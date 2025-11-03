import React from 'react';

export default function Navbar({ onLoginClick }) {
  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Text logo: NovaFolio */}
        <a href="/" className="text-lg font-bold">
          <span className="bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
            Templyx
          </span>
        </a>

        <div className="flex items-center gap-6">
          <a href="#" className="text-sm text-gray-700 hover:text-gray-900">Home</a>
          <a href="#" className="text-sm text-gray-700 hover:text-gray-900">Projects</a>
          <a href="#" className="text-sm text-gray-700 hover:text-gray-900">About</a>

          <button
            onClick={onLoginClick}
            className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Login
          </button>
        </div>
      </div>
    </nav>
  );
}