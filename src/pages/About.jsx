import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';

export default function About() {
const [authOpen, setAuthOpen] = useState(false);
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

return (
<div className="min-h-screen bg-gray-50">
<Navbar onLoginClick={() => setAuthOpen(true)} />

      {/* Hero Section */}
<section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-pink-50 min-h-[75vh] flex items-center">
    {/* Floating UI Elements */}
      <div className="absolute top-16 left-16 w-24 h-24 bg-white rounded-xl shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 opacity-0 animate-bounce-in" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center justify-center h-full text-2xl">🎨</div>
        </div>
        <div className="absolute top-32 right-20 w-20 h-20 bg-black text-white rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center text-xl opacity-0 animate-bounce-in" style={{animationDelay: '0.4s'}}>
          ⚡
        </div>
        <div className="absolute bottom-20 left-1/4 w-28 h-16 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-lg shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center text-white font-semibold opacity-0 animate-bounce-in" style={{animationDelay: '0.6s'}}>
          Code
        </div>
        <div className="absolute bottom-32 right-1/3 w-22 h-22 bg-white rounded-2xl shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 flex items-center justify-center opacity-0 animate-bounce-in" style={{animationDelay: '0.8s'}}>
          <span className="text-3xl">🚀</span>
        </div>
        <div className="absolute top-1/2 left-10 w-18 h-18 bg-gray-900 text-white rounded-lg shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center text-lg font-bold opacity-0 animate-bounce-in" style={{animationDelay: '1.0s'}}>
          UI
        </div>
        <div className="absolute top-3/4 right-16 w-26 h-14 bg-pink-500 text-white rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center font-semibold opacity-0 animate-bounce-in" style={{animationDelay: '1.2s'}}>
          Design
        </div>
        <div className="mx-auto max-w-6xl px-4 text-center relative z-10">
          <h1 className="animate-fade-in text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            About
            <span className="ml-3 bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
              Templyx
            </span>
          </h1>
          <p className="mt-6 animate-fade-in-delay text-xl text-gray-600">
            Discover the power of modern web templates and portfolios.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <section ref={sectionRef} className={`transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="prose prose-gray max-w-none">
            <p>
              Templyx is a cutting-edge platform designed to empower creators, developers, and designers to showcase their work with stunning, responsive templates.
            </p>
            <p>
              Built with modern technologies like React, Tailwind CSS, and Supabase, Templyx offers a seamless experience for building portfolios, e-commerce sites, and more. Our mission is to make web development accessible and beautiful for everyone.
            </p>
            <p>
              Join our community of innovators and bring your ideas to life with Templyx.
            </p>
          </div>
        </section>
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
