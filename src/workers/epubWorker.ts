/// <reference lib="webworker" />
import { db } from '@/db/schema';
import { XMLParser } from 'fast-xml-parser';
import JSZip from 'jszip';

// Parser config
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

async function extractMetadataFromEpub(arrayBuffer: ArrayBuffer) {
  console.log('[Worker] Start extracting EPUB');

  const zip = await JSZip.loadAsync(arrayBuffer);
  console.log('[Worker] ZIP loaded, files:', Object.keys(zip.files).length);

  // Step 1: container.xml
  const containerXml = await zip
    .file('META-INF/container.xml')
    ?.async('string');
  if (!containerXml) throw new Error('Missing container.xml');

  const containerDoc = parser.parse(containerXml);
  const rootfile = containerDoc.container?.rootfiles?.rootfile?.['@_full-path'];
  if (!rootfile) throw new Error('Missing rootfile in container.xml');
  console.log('[Worker] Rootfile:', rootfile);

  // Step 2: content.opf
  const contentXml = await zip.file(rootfile)?.async('string');
  if (!contentXml) throw new Error('Missing content.opf');

  const contentDoc = parser.parse(contentXml);
  const metadataNode =
    contentDoc.package?.metadata || contentDoc.package?.['opf:metadata'] || {};
  console.log('[Worker] Metadata node keys:', Object.keys(metadataNode));

  const extractMetadataNode = (
    field: string,
    type: 'array' | 'string' | 'number' = 'string',
  ) => {
    const fieldValues = Array.isArray(metadataNode[field])
      ? metadataNode[field]
      : metadataNode[field]
        ? [metadataNode[field]]
        : [];
    fieldValues.forEach((value: any) => {
      if (typeof value === 'object') {
        value = value['#text'] || '';
      }
    });
    switch (type) {
      case 'array':
        return fieldValues;
      case 'number':
        return fieldValues[0] ? parseInt(fieldValues[0]) : null;
      default:
        return fieldValues[0] ? fieldValues[0].toString() : null;
    }
  };

  const extractCalibreMetadata = (
    field: string,
    type: 'string' | 'number' = 'string',
  ) => {
    const value = metas.find((m: any) => m['@_name'] === field)?.['@_content'];

    return type === 'string' ? value?.toString() : parseInt(value ?? '0');
  };

  // Extract fields
  const metas = Array.isArray(metadataNode.meta)
    ? metadataNode.meta
    : [metadataNode.meta];
  const title = extractMetadataNode('dc:title');
  const author = extractMetadataNode('dc:creator', 'array');
  const language = extractMetadataNode('dc:language');
  const publisher = extractMetadataNode('dc:publisher');
  const description = extractMetadataNode('dc:description');
  const tags = extractMetadataNode('dc:subject', 'array');
  const series = extractCalibreMetadata('calibre:series');
  const seriesIndex = extractCalibreMetadata('calibre:series_index', 'number');
  const titleSort = extractCalibreMetadata('calibre:title_sort');

  console.log('[Worker] Metadata extracted:', {
    title,
    author,
    language,
    publisher,
    series,
    seriesIndex,
    titleSort,
  });

  // Step 3: cover
  let coverBlob: Blob | null = null;
  const metaCoverId = extractCalibreMetadata('cover');
  console.log('[Worker] Cover meta id:', metaCoverId);

  if (metaCoverId) {
    const manifestItems = [].concat(contentDoc.package?.manifest?.item ?? []);
    const coverItem = manifestItems.find((i: any) => i['@_id'] === metaCoverId);
    const coverHref = coverItem?.['@_href'];

    if (coverHref) {
      const basePath = rootfile.substring(0, rootfile.lastIndexOf('/') + 1);
      const coverPath = basePath + coverHref;
      console.log('[Worker] Cover path:', coverPath);

      const coverFile = zip.file(coverPath);
      if (coverFile) {
        const coverArray = await coverFile.async('uint8array');
        coverBlob = new Blob([coverArray as any], { type: 'image/jpeg' });
        console.log('[Worker] Cover extracted, size:', coverBlob.size);
      }
    }
  }

  return {
    metadata: {
      title,
      author,
      language,
      publisher,
      description,
      series,
      seriesIndex,
      titleSort,
      tags,
    },
    coverBlob,
  };
}

// Worker handler
self.onmessage = async (e: MessageEvent) => {
  const { type, provider, fileId, accessToken } = e.data;

  if (type === 'extract') {
    try {
      console.log('[Worker] Extract job started', { provider, fileId });

      // Fetch EPUB binary
      let url = '';
      if (provider === 'gdrive') {
        url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      } else if (provider === 'onedrive') {
        url = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch file: ${res.statusText}`);
      const arrayBuffer = await res.arrayBuffer();
      console.log('[Worker] File fetched, size:', arrayBuffer.byteLength);

      // Parse EPUB
      const { metadata, coverBlob } =
        await extractMetadataFromEpub(arrayBuffer);

      const result = await db.files.update([provider, fileId], {
        metadata,
        status: 'ready',
      });

      console.log('[Worker] Update db succesfully', provider, fileId, result);

      // Post cover separately
      if (coverBlob) {
        const coverArray = await coverBlob.arrayBuffer();
        self.postMessage(
          {
            type: 'cover',
            payload: coverArray,
          },
          [coverArray],
        );

        return;
      }

      // Post metadata
      self.postMessage({
        type: 'done',
      });
    } catch (err: any) {
      console.error('[Worker] Error:', err.message);
      self.postMessage({ type: 'error', fileId, provider, error: err.message });
    }
  }
};
