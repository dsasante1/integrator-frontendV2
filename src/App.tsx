import React from 'react';
import { AuthProvider } from './contexts/AuthContext';

const App: React.FC = () => {
  return (
    <div className="min-h-screen">
      <AuthProvider>
        {/* This component is now just a wrapper for AuthProvider */}
        {/* Actual page content will be rendered by Astro pages */}
      </AuthProvider>
    </div>
  );
};

export default App;