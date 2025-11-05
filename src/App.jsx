import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Profile from './pages/Profile';
import About from './pages/About';
import PostLoginRedirectOverlay from './components/PostLoginRedirectOverlay';
import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <PostLoginRedirectOverlay defaultTo="/home" defaultDelay={1200} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/about" element={<About />} />
        <Route path="/profile/:username?" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}