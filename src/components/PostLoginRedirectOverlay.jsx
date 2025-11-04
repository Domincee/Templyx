import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PostLoginRedirectOverlay({
  defaultTo = '/home',
  defaultDelay = 900,  // tweak global timer here
  zIndex = 9999,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [show, setShow] = useState(false);
  const pending = useRef(null); // { to, delayMs }

  // Listen for post-login event fired by AuthModal
  useEffect(() => {
    const onPostLogin = (e) => {
      const { to, delayMs } = e.detail || {};
      pending.current = {
        to: to || defaultTo,
        delayMs: Number.isFinite(delayMs) ? delayMs : defaultDelay,
      };
      setShow(true);
      // fallback for OAuth refresh
      sessionStorage.setItem('postLoginRedirect', JSON.stringify(pending.current));
    };
    window.addEventListener('post-login', onPostLogin);
    return () => window.removeEventListener('post-login', onPostLogin);
  }, [defaultTo, defaultDelay]);

  // Fallback (page reload after OAuth)
  useEffect(() => {
    const raw = sessionStorage.getItem('postLoginRedirect');
    if (raw && !pending.current) {
      try {
        const parsed = JSON.parse(raw);
        pending.current = {
          to: parsed.to || defaultTo,
          delayMs: Number.isFinite(parsed.delayMs) ? parsed.delayMs : defaultDelay,
        };
        setShow(true);
      } catch {}
    }
  }, [defaultTo, defaultDelay]);

  // When user is available and we have a pending redirect, wait then navigate
  useEffect(() => {
    if (!user || !pending.current) return;

    const { to, delayMs } = pending.current;
    const t = setTimeout(() => {
      navigate(to, { replace: true });
      sessionStorage.removeItem('postLoginRedirect');
      pending.current = null;
      setShow(false);
    }, delayMs);

    return () => clearTimeout(t);
  }, [user, navigate]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 grid place-items-center bg-white" style={{ zIndex }}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        <p className="text-sm text-gray-700">Signing you in…</p>
      </div>
    </div>
  );
}