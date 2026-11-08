import localforage from 'localforage';
import type { BookMetadata } from './epubUtils';
import type { LibraryFolder } from './types/library';

interface LocalTestBook extends Omit<BookMetadata, 'coverBlob' | 'coverUrl'> {
  coverFilename: string;
}

interface LocalTestManifest {
  folderName: string;
  books: LocalTestBook[];
}

const metadataCache = localforage.createInstance({
  name: 'epubBookshelf',
  storeName: 'metadata',
});
const folderBooksCache = localforage.createInstance({
  name: 'epubBookshelf',
  storeName: 'folderBooks',
});
const foldersCache = localforage.createInstance({
  name: 'epubBookshelf',
  storeName: 'folders',
});

interface CachedFolderBook {
  id: string;
  fileSize?: string;
}

export async function loadDevTestFolders(
  onProgress?: (loaded: number, total: number) => void,
): Promise<LibraryFolder[]> {
  if (!import.meta.env.DEV) {
    throw new Error('Local test data is only available in development.');
  }

  const response = await fetch('/local-test-data/manifest.json');
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? 'Local test data is missing. Run the test-data export first.'
        : 'Could not load local test data.',
    );
  }
  const manifest: LocalTestManifest = await response.json();
  if (!manifest.books.length) {
    throw new Error('The local test-data manifest contains no books.');
  }

  const folderId = '__local_dev_test_data__';
  const cachedReferences =
    await folderBooksCache.getItem<CachedFolderBook[]>(folderId);
  let hasCompleteCache =
    cachedReferences?.length === manifest.books.length &&
    cachedReferences.every(({ id }) => id.startsWith('local-test-'));

  if (hasCompleteCache && cachedReferences) {
    const batchSize = 32;
    for (let index = 0; index < cachedReferences.length; index += batchSize) {
      const batch = cachedReferences.slice(index, index + batchSize);
      const metadata = await Promise.all(
        batch.map(({ id }) => metadataCache.getItem<BookMetadata>(id)),
      );
      if (metadata.some((book) => !book || !(book.coverBlob instanceof Blob))) {
        hasCompleteCache = false;
        break;
      }
    }
  }

  if (hasCompleteCache && cachedReferences) {
    onProgress?.(cachedReferences.length, cachedReferences.length);
    return [
      {
        id: folderId,
        name: `${manifest.folderName} (local test data)`,
        lastUpdate: new Date().toISOString(),
        bookCount: cachedReferences.length,
      },
    ];
  }

  const bookReferences: CachedFolderBook[] = [];
  const driveFiles: DriveFile[] = [];
  const batchSize = 8;

  for (let index = 0; index < manifest.books.length; index += batchSize) {
    const batch = manifest.books.slice(index, index + batchSize);
    const booksWithCovers = await Promise.all(
      batch.map(async ({ coverFilename, ...book }) => {
        const coverResponse = await fetch(
          `/local-test-data/covers/${encodeURIComponent(coverFilename)}`,
        );
        if (!coverResponse.ok) {
          throw new Error(`Could not load cover for “${book.title}”.`);
        }

        return {
          ...book,
          id: `local-test-${book.id}`,
          coverBlob: await coverResponse.blob(),
        };
      }),
    );

    await Promise.all(
      booksWithCovers.map((book) => metadataCache.setItem(book.id, book)),
    );
    bookReferences.push(
      ...booksWithCovers.map(({ id, fileSize }) => ({ id, fileSize })),
    );
    driveFiles.push(
      ...booksWithCovers.map((book) => ({
        id: book.id,
        name: `${book.title}.epub`,
        mimeType: 'application/epub+zip',
        size: book.fileSize ?? '0',
      })),
    );
    onProgress?.(bookReferences.length, manifest.books.length);
  }

  await Promise.all([
    folderBooksCache.setItem(folderId, bookReferences),
    foldersCache.setItem(`epubFiles:${folderId}`, driveFiles),
  ]);

  return [
    {
      id: folderId,
      name: `${manifest.folderName} (local test data)`,
      lastUpdate: new Date().toISOString(),
      bookCount: bookReferences.length,
    },
  ];
}
