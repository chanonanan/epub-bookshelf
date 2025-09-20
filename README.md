# Google Drive EPUB Bookshelf

A React web app that lets you browse and read EPUB books from your Google Drive. Built with React, Vite, TypeScript, and TailwindCSS.

## Features

- Google OAuth authentication
- List EPUB files from Google Drive
- Display book covers and titles in a grid layout
- Built-in EPUB reader (epub.js)
- Local caching of book metadata and covers

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
