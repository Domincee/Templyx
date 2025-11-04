import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (active) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    };
    init();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithFacebook = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
    return { error };
  };

  // ADD THIS
  const signInWithGoogle = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,     // works local and prod
        queryParams: { prompt: 'select_account' } // optional nicety
      },
    });
    if (error) setError(error.message);
    return { error };
  };

  const registerWithEmail = async ({ email, password, name, username }) => {
    setError('');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, username } },
    });
    if (error) setError(error.message);
    return { data, error };
  };

  const loginWithEmail = async ({ email, password }) => {
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user, loading, error,
      signInWithFacebook, signInWithGoogle, // expose Google
      registerWithEmail, loginWithEmail, signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}