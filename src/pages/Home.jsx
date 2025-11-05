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
      className="group flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white/70 p-6 text-center shadow-sm transition hover:border-gray-400 hover:bg-white"
    >
      <div className="grid h-12 w-12 place-items-center rounded-full bg-gray-100 text-gray-500 transition group-hover:bg-gray-200">
        <span className="text-3xl leading-none">+</span>
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-900">Publish project</div>
        <div className="text-xs text-gray-500">Share what you’ve built</div>
      </div>
    </button>
  );
}

function ProjectCard({ project, onClick, reactionCounts, navigate }) {
  return (
    <button
      onClick={onClick}
      className="group w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="h-32 w-full bg-gray-100">
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
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
          <img
            src={project.owner?.avatar_url || 'https://via.placeholder.com/16'}
          alt={project.owner?.username}
        className="w-4 h-4 rounded-full object-cover"
        />
        <span>{project.owner?.full_name || (project.owner?.username ? '@' + project.owner.username : '—')}</span>
        </div>
        <div className="mt-1">
          <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
            {project.category}
          </span>
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

        {/* Reaction displays */}
        <div className="mt-3 flex gap-2">
        {[
          { type: 'cool', count: reactionCounts[project.id]?.cool || 0, src: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGQweHE3MTVsa3JxNGg2Y3FzZThlcGQ1aW54MTU4N2xzanZlc3M0diZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5gXYzsVBmjIsw/giphy.gif' },
            { type: 'fire', count: reactionCounts[project.id]?.fire || 0, src: 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTBxZjMxbTliaXR4d2UzbDEyZnNoMW9tdmFxbmUzdzZxOGE4Y2FjMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JQhWDr0NIkZHy/giphy.gif' },
            { type: 'nice', count: reactionCounts[project.id]?.nice || 0, src: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3UzNXFtczhnOW1meGM1M3dyM3p2MmQ1OWtxaTN0eGp3YmhqbGwwbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/yJFeycRK2DB4c/giphy.gif' },
          ].filter(r => r.count > 0).sort((a, b) => b.count - a.count).map(r => (
            <div key={r.type} className="flex flex-col items-center">
              <img src={r.src} alt={r.type} className="w-8 h-8 rounded" />
              <span className="text-xs text-gray-500 mt-1">{r.count}</span>
            </div>
          ))}
        </div>
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
  const [reactionCounts, setReactionCounts] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoadingProjects(true);
      setError('');
      const { data, error: err } = await supabase
        .from('projects')
        .select(`
        id, title, description, tools, category, image_url, created_at,
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
        // Fetch reaction counts
        if (data && data.length > 0) {
          fetchReactionCounts(data.map(p => p.id));
        }
      }
      setLoadingProjects(false);
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const fetchReactionCounts = async (projectIds) => {
    try {
      const { data: reactions } = await supabase
        .from('project_reactions')
        .select('project_id, reaction_type')
        .in('project_id', projectIds);

      const counts = {};
      reactions?.forEach(r => {
        if (!counts[r.project_id]) counts[r.project_id] = { cool: 0, fire: 0, nice: 0 };
        counts[r.project_id][r.reaction_type]++;
      });
      setReactionCounts(counts);
    } catch (error) {
      console.error('Error fetching reaction counts:', error);
    }
  };

  const handleCreateClick = () => {
    if (!user) setAuthOpen(true);
    else setPublishOpen(true);
  };

  const toggleReaction = async (projectId, type) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    try {
      const { data: existing } = await supabase
        .from('project_reactions')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('reaction_type', type)
        .maybeSingle();

      if (existing) {
        await supabase.from('project_reactions').delete().eq('id', existing.id);
      } else {
        await supabase.from('project_reactions').insert({
          project_id: projectId,
          user_id: user.id,
          reaction_type: type
        });
      }
      // Optionally refetch projects to update counts, but for now, just toggle
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
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
          <>
            {/* Brief introduction */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Templx</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover and share creative projects built with modern web technologies.
                Explore portfolios, UI designs, and innovative ideas from our community.
              </p>
            </div>

            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Create/publish card */}
              <CreateProjectCard onClick={handleCreateClick} />

              {/* Recent projects */}
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onClick={() => navigate('/projects')}
                  reactionCounts={reactionCounts}
                  navigate={navigate}
                />
              ))}
            </section>
          </>
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
          // Optionally refresh or navigate
        }}
      />
    </div>
  );
}