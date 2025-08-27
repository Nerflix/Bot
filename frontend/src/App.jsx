import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BotDetailsPage from './pages/BotDetailsPage';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Landing page route */}
          <Route path="/" element={<BotDetailsPage />} />
          
          {/* Redirect any other paths to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;