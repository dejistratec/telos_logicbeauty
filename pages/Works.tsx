import React from 'react';
import { WORKS } from '../constants';
import { FadeIn } from '../components/FadeIn';

export const Works: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Dark Header Section */}
      <section className="bg-sumi text-stone py-32 px-6 md:px-12">
        <div className="container mx-auto">
          <FadeIn>
            <h2 className="font-heading text-4xl md:text-5xl mb-4 text-white">Selected Works</h2>
            <p className="font-jp text-sm tracking-widest text-stone/60">実績と証明</p>
            <div className="w-12 h-1 bg-bronze mt-8"></div>
          </FadeIn>
        </div>
      </section>

      {/* Works List Section */}
      <section className="bg-vapor py-24 px-6 md:px-12">
        <div className="container mx-auto space-y-32">
          {WORKS.map((work, index) => (
            <FadeIn key={work.id} className="flex flex-col md:flex-row gap-12 md:gap-24 items-start">
               {/* Visual Side */}
               <div className="w-full md:w-1/2 relative group">
                  <div className="aspect-[4/5] overflow-hidden bg-stone/20">
                     <img 
                      src={`https://picsum.photos/seed/${work.id}/800/1000?grayscale`} 
                      alt={work.client} 
                      className="w-full h-full object-cover img-quiet group-hover:scale-105 transition-transform duration-700"
                     />
                  </div>
                  <div className="absolute -bottom-6 -right-6 md:-right-12 bg-white p-8 shadow-xl max-w-xs z-10">
                     <div className="space-y-4">
                       {work.evidence.map((ev, i) => (
                         <div key={i} className="border-b border-stone/30 pb-2 last:border-0 last:pb-0">
                            <p className="text-[10px] text-sumi/50 uppercase tracking-widest mb-1">{ev.label}</p>
                            <p className="font-heading text-2xl md:text-3xl text-bronze">{ev.value}</p>
                         </div>
                       ))}
                     </div>
                  </div>
               </div>

               {/* Logic Side */}
               <div className="w-full md:w-1/2 pt-12">
                  <span className="font-heading text-sm text-sumi/40 block mb-4">Case 0{index + 1} <span className="font-jp text-xs ml-2 opacity-50">実績</span></span>
                  <h3 className="font-heading text-3xl md:text-4xl mb-2">{work.client}</h3>
                  <p className="text-xs text-bronze uppercase tracking-widest mb-8">{work.category}</p>

                  <div className="mb-8 flex flex-wrap gap-2">
                     {work.scope.map(s => (
                       <span key={s} className="text-[10px] border border-stone px-3 py-1 text-sumi/60">
                         {s}
                       </span>
                     ))}
                  </div>

                  <div className="font-jp text-sm leading-loose text-sumi/80 space-y-8 text-justify">
                     <div>
                        <p className="font-bold text-xs mb-2 text-sumi/40 uppercase tracking-widest">Description <span className="ml-1 opacity-50">概要</span></p>
                        <p>{work.description}</p>
                     </div>
                     
                     <div className="bg-white p-6 border-l-2 border-bronze shadow-sm">
                        <p className="font-bold mb-2 text-xs text-bronze uppercase tracking-widest">Highlights <span className="ml-1 opacity-50">重要ポイント</span></p>
                        <p className="text-xs leading-relaxed">{work.highlights}</p>
                     </div>

                     <div>
                        <p className="font-bold text-xs mb-2 text-sumi/40 uppercase tracking-widest">Outcome <span className="ml-1 opacity-50">成果</span></p>
                        <p>{work.outcome}</p>
                     </div>
                  </div>
               </div>
            </FadeIn>
          ))}
        </div>
        
        <div className="text-center py-24 mt-12 border-t border-stone/30">
           <p className="font-heading text-3xl mb-2">Connect with TELOS.</p>
           <p className="font-jp text-xs text-sumi/50 tracking-widest mb-8">お問い合わせ</p>
           <a 
                href="https://line.me/R/ti/p/@placeholder" 
                className="bg-sumi text-white px-10 py-4 text-xs tracking-[0.2em] uppercase hover:bg-bronze transition-colors duration-500 min-w-[200px] inline-block"
              >
                Contact (LINE)
           </a>
        </div>
      </section>
    </div>
  );
};