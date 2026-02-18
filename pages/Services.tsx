import React from 'react';
import { Link } from 'react-router-dom';
import { SERVICES } from '../constants';
import { FadeIn } from '../components/FadeIn';
import { ArrowRight } from 'lucide-react';

export const Services: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
       {/* Dark Header Section (30-40% balance) */}
       <section className="bg-sumi text-stone py-32 px-6 md:px-12">
         <div className="container mx-auto">
            <FadeIn>
              <h2 className="font-heading text-4xl md:text-5xl mb-4 text-white">Services</h2>
              <p className="font-jp text-sm tracking-widest text-stone/60">論理と美意識の統合</p>
              <div className="w-12 h-1 bg-bronze mt-8"></div>
            </FadeIn>
         </div>
       </section>

      {/* Services List Section (Light) */}
      <section className="bg-vapor py-24 px-6 md:px-12 flex-1">
        <div className="container mx-auto">
           <div className="flex flex-col gap-6">
              {SERVICES.map((service, i) => (
                <Link 
                  to={`/service/${service.id}`}
                  key={service.id} 
                  className="bg-[#F4F4F4] p-8 md:p-12 hover:bg-white transition-colors duration-500 group relative overflow-hidden block w-full rounded-sm"
                >
                  <FadeIn delay={i * 0.1}>
                      <div className="flex flex-col md:flex-row gap-8 md:gap-16">
                        
                        {/* Left Column: Identity */}
                        <div className="w-full md:w-1/3 flex flex-col justify-between shrink-0">
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                   <span className="font-heading text-xl text-stone/60 group-hover:text-bronze/50 transition-colors">0{i + 1}</span>
                                   <span className="font-jp text-[10px] border border-sumi/10 px-2 py-0.5 rounded-full text-sumi/50">
                                      {service.subtitle}
                                   </span>
                                </div>
                                <h4 className="font-heading text-3xl md:text-4xl text-sumi mb-2 group-hover:text-bronze transition-colors duration-500">
                                  {service.title}
                                </h4>
                                <p className="font-jp text-sm text-sumi/60 mb-4">{service.titleJp}</p>
                                <p className="font-jp text-xs font-medium text-bronze tracking-wider mb-6">
                                  {service.concept}
                                </p>
                            </div>
                            
                            <div className="hidden md:block">
                                <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-sumi/40 group-hover:text-bronze transition-colors">
                                   View Details <ArrowRight size={14} />
                                </span>
                            </div>
                        </div>

                        {/* Right Column: Content */}
                        <div className="w-full md:w-2/3 border-t md:border-t-0 md:border-l border-sumi/10 pt-8 md:pt-0 md:pl-16 flex flex-col justify-center">
                            {/* Description */}
                            <div className="mb-8">
                              <h5 className="font-jp text-xs font-bold text-sumi/40 uppercase tracking-widest mb-3">Service Summary</h5>
                              <p className="font-jp text-sm leading-loose text-sumi/80">
                                {service.description}
                              </p>
                            </div>

                            {/* Price Info */}
                            <div className="mb-8">
                               <h5 className="font-jp text-xs font-bold text-sumi/40 uppercase tracking-widest mb-3">Price</h5>
                               <div className="flex flex-col sm:flex-row gap-y-4 gap-x-12">
                                  {service.pricingDetails.initial ? (
                                    <>
                                      <div>
                                        <span className="block text-[10px] text-sumi/50 mb-1 font-jp">初期構築</span>
                                        <span className="font-heading text-lg md:text-xl text-sumi">{service.pricingDetails.initial.price}</span>
                                      </div>
                                      {(service.pricingDetails.monthly || service.pricingDetails.recommended) && (
                                        <div>
                                          <span className="block text-[10px] text-sumi/50 mb-1 font-jp">月額 / 手数料</span>
                                          <span className="font-heading text-lg md:text-xl text-sumi">
                                            {service.pricingDetails.monthly?.price || service.pricingDetails.recommended?.price}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div>
                                      <span className="block text-[10px] text-sumi/50 mb-1 font-jp">参考価格</span>
                                      <span className="font-heading text-lg md:text-xl text-sumi">{service.priceLabel}</span>
                                    </div>
                                  )}
                               </div>
                            </div>

                            {/* Work Content List */}
                            <div>
                              <h5 className="font-jp text-xs font-bold text-sumi/40 uppercase tracking-widest mb-3">SCOPE OF WORK</h5>
                              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                {service.pricingDetails.recommended ? (
                                   service.pricingDetails.recommended.details.slice(0, 6).map((item, idx) => (
                                     <li key={idx} className="font-jp text-xs text-sumi/70 flex items-start gap-2">
                                       <span className="w-1 h-1 bg-bronze rounded-full mt-1.5 shrink-0"></span>
                                       <span className="line-clamp-2">{item}</span>
                                     </li>
                                   ))
                                ) : service.pricingDetails.menu ? (
                                    service.pricingDetails.menu.flatMap(m => m.items).slice(0,6).map((item, idx) => (
                                      <li key={idx} className="font-jp text-xs text-sumi/70 flex items-start gap-2">
                                       <span className="w-1 h-1 bg-bronze rounded-full mt-1.5 shrink-0"></span>
                                       <span>{item.label}</span>
                                     </li>
                                    ))
                                ) : (
                                    service.workflow.slice(0,6).map((item, idx) => (
                                      <li key={idx} className="font-jp text-xs text-sumi/70 flex items-start gap-2">
                                       <span className="w-1 h-1 bg-bronze rounded-full mt-1.5 shrink-0"></span>
                                       <span>{item.split(':')[0]}</span>
                                     </li>
                                    ))
                                )}
                              </ul>
                            </div>
                        </div>
                        
                        {/* Mobile Action */}
                        <div className="md:hidden flex justify-end">
                            <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-sumi/50 group-hover:text-bronze transition-colors">
                               Details <ArrowRight size={14} />
                            </span>
                        </div>

                      </div>
                  </FadeIn>
                </Link>
              ))}
           </div>
        </div>
      </section>
    </div>
  );
};