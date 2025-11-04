import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AuthTransitionRedirect({ to = '/projects', delay = 900 }) {
  const { user, loading } = useAuth();
  const [show, setShow] = useState(false);
  const initialized = useRef(false);
  const prevUser = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Record the initial auth state once loading finishes
  useEffect(() => {
    if (!initialized.current && !loading) {
      prevUser.current = user ?? null;
      initialized.current = true;
    }
  }, [loading, user]);

  // Show overlay when we transition from logged-out -> logged-in
  useEffect(() => {
    if (!initialized.current) return;

    const was = prevUser.current;
    const now = user ?? null;
    prevUser.current = now;

    if (!was && now) {
      setShow(true);
      const t = setTimeout(() => {
        if (location.pathname !== to) {
          navigate(to, { replace: true });
        }
        // hide overlay even if already on the same route
        setShow(false);
      }, delay);
      return () => clearTimeout(t);
    }
  }, [user, to, navigate, location.pathname, delay]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        <p className="text-sm text-gray-700">Signing you in…</p>
      </div>
    </div>
  );
}