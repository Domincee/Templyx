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

  // Basic profile display (from auth metadata for name/email)
  const firstName =
    user?.user_metadata?.given_name ??
    user?.user_metadata?.first_name ??
    (user?.user_metadata?.name?.trim()?.split(/\s+/)[0]) ??
    (user?.user_metadata?.full_name?.trim()?.split(/\s+/)[0]) ??
    null;

  // Load/edit username from profiles table
  const [profile, setProfile] = React.useState(null);
  const [profileLoading, setProfileLoading] = React.useState(true);
  const [uEditing, setUEditing] = React.useState(false);
  const [usernameInput, setUsernameInput] = React.useState('');
  const [uSaving, setUSaving] = React.useState(false);
  const [uError, setUError] = React.useState('');
  const [uOk, setUOk] = React.useState('');

  const loadProfileRow = React.useCallback(async () => {
    if (!user) { setProfile(null); setProfileLoading(false); return; }
    setProfileLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .eq('id', user.id)
      .single();
    if (!error) {
      setProfile(data);
      setUsernameInput(data?.username || '');
      setUEditing(!data?.username); // auto-open edit if missing
    } else {
      // If row missing (should be inserted by trigger), keep editing on
      setProfile(null);
      setUsernameInput('');
      setUEditing(true);
    }
    setProfileLoading(false);
  }, [user]);

  React.useEffect(() => { loadProfileRow(); }, [loadProfileRow]);

  const validateUsername = (v) => /^[A-Za-z0-9_]{3,20}$/.test(v);

  const saveUsername = async () => {
    setUError('');
    setUOk('');
    const value = (usernameInput || '').trim();

    if (!validateUsername(value)) {
      setUError('Username must be 3–20 characters (letters, numbers, underscores).');
      return;
    }

    try {
      setUSaving(true);
      // Upsert to ensure a row exists; unique index on lower(username) enforces uniqueness
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, username: value }, { onConflict: 'id' })
        .select('id, username, full_name')
        .single();

      if (error) {
        if (error.code === '23505' || /duplicate key|unique/i.test(error.message)) {
          throw new Error('That username is taken. Try another.');
        }
        throw error;
      }

      setProfile(data);
      setUEditing(false);
      setUOk('Username saved!');

      // Mirror to auth.user_metadata so Navbar/Profile update immediately
      await supabase.auth.updateUser({ data: { username: data.username } });
    } catch (e) {
      setUError(e?.message || 'Failed to save username.');
    } finally {
      setUSaving(false);
    }
  };

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
    } else {
      setMyProjects((prev) => prev.map((p) => (p.id === proj.id ? data : p)));
    }
  };

  if (loading || profileLoading) {
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
                {/* Username - editable */}
                <div>
                  <div className="text-xs uppercase text-gray-500">Username</div>

                  {!uEditing && profile?.username ? (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="font-medium text-gray-900">{profile.username}</div>
                      <button
                        onClick={() => { setUEditing(true); setUError(''); setUOk(''); setUsernameInput(profile.username); }}
                        className="text-xs text-gray-600 underline hover:text-gray-900"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                        placeholder="Choose a username"
                        value={usernameInput}
                        onChange={(e) => { setUsernameInput(e.target.value); setUError(''); setUOk(''); }}
                        disabled={uSaving}
                      />
                      <button
                        onClick={saveUsername}
                        disabled={uSaving}
                        className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                      >
                        {uSaving ? 'Saving…' : 'Save'}
                      </button>
                      {profile?.username && (
                        <button
                          onClick={() => { setUEditing(false); setUError(''); setUOk(''); setUsernameInput(profile.username); }}
                          className="text-xs text-gray-600 underline hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}

                  {uError && <p className="mt-1 text-xs text-red-600">{uError}</p>}
                  {uOk && <p className="mt-1 text-xs text-green-600">{uOk}</p>}
                </div>

                {/* First name */}
                <div>
                  <div className="text-xs uppercase text-gray-500">First name</div>
                  <div className="mt-1 font-medium text-gray-900">{firstName || '—'}</div>
                </div>

                {/* Email */}
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
                  onClick={() => { setEditingProject(null); setProjectModalOpen(true); }}
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
                          <button onClick={() => openEdit(proj)} className="text-sm font-medium text-gray-700 hover:text-gray-900">
                            Edit
                          </button>
                          <button
                            onClick={() => togglePublish(proj)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${proj.published ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
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