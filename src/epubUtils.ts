import epub from 'epubjs';
import JSZip from 'jszip';
import localforage from 'localforage';
import { downloadFile, downloadFileRange, listEpubFiles } from './googleDrive';

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

interface ZipEntry {
  name: string;
  fileNameLength: number;
  extraLength: number;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

class FullFileResponse extends Error {
  readonly blob: Blob;

  constructor(blob: Blob) {
    super('Drive returned the complete file instead of the requested range');
    this.blob = blob;
  }
}

const MAX_CENTRAL_DIRECTORY_SIZE = 64 * 1024 * 1024;

const fetchFileRange = async (
  fileId: string,
  start: number,
  end: number,
): Promise<Uint8Array> => {
  const response = await downloadFileRange(fileId, start, end);
  if (!response) {
    throw new Error('Google Drive authentication is unavailable');
  }
  if (response.kind === 'full') {
    throw new FullFileResponse(response.blob);
  }

  const data = new Uint8Array(response.data);
  if (data.byteLength !== end - start + 1) {
    throw new Error('Google Drive returned an incomplete byte range');
  }
  return data;
};

const parseZipDirectory = async (
  fileId: string,
  fileSize: number,
): Promise<Map<string, ZipEntry>> => {
  const tailStart = Math.max(0, fileSize - 22 - 0xffff);
  const tail = await fetchFileRange(fileId, tailStart, fileSize - 1);
  const tailView = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  let eocdOffset = -1;

  for (let offset = tail.byteLength - 22; offset >= 0; offset--) {
    if (tailView.getUint32(offset, true) !== 0x06054b50) continue;
    const commentLength = tailView.getUint16(offset + 20, true);
    if (offset + 22 + commentLength <= tail.byteLength) {
      eocdOffset = offset;
      break;
    }
  }

  if (eocdOffset < 0) {
    throw new Error('EPUB ZIP directory marker was not found');
  }

  const diskNumber = tailView.getUint16(eocdOffset + 4, true);
  const directoryDisk = tailView.getUint16(eocdOffset + 6, true);
  const entriesOnDisk = tailView.getUint16(eocdOffset + 8, true);
  const entryCount = tailView.getUint16(eocdOffset + 10, true);
  const directorySize = tailView.getUint32(eocdOffset + 12, true);
  const directoryOffset = tailView.getUint32(eocdOffset + 16, true);

  if (
    diskNumber !== 0 ||
    directoryDisk !== 0 ||
    entriesOnDisk !== entryCount ||
    entryCount === 0xffff ||
    directorySize === 0xffffffff ||
    directoryOffset === 0xffffffff ||
    directorySize > MAX_CENTRAL_DIRECTORY_SIZE ||
    directoryOffset + directorySize > fileSize
  ) {
    throw new Error('EPUB uses an unsupported ZIP directory layout');
  }

  if (directorySize === 0) return new Map();

  const directory = await fetchFileRange(
    fileId,
    directoryOffset,
    directoryOffset + directorySize - 1,
  );
  const view = new DataView(
    directory.buffer,
    directory.byteOffset,
    directory.byteLength,
  );
  const decoder = new TextDecoder();
  const entries = new Map<string, ZipEntry>();
  let offset = 0;

  for (let index = 0; index < entryCount; index++) {
    if (
      offset + 46 > directory.byteLength ||
      view.getUint32(offset, true) !== 0x02014b50
    ) {
      throw new Error('EPUB ZIP directory entry is invalid');
    }

    const flags = view.getUint16(offset + 8, true);
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const entryLength = 46 + nameLength + extraLength + commentLength;

    if (offset + entryLength > directory.byteLength) {
      throw new Error('EPUB ZIP directory entry is truncated');
    }
    if (
      flags & 1 ||
      compressedSize === 0xffffffff ||
      uncompressedSize === 0xffffffff ||
      localHeaderOffset === 0xffffffff
    ) {
      throw new Error('EPUB contains an unsupported ZIP entry');
    }

    const name = decoder.decode(
      directory.subarray(offset + 46, offset + 46 + nameLength),
    );
    entries.set(name, {
      name,
      fileNameLength: nameLength,
      extraLength,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });
    offset += entryLength;
  }

  return entries;
};

const readZipEntry = async (
  fileId: string,
  entry: ZipEntry,
): Promise<Uint8Array> => {
  const firstRangeEnd =
    entry.localHeaderOffset +
    30 +
    entry.fileNameLength +
    entry.extraLength +
    entry.compressedSize -
    1;
  const localEntry = await fetchFileRange(
    fileId,
    entry.localHeaderOffset,
    Math.max(entry.localHeaderOffset + 29, firstRangeEnd),
  );
  const view = new DataView(
    localEntry.buffer,
    localEntry.byteOffset,
    localEntry.byteLength,
  );
  if (view.getUint32(0, true) !== 0x04034b50) {
    throw new Error(`EPUB ZIP entry header is invalid: ${entry.name}`);
  }

  const nameLength = view.getUint16(26, true);
  const extraLength = view.getUint16(28, true);
  const dataOffset = entry.localHeaderOffset + 30 + nameLength + extraLength;
  const offsetInRange = dataOffset - entry.localHeaderOffset;
  const compressed =
    offsetInRange + entry.compressedSize <= localEntry.byteLength
      ? localEntry.subarray(offsetInRange, offsetInRange + entry.compressedSize)
      : await fetchFileRange(
          fileId,
          dataOffset,
          dataOffset + entry.compressedSize - 1,
        );

  let uncompressed: Uint8Array;
  if (entry.compressionMethod === 0) {
    uncompressed = compressed;
  } else if (entry.compressionMethod === 8) {
    const deflated = new Blob([compressed.slice().buffer])
      .stream()
      .pipeThrough(new DecompressionStream('deflate-raw' as CompressionFormat));
    uncompressed = new Uint8Array(await new Response(deflated).arrayBuffer());
  } else {
    throw new Error(`Unsupported EPUB ZIP compression: ${entry.name}`);
  }

  if (uncompressed.byteLength !== entry.uncompressedSize) {
    throw new Error(`EPUB ZIP entry has an unexpected size: ${entry.name}`);
  }
  return uncompressed;
};

const parseXml = (content: string): Document => {
  const document = new DOMParser().parseFromString(content, 'application/xml');
  if (document.getElementsByTagName('parsererror').length > 0) {
    throw new Error('EPUB XML metadata is invalid');
  }
  return document;
};

const getElementsByLocalName = (
  document: Document,
  localName: string,
): Element[] =>
  Array.from(document.getElementsByTagName('*')).filter(
    (element) => element.localName === localName,
  );

const resolveZipPath = (basePath: string, href: string): string => {
  const decodedHref = decodeURIComponent(href.split(/[?#]/, 1)[0]);
  const pathParts = decodedHref.startsWith('/')
    ? []
    : basePath.split('/').filter(Boolean);

  for (const part of decodedHref.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      pathParts.pop();
    } else {
      pathParts.push(part);
    }
  }
  return pathParts.join('/');
};

const extractMetadataFromRanges = async (
  file: DriveFile,
): Promise<BookMetadata> => {
  const fileSize = Number(file.size);
  if (!Number.isSafeInteger(fileSize) || fileSize <= 0) {
    throw new Error('Drive file size is unavailable for range requests');
  }

  const entries = await parseZipDirectory(file.id, fileSize);
  const containerEntry = entries.get('META-INF/container.xml');
  if (!containerEntry) {
    throw new Error('EPUB container.xml was not found');
  }

  const containerDocument = parseXml(
    new TextDecoder().decode(await readZipEntry(file.id, containerEntry)),
  );
  const opfPath = getElementsByLocalName(
    containerDocument,
    'rootfile',
  )[0]?.getAttribute('full-path');
  const opfEntry = opfPath ? entries.get(opfPath) : undefined;
  if (!opfEntry) {
    throw new Error('EPUB package document was not found');
  }

  const opfDocument = parseXml(
    new TextDecoder().decode(await readZipEntry(file.id, opfEntry)),
  );
  const metadataText = (name: string) =>
    getElementsByLocalName(opfDocument, name)[0]?.textContent?.trim();
  const metaElements = getElementsByLocalName(opfDocument, 'meta');
  const calibreMeta = (name: string) =>
    metaElements
      .find((element) => element.getAttribute('name') === name)
      ?.getAttribute('content');
  const seriesIndex = Number.parseFloat(
    calibreMeta('calibre:series_index') ?? '',
  );

  const result: BookMetadata = {
    id: file.id,
    title: metadataText('title') || 'Unknown Title',
    author: metadataText('creator') || 'Unknown Author',
    tags: getElementsByLocalName(opfDocument, 'subject')
      .map((element) => element.textContent?.trim() ?? '')
      .filter(Boolean),
    language: metadataText('language'),
    publisher: metadataText('publisher'),
    publishDate: metadataText('date'),
    description: metadataText('description'),
    series: calibreMeta('calibre:series') ?? undefined,
    seriesIndex: Number.isFinite(seriesIndex) ? seriesIndex : undefined,
  };

  const manifestItems = getElementsByLocalName(opfDocument, 'item');
  const coverId = metaElements
    .find((element) => element.getAttribute('name') === 'cover')
    ?.getAttribute('content');
  const coverItem =
    manifestItems.find((item) => item.getAttribute('id') === coverId) ??
    manifestItems.find((item) =>
      item.getAttribute('properties')?.split(/\s+/).includes('cover-image'),
    );
  const coverHref = coverItem?.getAttribute('href');

  if (coverHref) {
    const opfDirectory = opfEntry.name.split('/').slice(0, -1).join('/');
    const coverPath = resolveZipPath(opfDirectory, coverHref);
    const coverEntry = entries.get(coverPath);
    if (coverEntry) {
      const coverData = await readZipEntry(file.id, coverEntry);
      const extension = coverPath.split('.').pop()?.toLowerCase();
      const mediaType =
        coverItem?.getAttribute('media-type') ||
        (extension === 'png'
          ? 'image/png'
          : extension === 'gif'
            ? 'image/gif'
            : extension === 'svg'
              ? 'image/svg+xml'
              : 'image/jpeg');
      result.coverBlob = new Blob([coverData.slice().buffer], {
        type: mediaType,
      });
    }
  }

  await metadataCache.setItem(file.id, result);
  return result;
};

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
      let coverEntry = epubContents.file(
        cover.startsWith('/') ? cover.slice(1) : cover,
      );

      if (coverEntry) {
        const coverBuffer = await coverEntry.async('arraybuffer');
        coverBlob = new Blob([coverBuffer], { type: 'image/jpeg' });
      } else if (opfEntry) {
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
      }
    }
  } catch (error) {
    console.error('Error extracting cover:', error);
  }

  book.destroy();
  const metadataToCache = { ...result };
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
    try {
      metadata = await extractMetadataFromRanges(file);
    } catch (error) {
      const fallbackBlob =
        error instanceof FullFileResponse
          ? error.blob
          : await downloadFile(file.id);
      if (!(error instanceof FullFileResponse)) {
        console.warn(
          'Range-based metadata extraction failed; downloading the complete EPUB instead.',
          error,
        );
      }
      if (!fallbackBlob) return null;
      metadata = await extractBookInfo(file.id, fallbackBlob);
    }
  }

  metadata.fileSize = file.size;
  return metadata;
};

export const refreshBookInfo = async (
  fileId: string,
  fileSize: string,
): Promise<BookMetadata | null> => {
  await metadataCache.removeItem(fileId);
  return getMetadata({
    id: fileId,
    name: '',
    mimeType: 'application/epub+zip',
    size: fileSize,
  });
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
