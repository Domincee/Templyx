import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';

const templates = [
  { id: 'portfolio', title: 'Portfolio Template', description: 'Showcase your projects and skills with a clean, modern design.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop' },
  { id: 'ecommerce', title: 'E-commerce Template', description: 'Build an online store with product listings and checkout.', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200&auto=format&fit=crop' },
  { id: 'dashboard', title: 'Dashboard Template', description: 'Create admin panels and analytics dashboards.', image: 'https://images.unsplash.com/photo-1551288049-bebda4f6a45d?q=80&w=1200&auto=format&fit=crop' },
  { id: 'analytics', title: 'Analytics Template', description: 'Display data visualizations and reports.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop' },
];

function TemplateCard({ template, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      role="button"
      aria-label={template.title}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div
        className="h-48 w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
        style={{ backgroundImage: `url(${template.image})` }}
      />
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">{template.title}</h3>
        <p className="mt-2 text-sm text-gray-600">{template.description}</p>
      </div>
    </div>
  );
}

export default function Landing() {
  const [authOpen, setAuthOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const openLoginOrGoProjects = () => {
    if (user) navigate('/projects');
    else setAuthOpen(true);
  };

  const scrollToTemplates = () => {
    document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-pink-50 py-24">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="animate-fade-in text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Build your portfolio with
            <span className="ml-3 bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
              Templyx
            </span>
          </h1>
          <p className="mt-6 animate-fade-in-delay text-xl text-gray-600">
            Choose from our collection of beautiful templates and get started in minutes.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={openLoginOrGoProjects}
              className="animate-bounce-in rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800"
            >
              {user ? 'Go to Projects' : 'Login'}
            </button>
            <button
              onClick={scrollToTemplates}
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
            >
              View Templates
            </button>
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section id="templates" className="py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Choose Your Template</h2>
            <p className="mt-4 text-gray-600">
              Start with a professionally designed template and customize it to fit your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={openLoginOrGoProjects}
              />
            ))}
          </div>
        </div>
      </section>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        redirectPath="/projects"
        overlayDelay={900}  // tweak the post-login loader duration here if you want per-use
      />
    </div>
  );
}