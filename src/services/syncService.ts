import { db } from '@/db/schema';

export async function syncFolder(
  provider: string,
  folderId: string,
  client: any,
) {
  const files = await db.files.where({ provider, folderId }).toArray();
  const metadata = files.map((f) => ({
    id: f.id,
    name: f.name,
    metadata: f.metadata,
    coverId: f.coverId,
    modifiedAt: f.modifiedAt,
  }));

  const blob = new Blob([JSON.stringify(metadata)], {
    type: 'application/json',
  });
  await client.uploadFile(folderId, `epub-bookshelf-${folderId}.json`, blob);
}
