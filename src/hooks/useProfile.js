// src/hooks/useProfile.js
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export function useProfile(userIdOverride) {
  const { user } = useAuth();
  const uid = userIdOverride ?? user?.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!uid) { setProfile(null); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    setError(err || null);
    setProfile(data ?? null);
    setLoading(false);
  }, [uid]);

  useEffect(() => { refresh(); }, [refresh]);

  const updateProfile = useCallback(async (fields) => {
    if (!uid) throw new Error('Not signed in');
    const { data, error: err } = await supabase
      .from('profiles')
      .update(fields)
      .eq('id', uid)
      .select()
      .single();
    if (err) throw err;
    setProfile(data);
    return data;
  }, [uid]);

  const isUsernameAvailable = useCallback(async (name) => {
    const value = (name || '').trim();
    if (!value) return false;
    const { count, error: err } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .ilike('username', value); // case-insensitive equality (no wildcards)
    if (err) throw err;
    return (count ?? 0) === 0;
  }, []);

  const setUsername = useCallback(async (name) => {
    const value = (name || '').trim();
    if (!/^[A-Za-z0-9_]{3,20}$/.test(value)) {
      throw new Error('Username must be 3–20 characters (letters, numbers, underscores).');
    }
    const available = await isUsernameAvailable(value);
    if (!available) throw new Error('That username is taken.');

    const updated = await updateProfile({ username: value });

    // Optional: mirror to auth.user_metadata so it appears in the session/JWT
    await supabase.auth.updateUser({ data: { username: updated.username } });

    return updated;
  }, [isUsernameAvailable, updateProfile]);

  return { profile, loading, error, refresh, updateProfile, setUsername, isUsernameAvailable };
}