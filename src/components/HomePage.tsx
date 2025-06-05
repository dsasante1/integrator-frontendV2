import React, { useState } from 'react';
import LoginForm from './LoginForm';

const HomePage: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6">
        <div className="text-xl font-semibold tracking-wide uppercase text-black">Integrator</div>
        <div className="space-x-3">
          <button
            onClick={() => setShowSignup(true)}
            className="px-5 py-2 border border-black rounded-lg bg-black text-white font-medium hover:bg-gray-900 transition"
          >
            Sign Up
          </button>
          <button
            onClick={() => setShowLogin(true)}
            className="px-5 py-2 border border-black rounded-lg bg-black text-white font-medium hover:bg-gray-900 transition"
          >
            Log In
          </button>
        </div>
      </header>

      {/* Feature Cards Grid */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Top Row */}
          <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center text-center">
            {/* Icon */}
            <svg width="64" height="64" fill="none" viewBox="0 0 64 64" className="mb-4">
              <rect x="12" y="16" width="40" height="32" rx="4" stroke="#222" strokeWidth="2"/>
              <circle cx="48" cy="20" r="5" fill="#6fcf97"/>
              <line x1="20" y1="28" x2="44" y2="28" stroke="#222" strokeWidth="2"/>
              <line x1="20" y1="36" x2="44" y2="36" stroke="#222" strokeWidth="2"/>
            </svg>
            <h2 className="text-xl font-semibold mb-2">Manage API collections</h2>
            <p className="text-gray-500">Organize and maintain your Postman API collections.</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center text-center">
            {/* Icon */}
            <svg width="64" height="64" fill="none" viewBox="0 0 64 64" className="mb-4">
              <rect x="16" y="16" width="32" height="40" rx="4" stroke="#222" strokeWidth="2"/>
              <polygon points="48,16 56,24 48,24" fill="#6fcf97"/>
              <line x1="24" y1="32" x2="40" y2="32" stroke="#222" strokeWidth="2"/>
              <line x1="24" y1="40" x2="40" y2="40" stroke="#222" strokeWidth="2"/>
            </svg>
            <h2 className="text-xl font-semibold mb-2">Snapshots of changes</h2>
            <p className="text-gray-500">Snapshot and track changes to collection contents</p>
          </div>
          {/* Bottom Row (spans both columns) */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow p-8 flex flex-col items-center text-center mt-2">
            {/* Icon */}
            <svg width="64" height="64" fill="none" viewBox="0 0 64 64" className="mb-4">
              <rect x="12" y="20" width="28" height="28" rx="4" stroke="#222" strokeWidth="2"/>
              <rect x="24" y="12" width="28" height="28" rx="4" stroke="#222" strokeWidth="2"/>
              <path d="M32 34h8m0 0-2-2m2 2-2 2" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M40 42h-8m0 0 2-2m-2 2 2 2" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2 className="text-xl font-semibold mb-2">Compare snapshots</h2>
            <p className="text-gray-500">Compare snapshots to view differences</p>
          </div>
        </div>
      </main>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-5xl font-light"
              aria-label="Close"
            >
              &times;
            </button>
            <LoginForm onSuccess={() => {
              setShowLogin(false);
              window.location.href = '/app';
            }} />
          </div>
        </div>
      )}

      {/* Signup Modal (reuses LoginForm in signup mode) */}
      {showSignup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowSignup(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-5xl font-light"
              aria-label="Close"
            >
              &times;
            </button>
            <LoginForm onSuccess={() => {
              setShowSignup(false);
              window.location.href = '/app';
            }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage; 