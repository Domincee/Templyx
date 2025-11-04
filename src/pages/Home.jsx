import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import ProjectPublishModal from '../components/ProjectPublishModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

function PortfolioCard({ p, onClick }) {
  const initial = p.full_name?.trim()?.[0]?.toUpperCase() || p.username?.trim()?.[0]?.toUpperCase() || 'U';
  return (
    <button onClick={onClick} className="group flex w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-4 p-4">
        {p.avatar_url ? (
          <img src={p.avatar_url} alt={p.username || p.full_name || 'User'} className="h-12 w-12 rounded-full object-cover ring-1 ring-gray-200" />
        ) : (
          <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-white">
            <span className="text-lg font-semibold">{initial}</span>
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-900">{p.full_name || '—'}</div>
          <div className="truncate text-xs text-gray-500">@{p.username || 'unknown'}</div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <span className="text-xs text-gray-500">Updated {new Date(p.updated_at || p.created_at).toLocaleDateString()}</span>
      </div>
    </button>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoadingProfiles(true);
      setError('');
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, created_at, updated_at')
        .not('username', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(12);
      if (!isMounted) return;
      if (err) {
        setError(err.message);
        setProfiles([]);
      } else {
        setProfiles(data || []);
      }
      setLoadingProfiles(false);
    };
    load();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLoginClick={() => setAuthOpen(true)} />

      <main className="mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Showcase your projects with
          <span className="ml-2 bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">Templyx</span>
        </h1>
        <p className="mt-3 text-gray-600">Explore projects from the community and get inspired.</p>

        <div className="mt-8 flex items-center justify-center gap-3">
          {user && (
            <button
              onClick={() => setPublishOpen(true)}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Publish
            </button>
          )}
          <Link to="/projects" className="text-sm text-gray-700 hover:text-gray-900">
            View projects
          </Link>
        </div>

        {/* Featured Portfolios */}
        <section className="mt-16 text-left">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">Featured projects</h2>
            <Link to="/projects" className="text-sm text-gray-700 hover:text-gray-900">Explore projects</Link>
          </div>

          {loadingProfiles ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-white" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : profiles.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
              No portfolios yet. Be the first to create one!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map((p) => (
                <PortfolioCard key={p.id} p={p} onClick={() => navigate(`/u/${p.username}`)} />
              ))}
            </div>
          )}
        </section>
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} redirectPath="/home" overlayDelay={900} />

      <ProjectPublishModal
        isOpen={publishOpen}
        onClose={() => setPublishOpen(false)}
        onPublished={() => navigate('/projects')}
      />
    </div>
  );
}