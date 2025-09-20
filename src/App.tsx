import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BookshelfPage from './pages/BookshelfPage';
import SeriesPage from './pages/SeriesPage';
import BookDetailsPage from './pages/BookDetailsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/bookshelf/:folderId" element={<BookshelfPage />} />
        <Route path="/bookshelf/:folderId/:series" element={<SeriesPage />} />
        <Route path="/book/:id" element={<BookDetailsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
