import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import ProjectModal from '../components/ProjectModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

function ProjectCard({ project, onClick, onReactionToggle, reactionCounts, userReactions, navigate }) {
return (
<div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
<button
  onClick={onClick}
    className="w-full text-left group"
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
      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
      <img
      src={project.owner?.avatar_url || 'https://via.placeholder.com/16'}
      alt={project.owner?.username}
      className="w-4 h-4 rounded-full object-cover"
      />
      <span>{project.owner?.full_name || project.owner?.username || 'Anonymous'}</span>
      </div>
      </div>
      </button>
      {/* Reactions below the card */}
      
      <div className="p-4 border-t border-gray-100">
        <div className="flex gap-2">
           <div className="flex flex-col items-center">
            <button onClick={() => onReactionToggle?.(project.id, 'cool')} className={`p-2 rounded-lg transition hover:scale-110 ${userReactions[project.id] === 'cool' ? 'bg-blue-100 border-2 border-blue-500' : 'hover:bg-gray-100'}`}>
              <img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGQweHE3MTVsa3JxNGg2Y3FzZThlcGQ1aW54MTU4N2xzanZlc3M0diZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5gXYzsVBmjIsw/giphy.gif" alt="cool" className="w-12 h-12 rounded-xl" />
        </button>
            <span className="text-xs text-gray-500 mt-1">{reactionCounts[project.id]?.cool || 0}</span>
        </div>

          <div className="flex flex-col items-center">
            <button onClick={() => onReactionToggle?.(project.id, 'fire')} className={`p-2 rounded-lg transition hover:scale-110 ${userReactions[project.id] === 'fire' ? 'bg-red-100 border-2 border-red-500' : 'hover:bg-gray-100'}`}>
          <img src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTBxZjMxbTliaXR4d2UzbDEyZnNoMW9tdmFxbmUzdzZxOGE4Y2FjMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JQhWDr0NIkZHy/giphy.gif" alt="fire" className="w-12 h-12 rounded-xl" />
          </button>
            <span className="text-xs text-gray-500 mt-1">{reactionCounts[project.id]?.fire || 0}</span>
        </div>

        <div className="flex flex-col items-center">
            <button onClick={() => onReactionToggle?.(project.id, 'nice')} className={`p-2 rounded-lg transition hover:scale-110 ${userReactions[project.id] === 'nice' ? 'bg-green-100 border-2 border-green-500' : 'hover:bg-gray-100'}`}>
              <img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3UzNXFtczhnOW1meGM1M3dyM3p2MmQ1OWtxaTN0eGp3YmhqbGwwbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/yJFeycRK2DB4c/giphy.gif" alt="nice" className="w-12 h-12 rounded-xl" />
            </button>
            <span className="text-xs text-gray-500 mt-1">{reactionCounts[project.id]?.nice || 0}</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
            <button onClick={() => onReactionToggle?.(project.id, 'wow')} className={`p-2 rounded-lg transition hover:scale-110 ${userReactions[project.id] === 'wow' ? 'bg-green-100 border-2 border-green-500' : 'hover:bg-gray-100'}`}>
              <img src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGQ1cTRqM2ptZjR0MGswbXFtejhxbnRncjhtZDc3bm5ibmp5aXp5NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Um3ljJl8jrnHy/giphy.gif" alt="wow" className="w-12 h-12 rounded-xl" />
            </button>
            <span className="text-xs text-gray-500 mt-1">{reactionCounts[project.id]?.nice || 0}</span>
          </div>
        </div>


      </div>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [reactionCounts, setReactionCounts] = useState({});
  const [userReactions, setUserReactions] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setErr('');
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, title, description, tools, image_url, live_url, repo_url, created_at,
          owner:profiles (id, username, full_name, avatar_url)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false });
      if (!alive) return;
      if (error) setErr(error.message);
      setProjects(data || []);
      // Fetch reaction counts
      if (data && data.length > 0) {
        fetchReactionCounts(data.map(p => p.id));
      }
      setLoading(false);
    };
    load();
    return () => { alive = false; };
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

      // Fetch user reactions
      if (user) {
        const { data: userReacts } = await supabase
          .from('project_reactions')
          .select('project_id, reaction_type')
          .eq('user_id', user.id)
          .in('project_id', projectIds);

        const userReactsObj = {};
        userReacts?.forEach(r => {
          userReactsObj[r.project_id] = r.reaction_type;
        });
        setUserReactions(userReactsObj);
      }
    } catch (error) {
      console.error('Error fetching reaction data:', error);
    }
  };

  const toggleReaction = async (projectId, type) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    try {
      const current = userReactions[projectId];
      if (current === type) {
        // Remove
        await supabase.from('project_reactions').delete().eq('project_id', projectId).eq('user_id', user.id).eq('reaction_type', type);
        setUserReactions(prev => ({ ...prev, [projectId]: null }));
      } else {
        // Switch: first remove old if any, then insert new
        if (current) {
          await supabase.from('project_reactions').delete().eq('project_id', projectId).eq('user_id', user.id).eq('reaction_type', current);
        }
        await supabase.from('project_reactions').insert({
          project_id: projectId,
          user_id: user.id,
          reaction_type: type
        });
        setUserReactions(prev => ({ ...prev, [projectId]: type }));

        // Insert notification for project owner
        const { data: project } = await supabase
          .from('projects')
          .select('owner_id, title')
          .eq('id', projectId)
          .single();

        if (project && project.owner_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: project.owner_id,
            type: 'reaction',
            message: `${user.user_metadata?.full_name || user.email} reacted with ${type} to your project "${project.title}"`,
            related_id: projectId
          });
        }
      }
      // Update counts
      fetchReactionCounts(projects.map(p => p.id));
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const filteredProjects = selectedCategory === 'All' ? projects : projects.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLoginClick={() => setAuthOpen(true)} />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <p className="mt-2 text-gray-600">Latest community projects.</p>
        </header>

        {/* Category filter */}
        {!loading && !err && projects.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {['All', 'Portfolio', 'UI', 'Ecommerce', 'Dashboard', 'Blog', 'Landing', 'Hobby', 'Personal'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition hover:transform hover:-translate-y-0.5 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-black text-white'
                    : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white" />
            ))}
          </div>
        ) : err ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
            No projects in this category. Try selecting "All" or another category.
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onClick={() => setSelected(p)}
                onReactionToggle={toggleReaction}
                reactionCounts={reactionCounts}
                userReactions={userReactions}
                navigate={navigate}
              />
            ))}
          </section>
        )}
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <ProjectModal project={selected} isOpen={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}