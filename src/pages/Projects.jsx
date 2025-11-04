import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import ProjectModal from '../components/ProjectModal';

const projects = [
  {
    id: 'p1',
    title: 'Templyx Portfolio',
    summary: 'Clean personal portfolio template with sections and theming.',
    description:
      'A minimal portfolio template built with React and Tailwind. Includes projects, about, and contact sections with responsive design.',
    tags: ['React', 'Tailwind', 'Vite'],
    // image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=1200&auto=format&fit=crop',
    liveUrl: '#',
    repoUrl: '#',
  },
  {
    id: 'p2',
    title: 'Blog Engine',
    summary: 'Markdown blog with categories and search.',
    description:
      'A lightweight blog engine supporting Markdown, tags, search, and RSS feed generation.',
    tags: ['Content', 'Search'],
    liveUrl: '#',
    repoUrl: '#',
  },
  {
    id: 'p3',
    title: 'UI Components',
    summary: 'Reusable UI kit of buttons, inputs, and modals.',
    description:
      'A small UI component kit built with utility-first styles. Fully accessible and themeable.',
    tags: ['Design System', 'Accessibility'],
    liveUrl: '#',
    repoUrl: '#',
  },
  {
    id: 'p4',
    title: 'Analytics Dashboard',
    summary: 'Simple dashboard with charts and filters.',
    description:
      'A starter analytics dashboard with responsive cards, charts, and filter panels.',
    tags: ['Charts', 'Dashboard'],
    liveUrl: '#',
    repoUrl: '#',
  },
  {
    id: 'p5',
    title: 'Landing Page',
    summary: 'Conversion-focused landing with A/B experiments.',
    description:
      'A fast, responsive landing page optimized for conversions with built-in A/B testing hooks.',
    tags: ['Marketing', 'Performance'],
    liveUrl: '#',
    repoUrl: '#',
  },
  {
    id: 'p6',
    title: 'Task Manager',
    summary: 'Kanban-style tasking with drag & drop.',
    description:
      'A simple task manager app that supports Kanban boards and drag-and-drop interactions.',
    tags: ['Productivity', 'DnD'],
    liveUrl: '#',
    repoUrl: '#',
  },
  
];

function ProjectCard({ project, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="h-40 w-full bg-gradient-to-br from-indigo-500 to-pink-500 opacity-90 transition group-hover:opacity-100" />
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold text-gray-900">{project.title}</h3>
        <p className="mt-1 text-sm text-gray-600">{project.summary}</p>
        {project.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {project.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </button>
  );
}

export default function Projects() {
  const [authOpen, setAuthOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLoginClick={() => setAuthOpen(true)} />

      <main className="mx-auto max-w-6xl px-4 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-2 text-gray-600">A selection of things I’ve built or worked on.</p>
        </header>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onClick={() => setSelected(p)} />
          ))}
        </section>
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <ProjectModal project={selected} isOpen={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}