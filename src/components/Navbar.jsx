import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar({ onLoginClick }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const username =
    user?.user_metadata?.username ??
    user?.user_metadata?.preferred_username ??
    null;

  // First name only (never full name)
  const firstName =
    user?.user_metadata?.given_name ??
    user?.user_metadata?.first_name ??
    (user?.user_metadata?.name?.trim()?.split(/\s+/)[0]) ??
    (user?.user_metadata?.full_name?.trim()?.split(/\s+/)[0]) ??
    null;

  const label = loading ? '...' : user ? (username || firstName || 'Profile') : 'Login';

  const handleRightButton = () => {
    if (loading) return;
    if (user) {
      navigate('/profile');
    } else {
      onLoginClick?.();
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-bold">
          <span className="bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
            Templyx
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `text-sm px-3 py-2 rounded-lg transition-all duration-300 ease-in-out ${isActive ? 'bg-black text-white' : 'text-black hover:bg-black hover:text-white'}`
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `text-sm px-3 py-2 rounded-lg transition-all duration-300 ease-in-out ${isActive ? 'bg-black text-white' : 'text-black hover:bg-black hover:text-white'}`
            }
          >
            Projects
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `text-sm px-3 py-2 rounded-lg transition-all duration-300 ease-in-out ${isActive ? 'bg-black text-white' : 'text-black hover:bg-black hover:text-white'}`
            }
          >
            About
          </NavLink>

          <button
            onClick={handleRightButton}
            className="max-w-[160px] truncate rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            title={label}
          >
            {label}
          </button>
        </div>
      </div>
    </nav>
  );
}