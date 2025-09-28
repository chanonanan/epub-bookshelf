import type { Cover, File, Folder } from '@/types/models';
import { db } from './schema';

// Folders
export async function addFolder(folder: Folder) {
  await db.folders.put(folder);
}

export async function getFolders(provider: string) {
  return await db.folders.where('provider').equals(provider).toArray();
}

// Files
export async function addFiles(files: File[]) {
  await db.files.bulkPut(files);
}

export async function getFilesInFolder(provider: string, folderId: string) {
  return await db.files
    .where('[provider+folderId]')
    .equals([provider, folderId])
    .toArray();
}

// Covers
export async function addCover(cover: Cover) {
  await db.covers.put(cover);
}

export async function getCover(fileId: string) {
  return await db.covers.get(fileId);
}
