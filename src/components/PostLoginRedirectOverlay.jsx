import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PostLoginRedirectOverlay({
  defaultTo = '/projects',
  defaultDelay = 1200, // tweak this
}) {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const raw = sessionStorage.getItem('postLoginRedirect');
    if (!raw) return;

    let cfg = {};
    try { cfg = JSON.parse(raw) || {}; } catch {}
    const to = cfg.to || defaultTo;
    const delay = Number(cfg.delayMs ?? defaultDelay);

    setShow(true);
    const t = setTimeout(() => {
      navigate(to, { replace: true });
      setShow(false);
      sessionStorage.removeItem('postLoginRedirect');
    }, Number.isFinite(delay) ? delay : defaultDelay);

    return () => clearTimeout(t);
  }, [user, navigate, defaultTo, defaultDelay]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        <p className="text-sm text-gray-700">Redirecting to projects…</p>
      </div>
    </div>
  );
}