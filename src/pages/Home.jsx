import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import ProjectFormModal from '../components/ProjectFormModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

function CreateProjectCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white/70 p-8 text-center shadow-sm transition hover:border-gray-400 hover:bg-white"
    >
      <div className="grid h-16 w-16 place-items-center rounded-full bg-gray-100 text-gray-500 transition group-hover:bg-gray-200">
        <span className="text-3xl leading-none">+</span>
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-900">Publish project</div>
        <div className="text-xs text-gray-500">Share what you’ve built</div>
      </div>
    </button>
  );
}

function ProjectCard({ project, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="h-40 w-full bg-gray-100">
        {project.image_url ? (
          <img src={project.image_url} alt={project.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-500 to-pink-500 text-white">
            <span className="text-lg font-semibold">
              {project.title?.[0]?.toUpperCase() || 'P'}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900">{project.title}</h3>
        <div className="mt-1 text-xs text-gray-600">
          {project.owner?.full_name || (project.owner?.username ? '@' + project.owner.username : '—')}
        </div>
        {project.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">{project.description}</p>
        ) : null}
        {Array.isArray(project.tools) && project.tools.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {project.tools.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoadingProjects(true);
      setError('');
      const { data, error: err } = await supabase
        .from('projects')
        .select(`
          id, title, description, tools, image_url, created_at,
          owner:profiles (username, full_name, avatar_url)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(12);

      if (!alive) return;
      if (err) {
        setError(err.message);
        setProjects([]);
      } else {
        setProjects(data || []);
      }
      setLoadingProjects(false);
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const handleCreateClick = () => {
    if (!user) setAuthOpen(true);
    else setPublishOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLoginClick={() => setAuthOpen(true)} />

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Social-style grid of projects, with a create card */}
        {loadingProjects ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Create/publish card */}
            <CreateProjectCard onClick={handleCreateClick} />

            {/* Recent projects */}
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onClick={() => navigate('/projects')}
              />
            ))}
          </section>
        )}
      </main>

      {/* Auth modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        redirectPath="/home"
        overlayDelay={900}
      />

      {/* Reuse the same Project form modal used in Profile (create mode) */}
      <ProjectFormModal
        isOpen={publishOpen}
        onClose={() => setPublishOpen(false)}
        initial={null}
        onSaved={() => {
          setPublishOpen(false);
          navigate('/projects'); // go to the projects page where detailed modal is available
        }}
      />
    </div>
  );
}