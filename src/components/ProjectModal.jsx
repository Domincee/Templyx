import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProjectModal({ project, isOpen, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!isOpen || !project) return null;

  const tools = Array.isArray(project.tools) ? project.tools : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
      className="mx-4 w-full max-w-2xl max-h-[70vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 bg-gray-100/50 text-gray-500 hover:bg-gray-200 hover:text-gray-700 hover:scale-110 transition-all duration-200 cursor-pointer"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {project.image_url && (
          <img src={project.image_url} alt={project.title} className="mt-4 aspect-[16/9] w-full rounded-lg object-cover" />
        )}

        {project.owner && (
        <div className="mt-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
              <img
              src={project.owner.avatar_url || 'https://via.placeholder.com/32'}
              alt={project.owner.username}
          className="w-6 h-6 rounded-full object-cover"
        />
        <span>
        {project.owner.full_name || `@${project.owner.username}` || 'Unknown'}
        </span>
        </div>
        </div>
        )}

        <p className="mt-4 text-gray-700">{project.description}</p>

        {tools.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tools.map((t) => (
              <span key={t} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Live preview
            </a>
          )}
        {project.repo_url && (
          <a
            href={project.repo_url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            GitHub repo
            </a>
          )}
          {project.owner?.username && (
            <button
              onClick={() => navigate(`/profile/${project.owner.username}`)}
              className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-400"
            >
              View Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}