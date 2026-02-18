import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../constants';
import { Symbol } from '../components/Symbol';
import { FadeIn } from '../components/FadeIn';
import { ArrowLeft, ArrowRight, Layout as LayoutIcon, Menu } from 'lucide-react';

// --- Shared Content Components for Variations ---
const ContentLogic = () => (
  <div className="space-y-6">
    <h1 className="font-heading text-4xl md:text-6xl tracking-tight leading-tight">
      Logic serves <span className="italic">Beauty</span>.
    </h1>
    <p className="font-jp text-sm tracking-[0.2em] opacity-80 leading-loose">
      {BRAND.subTagline}
    </p>
    <div className="flex flex-wrap gap-4 pt-4">
      <ActionButtons />
    </div>
  </div>
);

const ActionButtons = ({ light = false }: { light?: boolean }) => (
  <>
    <a href="#" className={`px-8 py-3 text-[10px] tracking-[0.2em] uppercase transition-all duration-300 ${light ? 'bg-white text-sumi hover:bg-stone' : 'bg-sumi text-white hover:bg-bronze'}`}>
      Contact (LINE)
    </a>
    <Link to="/service" className={`px-8 py-3 text-[10px] tracking-[0.2em] uppercase border transition-all duration-300 ${light ? 'border-white text-white hover:bg-white hover:text-sumi' : 'border-sumi text-sumi hover:bg-sumi hover:text-white'}`}>
      Download
    </Link>
  </>
);

const NavLinks = () => (
  <nav className="flex gap-6 text-[10px] tracking-[0.2em] uppercase">
    {['Home', 'About', 'Service', 'Works'].map(l => (
      <span key={l} className="cursor-pointer hover:opacity-50">{l}</span>
    ))}
  </nav>
);

// --- Variations 1-10 ---

// V1: The Axis (Split)
const Variation1 = () => (
  <div className="h-screen w-full flex flex-col md:flex-row relative">
    <div className="w-full md:w-1/2 bg-vapor flex items-center justify-center p-12 order-2 md:order-1 relative">
      <div className="max-w-md">
        <Symbol className="w-12 h-12 mb-12 text-sumi" />
        <ContentLogic />
      </div>
      <div className="absolute top-8 left-8"><span className="text-xs font-bold tracking-widest">TELOS</span></div>
    </div>
    <div className="w-full md:w-1/2 bg-sumi order-1 md:order-2 overflow-hidden relative">
      <img src="https://picsum.photos/1000/1200?grayscale" className="w-full h-full object-cover opacity-50 img-quiet" />
      <div className="absolute inset-0 flex items-center justify-center">
         <div className="w-[1px] h-32 bg-white/30"></div>
      </div>
    </div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block mix-blend-difference text-white">
       <span className="font-heading text-6xl italic">vs</span>
    </div>
  </div>
);

// V2: The Grid (Swiss)
const Variation2 = () => (
  <div className="h-screen w-full bg-vapor p-4 md:p-8 flex flex-col">
    <div className="flex-1 border border-sumi/20 grid grid-cols-1 md:grid-cols-2 grid-rows-2">
       {/* Top Left: Header */}
       <div className="border-b md:border-b-0 md:border-r border-sumi/20 p-8 relative">
          <Symbol className="w-12 h-12" />
          <div className="absolute bottom-8 left-8">
            <h2 className="font-heading text-2xl">{BRAND.name}</h2>
            <p className="text-[10px] tracking-widest">Quiet Architecture</p>
          </div>
       </div>
       {/* Top Right: Nav & Secondary */}
       <div className="border-b border-sumi/20 p-8 flex flex-col justify-between items-end text-right">
          <NavLinks />
          <p className="font-jp text-xs leading-loose opacity-60 max-w-xs">
            {BRAND.subTagline}
          </p>
       </div>
       {/* Bottom Left: Visual */}
       <div className="border-r border-sumi/20 relative overflow-hidden hidden md:block">
          <img src="https://picsum.photos/800/800?grayscale" className="w-full h-full object-cover img-quiet" />
       </div>
       {/* Bottom Right: Hero Content */}
       <div className="p-8 flex flex-col justify-center">
          <h1 className="font-heading text-5xl mb-8">Logic serves Beauty.</h1>
          <div className="flex gap-4">
             <ActionButtons />
          </div>
       </div>
    </div>
  </div>
);

// V3: The Monument (Scale)
const Variation3 = () => (
  <div className="h-screen w-full bg-stone/20 relative overflow-hidden flex items-center justify-center">
    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
       <Symbol className="w-[120vw] h-[120vw]" />
    </div>
    <div className="relative z-10 text-center space-y-4">
       <p className="text-xs tracking-[1em] uppercase">Architecture of Truth</p>
       <h1 className="font-heading text-[12vw] leading-[0.8] text-sumi mix-blend-overlay">
         TELOS
       </h1>
       <div className="flex justify-center gap-12 pt-12">
          <Link to="/service" className="text-xs tracking-widest border-b border-sumi pb-1 hover:text-bronze transition-colors">ENTER</Link>
       </div>
    </div>
    <div className="absolute bottom-12 left-0 w-full text-center">
       <p className="font-jp text-sm tracking-[0.2em]">{BRAND.subTagline}</p>
    </div>
  </div>
);

// V4: The Corners (Tension)
const Variation4 = () => (
  <div className="h-screen w-full bg-vapor relative p-12 md:p-24">
    {/* Top Left */}
    <div className="absolute top-12 left-12 md:top-24 md:left-24">
      <div className="flex items-center gap-4">
        <Symbol className="w-10 h-10" />
        <span className="font-heading text-xl">{BRAND.name}</span>
      </div>
    </div>
    
    {/* Top Right */}
    <div className="absolute top-12 right-12 md:top-24 md:right-24 text-right">
       <NavLinks />
    </div>

    {/* Center (Empty - Quiet) */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-stone rounded-full flex items-center justify-center">
       <div className="w-1 h-1 bg-sumi rounded-full"></div>
    </div>

    {/* Bottom Left */}
    <div className="absolute bottom-12 left-12 md:bottom-24 md:left-24 max-w-xs">
       <h1 className="font-heading text-3xl mb-4">Logic serves Beauty.</h1>
       <p className="font-jp text-xs leading-relaxed opacity-60">{BRAND.subTagline}</p>
    </div>

    {/* Bottom Right */}
    <div className="absolute bottom-12 right-12 md:bottom-24 md:right-24 flex flex-col gap-4">
       <ActionButtons />
    </div>
  </div>
);

// V5: The Frame (Sanctuary)
const Variation5 = () => (
  <div className="h-screen w-full bg-sumi p-6 md:p-12">
    <div className="w-full h-full bg-white relative overflow-hidden shadow-2xl">
       <div className="absolute inset-0 bg-stone/10"></div>
       <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-20">
          <span className="font-heading text-2xl">TELOS</span>
          <Menu className="w-6 h-6" />
       </div>
       
       <div className="h-full flex flex-col items-center justify-center relative z-10">
          <div className="w-px h-24 bg-sumi mb-8"></div>
          <h1 className="font-heading text-5xl md:text-7xl mb-8">Logic serves Beauty.</h1>
          <div className="w-px h-24 bg-sumi mt-8"></div>
       </div>

       <img src="https://picsum.photos/1200/800?grayscale" className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-multiply pointer-events-none" />
    </div>
  </div>
);

// V6: The Flow (Horizontal)
const Variation6 = () => (
  <div className="h-screen w-full bg-vapor flex flex-col md:flex-row">
     <div className="w-full md:w-24 border-b md:border-b-0 md:border-r border-sumi/10 flex md:flex-col justify-between items-center p-6 bg-white z-20">
        <Symbol className="w-8 h-8" />
        <div className="hidden md:block rotate-180 py-12 writing-vertical-rl text-[10px] tracking-[0.3em] uppercase">
           Quiet Architecture
        </div>
        <Menu className="w-6 h-6 cursor-pointer" />
     </div>
     <div className="flex-1 relative overflow-hidden flex items-center pl-12 md:pl-32">
        <div className="relative z-10 space-y-8 max-w-xl">
           <span className="text-[10px] uppercase tracking-widest text-bronze">Digital Sanctuary</span>
           <h1 className="font-heading text-6xl md:text-8xl leading-none">
             Logic<br/>Serves<br/>Beauty.
           </h1>
           <div className="flex gap-4">
              <ActionButtons />
           </div>
        </div>
        <div className="absolute top-0 right-0 w-2/3 h-full bg-stone/20 skew-x-12 translate-x-32 overflow-hidden">
           <img src="https://picsum.photos/1000/1200?grayscale" className="w-full h-full object-cover img-quiet opacity-80" />
        </div>
     </div>
  </div>
);

// V7: The Dark (Inversion)
const Variation7 = () => (
  <div className="h-screen w-full bg-[#111] text-[#E5E5E5] flex items-center justify-center relative overflow-hidden">
     <div className="absolute top-0 left-0 w-full p-12 flex justify-between items-center z-20">
        <Symbol className="w-10 h-10 text-white" />
        <div className="text-white"><NavLinks /></div>
     </div>
     
     <div className="text-center z-10 space-y-8 max-w-2xl px-6">
        <Symbol className="w-32 h-32 mx-auto text-bronze opacity-80 mb-8" />
        <h1 className="font-heading text-5xl md:text-7xl text-bronze">Logic serves Beauty.</h1>
        <p className="font-jp text-white/60 tracking-[0.2em]">{BRAND.subTagline}</p>
        <div className="pt-12 flex justify-center gap-6">
           <ActionButtons light />
        </div>
     </div>
     <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone/10 to-transparent pointer-events-none"></div>
  </div>
);

// V8: The Overlap (Layer)
const Variation8 = () => (
  <div className="h-screen w-full bg-stone/30 flex items-center justify-center p-6">
     <div className="relative w-full max-w-5xl aspect-video">
        {/* Back Layer Image */}
        <div className="absolute top-0 right-0 w-3/4 h-full bg-white shadow-xl overflow-hidden">
           <img src="https://picsum.photos/1200/900?grayscale" className="w-full h-full object-cover img-quiet" />
        </div>
        {/* Front Layer Text */}
        <div className="absolute bottom-12 left-0 md:left-12 w-full md:w-1/2 bg-vapor p-12 shadow-2xl border-l-4 border-sumi">
           <h1 className="font-heading text-4xl md:text-5xl mb-6">Logic serves Beauty.</h1>
           <p className="font-jp text-sm leading-loose mb-8">{BRAND.subTagline}</p>
           <div className="flex gap-4">
              <ActionButtons />
           </div>
        </div>
     </div>
  </div>
);

// V9: The Minimal (Reduction)
const Variation9 = () => (
  <div className="h-screen w-full bg-white flex flex-col items-center justify-center relative">
     <div className="absolute top-8 w-full text-center">
        <Symbol className="w-6 h-6 mx-auto" />
     </div>
     
     <div className="space-y-2 text-center">
        <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-stone">Concept</p>
        <h1 className="font-heading text-2xl tracking-[0.2em]">LOGIC SERVES BEAUTY</h1>
     </div>

     <div className="absolute bottom-12 w-full text-center">
        <Link to="/service" className="text-[9px] tracking-[0.3em] uppercase border border-sumi/20 px-6 py-2 hover:border-sumi transition-colors">Enter Site</Link>
     </div>
  </div>
);

// V10: The Magazine (Editorial)
const Variation10 = () => (
  <div className="h-screen w-full bg-vapor p-8 md:p-16 flex flex-col">
     <header className="border-b-4 border-sumi pb-4 mb-12 flex justify-between items-end">
        <h1 className="font-heading text-6xl md:text-8xl leading-[0.8]">TELOS</h1>
        <div className="text-right pb-1">
           <p className="text-[10px] uppercase tracking-widest">Issue 01: Ver2</p>
           <p className="text-[10px] uppercase tracking-widest">Tokyo, JP</p>
        </div>
     </header>
     
     <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-4 space-y-8">
           <h2 className="font-heading text-3xl italic leading-tight">Where Data<br/>Meets Design.</h2>
           <p className="font-jp text-xs leading-loose text-justify">
             {BRAND.description} <br/><br/>
             私たちの哲学は静寂の中にあります。ノイズを取り除き、本質だけを残すこと。それがTELOSの流儀です。
           </p>
           <div className="pt-8">
              <ActionButtons />
           </div>
        </div>
        <div className="col-span-12 md:col-span-8 relative bg-stone/20">
           <img src="https://picsum.photos/900/600?grayscale" className="w-full h-full object-cover img-quiet" />
           <div className="absolute bottom-0 left-0 bg-white p-4">
              <p className="text-[10px] tracking-widest">FIG 01. QUIET ARCHITECTURE</p>
           </div>
        </div>
     </div>
  </div>
);

// --- Variations 11-20 ---

// V11: The Cinematic (Widescreen)
const Variation11 = () => (
  <div className="h-screen w-full bg-black relative overflow-hidden flex items-end">
    <img 
      src="https://picsum.photos/1920/1080?grayscale" 
      className="absolute inset-0 w-full h-full object-cover opacity-40 img-quiet" 
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
    
    <div className="relative z-10 w-full p-12 md:p-24 flex flex-col md:flex-row justify-between items-end text-white">
      <div className="space-y-6 max-w-2xl">
        <span className="text-[10px] tracking-[0.4em] text-bronze uppercase">Design Firm</span>
        <h1 className="font-heading text-5xl md:text-7xl">Logic serves Beauty.</h1>
        <p className="font-jp text-sm tracking-widest opacity-70">{BRAND.subTagline}</p>
      </div>
      <div className="flex gap-4 mt-8 md:mt-0">
         <ActionButtons light />
      </div>
    </div>
  </div>
);

// V12: The Pillar (Vertical)
const Variation12 = () => (
  <div className="min-h-screen w-full bg-white flex justify-center py-24">
     <div className="w-full max-w-md border-x border-stone/30 flex flex-col items-center text-center px-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-12 bg-sumi"></div>
        <Symbol className="w-16 h-16 mt-12 mb-16" />
        
        <h1 className="font-heading text-4xl mb-8 leading-snug">
          Logic<br/>serves<br/><span className="italic">Beauty</span>.
        </h1>
        
        <div className="w-px h-16 bg-stone my-8"></div>
        
        <p className="font-jp text-xs leading-loose text-sumi/70 mb-12">
          {BRAND.description}
        </p>
        
        <div className="flex flex-col gap-4 w-full">
           <ActionButtons />
        </div>
        
        <div className="mt-24 space-y-4">
           {['Home', 'About', 'Service'].map(l => (
             <span key={l} className="block text-[10px] uppercase tracking-widest cursor-pointer hover:text-bronze">{l}</span>
           ))}
        </div>
     </div>
  </div>
);

// V13: The Bauhaus (Asymmetry)
const Variation13 = () => (
  <div className="h-screen w-full bg-stone grid grid-cols-12 grid-rows-6">
     {/* Block 1: Dark */}
     <div className="col-span-12 md:col-span-4 row-span-2 bg-sumi flex items-center justify-center">
        <Symbol className="w-20 h-20 text-white" />
     </div>
     
     {/* Block 2: Image */}
     <div className="col-span-12 md:col-span-8 row-span-4 relative overflow-hidden">
        <img src="https://picsum.photos/1000/1000?grayscale" className="w-full h-full object-cover img-quiet" />
        <div className="absolute inset-0 bg-sumi/20 mix-blend-multiply"></div>
     </div>
     
     {/* Block 3: Content */}
     <div className="col-span-12 md:col-span-4 row-span-4 bg-vapor p-12 flex flex-col justify-between">
        <h1 className="font-heading text-5xl">Logic serves Beauty.</h1>
        <div className="flex flex-col gap-4 items-start">
           <ActionButtons />
        </div>
     </div>
     
     {/* Block 4: Bronze */}
     <div className="col-span-12 md:col-span-8 row-span-2 bg-bronze flex items-center px-12 text-white">
        <p className="font-heading text-3xl italic">{BRAND.subTagline}</p>
     </div>
  </div>
);

// V14: The Card (Glass)
const Variation14 = () => (
  <div className="h-screen w-full bg-stone/20 relative flex items-center justify-center p-6 overflow-hidden">
     {/* Background Blobs */}
     <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-bronze/20 rounded-full blur-3xl"></div>
     <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sumi/10 rounded-full blur-3xl"></div>
     
     {/* Glass Card */}
     <div className="w-full max-w-4xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-2xl rounded-sm p-12 md:p-24 text-center relative z-10">
        <Symbol className="w-12 h-12 mx-auto mb-12 opacity-80" />
        <h1 className="font-heading text-5xl md:text-7xl mb-8 text-sumi">TELOS</h1>
        <p className="font-jp text-sm tracking-widest text-sumi/70 mb-12">{BRAND.subTagline}</p>
        <div className="flex justify-center gap-6">
           <ActionButtons />
        </div>
     </div>
  </div>
);

// V15: The Typographic (Impact)
const Variation15 = () => (
  <div className="h-screen w-full bg-vapor flex flex-col justify-between p-6 md:p-12 overflow-hidden relative">
     <h1 className="font-heading text-[15vw] leading-none text-sumi/10 absolute top-0 left-0 select-none">LOGIC</h1>
     <h1 className="font-heading text-[15vw] leading-none text-sumi/10 absolute bottom-0 right-0 select-none">BEAUTY</h1>
     
     <div className="relative z-10 h-full flex items-center justify-center">
        <div className="max-w-xl text-center space-y-8 bg-white/80 backdrop-blur p-12 shadow-sm border border-sumi/5">
           <Symbol className="w-10 h-10 mx-auto" />
           <p className="font-jp text-lg leading-loose">{BRAND.description}</p>
           <div className="flex justify-center gap-4 pt-4">
              <ActionButtons />
           </div>
        </div>
     </div>
  </div>
);

// V16: The Horizon (Split Horizontal)
const Variation16 = () => (
  <div className="h-screen w-full flex flex-col">
     <div className="h-1/2 bg-white flex items-center justify-center p-12">
        <div className="text-center">
           <Symbol className="w-12 h-12 mx-auto mb-6" />
           <h1 className="font-heading text-5xl">Logic serves Beauty.</h1>
        </div>
     </div>
     <div className="h-1/2 bg-sumi relative overflow-hidden group">
        <img src="https://picsum.photos/1920/800?grayscale" className="w-full h-full object-cover opacity-50 img-quiet group-hover:scale-105 transition-transform duration-1000" />
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="flex gap-8">
              <Link to="/service" className="text-white border border-white px-8 py-3 text-xs tracking-widest uppercase hover:bg-white hover:text-sumi transition-colors">Enter</Link>
           </div>
        </div>
     </div>
  </div>
);

// V17: The Diagonal (Movement)
const Variation17 = () => (
  <div className="h-screen w-full bg-sumi relative overflow-hidden">
     {/* Image Slice */}
     <div className="absolute inset-0 bg-white" style={{ clipPath: 'polygon(60% 0, 100% 0, 100% 100%, 40% 100%)' }}>
        <img src="https://picsum.photos/1200/1200?grayscale" className="w-full h-full object-cover img-quiet" />
        <div className="absolute inset-0 bg-bronze/10 mix-blend-multiply"></div>
     </div>
     
     <div className="absolute top-1/2 left-12 md:left-24 -translate-y-1/2 text-white max-w-lg z-10">
        <Symbol className="w-12 h-12 mb-8 text-white" />
        <h1 className="font-heading text-6xl mb-6">TELOS</h1>
        <p className="font-jp text-sm leading-loose opacity-80 mb-12">
           斜めから見ることで、真実は立体になる。<br/>
           {BRAND.subTagline}
        </p>
        <ActionButtons light />
     </div>
  </div>
);

// V18: The Sidebar (Fixed)
const Variation18 = () => (
  <div className="h-screen w-full flex flex-col md:flex-row bg-vapor">
     <div className="w-full md:w-80 bg-sumi text-white p-12 flex flex-col justify-between shrink-0">
        <div>
           <Symbol className="w-10 h-10 mb-8" />
           <h2 className="font-heading text-2xl tracking-widest">TELOS</h2>
        </div>
        <nav className="space-y-4 text-xs tracking-[0.2em] uppercase opacity-70">
           <div className="border-b border-white/20 pb-2">Home</div>
           <div className="border-b border-white/20 pb-2">About</div>
           <div className="border-b border-white/20 pb-2">Service</div>
           <div className="border-b border-white/20 pb-2">Contact</div>
        </nav>
        <div className="text-[10px] opacity-40">© 2025</div>
     </div>
     <div className="flex-1 overflow-y-auto p-12 md:p-24">
        <div className="max-w-3xl space-y-12">
           <h1 className="font-heading text-6xl md:text-8xl text-sumi">Logic serves Beauty.</h1>
           <div className="w-24 h-1 bg-bronze"></div>
           <div className="columns-1 md:columns-2 gap-12 font-jp text-sm leading-loose text-justify text-sumi/80">
              <p>{BRAND.description}</p>
              <p className="mt-8 md:mt-0">{BRAND.subTagline}<br/><br/>私たちは静寂をデザインします。</p>
           </div>
           <div className="pt-8">
             <ActionButtons />
           </div>
           <div className="h-64 bg-stone/20 mt-12 overflow-hidden">
              <img src="https://picsum.photos/800/400?grayscale" className="w-full h-full object-cover img-quiet" />
           </div>
        </div>
     </div>
  </div>
);

// V19: The Gallery (Grid)
const Variation19 = () => (
  <div className="min-h-screen w-full bg-white p-8 md:p-16">
     <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
        <div className="flex flex-col justify-between space-y-8">
           <Symbol className="w-12 h-12" />
           <div>
              <h1 className="font-heading text-4xl mb-4">Logic serves Beauty.</h1>
              <p className="font-jp text-xs opacity-60">{BRAND.subTagline}</p>
           </div>
           <div><ActionButtons /></div>
        </div>
        <div className="md:mt-24 space-y-8">
           <div className="aspect-[3/4] bg-stone/20 overflow-hidden">
              <img src="https://picsum.photos/seed/1/600/800?grayscale" className="w-full h-full object-cover img-quiet hover:scale-105 transition-transform duration-700" />
           </div>
           <p className="font-serif text-xs italic text-center">Fig. 1 — Structure</p>
        </div>
        <div className="space-y-8">
           <div className="aspect-[3/4] bg-stone/20 overflow-hidden">
              <img src="https://picsum.photos/seed/2/600/800?grayscale" className="w-full h-full object-cover img-quiet hover:scale-105 transition-transform duration-700" />
           </div>
           <p className="font-serif text-xs italic text-center">Fig. 2 — Aesthetic</p>
        </div>
     </div>
  </div>
);

// V20: The Zen (Enso)
const Variation20 = () => (
  <div className="h-screen w-full bg-[#FDFDFD] flex items-center justify-center relative">
     <div className="w-64 h-64 border border-sumi/10 rounded-full flex items-center justify-center hover:border-bronze transition-colors duration-1000 group cursor-pointer relative">
        <div className="absolute inset-0 rounded-full border border-bronze opacity-0 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700"></div>
        <div className="text-center group-hover:scale-105 transition-transform duration-700">
           <span className="font-heading text-2xl tracking-widest block mb-2">TELOS</span>
           <span className="text-[9px] uppercase tracking-[0.3em] opacity-40">Enter</span>
        </div>
     </div>
     
     <div className="absolute top-12 left-12">
        <Symbol className="w-8 h-8 opacity-20" />
     </div>
     <div className="absolute bottom-12 right-12 text-right">
        <p className="font-heading text-sm text-sumi/40">Logic serves Beauty.</p>
     </div>
  </div>
);

export const Prototypes: React.FC = () => {
  const [current, setCurrent] = useState(1);
  const total = 20;

  const renderVariation = () => {
    switch(current) {
      case 1: return <Variation1 />;
      case 2: return <Variation2 />;
      case 3: return <Variation3 />;
      case 4: return <Variation4 />;
      case 5: return <Variation5 />;
      case 6: return <Variation6 />;
      case 7: return <Variation7 />;
      case 8: return <Variation8 />;
      case 9: return <Variation9 />;
      case 10: return <Variation10 />;
      case 11: return <Variation11 />;
      case 12: return <Variation12 />;
      case 13: return <Variation13 />;
      case 14: return <Variation14 />;
      case 15: return <Variation15 />;
      case 16: return <Variation16 />;
      case 17: return <Variation17 />;
      case 18: return <Variation18 />;
      case 19: return <Variation19 />;
      case 20: return <Variation20 />;
      default: return <Variation1 />;
    }
  };

  const labels = [
    "The Axis", "The Grid", "The Monument", "The Corners", "The Frame",
    "The Flow", "The Dark", "The Overlap", "The Minimal", "The Magazine",
    "The Cinematic", "The Pillar", "The Bauhaus", "The Glass", "The Impact",
    "The Horizon", "The Diagonal", "The Sidebar", "The Gallery", "The Zen"
  ];

  return (
    <div className="relative min-h-screen bg-white text-sumi">
      {/* Return to Main Site */}
      <Link to="/" className="fixed top-4 left-4 z-50 bg-white/80 backdrop-blur px-4 py-2 rounded-full text-xs hover:bg-sumi hover:text-white transition-colors border border-sumi/10 shadow-sm flex items-center gap-2">
         <ArrowLeft size={12} /> Back to Main
      </Link>

      {/* Variation Renderer */}
      <FadeIn key={current} duration={0.5} className="w-full h-full">
         {renderVariation()}
      </FadeIn>

      {/* Switcher Control */}
      <div className="fixed bottom-8 right-8 z-50 flex items-center gap-4 bg-white/90 backdrop-blur p-4 rounded-xl shadow-xl border border-stone/20">
         <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] uppercase tracking-widest text-bronze">Prototype</span>
            <span className="font-heading text-lg w-48 text-right">{current.toString().padStart(2, '0')} — {labels[current-1]}</span>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={() => setCurrent(prev => prev > 1 ? prev - 1 : total)}
              className="w-10 h-10 rounded-full border border-sumi/20 flex items-center justify-center hover:bg-sumi hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <button 
              onClick={() => setCurrent(prev => prev < total ? prev + 1 : 1)}
              className="w-10 h-10 rounded-full border border-sumi/20 flex items-center justify-center hover:bg-sumi hover:text-white transition-colors"
            >
              <ArrowRight size={16} />
            </button>
         </div>
         <div className="ml-4 border-l border-stone/30 pl-4 hidden md:block">
            <LayoutIcon className="w-5 h-5 opacity-50" />
         </div>
      </div>
    </div>
  );
};