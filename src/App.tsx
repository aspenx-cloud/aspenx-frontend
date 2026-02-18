import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import BuilderPage from './pages/BuilderPage';
import AccountPage from './pages/AccountPage';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/builder" element={<BuilderPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
