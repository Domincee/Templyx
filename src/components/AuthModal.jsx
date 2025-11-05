import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthModal({
  isOpen,
  onClose,
  redirectPath = '/home',
  overlayDelay = 900,
}) {
  const {
    user,
    loading,
    error,
    signInWithFacebook,
    signInWithGoogle,
    signOut,
  } = useAuth();

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.username ||
    (user?.email ? user.email.split('@')[0] : 'User');

  const username =
    user?.user_metadata?.username ||
    user?.user_metadata?.preferred_username ||
    (user?.email ? user.email.split('@')[0] : '—');

  const setOverlayFlag = () => {
    try {
      sessionStorage.setItem(
        'postLoginRedirect',
        JSON.stringify({ to: redirectPath, delayMs: overlayDelay })
      );
    } catch {}
  };

  const onGoogle = () => {
    setOverlayFlag();
    signInWithGoogle();
    onClose?.();
  };

  const onFacebook = () => {
    setOverlayFlag();
    signInWithFacebook();
    onClose?.();
  };

  const handleClose = () => onClose?.();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white/80 p-6 text-gray-800 shadow-xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button aria-label="Close" onClick={handleClose} className="absolute right-3 top-3 rounded-full p-2 bg-gray-100/50 text-gray-500 hover:bg-gray-200 hover:text-gray-700 hover:scale-110 transition-all duration-200 cursor-pointer">×</button>

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
            className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-gray-800 hover:transform hover:-translate-y-0.5 cursor-pointer"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-4 text-center text-2xl font-semibold text-gray-900">Continue with</h2>

            {error && (
              <div className="mt-2 rounded-lg border border-red-200 bg-red-100 p-3 text-sm text-red-700">
                {String(error)}
              </div>
            )}

            <div className="space-y-3">
              <button
              type="button"
              onClick={onGoogle}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-900 transition-all hover:bg-gray-50 hover:transform hover:-translate-y-0.5 cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6A6 6 0 116 12a6 6 0 016-6c1.7 0 3.2.6 4.3 1.6l2.9-2.9A10 10 0 0012 2a10 10 0 100 20c5.8 0 9.6-4.1 9.6-9.9 0-.7-.1-1.2-.2-1.9H12z"/>
                </svg>
                Continue with Google
              </button>

              <button
              type="button"
              onClick={onFacebook}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-all hover:bg-blue-700 hover:transform hover:-translate-y-0.5 cursor-pointer"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.676 0H1.324A1.324 1.324 0 000 1.324v21.352A1.324 1.324 0 001.324 24h11.495v-9.294H9.847v-3.622h2.972V8.413c0-2.938 1.794-4.538 4.413-4.538 1.255 0 2.335.094 2.648.136v3.07h-1.817c-1.427 0-1.703.678-1.703 1.672v2.19h3.404l-.445 3.622h-2.959V24h5.801A1.324 1.324 0 0024 22.676V1.324A1.324 1.324 0 0022.676 0z"/></svg>
                Continue with Facebook
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}