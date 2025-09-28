src/
├── app/
│ ├── App.tsx # root routes + provider context
│ ├── routes.tsx # central route definitions
│ └── providers.tsx # auth + provider switching
│
├── pages/
│ ├── LoginPage.tsx
│ ├── FoldersPage.tsx # list of cached folders
│ ├── BookshelfPage.tsx # progressive file list + metadata extraction
│ ├── BookDetailsPage.tsx
│ └── ReaderPage.tsx
│
├── components/
│ ├── layout/
│ │ ├── Navbar.tsx
│ │ └── ProviderSwitcher.tsx
│ ├── bookshelf/
│ │ ├── BookCard.tsx
│ │ ├── BookList.tsx
│ │ └── GroupedShelf.tsx
│ ├── common/
│ │ ├── LazyImage.tsx
│ │ ├── ViewToggle.tsx
│ │ └── SearchBox.tsx
│ └── ProgressIndicator.tsx
│
├── providers/ # cloud provider APIs
│ ├── storageProvider.ts # interface
│ ├── gdrive.ts
│ └── onedrive.ts
│
├── db/
│ ├── schema.ts # IndexedDB schema (folders, files, covers, syncRoots, settings)
│ ├── index.ts
│ └── migrations/
│ └── migrateMetadata.ts
│
├── services/
│ ├── batchProcessor.ts # global queue, worker manager
│ ├── syncService.ts # push/pull JSON from Drive/OneDrive
│ ├── coverService.ts # compress WebP, store covers
│ ├── channel.ts # BroadcastChannel for multi-tab sync
│ └── settingsService.ts
│
├── hooks/
│ ├── useBatchProgress.ts # subscribe to global batch progress
│ ├── useEpubWorker.ts
│ ├── useBreakpoint.ts
│ └── useScrollRestore.ts
│
├── workers/
│ └── epubWorker.ts # fetch EPUB + extract metadata + cover
│
├── types/
│ ├── models.ts # File, Folder, Metadata, Progress, SyncRoot
│ └── api.ts
│
└── utils/
├── formatDate.ts
├── debounce.ts
└── logger.ts
