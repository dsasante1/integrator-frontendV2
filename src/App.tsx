import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import IntegratorApp from './components/IntegratorApp';
import HomePage from './components/HomePage';

// Component to handle route changes
const RouteChangeHandler: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [location]);

  return null;
};

const App: React.FC = () => {
  return (
    <div className="min-h-screen">
      <AuthProvider>
        <Router>
          <RouteChangeHandler />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/app/*" element={<IntegratorApp />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
};

export default App; 