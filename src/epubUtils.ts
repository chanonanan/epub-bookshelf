/**
 * Helper functions for extracting EPUB metadata and covers
 */
import epub from 'epubjs';
import JSZip from 'jszip';
import localforage from 'localforage';
import { downloadFile, listEpubFiles } from './googleDrive';

export interface BookMetadata {
  id: string;
  title: string;
  author: string;
  coverUrl?: string; // Base64 encoded cover image data
  thumbUrl?: string; // Thumbnail version of cover image
  coverBlob?: Blob; // Cover image as Blob
  series?: string;
  seriesIndex?: number;
  tags: string[];
  calibreId?: string;
  description?: string;
  language?: string;
  publisher?: string;
  publishDate?: string;
  fileSize?: string;
  downloadUrl?: string;
}

const metadataCache = localforage.createInstance({
  name: 'epubBookshelf',
  storeName: 'metadata',
});

/**
 * Extract metadata and cover from an EPUB file
 */
export const extractBookInfo = async (
  fileId: string,
  epubBlob: Blob,
): Promise<BookMetadata> => {
  // Convert Blob to ArrayBuffer
  const arrayBuffer = await epubBlob.arrayBuffer();

  // Create EPUB.js book object for basic metadata and cover
  const book = epub(arrayBuffer);
  await book.ready;

  // Extract metadata
  const metadata = await book.loaded.metadata;

  // Initialize basic metadata
  const result: BookMetadata = {
    id: fileId,
    title: metadata.title || 'Unknown Title',
    author: metadata.creator || 'Unknown Author',
    tags: [],
    language: metadata.language,
    publisher: metadata.publisher,
    publishDate: metadata.pubdate,
    description: metadata.description,
  };

  // Load EPUB using JSZip for Calibre metadata extraction
  const zip = new JSZip();
  const epubContents = await zip.loadAsync(arrayBuffer);

  // Search for the OPF file
  let opfEntry: JSZip.JSZipObject | null = null;
  const containerXmlEntry = epubContents.file('META-INF/container.xml');
  if (containerXmlEntry) {
    const containerXml = await containerXmlEntry.async('text');
    const opfPathMatch = containerXml.match(/<rootfile.*?full-path="([^"]+)"/);
    if (opfPathMatch) {
      opfEntry = epubContents.file(opfPathMatch[1]);
    }
  }

  if (opfEntry) {
    const opfContent = await opfEntry.async('text');

    // Extract Calibre metadata from meta tags
    const metaMatches = opfContent.matchAll(
      /<meta[^>]+name="([^"]+)"[^>]+content="([^"]+)"/g,
    );
    for (const match of metaMatches) {
      const [, name, content] = match;
      if (name.startsWith('calibre:')) {
        const calibreProp = name.replace('calibre:', '');
        switch (calibreProp) {
          case 'series':
            result.series = content;
            break;
          case 'series_index':
            result.seriesIndex = parseFloat(content);
            break;
          case 'title_sort':
            // Could be used for sorting if needed
            break;
        }
      }
    }

    // Also check dc:subject tags
    const subjectMatches = opfContent.matchAll(
      /<dc:subject[^>]*>([^<]+)<\/dc:subject>/g,
    );
    for (const match of subjectMatches) {
      const subject = match[1];
      result.tags.push(subject);
    }
  }

  // Extract cover
  try {
    const cover = await book.loaded.cover;
    let coverBlob: Blob | null = null;

    if (cover) {
      // Try direct path from epub.js
      let coverEntry = epubContents.file(
        cover.startsWith('/') ? cover.slice(1) : cover,
      );

      if (coverEntry) {
        const coverBuffer = await coverEntry.async('arraybuffer');
        coverBlob = new Blob([coverBuffer], { type: 'image/jpeg' });
      } else if (opfEntry) {
        // If direct path fails, try extracting cover path from OPF
        const opfContent = await opfEntry.async('text');
        const coverIdMatch = opfContent.match(
          /<meta name="cover" content="([^"]+)"/,
        );

        if (coverIdMatch) {
          const coverId = coverIdMatch[1];
          const coverMatch = opfContent.match(
            new RegExp(`<item[^>]+id="${coverId}"[^>]+href="([^"]+)"`),
          );

          if (coverMatch) {
            const coverPath = coverMatch[1];
            // Get the relative path from the OPF location
            const opfDir = opfEntry.name.split('/').slice(0, -1).join('/');
            const fullPath = opfDir ? `${opfDir}/${coverPath}` : coverPath;
            coverEntry = epubContents.file(fullPath);

            if (coverEntry) {
              const coverBuffer = await coverEntry.async('arraybuffer');
              coverBlob = new Blob([coverBuffer], { type: 'image/jpeg' });
            }
          }
        }
      }

      if (coverBlob) {
        result.coverBlob = coverBlob;
        // result.coverUrl = URL.createObjectURL(coverBlob);
        // result.thumbUrl = await createThumbnail(coverBlob);
      }
    }
  } catch (error) {
    console.error('Error extracting cover:', error);
  }

  // Clean up book object
  book.destroy();

  // Store metadata in cache (without coverUrl as it's temporary)
  const metadataToCache = { ...result };
  //   delete metadataToCache.coverUrl;
  //   delete metadataToCache.thumbUrl;
  await metadataCache.setItem(fileId, metadataToCache);

  return result;
};

export const getMetadataById = async (
  fileId: string,
): Promise<BookMetadata | null> => {
  return getMetadata({ id: fileId, name: '', mimeType: '', size: '' });
};

/**
 * Get cached book metadata
 */
export const getMetadata = async (
  file: DriveFile,
): Promise<BookMetadata | null> => {
  let metadata = await metadataCache.getItem<BookMetadata>(file.id);
  if (!metadata) {
    const epubBlob = await downloadFile(file.id);
    if (!epubBlob) return null;

    metadata = await extractBookInfo(file.id, epubBlob);
  }

  //   if (metadata.coverBlob) {
  //     // If we have a cached coverBlob, create a URL for it
  //     metadata.coverUrl = URL.createObjectURL(metadata.coverBlob);
  //     metadata.thumbUrl = await createThumbnail(metadata.coverBlob);
  //   }

  metadata.fileSize = file.size;
  return metadata;
};

export const getBooksInFolder = async (
  folderId: string,
  ignoreCache = false,
): Promise<BookMetadata[]> => {
  const files = await listEpubFiles(folderId, ignoreCache);
  const batchSize = 20;
  const results: BookMetadata[] = [];

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);

    const bookPromises: Promise<BookMetadata | null>[] = batch.map(
      async (file) => {
        try {
          const metadata = await getMetadata(file);
          return metadata;
        } catch (error) {
          console.error('Error processing file:', file.name, error);
          return null;
        }
      },
    );

    const books = await Promise.all(bookPromises);
    results.push(...(books.filter(Boolean) as BookMetadata[]));
  }

  return results;
};

export async function createThumbnail(
  blob: Blob,
  maxWidth = 200,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to WebP for smaller size
      canvas.toBlob(
        (thumbnailBlob) => {
          if (thumbnailBlob) {
            resolve(URL.createObjectURL(thumbnailBlob));
          } else {
            resolve(URL.createObjectURL(blob)); // fallback
          }
        },
        'image/webp',
        0.7, // quality
      );
    };
    img.src = URL.createObjectURL(blob);
  });
}
