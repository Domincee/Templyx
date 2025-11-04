import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';

export default function About() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLoginClick={() => setAuthOpen(true)} />

      <main className="mx-auto max-w-6xl px-4 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">About</h1>
          <p className="mt-2 text-gray-600">Learn more about me and my work.</p>
        </header>

        <section className="prose prose-gray max-w-none">
          <p>
            Welcome to my portfolio! I'm a passionate developer who loves creating clean, efficient, and user-friendly applications.
          </p>
          <p>
            This template showcases some of my projects and skills. Feel free to explore and get in touch if you'd like to collaborate.
          </p>
        </section>
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
