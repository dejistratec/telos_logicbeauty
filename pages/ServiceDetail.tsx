import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { SERVICES } from '../constants';
import { FadeIn } from '../components/FadeIn';
import { ArrowRight } from 'lucide-react';

export const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const currentIndex = SERVICES.findIndex(s => s.id === id);
  const service = SERVICES[currentIndex];

  if (!service) {
    return <Navigate to="/service" replace />;
  }

  // Calculate next service for navigation loop
  const nextIndex = (currentIndex + 1) % SERVICES.length;
  const nextService = SERVICES[nextIndex];

  return (
    <div className="pb-0">
      {/* Header */}
      <div className="bg-sumi text-vapor pt-32 pb-32 px-6 md:px-12 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 border border-stone/10 rounded-full translate-x-1/3 -translate-y-1/3"></div>
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <FadeIn>
            <div className="flex items-center gap-4 mb-6 text-bronze/60">
               <span className="text-xs font-serif italic">0{currentIndex + 1}</span>
               <div className="w-12 h-[1px] bg-bronze/30"></div>
            </div>
            <span className="text-bronze text-xs tracking-[0.3em] uppercase block mb-4">
              {service.subtitle}
            </span>
            <h1 className="font-heading text-4xl md:text-6xl mb-4 leading-tight">{service.title}</h1>
            <p className="font-jp text-sm md:text-base text-stone/60 mb-8 tracking-widest block">
              {service.titleJp}
            </p>
            <p className="font-jp text-lg md:text-xl text-stone/80 tracking-wider">
              {service.concept}
            </p>
          </FadeIn>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-12 max-w-5xl -mt-16 relative z-10">
        <FadeIn delay={0.2} className="bg-white p-8 md:p-16 shadow-lg border-t border-stone/20">
           <p className="font-jp text-base leading-loose text-sumi/80 text-justify mb-16">
             {service.description}
           </p>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
              {/* Left Column: Workflow (Visualized) */}
              <div>
                <h3 className="font-heading text-2xl mb-8 border-b border-sumi/10 pb-4 flex justify-between items-baseline">
                  <span>Workflow</span>
                  <span className="text-[10px] text-sumi/40 uppercase tracking-widest font-sans">Steps</span>
                </h3>
                
                <div className="relative pl-4 space-y-6 before:absolute before:left-[5px] before:top-3 before:bottom-3 before:w-[1px] before:bg-sumi/10">
                  {service.workflow.map((step, i) => {
                    // Split content for better visualization if hyphen exists
                    const parts = step.includes(' - ') ? step.split(' - ') : [step];
                    const title = parts[0];
                    const description = parts[1];

                    return (
                      <div key={i} className="relative group pl-6">
                        {/* Timeline Node */}
                        <div className="absolute left-0 top-2 w-[11px] h-[11px] rounded-full bg-white border border-sumi/20 group-hover:border-bronze group-hover:bg-bronze transition-colors duration-500 z-10"></div>
                        
                        {/* Content Card */}
                        <div className="bg-[#FAFAFA] p-5 rounded-sm border border-transparent hover:border-bronze/20 hover:bg-white hover:shadow-sm transition-all duration-500">
                          <span className="text-[10px] font-serif text-bronze italic block mb-1 opacity-70">
                            Phase 0{i+1}
                          </span>
                          <p className="font-heading font-bold text-sm text-sumi mb-1 group-hover:text-bronze transition-colors">
                            {title}
                          </p>
                          {description && (
                            <p className="font-jp text-xs text-sumi/60 leading-relaxed border-t border-sumi/5 pt-2 mt-2">
                              {description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Right Column: Pricing Structure */}
              <div>
                 <h3 className="font-heading text-2xl mb-8 border-b border-sumi/10 pb-4 flex justify-between items-baseline">
                   <span>Price</span>
                   <span className="text-[10px] text-sumi/40 uppercase tracking-widest font-sans">Structure</span>
                 </h3>

                 <div className="space-y-12">
                    {/* 1. Initial Cost */}
                    {service.pricingDetails.initial && (
                       <div>
                         <p className="text-[10px] text-sumi/50 uppercase tracking-widest mb-2">Initial Cost</p>
                         <p className="font-heading text-xl mb-1">{service.pricingDetails.initial.price}</p>
                         <p className="text-xs text-sumi/60">{service.pricingDetails.initial.description}</p>
                       </div>
                    )}

                    {/* 2. Monthly Range */}
                    {service.pricingDetails.monthly && (
                       <div>
                         <p className="text-[10px] text-sumi/50 uppercase tracking-widest mb-2">Monthly Range</p>
                         <p className="font-heading text-xl mb-1">{service.pricingDetails.monthly.price}</p>
                         <p className="text-xs text-sumi/60">{service.pricingDetails.monthly.description}</p>
                       </div>
                    )}

                    {/* 3. Recommended Plan (Monthly Standard) */}
                    {service.pricingDetails.recommended && (
                      <div>
                        <div className="bg-vapor p-10 border border-stone/30 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-stone/20 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-150"></div>
                            
                            <p className="font-heading text-3xl mb-2 relative z-10">{service.pricingDetails.recommended.price}</p>
                            <p className="text-[10px] text-sumi/50 uppercase tracking-widest mb-8 relative z-10">Monthly Standard</p>
                            <ul className="space-y-4 relative z-10 mb-8">
                              {service.pricingDetails.recommended.details.map((detail, i) => (
                                <li key={i} className="font-jp text-xs flex items-start gap-3 text-sumi/70">
                                  <div className="w-1 h-1 bg-bronze rounded-full mt-1.5 shrink-0"></div>
                                  <span>{detail}</span>
                                </li>
                              ))}
                            </ul>
                            {service.pricingDetails.recommended.note && (
                              <p className="text-[10px] text-sumi/40 relative z-10">{service.pricingDetails.recommended.note}</p>
                            )}
                        </div>
                      </div>
                    )}

                    {/* 4. Menu (Creative Studio) */}
                    {service.pricingDetails.menu && (
                       <div className="space-y-8">
                         {service.pricingDetails.menu.map((cat, i) => (
                           <div key={i}>
                              <p className="text-xs font-bold uppercase tracking-widest mb-4 text-bronze">{cat.category}</p>
                              <ul className="space-y-4">
                                 {cat.items.map((item, j) => (
                                   <li key={j} className="flex justify-between items-end border-b border-stone/30 pb-2">
                                      <span className="font-jp text-sm text-sumi/80">{item.label}</span>
                                      <span className="font-sans text-sm font-bold text-sumi">{item.price}</span>
                                   </li>
                                 ))}
                              </ul>
                           </div>
                         ))}
                       </div>
                    )}
                 </div>
              </div>
           </div>

           <div className="text-center border-t border-stone pt-16">
             <div className="flex flex-col md:flex-row gap-6 justify-center">
                <a 
                  href="https://line.me/R/ti/p/@placeholder" 
                  className="inline-block bg-sumi text-white px-12 py-4 text-xs tracking-[0.2em] uppercase hover:bg-bronze transition-colors duration-300 min-w-[240px]"
                >
                  お問い合わせ (LINE)
                </a>
                <Link 
                  to="/service" 
                  className="inline-block border border-sumi text-sumi px-12 py-4 text-xs tracking-[0.2em] uppercase hover:bg-vapor hover:border-bronze hover:text-bronze transition-colors duration-300 min-w-[240px]"
                >
                  資料ダウンロード
                </Link>
             </div>
             <p className="mt-6 text-[10px] text-sumi/40 tracking-widest">Connect with TELOS.</p>
           </div>
        </FadeIn>
      </div>

      {/* Next Service Navigation */}
      <Link to={`/service/${nextService.id}`} className="block group mt-24">
        <div className="bg-sumi/5 py-24 px-6 md:px-12 transition-colors duration-500 group-hover:bg-sumi group-hover:text-white">
          <div className="container mx-auto max-w-5xl flex justify-between items-center">
             <div className="text-left">
                <span className="text-[10px] uppercase tracking-[0.3em] opacity-50 block mb-4">Next Service</span>
                <span className="font-heading text-3xl md:text-5xl">{nextService.title}</span>
             </div>
             <ArrowRight className="w-8 h-8 opacity-50 group-hover:translate-x-4 transition-transform duration-500" />
          </div>
        </div>
      </Link>
    </div>
  );
};