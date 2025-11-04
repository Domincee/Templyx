import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthModal({
  isOpen,
  onClose,
  redirectPath = '/home',   // redirect to Home after overlay
  overlayDelay = 900,       // tweak the loader time here per-use
}) {
  const {
    user,
    loading,
    error,
    signInWithFacebook,
    registerWithEmail,
    loginWithEmail,
    signOut,
  } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.username ||
    (user?.email ? user.email.split('@')[0] : 'User');

  const username =
    user?.user_metadata?.username ||
    user?.user_metadata?.preferred_username ||
    (user?.email ? user.email.split('@')[0] : '—');

  // Tell the overlay to run (used for email/password paths)
  const requestRedirect = () => {
    const payload = { to: redirectPath, delayMs: overlayDelay };
    try {
      sessionStorage.setItem('postLoginRedirect', JSON.stringify(payload));
    } catch {}
    // Fire event so overlay shows without page reload
    window.dispatchEvent(new CustomEvent('post-login', { detail: payload }));
  };

  const handleClose = () => {
    onClose?.();
    setMode('login');
    setForm({ name: '', username: '', email: '', password: '' });
  };

  // Email/password submit
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        await loginWithEmail({ email: form.email, password: form.password });
      } else {
        await registerWithEmail({
          email: form.email,
          password: form.password,
          name: form.name,
          username: form.username,
        });
      }
      requestRedirect(); // overlay after successful sign-in (no page reload)
      onClose?.();
    } catch {
      // error is rendered from context as `error`
    }
  };

  // Facebook OAuth: set fallback BEFORE redirect, don't await
  const onFacebook = () => {
    try {
      sessionStorage.setItem(
        'postLoginRedirect',
        JSON.stringify({ to: redirectPath, delayMs: overlayDelay })
      );
    } catch {}
    // Do NOT dispatch the event here: page will navigate away to Facebook
    // The overlay will show after redirect-back via the sessionStorage fallback.
    signInWithFacebook();
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white/80 p-6 text-gray-800 shadow-xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          aria-label="Close"
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          ×
        </button>

        {loading ? (
          <div className="p-4 text-center">Loading…</div>
        ) : user ? (
          <>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">Welcome 👋</h2>
            <div className="space-y-1 text-sm">
              <div><strong>Name:</strong> {displayName || '—'}</div>
              <div><strong>Username:</strong> {username || '—'}</div>
              <div><strong>Email:</strong> {user.email}</div>
            </div>
            <button
              onClick={signOut}
              className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-gray-800"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-4 text-center text-2xl font-semibold text-gray-900">
              Sign in to your account
            </h2>

            {error && (
              <div className="mt-2 rounded-lg border border-red-200 bg-red-100 p-3 text-sm text-red-700">
                {String(error)}
              </div>
            )}

            {/* Provider */}
            <button
              type="button"
              onClick={onFacebook}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-blue-700"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.676 0H1.324A1.324 1.324 0 000 1.324v21.352A1.324 1.324 0 001.324 24h11.495v-9.294H9.847v-3.622h2.972V8.413c0-2.938 1.794-4.538 4.413-4.538 1.255 0 2.335.094 2.648.136v3.07h-1.817c-1.427 0-1.703.678-1.703 1.672v2.19h3.404l-.445 3.622h-2.959V24h5.801A1.324 1.324 0 0024 22.676V1.324A1.324 1.324 0 0022.676 0z" />
              </svg>
              Continue with Facebook
            </button>

            <div className="my-5 flex items-center">
              <div className="flex-grow border-t border-gray-300" />
              <span className="mx-3 text-xs uppercase text-gray-500">or</span>
              <div className="flex-grow border-t border-gray-300" />
            </div>

            {/* Mode switch */}
            <div className="flex overflow-hidden rounded-lg border border-gray-200 text-sm">
              <button
                type="button"
                className={`flex-1 py-2 font-medium transition ${
                  mode === 'login' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setMode('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={`flex-1 py-2 font-medium transition ${
                  mode === 'register' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setMode('register')}
              >
                Register
              </button>
            </div>

            {/* Email/password form */}
            <form className="mt-4 space-y-3" onSubmit={onSubmit}>
              {mode === 'register' && (
                <>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="Full name (optional)"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="Username (optional)"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </>
              )}

              <input
                type="email"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />

              <input
                type="password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />

              <button className="w-full rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-gray-800">
                {mode === 'login' ? 'Login' : 'Create account'}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-gray-500">
              After registering, check your inbox for confirmation if required.
            </p>
          </>
        )}
      </div>
    </div>
  );
}