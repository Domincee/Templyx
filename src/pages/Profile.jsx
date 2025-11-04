import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import ProjectFormModal from '../components/ProjectFormModal';
import { deleteAllUserStorage } from '../utils/storageCleanup';

export default function Profile() {
    const [deleting, setDeleting] = React.useState(false);
    const [delErr, setDelErr] = React.useState('');

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

    async function handleDeleteAccount() {
        if (!user) return;
        if (!confirm('Delete your account? This will remove your projects and images.')) return;

        try {
            setDeleting(true);
            setDelErr('');

            // Capture token first
            const { data: sess } = await supabase.auth.getSession();
            const jwt = sess?.session?.access_token;
            console.log('delete jwt present?', !!jwt, jwt?.slice(0, 12));

            // 1) Storage
            await deleteAllUserStorage({ userId: user.id, username: profile?.username });

            // 2) Profile (cascades projects)
            const { error: profErr } = await supabase.from('profiles').delete().eq('id', user.id);
            if (profErr) throw profErr;

            // 3) Clear local session only (avoid 403 on global logout)
            await supabase.auth.signOut({ scope: 'local' });

            // 4) Delete auth user via serverless API
            const apiBase = import.meta.env.DEV ? 'http://localhost:3000' : '';
            const resp = await fetch(`${apiBase}/api/delete-account`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${jwt}`, // must be here
                },
                body: JSON.stringify({ userId: user.id }),
            });
            if (!resp.ok) {
                const msg = await resp.text().catch(() => '');
                throw new Error(`Auth delete failed: ${resp.status} ${msg}`);
            }
            // 5) Redirect
            navigate('/', { replace: true });
        } catch (e) {
            setDelErr(e?.message || 'Failed to delete account.');
        } finally {
            setDeleting(false);
        }
    }

    const loadProfileRow = React.useCallback(async () => {
        if (!user) { setProfile(null); setProfileLoading(false); return; }
        setProfileLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, full_name')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            console.error(error);
        } else if (!data) {
            setProfile(null);
            setUsernameInput('');
            setUEditing(true);
        } else {
            setProfile(data);
            setUsernameInput(data.username || '');
            setUEditing(!data.username);
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
        <div className="min-h-screen bg-white">
            <Navbar onLoginClick={() => setAuthOpen(true)} />
            <main className="mx-auto max-w-5xl px-4 py-12">
                {!user ? (
                    <div className="rounded-xl border border-black bg-white p-8 text-center">
                        <h1 className="text-2xl font-semibold text-black">You’re not logged in</h1>
                        <p className="mt-2 text-gray-800">Please log in to view your profile.</p>
                        <button
                            onClick={() => setAuthOpen(true)}
                            className="mt-6 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 cursor-pointer"
                        >
                            Login
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Profile header */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-bounce-in max-w-3xl mx-auto">
                            {/* Profile Header */}
                            <div className="flex items-center gap-4 mb-6 max-w-[50%]">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 p-[2px] shrink-0 hover:scale-105 transition-transform duration-300">
                                    <img
                                        src={
                                            user.user_metadata?.picture ||
                                            user.user_metadata?.avatar_url ||
                                            'https://via.placeholder.com/100'
                                        }
                                        alt="Profile"
                                        className="w-full h-full rounded-full border-2 border-white object-cover"
                                    />
                                </div>

                                <div className="flex flex-col justify-center">
                                    <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
                                    <p className="text-gray-500 text-sm mt-1">
                                        Welcome back, {firstName || user.email}!
                                    </p>
                                </div>
                            </div>

                            {/* Profile Details */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Username - editable */}
                                <div>
                                    <div className="text-xs font-medium uppercase text-gray-400">Username</div>

                                    {!uEditing && profile?.username ? (
                                        <div className="mt-2 flex items-center gap-3">
                                            <div className="font-medium text-gray-900">{profile.username}</div>
                                            <button
                                                onClick={() => {
                                                    setUEditing(true);
                                                    setUError('');
                                                    setUOk('');
                                                    setUsernameInput(profile.username);
                                                }}
                                                className="px-3 py-1 text-xs font-medium text-gray-700 border border-gray-200 rounded-md 
             hover:bg-gray-100 hover:text-gray-900 
             transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
                                            >
                                                Edit
                                            </button>

                                        </div>
                                    ) : (
                                        <div className="mt-2 flex items-center gap-2">
                                            <input
                                                className="w-full max-w-xs rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                                                placeholder="Choose a username"
                                                value={usernameInput}
                                                onChange={(e) => {
                                                    setUsernameInput(e.target.value);
                                                    setUError('');
                                                    setUOk('');
                                                }}
                                                disabled={uSaving}
                                            />
                                            <button
                                                onClick={saveUsername}
                                                disabled={uSaving}
                                                className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60 transition cursor-pointer"
                                            >
                                                {uSaving ? 'Saving…' : 'Save'}
                                            </button>
                                            {profile?.username && (
                                                <button
                                                    onClick={() => {
                                                        setUEditing(false);
                                                        setUError('');
                                                        setUOk('');
                                                        setUsernameInput(profile.username);
                                                    }}
                                                    className="text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {uError && <p className="mt-1 text-xs text-red-500">{uError}</p>}
                                    {uOk && <p className="mt-1 text-xs text-green-600">{uOk}</p>}
                                </div>

                                {/* First name */}
                                <div>
                                    <div className="text-xs font-medium uppercase text-gray-400">First name</div>
                                    <div className="mt-1 font-medium text-gray-900">{firstName || '—'}</div>
                                </div>

                                {/* Email */}
                                <div className="sm:col-span-2">
                                    <div className="text-xs font-medium uppercase text-gray-400">Email</div>
                                    <div className="mt-1 font-medium text-gray-900">{user.email}</div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                    onClick={async () => {
                                        await signOut();
                                        navigate('/', { replace: true });
                                    }}
                                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition animate-bounce-in cursor-pointer"
                                    style={{ animationDelay: '0.2s' }}
                                >
                                    Sign out
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleting}
                                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 transition animate-bounce-in cursor-pointer"
                                    style={{ animationDelay: '0.4s' }}
                                >
                                    {deleting ? 'Deleting…' : 'Delete account'}
                                </button>
                            </div>

                            {delErr && (
                                <div
                                    className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 animate-bounce-in"
                                    style={{ animationDelay: '0.6s' }}
                                >
                                    {delErr}
                                </div>
                            )}
                        </div>

                        {/* My Projects */}
                        <section className="mt-10 animate-bounce-in" style={{ animationDelay: '0.8s' }}>
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-black">My projects</h2>
                                <button
                                    onClick={() => { setEditingProject(null); setProjectModalOpen(true); }}
                                    className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 cursor-pointer"
                                >
                                    Publish
                                </button>
                            </div>

                            {pLoading ? (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="h-64 animate-pulse rounded-2xl border border-black bg-white" />
                                    ))}
                                </div>
                            ) : pError ? (
                                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{pError}</div>
                            ) : myProjects.length === 0 ? (
                                <div className="rounded-md border border-black bg-white p-6 text-center text-sm text-gray-800">
                                    You haven’t published anything yet. Click “Publish” to add your first project.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {myProjects.map((proj, index) => (
                                        <div key={proj.id} className="overflow-hidden rounded-2xl border border-black bg-white animate-bounce-in" style={{ animationDelay: `${index * 0.1}s` }}>
                                            <div className="h-40 w-full bg-white">
                                                {proj.image_url ? (
                                                    <img src={proj.image_url} alt={proj.title} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center bg-black text-white">
                                                        <span className="text-lg font-semibold">{proj.title?.[0]?.toUpperCase()}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="text-base font-semibold text-black">{proj.title}</h3>
                                                <p className="mt-1 text-sm text-gray-800">{proj.description}</p>

                                                <div className="mt-3 flex items-center justify-between">
                                                    <button
                                                        onClick={() => openEdit(proj)}
                                                        className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 cursor-pointer"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => togglePublish(proj)}
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold border cursor-pointer ${proj.published
                                                                ? 'bg-black text-white hover:bg-gray-800'
                                                                : 'bg-white text-black border-black hover:bg-black hover:text-white'
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