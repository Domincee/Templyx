import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLoginClick={() => setAuthOpen(true)} />

      <main className="mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Build your portfolio with
          <span className="ml-2 bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
            Templyx
          </span>
        </h1>
        <p className="mt-3 text-gray-600">
          A clean, minimal starter template. Add your projects, blog, and more.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setAuthOpen(true)}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Login
          </button>
          <a
            href="#projects"
            className="text-sm text-gray-700 hover:text-gray-900"
          >
            View projects
          </a>
        </div>
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}