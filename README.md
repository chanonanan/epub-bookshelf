# Google Drive EPUB Bookshelf

A React web app that lets you browse and read EPUB books from your Google Drive. Built with React, Vite, TypeScript, and TailwindCSS.

## Features

- Google OAuth authentication
- List EPUB files from Google Drive
- Display book covers and titles in a grid layout
- Search, sort, filter, and group books by series, author, or tag
- Switch between grid and list layouts, and refresh metadata for selected books
- Virtualized rendering for large shelves
- Built-in EPUB reader (epub.js)
- Local caching of book metadata and covers
- Installable PWA with an offline-cached app shell
- Update prompts let you install a new build or skip it; skipped builds are
  remembered, and update checks are available in Settings

The PWA caches the application shell and static assets. Google Drive content still
requires an internet connection and Google authorization. Update prompts are
shown in-app; background push notifications are not configured.

## Prerequisites

- Node.js and npm installed
- A Google Cloud Project with:
  - OAuth 2.0 credentials configured
  - Google Drive API enabled

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a project in [Google Cloud Console](https://console.cloud.google.com):
   - Enable the Google Drive API
   - Configure OAuth 2.0 credentials
   - Add your domain to authorized JavaScript origins
   - Save your Client ID

3. Create `.env` file in project root with your Google OAuth client ID:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here
   ```

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Mobile testing with local bookshelf data

The development build includes a **Load test data** button on the home page.
On first use, it copies the browser-exported metadata and cover images from
`local-test-data/` into the app's normal IndexedDB caches. The dataset directory
is ignored by Git and served only by Vite. Later loads use the IndexedDB copy.
To open the app on a phone on the same network, visit
`http://<dev-machine-IP>:5173`.

The local fixture contains book metadata and cover images (about 380 MiB), but
not EPUB files. Browsing, searching, grouping, and book details work without
Google sign-in; EPUB downloads and metadata refresh are unavailable for fixture
books. Keep the development server on a trusted network while this personal
data is present.

## Building for Production

```bash
npm run build
```

Deploy the contents of the `dist` folder to your static hosting service (Netlify, Vercel, or GitHub Pages).

## Tech Stack

- React + Vite (TypeScript)
- TailwindCSS for styling
- Google Identity Services for OAuth
- Google Drive API v3
- epub.js for EPUB reading
- localforage for caching

## Project Structure

```
src/
  ├── components/
  │   ├── Bookshelf.tsx    # Grid of book covers
  │   └── Reader.tsx       # EPUB reader component
  ├── App.tsx             # Main app component
  ├── googleDrive.ts      # Google Drive API helpers
  ├── epubUtils.ts        # EPUB parsing utilities
  └── main.tsx           # App entry point
```

## License

MIT

```

```
