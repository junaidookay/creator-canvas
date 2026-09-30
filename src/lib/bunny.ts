export interface BunnyConfig {
  libraryId: string;
  apiKey: string;
  cdnHost: string;
}

const BUNNY_API_BASE = 'https://video.bunnycdn.com';

export interface BunnyUploadResult {
  videoId: string;
  playbackUrl: string;
}

export const uploadVideoToBunny = async (
  file: File,
  title: string,
  config: BunnyConfig,
  onProgress?: (pct: number) => void
): Promise<BunnyUploadResult> => {
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
  // Delete requires server-side credentials. Use the storage-admin edge
  // function pattern or the Bunny dashboard until a delete endpoint exists.
  throw new Error(`Bunny: delete of video ${videoId} is not yet supported via the app. Use the Bunny dashboard.`);
};
