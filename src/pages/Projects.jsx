import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import ProjectModal from '../components/ProjectModal';
import { supabase } from '../lib/supabaseClient';

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
            <span className="text-lg font-semibold">{project.title?.[0]?.toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900">{project.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-600">{project.description}</p>
      </div>
    </button>
  );
}

export default function Projects() {
  const [authOpen, setAuthOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setErr('');
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, title, description, tools, image_url, live_url, repo_url, created_at,
          owner:profiles (id, username, full_name)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false });
      if (!alive) return;
      if (error) setErr(error.message);
      setProjects(data || []);
      setLoading(false);
    };
    load();
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLoginClick={() => setAuthOpen(true)} />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-2 text-gray-600">Latest community projects.</p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white" />
            ))}
          </div>
        ) : err ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div>
        ) : projects.length === 0 ? (
          <div className="rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
            No projects yet. Be the first to publish from Home!
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} onClick={() => setSelected(p)} />
            ))}
          </section>
        )}
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <ProjectModal project={selected} isOpen={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}