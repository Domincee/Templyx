import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

// -------- Config --------
const BUCKET = 'project-images';
const LIMITS = {
  maxBytes: 2 * 1024 * 1024, // 2 MB
  maxEdge: 1600,             // px
  allowed: ['image/webp', 'image/jpeg', 'image/png'],
};

// -------- Helpers --------
function isValidHttpUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
function isValidGithubRepoUrl(s) {
  if (!isValidHttpUrl(s)) return false;
  return /^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+\/?$/i.test(s);
}
function isLikelyImageUrl(s) {
  const c = (s || '').split('?')[0].toLowerCase();
  return /\.(webp|png|jpe?g|gif|avif|svg)$/i.test(c);
}
async function readAsDataURL(file) {
  return await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}
async function loadImage(src) {
  return await new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}
async function downscaleToWebp(file, maxEdge = LIMITS.maxEdge, quality = 0.82) {
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/webp', quality));
  return blob;
}
// derive storage path from public URL (so we can delete old)
function extractStoragePath(publicUrl) {
  const marker = '/storage/v1/object/public/' + BUCKET + '/';
  const i = publicUrl.indexOf(marker);
  return i >= 0 ? publicUrl.slice(i + marker.length) : null;
}

export default function ProjectFormModal({
  isOpen,
  onClose,
  onSaved,    // (project) => void
  onDeleted,  // (id) => void
  initial,    // existing project for edit; null/undefined for create
}) {
  const { user } = useAuth();
  const isEdit = !!initial;

  const [form, setForm] = useState({
  title: '',
  description: '',
  toolsText: '',
  category: '',
  imageUrl: '',
  liveUrl: '',
  repoUrl: '',
    published: true,
   });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrlOk, setImageUrlOk] = useState(false);

  // Show inline errors after submit or when a field has been blurred once
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({
  title: false,
  description: false,
  toolsText: false,
  category: false,
  imageUrl: false,
  liveUrl: false,
    repoUrl: false,
  });
  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }));

  useEffect(() => {
    if (!initial) {
      setForm({
      title: '',
      description: '',
      toolsText: '',
      category: '',
      imageUrl: '',
      liveUrl: '',
      repoUrl: '',
        published: true,
      });
      setError('');
      setImageUrlOk(false);
      setSubmitted(false);
      setTouched({ title: false, description: false, toolsText: false, category: false, imageUrl: false, liveUrl: false, repoUrl: false });
      return;
    }
    setForm({
    title: initial.title || '',
    description: initial.description || '',
    toolsText: Array.isArray(initial.tools) ? initial.tools.join(', ') : '',
    category: initial.category || '',
    imageUrl: initial.image_url || '',
    liveUrl: initial.live_url || '',
    repoUrl: initial.repo_url || '',
      published: Boolean(initial.published),
    });
    setError('');
    setSubmitted(false);
    setTouched({ title: false, description: false, toolsText: false, imageUrl: false, liveUrl: false, repoUrl: false });
  }, [initial]);

  // Validate imageUrl by trying to load it
  useEffect(() => {
    if (!form.imageUrl || !isValidHttpUrl(form.imageUrl) || !isLikelyImageUrl(form.imageUrl)) {
      setImageUrlOk(false);
      return;
    }
    const img = new Image();
    img.onload = () => setImageUrlOk(true);
    img.onerror = () => setImageUrlOk(false);
    img.src = form.imageUrl;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [form.imageUrl]);

  const handleClose = () => {
    if (saving || uploading) return;
    onClose?.();
  };

  const parseTools = (s) =>
    (s || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

  // Upload with compression + delete previous
  async function uploadFile(file) {
    if (!file) return;
    if (!user) { setError('Please log in to upload.'); return; }
    if (!LIMITS.allowed.includes(file.type)) {
      setError('Allowed types: JPEG, PNG, WebP.');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Downscale/convert to WebP and cap to 2 MB
      let blob = await downscaleToWebp(file, LIMITS.maxEdge, 0.82);
      if (blob.size > LIMITS.maxBytes) {
        blob = await downscaleToWebp(file, LIMITS.maxEdge, 0.7);
      }
      if (blob.size > LIMITS.maxBytes) {
        setError('Image is too large after compression. Try a smaller image.');
        return;
      }

      // Path must start with <uid>/ to satisfy RLS policy
      const path = `${user.id}/${Date.now()}.webp`;
      const fileToUpload = new File([blob], 'image.webp', { type: 'image/webp' });

      const { data: uploadData, error: upErr } = await supabase
        .storage.from(BUCKET)
        .upload(path, fileToUpload, {
          contentType: 'image/webp',
          upsert: false,
          cacheControl: '3600',
        });

      console.log({
        bucket: BUCKET,
        path,
        userId: user?.id,
        type: fileToUpload.type,
        size: fileToUpload.size,
        error: upErr,
        uploadData,
      });

      if (upErr) {
        setError(upErr.message || 'Upload blocked by policy.');
        return;
      }

      // Delete previous image to keep storage small (best‑effort)
      if (form.imageUrl) {
        const oldPath = extractStoragePath(form.imageUrl);
        if (oldPath) {
          const { error: delErr } = await supabase.storage.from(BUCKET).remove([oldPath]);
          if (delErr) console.warn('Failed to delete old image:', delErr);
        }
      }

      // Set the new public URL into the form
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const publicUrl = data.publicUrl;
      setForm((f) => ({ ...f, imageUrl: publicUrl }));
      setTouched((t) => ({ ...t, imageUrl: true }));
    } catch (e) {
      console.error('Upload failed:', e);
      setError(e?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  // DnD handlers
  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadFile(file);
  };

  // Validations for all fields
  const titleLen = form.title.trim().length;
  const titleTooShort = titleLen < 3;
  const titleTooLong = titleLen > 25;
  const titleOk = !titleTooShort && !titleTooLong;

  const descOk = form.description.trim().length >= 25; // min 25 chars
  const toolsOk = parseTools(form.toolsText).length > 0;
  const categoryOk = form.category.trim().length > 0;
  const liveOk = isValidHttpUrl(form.liveUrl);
  const repoOk = isValidGithubRepoUrl(form.repoUrl);

  const hasImage = !!form.imageUrl;
  const imageUrlSyntaxOk = hasImage && isValidHttpUrl(form.imageUrl) && isLikelyImageUrl(form.imageUrl);
  const imageOk = hasImage && (imageUrlOk || imageUrlSyntaxOk);

  const allValid = useMemo(
  () => titleOk && descOk && toolsOk && categoryOk && imageOk && liveOk && repoOk && !uploading,
  [titleOk, descOk, toolsOk, categoryOk, imageOk, liveOk, repoOk, uploading]
  );

  const showError = (fieldValid, key) => (!fieldValid) && (submitted || touched[key]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setError('');

    if (!user) {
      setError('Please log in to continue.');
      return;
    }
    if (!allValid) {
      // Let inline messages show; keep a general banner as well if you want
      // setError('Please complete all fields with valid values.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      tools: parseTools(form.toolsText),
      category: form.category.trim(),
      image_url: form.imageUrl.trim(),
      live_url: form.liveUrl.trim(),
      repo_url: form.repoUrl.trim(),
        published: !!form.published,
      };

      let res;
      if (isEdit) {
        res = await supabase
        .from('projects')
        .update(payload)
        .eq('id', initial.id)
        .select('id, owner_id, title, description, tools, category, image_url, live_url, repo_url, published, created_at, updated_at')
        .single();
      } else {
        res = await supabase
        .from('projects')
        .insert([{ ...payload, owner_id: user.id }])
        .select('id, owner_id, title, description, tools, category, image_url, live_url, repo_url, published, created_at, updated_at')
        .single();
      }

      if (res.error) throw res.error;
      onSaved?.(res.data);
      handleClose();
    } catch (e) {
      setError(e?.message || 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!isEdit || !initial?.id) return;
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      const { error: delErr } = await supabase.from('projects').delete().eq('id', initial.id);
      if (delErr) throw delErr;

      if (initial.image_url) {
        const oldPath = extractStoragePath(initial.image_url);
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      }

      onDeleted?.(initial.id);
      handleClose();
    } catch (e) {
      setError(e?.message || 'Failed to delete project.');
    }
  };

  if (!isOpen) return null;

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
  <div
  className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-xl"
  onClick={(e) => e.stopPropagation()}
  >
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit project' : 'Publish your project'}
          </h3>
          <button
            type="button"
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

        <form className="mt-4" onSubmit={submit}>
          {/* Parent Container: Flex with 2 columns */}
          <div className="grid grid-cols-5 gap-6">
            {/* Left Container: ~60% width (3/5) */}
            <div className="col-span-3 space-y-4">
              {/* Project Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                <input
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
                    titleOk ? 'border-gray-300 focus:ring-gray-900' : 'border-red-300 focus:ring-red-500'
                  }`}
                  placeholder="Project title (max 25 chars)"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  onBlur={() => touch('title')}
                  maxLength={60}
                  required
                />
                <p className="mt-1 text-xs text-red-600 min-h-[1.25rem]">
                  {showError(titleOk, 'title') ? (titleTooShort ? 'Title must be at least 3 characters.' : 'Max 25 characters.') : ''}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
                    descOk ? 'border-gray-300 focus:ring-gray-900' : 'border-red-300 focus:ring-red-500'
                  }`}
                  placeholder="Short description (min 25 chars)"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  onBlur={() => touch('description')}
                  required
                />
                <p className="mt-1 text-xs text-red-600 min-h-[1.25rem]">
                  {showError(descOk, 'description') ? 'Description must be at least 25 characters.' : ''}
                </p>
              </div>

              {/* Tools & Category (flex row) */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tools</label>
                  <input
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
                      toolsOk ? 'border-gray-300 focus:ring-gray-900' : 'border-red-300 focus:ring-red-500'
                    }`}
                    placeholder="Tools (comma separated)"
                    value={form.toolsText}
                    onChange={(e) => setForm({ ...form, toolsText: e.target.value })}
                    onBlur={() => touch('toolsText')}
                    required
                  />
                  <p className="mt-1 text-xs text-red-600 min-h-[1.25rem]">
                    {showError(toolsOk, 'toolsText') ? 'Add at least one tool (comma separated).' : ''}
                  </p>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
                      categoryOk ? 'border-gray-300 focus:ring-gray-900' : 'border-red-300 focus:ring-red-500'
                    }`}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    onBlur={() => touch('category')}
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="Portfolio">Portfolio</option>
                    <option value="UI">UI</option>
                    <option value="Ecommerce">Ecommerce</option>
                    <option value="Dashboard">Dashboard</option>
                    <option value="Blog">Blog</option>
                    <option value="Landing">Landing</option>
                  </select>
                  <p className="mt-1 text-xs text-red-600 min-h-[1.25rem]">
                    {showError(categoryOk, 'category') ? 'Please select a category.' : ''}
                  </p>
                </div>
              </div>

              {/* Live Preview & GitHub (flex row) */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Live Preview URL</label>
                  <input
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
                      liveOk ? 'border-gray-300 focus:ring-gray-900' : 'border-red-300 focus:ring-red-500'
                    }`}
                    placeholder="Live preview URL (https://...)"
                    value={form.liveUrl}
                    onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
                    onBlur={() => touch('liveUrl')}
                    required
                  />
                  <p className="mt-1 text-xs text-red-600 min-h-[1.25rem]">
                    {showError(liveOk, 'liveUrl') ? 'Enter a valid URL starting with http:// or https://' : ''}
                  </p>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Repository URL</label>
                  <input
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
                      repoOk ? 'border-gray-300 focus:ring-gray-900' : 'border-red-300 focus:ring-red-500'
                    }`}
                    placeholder="GitHub repository URL (https://github.com/owner/repo)"
                    value={form.repoUrl}
                    onChange={(e) => setForm({ ...form, repoUrl: e.target.value })}
                    onBlur={() => touch('repoUrl')}
                    required
                  />
                  <p className="mt-1 text-xs text-red-600 min-h-[1.25rem]">
                    {showError(repoOk, 'repoUrl') ? 'GitHub URL must be in the form: https://github.com/owner/repo' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Container: ~40% width (2/5) */}
            <div className="col-span-2 flex flex-col gap-4">
              {/* Image Drag & Drop / Preview */}
              <div className="min-h-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Image</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`relative rounded-lg border-2 border-dashed p-4 text-center ${dragActive ? 'border-gray-900 bg-gray-50' : 'border-gray-300'} ${form.imageUrl ? 'border-solid' : ''}`}
                >
                  {form.imageUrl ? (
                    <div className="grid place-items-center">
                      <img src={form.imageUrl} alt="Uploaded preview" className="max-w-full max-h-24 object-contain rounded" />
                      <p className="mt-2 text-sm text-gray-600">Image uploaded. Drag to replace or</p>
                      <label className="mt-1 inline-block cursor-pointer rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Browse new
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => uploadFile(e.target.files?.[0])}
                        />
                      </label>
                      {uploading && <p className="mt-2 text-xs text-gray-500">Uploading…</p>}
                    </div>
                  ) : (
                    <div className="grid place-items-center">
                      <p className="text-sm text-gray-700">Drag & drop an image here, or</p>
                      <label className="mt-2 inline-block cursor-pointer rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Browse
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => uploadFile(e.target.files?.[0])}
                        />
                      </label>
                      {uploading && <p className="mt-2 text-xs text-gray-500">Uploading…</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Project URL Input - at bottom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
                    imageOk ? 'border-gray-300 focus:ring-gray-900' : 'border-red-300 focus:ring-red-500'
                  }`}
                  placeholder="Image URL"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  onBlur={() => touch('imageUrl')}
                  required
                />
                {/* helper state/text */}
                <p className="mt-1 text-xs min-h-[1.25rem]">
                  {form.imageUrl && imageUrlSyntaxOk && !imageUrlOk
                    ? <span className="text-gray-600">Checking image…</span>
                    : showError(imageOk, 'imageUrl')
                    ? <span className="text-red-600">
                        {!hasImage
                          ? 'Please upload an image or paste a valid image URL.'
                          : (!imageUrlSyntaxOk
                            ? 'Enter a valid image URL (http/https and ends with .jpg/.png/.webp).'
                            : 'We could not load that image URL. Make sure it is publicly accessible.')}
                      </span>
                    : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Section: Spanning Both Columns */}
          <div className="mt-6 flex flex-col items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
              />
              Published
            </label>

            <div className="flex flex-col items-center gap-3">
              {isEdit ? (
                <button
                  type="button"
                  onClick={doDelete}
                  className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              ) : null}
              <button
                disabled={!allValid || saving || uploading}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {saving ? (isEdit ? 'Saving…' : 'Publishing…') : (isEdit ? 'Save changes' : 'Publish')}
              </button>
            </div>
          </div>


        </form>
      </div>
    </div>
  );
}