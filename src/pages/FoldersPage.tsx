import { useProvider } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { addFiles, getFilesInFolder } from '@/db';
import { db } from '@/db/schema';
import { batchProcessor } from '@/services/batchProcessor';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, Folder, FolderSync } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FoldersPage() {
  const { provider, client, token } = useProvider();
  const folders = useLiveQuery(() => {
    if (!provider) return [];
    return db.folders.where('provider').equals(provider).toArray();
  }, [provider]);

  const folderProgress = useLiveQuery(async () => {
    if (!provider) return {};
    const allFiles = await db.files
      .where('provider')
      .equals(provider)
      .toArray();

    const grouped: Record<
      string,
      { total: number; ready: number; pending: number; error: number }
    > = {};

    for (const f of allFiles) {
      if (!f.folderId) continue;
      if (!grouped[f.folderId]) {
        grouped[f.folderId] = { total: 0, ready: 0, pending: 0, error: 0 };
      }
      grouped[f.folderId].total++;
      if (f.status === 'ready') grouped[f.folderId].ready++;
      else if (f.status === 'error') grouped[f.folderId].error++;
      else grouped[f.folderId].pending++;
    }

    return grouped;
  }, [provider]);

  if (!provider || !token) return <div>Please login first</div>;

  const listAndSaveFiles = async (
    folderId: string,
    continueFileSync = false,
  ) => {
    console.log('List files...');
    const files = continueFileSync
      ? await getFilesInFolder(provider, folderId)
      : await client?.listFiles(folderId);
    console.log('File: ', files);
    if (files?.length) {
      await addFiles(files);
      batchProcessor.addJobs(files);
    }
  };

  const pickNewFolder = async () => {
    const folder = await client?.openPicker();
    console.log('Picked: ', folder);
    if (folder) {
      await db.folders.put(folder);
      await listAndSaveFiles(folder.id);
    }
  };

  return (
    <>
      <h2 className="text-xl">Folders</h2>
      <ul className="space-y-2">
        {folders?.map((f) => {
          const prog = folderProgress?.[f.id];
          const label = prog
            ? `${prog.ready}/${prog.total} ready` +
              (prog.error ? ` (${prog.error} failed)` : '')
            : 'No files';

          const percent =
            prog && prog.total > 0
              ? Math.round((prog.ready / prog.total) * 100)
              : 0;
          return (
            <li
              key={f.id}
              className="relative group border rounded px-3 py-2 flex justify-between items-center"
            >
              <div className="flex gap-2">
                <Folder />
                <span>{f.name}</span>
              </div>

              <div className="flex">
                {/* Progress */}
                <div className="mt-1 mx-2">
                  <div className="w-full bg-gray-200 h-2 rounded">
                    <div
                      className="bg-green-500 h-2 rounded transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
                <Button
                  variant="link"
                  size="icon"
                  className="cursor-pointer"
                  title={
                    prog && prog.total > 0 && prog.ready < prog.total
                      ? 'Continue processing'
                      : 'Refresh this folder'
                  }
                  onClick={() =>
                    listAndSaveFiles(
                      f.id,
                      prog ? prog.ready < prog.total : false,
                    )
                  }
                >
                  <FolderSync />
                </Button>
                {/* Navigate inside */}
                <Button variant="link" size="icon" title="Select this folder">
                  <Link to={`/${provider}/folder/${f.id}`}>
                    <ChevronRight />
                  </Link>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <Button
        className="mt-4 btn-primary"
        onClick={async () => pickNewFolder()}
      >
        Add New Folder
      </Button>
    </>
  );
}
