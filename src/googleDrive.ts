import localforage from 'localforage';

const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let client: ReturnType<
  typeof window.google.accounts.oauth2.initTokenClient
> | null = null;

let initializationPromise: Promise<void> | null = null;
let currentTokens: GoogleTokens | null = null;
let tokenPromise: Promise<GoogleTokens | null> | null = null;
let resolveTokenRequest: ((tokens: GoogleTokens | null) => void) | null = null;

/**
 * Load and initialize Google Identity Services without opening an auth popup.
 */
export const initializeGoogleAuth = async (): Promise<void> => {
  if (client) return;
  if (initializationPromise) return initializationPromise;

  initializationPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = async () => {
      try {
        client = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPE,
          callback: (response: TokenResponse) => {
            if (response.error) {
              currentTokens = null;
              tokenPromise = null;
              resolveTokenRequest?.(null);
              resolveTokenRequest = null;
              return;
            }

            const tokens: GoogleTokens = {
              access_token: response.access_token,
              expires_at: Date.now() + response.expires_in * 1000,
            };
            currentTokens = tokens;
            tokenPromise = Promise.resolve(tokens);
            const resolveRequest = resolveTokenRequest;
            resolveTokenRequest = null;
            void localforage
              .setItem('google_tokens', tokens)
              .then(() => resolveRequest?.(tokens))
              .catch((error) => {
                console.error('Failed to cache Google tokens:', error);
                resolveRequest?.(tokens);
              });
          },
        });

        const cachedTokens =
          await localforage.getItem<GoogleTokens>('google_tokens');
        if (cachedTokens && cachedTokens.expires_at > Date.now()) {
          currentTokens = cachedTokens;
          tokenPromise = Promise.resolve(cachedTokens);
        }
        resolve();
      } catch (err) {
        initializationPromise = null;
        reject(err);
      }
    };
    script.onerror = () => {
      initializationPromise = null;
      reject(new Error('Failed to load Google Identity Services'));
    };
    document.head.appendChild(script);
  });

  return initializationPromise;
};

/**
 * Get cached OAuth tokens or request them directly from a user gesture.
 */
export const getTokens = (): Promise<GoogleTokens | null> => {
  if (currentTokens && currentTokens.expires_at > Date.now()) {
    return Promise.resolve(currentTokens);
  }
  if (tokenPromise) return tokenPromise;
  if (!client) {
    return initializeGoogleAuth().then(() => getTokens());
  }

  tokenPromise = new Promise((resolve) => {
    resolveTokenRequest = resolve;
  });
  client.requestAccessToken();
  return tokenPromise;
};

const foldersCache = localforage.createInstance({
  name: 'epubBookshelf',
  storeName: 'folders',
});

/**
 * List all EPUB files in user's Drive
 */
export const listEpubFiles = async (
  folderId: string,
  ignoreCache = false,
  onFileFound?: (file: DriveFile) => void | Promise<void>,
): Promise<DriveFile[]> => {
  const cacheKey = `epubFiles:${folderId}`;
  const cachedFiles = await foldersCache.getItem<DriveFile[]>(cacheKey);
  if (cachedFiles && !ignoreCache) {
    for (const file of cachedFiles) {
      await onFileFound?.(file);
    }
    return cachedFiles;
  }

  const tokens = await getTokens();
  if (!tokens) return [];

  const allFiles: DriveFile[] = [];

  // helper to list both files & folders inside a parent
  const fetchChildren = async (parentId: string): Promise<void> => {
    let pageToken: string | null = null;

    do {
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.append(
        'q',
        `'${parentId}' in parents and trashed=false`,
      );
      url.searchParams.append(
        'fields',
        'nextPageToken,files(id,name,mimeType,size)',
      );
      url.searchParams.append('pageSize', '100');
      if (pageToken) {
        url.searchParams.append('pageToken', pageToken);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch files:', response.statusText);
        break;
      }

      const data = await response.json();
      const files: DriveFile[] = data.files || [];

      for (const file of files) {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          // recurse into subfolder
          await fetchChildren(file.id);
        } else if (file.mimeType === 'application/epub+zip') {
          allFiles.push(file);
          await onFileFound?.(file);
        }
      }

      pageToken = data.nextPageToken || null;
    } while (pageToken);
  };

  await fetchChildren(folderId);

  await foldersCache.setItem(cacheKey, allFiles);
  return allFiles;
};

/**
 * Download an EPUB file from Drive (no caching)
 */
export const downloadFile = async (fileId: string): Promise<Blob | null> => {
  if (fileId.startsWith('local-test-')) return null;

  const tokens = await getTokens();
  if (!tokens) return null;

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    },
  );

  if (!response.ok) return null;

  return response.blob();
};

export type FileRangeResponse =
  | { kind: 'range'; data: ArrayBuffer }
  | { kind: 'full'; blob: Blob };

/**
 * Download a byte range from a Drive file. Drive may ignore Range and return the
 * complete file, so callers must handle both response kinds.
 */
export const downloadFileRange = async (
  fileId: string,
  start: number,
  end: number,
): Promise<FileRangeResponse | null> => {
  const tokens = await getTokens();
  if (!tokens) return null;

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Range: `bytes=${start}-${end}`,
      },
    },
  );

  if (response.status === 206) {
    return { kind: 'range', data: await response.arrayBuffer() };
  }
  if (response.status === 200) {
    return { kind: 'full', blob: await response.blob() };
  }

  throw new Error(
    `Failed to fetch file range: ${response.status} ${response.statusText}`,
  );
};
