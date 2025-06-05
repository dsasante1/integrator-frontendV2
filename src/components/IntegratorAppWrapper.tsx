import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import IntegratorApp from './IntegratorApp';

const IntegratorAppWrapper: React.FC = () => {
  return (
    <AuthProvider>
      <IntegratorApp />
    </AuthProvider>
  );
};

export default IntegratorAppWrapper;