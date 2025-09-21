import { BrowserRouter } from 'react-router-dom';
import './App.css';
import { AppContent } from './AppContent';
import { ThemeProvider } from "@/components/ThemeProvider";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
};
