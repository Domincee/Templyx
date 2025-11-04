import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function ProjectPublishModal({ isOpen, onClose, onPublished }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    tools: '',        // comma-separated
    imageUrl: '',
    liveUrl: '',
    repoUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setForm({ title: '', description: '', tools: '', imageUrl: '', liveUrl: '', repoUrl: '' });
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!user) {
      setError('Please log in to publish.');
      return;
    }
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    try {
      setSaving(true);
      const toolsArr = (form.tools || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const { data, error: err } = await supabase
        .from('projects')
        .insert([
          {
            owner_id: user.id,
            title: form.title.trim(),
            description: form.description.trim() || null,
            tools: toolsArr,
            image_url: form.imageUrl.trim() || null,
            live_url: form.liveUrl.trim() || null,
            repo_url: form.repoUrl.trim() || null,
            published: true,
          },
        ])
        .select('*')
        .single();

      if (err) throw err;

      onPublished?.(data);
      handleClose();
    } catch (e) {
      setError(e?.message || 'Failed to publish project.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Publish your project</h3>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!user ? (
          <p className="mt-4 text-sm text-gray-600">You need to log in to publish.</p>
        ) : (
          <form className="mt-4 space-y-3" onSubmit={onSubmit}>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Project title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Short description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Tools (comma separated, e.g. React, Tailwind, Supabase)"
              value={form.tools}
              onChange={(e) => setForm({ ...form, tools: e.target.value })}
            />
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Image URL"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Live preview URL"
                value={form.liveUrl}
                onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
              />
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="GitHub repository URL"
                value={form.repoUrl}
                onChange={(e) => setForm({ ...form, repoUrl: e.target.value })}
              />
            </div>

            <div className="pt-2">
              <button
                disabled={saving}
                className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {saving ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}