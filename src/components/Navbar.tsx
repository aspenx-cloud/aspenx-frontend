import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthButton from './AuthButton';

const NAV_SECTIONS = [
  { label: 'About',   id: 'about'   },
  { label: 'Pricing', id: 'pricing' },
  { label: 'Contact', id: 'contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const scrollToSection = (id: string) => {
    setMobileOpen(false);
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-slate-950/95 backdrop-blur-md border-b border-slate-800/60 shadow-lg shadow-black/20' : 'bg-transparent'
      }`}
    >
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg px-1"
        >
          <div className="w-8 h-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg opacity-20 group-hover:opacity-40 transition-opacity" />
            <img src="/favicon.svg" alt="AspenX logo" className="w-8 h-8 relative" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Aspen</span>
            <span className="text-slate-200">X</span>
            <span className="text-slate-400 font-normal">.cloud</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_SECTIONS.map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className="text-sm text-slate-400 hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-1 py-0.5"
            >
              {label}
            </button>
          ))}
          <div className="w-px h-4 bg-slate-700" />
          <AuthButton />
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {mobileOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-950/98 border-b border-slate-800 px-4 pb-4 pt-2 animate-slide-up">
          <div className="flex flex-col gap-1 mb-4">
            {NAV_SECTIONS.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="text-left px-3 py-2.5 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors text-sm"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-800">
            <AuthButton />
          </div>
        </div>
      )}
    </header>
  );
}
