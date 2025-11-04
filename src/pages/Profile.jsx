import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  const [authOpen, setAuthOpen] = React.useState(false);
  const navigate = useNavigate();

  // local profile state
  const [profile, setProfile] = React.useState(null);
  const [pLoading, setPLoading] = React.useState(true);
  const [pError, setPError] = React.useState('');

  // username edit state
  const [editing, setEditing] = React.useState(false);
  const [usernameInput, setUsernameInput] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [msgError, setMsgError] = React.useState('');
  const [msgOk, setMsgOk] = React.useState('');

  React.useEffect(() => {
    const load = async () => {
      if (!user) { setPLoading(false); setProfile(null); return; }
      setPLoading(true);
      setPError('');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) setPError(error.message);
      setProfile(data || null);
      setPLoading(false);
      if (data?.username) setUsernameInput(data.username);
    };
    load();
  }, [user]);

  const validateUsername = (v) => /^[A-Za-z0-9_]{3,20}$/.test(v);

  const saveUsername = async () => {
    setMsgError('');
    setMsgOk('');
    const value = (usernameInput || '').trim();
    if (!validateUsername(value)) {
      setMsgError('Username must be 3–20 characters (letters, numbers, underscores).');
      return;
    }
    try {
      setSaving(true);

      // Try update; DB has unique index on lower(username)
      const { data, error } = await supabase
        .from('profiles')
        .update({ username: value })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        // 23505 is unique_violation
        if (error.code === '23505' || /duplicate key|unique/i.test(error.message)) {
          throw new Error('That username is taken. Try another.');
        }
        throw error;
      }

      setProfile(data);
      setMsgOk('Username saved!');
      setEditing(false);

      // Optional mirror so Navbar that reads user.user_metadata sees it too
      await supabase.auth.updateUser({ data: { username: data.username } });
    } catch (e) {
      setMsgError(e?.message || 'Failed to save username.');
    } finally {
      setSaving(false);
    }
  };

  // derive display first name from profile.full_name or auth metadata
  const firstName =
    profile?.full_name?.trim()?.split(/\s+/)[0] ??
    user?.user_metadata?.given_name ??
    user?.user_metadata?.first_name ??
    (user?.user_metadata?.name?.trim()?.split(/\s+/)[0]) ??
    (user?.user_metadata?.full_name?.trim()?.split(/\s+/)[0]) ??
    null;

  if (loading || pLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLoginClick={() => setAuthOpen(true)} />

      <main className="mx-auto max-w-4xl px-4 py-12">
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
          <div className="rounded-xl border border-gray-200 bg-white p-8">
            <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>

            {pError && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {pError}
              </div>
            )}

            <div className="mt-6 grid gap-6">
              {/* Username */}
              <div>
                <div className="text-xs uppercase text-gray-500">Username</div>

                {/* If we have a username and not editing, just show it with an Edit button */}
                {profile?.username && !editing ? (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="font-medium text-gray-900">{profile.username}</div>
                    <button
                      onClick={() => {
                        setUsernameInput(profile.username);
                        setEditing(true);
                        setMsgError('');
                        setMsgOk('');
                      }}
                      className="text-xs text-gray-600 hover:text-gray-900 underline"
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
                      onChange={(e) => {
                        setUsernameInput(e.target.value);
                        setMsgError('');
                        setMsgOk('');
                      }}
                      disabled={saving}
                    />
                    <button
                      onClick={saveUsername}
                      disabled={saving}
                      className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    {profile?.username && (
                      <button
                        onClick={() => {
                          setEditing(false);
                          setMsgError('');
                          setMsgOk('');
                          setUsernameInput(profile.username);
                        }}
                        className="text-xs text-gray-600 hover:text-gray-900 underline"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Full name */}
              <div>
                <div className="text-xs uppercase text-gray-500">Full name</div>
                <div className="mt-1 font-medium text-gray-900">
                  {profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '—'}
                </div>
              </div>

              {/* Email (from auth, not stored in profiles) */}
              <div>
                <div className="text-xs uppercase text-gray-500">Email</div>
                <div className="mt-1 font-medium text-gray-900">{user.email}</div>
              </div>

              {msgError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {msgError}
                </div>
              )}
              {msgOk && (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {msgOk}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={async () => {
                    await signOut();
                    navigate('/', { replace: true });
                  }}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}