import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { Helmet } from "react-helmet";

const templates = [
  { id: 'portfolio', title: 'Portfolio Inspiration', description: 'Showcase your projects and skills with stunning designs.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop' },
  { id: 'ui', title: 'UI Design Examples', description: 'Beautiful user interfaces that inspire creativity.', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=1200&auto=format&fit=crop' },
  { id: 'ecommerce', title: 'E-commerce Showcase', description: 'Modern online stores with elegant product displays.', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200&auto=format&fit=crop' },
  { id: 'dashboard', title: 'Dashboard Designs', description: ' Sleek admin panels and data visualization.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop' },
  { id: 'blog', title: 'Blog Templates', description: 'Engaging layouts for storytelling and content.', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1200&auto=format&fit=crop' },
  { id: 'landing', title: 'Landing Pages', description: 'Captivating entry points that convert visitors.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop' },
];
function TemplateCard({ template, onClick, delay }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:scale-105 hover:rotate-1 ${
        isVisible ? 'opacity-100 animate-bounce-in' : 'opacity-0'
      }`}
      style={{ animationDelay: `${delay}s` }}
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
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const openLoginOrGoProjects = () => {
    if (user) navigate('/projects');
    else setAuthOpen(true);
  };

  const scrollToTemplates = () => {
    document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
      
    <div className="min-h-screen bg-gray-50">
        <Helmet>
        <title>Templyx — Creative Portfolio Platform</title>
        <meta
          name="google-site-verification"
          content="dKTGLbUP0q-0Vrp7j9jL70qW83DlCMx7WluUjdz6EIM"
        />
        <meta
          name="description"
          content="Templyx — Showcase your projects built with React, TypeScript, and Tailwind. Connect with developers and share your portfolio."
        />
        <meta
          name="keywords"
          content="Templyx, portfolio, React, Supabase, developer showcase, TypeScript, Tailwind CSS, full-stack developer, creative projects"
        />
        <meta property="og:title" content="Templyx — Creative Portfolio Platform" />
        <meta property="og:description" content="Showcase your web projects and connect with creative developers on Templyx." />
        <meta property="og:image" content="https://templyx.vercel.app/logo.png" />
        <meta property="og:url" content="https://templyx.vercel.app/" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-pink-50 min-h-[75vh] flex items-center">
      {/* Floating UI Elements */}
      <div className="absolute top-16 left-16 w-24 h-24 bg-white rounded-xl shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 opacity-0 animate-bounce-in" style={{animationDelay: '0.2s'}}>
      <div className="flex items-center justify-center h-full text-2xl">💼</div>
      </div>
      <div className="absolute top-32 right-20 w-20 h-20 bg-black text-white rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center text-xl opacity-0 animate-bounce-in" style={{animationDelay: '0.4s'}}>
      🚀
      </div>
      <div className="absolute bottom-20 left-1/4 w-28 h-16 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-lg shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center text-white font-semibold opacity-0 animate-bounce-in" style={{animationDelay: '0.6s'}}>
      Project
      </div>
      <div className="absolute bottom-32 right-1/3 w-22 h-22 bg-white rounded-2xl shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 flex items-center justify-center opacity-0 animate-bounce-in" style={{animationDelay: '0.8s'}}>
      <span className="text-3xl">⭐</span>
      </div>
      <div className="absolute top-1/2 left-10 w-18 h-18 bg-gray-900 text-white rounded-lg shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center text-lg font-bold opacity-0 animate-bounce-in" style={{animationDelay: '1.0s'}}>
      UI
      </div>
      <div className="absolute top-3/4 right-16 w-26 h-14 bg-pink-500 text-white rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center font-semibold opacity-0 animate-bounce-in" style={{animationDelay: '1.2s'}}>
      Code
      </div>
        <div className="mx-auto max-w-6xl px-4 text-center relative z-10">
          <h1 className="animate-fade-in text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Share your Projects with
          <span className="ml-3 bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
          Templyx
          </span>
          </h1>
          <p className="mt-6 animate-fade-in-delay text-xl text-gray-600">
          Showcase your work, connect with opportunities, and build your professional presence.
          </p>

          <div className="mt-10 flex items-center justify-center">
          <button
          onClick={openLoginOrGoProjects}
          className="animate-bounce-in rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-gray-800 hover:scale-110 hover:-translate-y-2 hover:rotate-2 hover:shadow-xl"
          >
          {user ? 'Go to Projects' : 'Login'}
          </button>
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section id="templates" ref={sectionRef} className={`py-24 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Get Inspired by Amazing Creations</h2>
          <p className="mt-4 text-gray-600">
          Explore stunning portfolios, UI designs, and e-commerce sites from talented creators.
          </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, index) => (
          <TemplateCard
          key={template.id}
          template={template}
          onClick={openLoginOrGoProjects}
            delay={index * 0.2}
            isVisible={isVisible}
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