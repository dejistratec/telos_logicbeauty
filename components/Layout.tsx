import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { BRAND } from '../constants';
import { Menu, X } from 'lucide-react';
import { Symbol } from './Symbol';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    setIsMenuOpen(false);
  }, [pathname]);

  // Handle scroll for header background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', jp: 'ホーム', path: '/' },
    { name: 'About', jp: '私たちについて', path: '/about' },
    { name: 'Service', jp: 'サービス', path: '/service' },
    { name: 'Works', jp: '制作実績', path: '/works' },
  ];

  // Check if we are in the prototype view to potentially alter layout behavior (optional, currently strictly using same header)
  const isPrototype = pathname === '/prototypes';

  return (
    <div className="min-h-screen bg-vapor text-sumi font-sans selection:bg-bronze selection:text-white relative overflow-hidden">
      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none bg-grain opacity-50 z-0"></div>

      {/* Header */}
      {!isPrototype && (
        <header 
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-out px-6 md:px-12 py-4 flex justify-between items-center ${
            scrolled ? 'bg-vapor/90 backdrop-blur-sm shadow-sm' : 'bg-transparent'
          }`}
        >
          <Link to="/" className="z-50 group">
            <div className="flex flex-col items-center">
              {/* Symbol Logo */}
              <Symbol className="w-8 h-8 mb-2 transition-transform duration-700 group-hover:rotate-180" />
              
              {/* Brand Text */}
              <span className="font-heading text-xl tracking-[0.2em] font-medium group-hover:text-bronze transition-colors duration-500">
                {BRAND.name}
              </span>
              <span className="text-[0.5rem] tracking-[0.3em] text-bronze uppercase opacity-0 group-hover:opacity-100 transition-all duration-700 transform -translate-y-2 group-hover:translate-y-0 absolute top-full mt-1">
                Quiet Architecture
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-12">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                className="group flex flex-col items-center text-xs uppercase tracking-[0.25em] hover:text-bronze transition-colors duration-300 relative"
              >
                <span>{link.name}</span>
                <span className="text-[0.6em] tracking-wider opacity-60 group-hover:text-bronze transition-colors duration-300 mt-1 scale-90 origin-top">{link.jp}</span>
                <span className="absolute bottom-[-4px] left-0 w-0 h-[1px] bg-bronze transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
            <a 
              href="https://line.me/R/ti/p/@placeholder" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group border border-sumi px-6 py-2 text-xs tracking-[0.2em] uppercase hover:bg-sumi hover:text-white transition-all duration-500 flex flex-col items-center"
            >
              <span>Contact</span>
              <span className="text-[0.6em] tracking-wider opacity-60 group-hover:text-white/80 mt-0.5">お問い合わせ</span>
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden z-50 p-2 text-sumi"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Mobile Nav Overlay */}
          <div className={`fixed inset-0 bg-vapor z-40 flex flex-col justify-center items-center transition-all duration-700 ease-[0.22, 1, 0.36, 1] ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
            <div className="flex flex-col items-center space-y-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.name}
                  to={link.path}
                  className="flex flex-col items-center font-heading text-3xl text-sumi hover:text-bronze transition-colors duration-300"
                >
                  <span>{link.name}</span>
                  <span className="font-jp text-sm tracking-widest opacity-60 mt-2">{link.jp}</span>
                </Link>
              ))}
              <div className="w-[1px] h-12 bg-stone my-8"></div>
              <a 
                href="https://line.me/R/ti/p/@placeholder"
                className="flex flex-col items-center font-sans text-sm tracking-[0.2em] border-b border-sumi pb-1"
              >
                <span>LINE ENQUIRY</span>
                <span className="text-[0.7em] mt-1">お問い合わせ</span>
              </a>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`relative z-10 ${!isPrototype ? 'pt-0' : ''} min-h-screen flex flex-col`}>
        {children}
      </main>

      {/* Footer */}
      {!isPrototype && (
        <footer className="relative z-10 py-12 md:py-24 border-t border-stone/30 mt-auto bg-vapor text-sumi">
          <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-end">
            <div className="mb-12 md:mb-0">
              <div className="flex items-center gap-4 mb-6">
                <Symbol className="w-10 h-10" />
                <h2 className="font-heading text-4xl">{BRAND.name}</h2>
              </div>
              <p className="font-heading text-lg text-bronze italic mb-2">{BRAND.tagline}</p>
              <p className="text-xs text-sumi/60 tracking-wider">Tokyo, Japan</p>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-4">
               <div className="flex gap-8 mb-4">
                 {navLinks.map(l => (
                   <Link key={l.path} to={l.path} className="text-[10px] tracking-widest text-sumi/60 hover:text-sumi uppercase">
                     {l.name}
                   </Link>
                 ))}
               </div>
               <div className="flex flex-col items-end gap-2">
                 <p className="text-[10px] text-stone tracking-widest">© {new Date().getFullYear()} TELOS. All Rights Reserved.</p>
                 <Link to="/prototypes" className="text-[10px] text-bronze hover:text-sumi tracking-widest border-b border-bronze/50 pb-0.5">
                   View Design Prototypes (10)
                 </Link>
               </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};