import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import ProjectFormModal from '../components/ProjectFormModal';

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  const [authOpen, setAuthOpen] = React.useState(false);
  const navigate = useNavigate();

  // Basic profile display (from auth metadata)
  const username =
    user?.user_metadata?.username ??
    user?.user_metadata?.preferred_username ??
    null;

  const firstName =
    user?.user_metadata?.given_name ??
    user?.user_metadata?.first_name ??
    (user?.user_metadata?.name?.trim()?.split(/\s+/)[0]) ??
    (user?.user_metadata?.full_name?.trim()?.split(/\s+/)[0]) ??
    null;

  // My projects state
  const [myProjects, setMyProjects] = React.useState([]);
  const [pLoading, setPLoading] = React.useState(true);
  const [pError, setPError] = React.useState('');

  // Modals for create/edit
  const [projectModalOpen, setProjectModalOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState(null);

  const loadMyProjects = React.useCallback(async () => {
    if (!user) { setMyProjects([]); setPLoading(false); return; }
    setPLoading(true);
    setPError('');
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, description, tools, image_url, live_url, repo_url, published, created_at, updated_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    if (error) setPError(error.message);
    setMyProjects(data || []);
    setPLoading(false);
  }, [user]);

  React.useEffect(() => { loadMyProjects(); }, [loadMyProjects]);

  const openCreate = () => { setEditingProject(null); setProjectModalOpen(true); };
  const openEdit = (proj) => { setEditingProject(proj); setProjectModalOpen(true); };

  const onSaved = (proj) => {
    // Merge into list (update or insert)
    setMyProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === proj.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = proj;
        return copy;
      }
      return [proj, ...prev];
    });
  };

  const onDeleted = (id) => {
    setMyProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const togglePublish = async (proj) => {
    const desired = !proj.published;
    const { data, error } = await supabase
      .from('projects')
      .update({ published: desired })
      .eq('id', proj.id)
      .select()
      .single();
    if (error) {
      alert(error.message);
      return;
    }
    setMyProjects((prev) => prev.map((p) => (p.id === proj.id ? data : p)));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLoginClick={() => setAuthOpen(true)} />

      <main className="mx-auto max-w-5xl px-4 py-12">
        {!user ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">You’re not logged in</h1>
            <p className="mt-2 text-gray-600">Please log in to view your profile.</p>
            <button
              onClick={() => setAuthOpen(true)}
              className="mt-6 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Login
            </button>
          </div>
        ) : (
          <>
            {/* Profile header */}
            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs uppercase text-gray-500">Username</div>
                  <div className="mt-1 font-medium text-gray-900">{username || '—'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-gray-500">First name</div>
                  <div className="mt-1 font-medium text-gray-900">{firstName || '—'}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs uppercase text-gray-500">Email</div>
                  <div className="mt-1 font-medium text-gray-900">{user.email}</div>
                </div>
              </div>

              <button
                onClick={async () => {
                  await signOut();
                  navigate('/', { replace: true });
                }}
                className="mt-8 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Sign out
              </button>
            </div>

            {/* My Projects */}
            <section className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">My projects</h2>
                <button
                  onClick={openCreate}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Publish
                </button>
              </div>

              {pLoading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white" />
                  ))}
                </div>
              ) : pError ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{pError}</div>
              ) : myProjects.length === 0 ? (
                <div className="rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
                  You haven’t published anything yet. Click “Publish” to add your first project.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {myProjects.map((proj) => (
                    <div key={proj.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="h-40 w-full bg-gray-100">
                        {proj.image_url ? (
                          <img src={proj.image_url} alt={proj.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-500 to-pink-500 text-white">
                            <span className="text-lg font-semibold">{proj.title?.[0]?.toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-base font-semibold text-gray-900">{proj.title}</h3>
                        <p className="mt-1 text-sm text-gray-600">{proj.description}</p>

                        <div className="mt-3 flex items-center justify-between">
                          <button
                            onClick={() => openEdit(proj)}
                            className="text-sm font-medium text-gray-700 hover:text-gray-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => togglePublish(proj)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              proj.published
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {proj.published ? 'Published' : 'Unpublished'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      <ProjectFormModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        initial={editingProject}
        onSaved={onSaved}
        onDeleted={onDeleted}
      />
    </div>
  );
}