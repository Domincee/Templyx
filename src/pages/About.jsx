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
              Templyx is a community-driven platform where developers, designers, and creators can share their projects and connect with like-minded individuals. Showcase your work, discover amazing projects from others, and engage with the community through reactions and feedback.
            </p>
            <p>
              Built with modern technologies like React, TypeScript, Tailwind CSS, and Supabase, Templyx provides a seamless experience for creating, sharing, and discovering creative projects. Whether you're working on portfolios, UI designs, web applications, or hobby projects, this platform offers the perfect space to share your journey and get inspired by others.
            </p>
            <p>
              Key features include project categorization, real-time reactions (cool, fire, nice, wow), social authentication, and a responsive design that works beautifully on all devices. Join our growing community of innovators and bring your creative ideas to life!
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    Privacy & Data
                  </h4>
                  <div className="mt-1 text-sm text-blue-700">
                    <p>
                      We do not store or possess any personal information beyond what's necessary for authentication and basic profile functionality. All project data and user interactions are handled securely through Supabase with proper access controls.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Usage Disclaimer */}
        <section className={`mt-16 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Important Notice
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    <strong>All information, projects, and content on this platform are for personal and hobby purposes only.</strong> This portfolio is intended solely for showcasing creative work, learning experiences, and connecting with the developer community.
                  </p>
                  <p className="mt-2">
                    <strong>Do not use this platform or any content from it for:</strong>
                  </p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Commercial purposes without explicit permission</li>
                    <li>Academic submissions or assignments</li>
                    <li>Professional business development</li>
                    <li>Any purposes other than personal learning and community engagement</li>
                  </ul>
                  <p className="mt-2">
                    This is a personal project created for educational and community purposes. Respect the intended use and contribute positively to the developer community.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
