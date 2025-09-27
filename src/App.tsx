import { ThemeProvider } from '@/components/ThemeProvider';
import { HashRouter } from 'react-router-dom';
import './App.css';
import { LoadingOverlay } from './components/LoadingOverlay';
import { AppContent } from './context/AppContent';
import { LoadingProvider } from './context/LoadingContext';

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <HashRouter basename="/epub-bookshelf">
        <LoadingProvider>
          <LoadingOverlay />
          <AppContent />
        </LoadingProvider>
      </HashRouter>
    </ThemeProvider>
  );
}
