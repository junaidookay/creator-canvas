import { supabase } from '@/integrations/supabase/client';
import { uploadVideoToBunny, deleteVideoFromBunny } from '@/lib/bunny';
import * as tus from 'tus-js-client';

export type StorageProvider = 'supabase' | 'vimeo' | 'bunny';

export interface UploadResult {
  provider: StorageProvider;
  /** URL used to play/preview the video. Vimeo → embed URL. Supabase → public URL. */
  videoUrl: string;
  /** Path (Supabase) or provider URI (Vimeo /videos/123). Stored in `video_path`. */
  path: string;
  /** Provider video id (e.g. Vimeo numeric id), stored in `provider_video_id`. */
  providerVideoId?: string | null;
  /** Direct playback URL, stored in `provider_playback_url`. */
  providerPlaybackUrl?: string | null;
}

export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export const validateFile = (file: File, allowedTypes: string[], maxSize: number): string | null => {
  if (!allowedTypes.includes(file.type)) return `Invalid file type. Allowed: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`;
  if (file.size > maxSize) return `File too large. Max: ${(maxSize / 1024 / 1024).toFixed(0)}MB`;
  return null;
};

/**
 * Uploads a video file using the admin-configured default provider.
 * The `video-upload-init` edge function resolves the provider server-side:
 * - Bunny → returns library/API key/CDN host; browser uploads directly to Bunny
 * - Vimeo → returns tus upload URL; browser streams directly to Vimeo
 * - Supabase → falls back to Supabase Storage
 */
export const uploadVideo = async (
  file: File,
  meta: { title: string; description?: string },
  onProgress?: (pct: number) => void,
): Promise<UploadResult> => {
  const { data: initData, error: initErr } = await supabase.functions.invoke('video-upload-init', {
    body: { size: file.size, name: meta.title, description: meta.description ?? '' },
  });
  if (initErr) throw new Error(initErr.message);
  if (initData?.error) throw new Error(initData.error);

  if (initData?.provider === 'bunny') {
    const result = await uploadVideoToBunny(
      file,
      meta.title || file.name,
      { libraryId: initData.libraryId, apiKey: initData.apiKey, cdnHost: initData.cdnHost },
      onProgress,
    );
    return {
      provider: 'bunny',
      videoUrl: result.playbackUrl,
      path: result.videoId,
      providerVideoId: result.videoId,
      providerPlaybackUrl: result.playbackUrl,
    };
  }

  if (initData?.provider === 'vimeo') {
    await tusUpload(file, initData.uploadLink, onProgress);
    return {
      provider: 'vimeo',
      videoUrl: initData.playerEmbedUrl,
      path: initData.uri,
      providerVideoId: initData.videoId,
      providerPlaybackUrl: initData.playbackUrl,
    };
  }

  // Fallback: Supabase Storage
  return uploadToSupabase(file, onProgress);
};

const tusUpload = (file: File, endpoint: string, onProgress?: (pct: number) => void) =>
  new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      uploadUrl: endpoint,
      endpoint,
      retryDelays: [0, 1000, 3000, 5000],
      chunkSize: 8 * 1024 * 1024,
      metadata: { filename: file.name, filetype: file.type },
      onError: (err) => reject(err),
      onProgress: (uploaded, total) => onProgress?.(Math.round((uploaded / total) * 100)),
      onSuccess: () => resolve(),
    });
    upload.start();
  });

const uploadToSupabase = async (
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> => {
  const ext = file.name.split('.').pop();
  const path = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  onProgress?.(10);
  const { data, error } = await supabase.storage.from('videos').upload(path, file, { upsert: false });
  if (error) throw error;
  onProgress?.(95);

  const { data: urlData } = supabase.storage.from('videos').getPublicUrl(data.path);
  onProgress?.(100);

  return {
    provider: 'supabase',
    videoUrl: urlData.publicUrl,
    path: data.path,
    providerVideoId: null,
    providerPlaybackUrl: urlData.publicUrl,
  };
};

/** Uploads a thumbnail image to Supabase Storage (always). */
export const uploadThumbnail = async (
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ url: string; path: string }> => {
  const ext = file.name.split('.').pop();
  const path = `thumbnails/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  onProgress?.(10);
  const { data, error } = await supabase.storage.from('thumbnails').upload(path, file, { upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(data.path);
  onProgress?.(100);
  return { url: urlData.publicUrl, path: data.path };
};

export const deleteFile = async (path: string, bucket: string, provider?: StorageProvider) => {
  if (provider === 'bunny') {
    await deleteVideoFromBunny(path);
    return;
  }
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
};

/**
 * Generic Supabase Storage upload for images (avatars, banners, post images).
 * Kept for backwards compatibility with pages that upload non-video assets.
 */
export const uploadFile = async (
  file: File,
  bucket: string,
  folder: string,
  onProgress?: (pct: number) => void,
): Promise<{ url: string; path: string; provider: 'supabase' }> => {
  const ext = file.name.split('.').pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  onProgress?.(10);
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  onProgress?.(100);
  return { url: urlData.publicUrl, path: data.path, provider: 'supabase' };
};
