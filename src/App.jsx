import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <Home />
    </AuthProvider>
  );
}