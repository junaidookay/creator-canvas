import { supabase } from '@/integrations/supabase/client';

export type StorageProvider = 'supabase' | 's3' | 'r2' | 'b2' | 'local';

export interface UploadResult {
  path: string;
  url: string;
  provider: StorageProvider;
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

const getStorageProvider = (): StorageProvider => {
  const stored = localStorage.getItem('joulecorp_storage_provider');
  return (stored as StorageProvider) || 'supabase';
};

export const uploadFile = async (
  file: File,
  bucket: string,
  folder: string,
  onProgress?: (pct: number) => void
): Promise<UploadResult> => {
  const provider = getStorageProvider();

  switch (provider) {
    case 'supabase':
      return uploadToSupabase(file, bucket, folder, onProgress);
    case 's3':
    case 'r2':
    case 'b2':
    case 'local':
      throw new Error(`${provider} storage not yet configured. Set up in Admin Settings.`);
    default:
      throw new Error('Unknown storage provider');
  }
};

const uploadToSupabase = async (
  file: File,
  bucket: string,
  folder: string,
  onProgress?: (pct: number) => void
): Promise<UploadResult> => {
  const ext = file.name.split('.').pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  onProgress?.(10);
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  onProgress?.(90);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  onProgress?.(100);

  return { path: data.path, url: urlData.publicUrl, provider: 'supabase' };
};

export const deleteFile = async (path: string, bucket: string) => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
};
