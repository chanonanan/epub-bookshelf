/**
 * Helper functions for extracting EPUB metadata and covers
 */
import epub, { Book } from 'epubjs';
import JSZip from 'jszip';
import localforage from 'localforage';

export interface BookMetadata {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
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

const coverCache = localforage.createInstance({
  name: 'epubBookshelf',
  storeName: 'covers',
});

const metadataCache = localforage.createInstance({
  name: 'epubBookshelf',
  storeName: 'metadata',
});

/**
 * Extract metadata and cover from an EPUB file
 */
export const extractBookInfo = async (fileId: string, epubBlob: Blob): Promise<BookMetadata> => {
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
    const metaMatches = opfContent.matchAll(/<meta[^>]+name="([^"]+)"[^>]+content="([^"]+)"/g);
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

    // Also check dc:subject tags for any additional Calibre metadata
    const subjectMatches = opfContent.matchAll(/<dc:subject[^>]*>([^<]+)<\/dc:subject>/g);
    for (const match of subjectMatches) {
      const subject = match[1];
      if (subject.startsWith('calibre:')) {
        // Calibre ID format: "calibre:id:#"
        const idMatch = subject.match(/^calibre:id:(\d+)$/);
        if (idMatch) {
          result.calibreId = idMatch[1];
        }
      } else {
        // Regular tags
        result.tags.push(subject);
      }
    }
  }

  // Extract cover
  try {
    const cover = await book.loaded.cover;
    let coverBlob: Blob | null = null;

    if (cover) {
      // Try direct path from epub.js
      let coverEntry = epubContents.file(cover.startsWith('/') ? cover.slice(1) : cover);
      
      if (coverEntry) {
        const coverBuffer = await coverEntry.async('arraybuffer');
        coverBlob = new Blob([coverBuffer], { type: 'image/jpeg' });
      } else if (opfEntry) {
        // If direct path fails, try extracting cover path from OPF
        const opfContent = await opfEntry.async('text');
        const coverIdMatch = opfContent.match(/<meta name="cover" content="([^"]+)"/);
        
        if (coverIdMatch) {
          const coverId = coverIdMatch[1];
          const coverMatch = opfContent.match(new RegExp(`<item[^>]+id="${coverId}"[^>]+href="([^"]+)"`));
          
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
        result.coverUrl = URL.createObjectURL(coverBlob);
        await coverCache.setItem(fileId, coverBlob);
      }
    }
  } catch (error) {
    console.error('Error extracting cover:', error);
  }

  // Clean up book object
  book.destroy();

  // Store metadata in cache (without coverUrl as it's temporary)
  const metadataToCache = { ...result };
  delete metadataToCache.coverUrl;
  await metadataCache.setItem(fileId, metadataToCache);

  return result;
};

/**
 * Get a cached cover image Blob
 */
export const getCachedCover = async (fileId: string): Promise<Blob | null> => {
  return coverCache.getItem<Blob>(fileId);
};

/**
 * Get cached book metadata
 */
export const getCachedMetadata = async (fileId: string): Promise<BookMetadata | null> => {
  return metadataCache.getItem<BookMetadata>(fileId);
};