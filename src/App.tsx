import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import IntegratorApp from './components/IntegratorApp';
import HomePage from './components/HomePage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/app/*" element={<IntegratorApp />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App; 