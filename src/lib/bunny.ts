export interface BunnyConfig {
  libraryId: string;
  apiKey: string;
  cdnHost: string;
}

const STORAGE_KEYS = {
  libraryId: 'bunny_library_id',
  apiKey: 'bunny_api_key',
  cdnHost: 'bunny_cdn_host',
} as const;

export const getBunnyConfig = (): BunnyConfig | null => {
  const libraryId = localStorage.getItem(STORAGE_KEYS.libraryId);
  const apiKey = localStorage.getItem(STORAGE_KEYS.apiKey);
  const cdnHost = localStorage.getItem(STORAGE_KEYS.cdnHost);
  if (!libraryId || !apiKey || !cdnHost) return null;
  return { libraryId, apiKey, cdnHost };
};

export const saveBunnyConfig = (config: BunnyConfig): void => {
  localStorage.setItem(STORAGE_KEYS.libraryId, config.libraryId);
  localStorage.setItem(STORAGE_KEYS.apiKey, config.apiKey);
  localStorage.setItem(STORAGE_KEYS.cdnHost, config.cdnHost);
};

export const clearBunnyConfig = (): void => {
  localStorage.removeItem(STORAGE_KEYS.libraryId);
  localStorage.removeItem(STORAGE_KEYS.apiKey);
  localStorage.removeItem(STORAGE_KEYS.cdnHost);
};

const BUNNY_API_BASE = 'https://video.bunnycdn.com';

export interface BunnyUploadResult {
  videoId: string;
  playbackUrl: string;
}

export const uploadVideoToBunny = async (
  file: File,
  title: string,
  onProgress?: (pct: number) => void
): Promise<BunnyUploadResult> => {
  const config = getBunnyConfig();
  if (!config) {
    throw new Error('Bunny Stream is not configured. Set up in Admin Settings \u2192 Storage.');
  }

  onProgress?.(0);

  const createResponse = await fetch(`${BUNNY_API_BASE}/library/${config.libraryId}/videos`, {
    method: 'POST',
    headers: {
      'AccessKey': config.apiKey,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: title || file.name }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text().catch(() => '');
    throw new Error(`Bunny: failed to create video (${createResponse.status}). ${errorText}`);
  }

  const videoData = await createResponse.json();
  const videoId: string = videoData.guid;
  if (!videoId) {
    throw new Error('Bunny: no video ID returned from create call.');
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', `${BUNNY_API_BASE}/library/${config.libraryId}/videos/${videoId}`);
    xhr.setRequestHeader('AccessKey', config.apiKey);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Bunny: upload failed (${xhr.status} ${xhr.statusText}).`));
    });

    xhr.addEventListener('error', () => reject(new Error('Bunny: upload failed (network error).')));
    xhr.addEventListener('abort', () => reject(new Error('Bunny: upload was cancelled.')));

    xhr.send(file);
  });

  onProgress?.(100);

  const playbackUrl = `https://${config.cdnHost}/${videoId}/playlist.m3u8`;
  return { videoId, playbackUrl };
};

export const deleteVideoFromBunny = async (videoId: string): Promise<void> => {
  const config = getBunnyConfig();
  if (!config) throw new Error('Bunny Stream is not configured.');

  const response = await fetch(`${BUNNY_API_BASE}/library/${config.libraryId}/videos/${videoId}`, {
    method: 'DELETE',
    headers: {
      'AccessKey': config.apiKey,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Bunny: failed to delete video (${response.status}).`);
  }
};
