import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND, SERVICES } from '../constants';
import { FadeIn } from '../components/FadeIn';
import { Symbol } from '../components/Symbol';
import { ArrowRight } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section (Light - Canvas) */}
      <section className="flex-1 flex flex-col justify-center items-center text-center px-6 min-h-[85vh] bg-vapor relative pt-32 md:pt-0">
        <FadeIn duration={1.5} className="flex flex-col items-center max-w-4xl mx-auto z-10">
          {/* Logo Mark */}
          <div className="mb-6 relative">
             <Symbol className="w-14 h-14 md:w-24 md:h-24" />
          </div>

          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl tracking-tight leading-tight text-sumi mb-8">
            Logic serves <span className="italic">Beauty</span>.
          </h1>

          <p className="font-jp text-sm md:text-base tracking-[0.2em] text-sumi/80 max-w-xl leading-loose mb-12">
            {BRAND.subTagline}
          </p>

          <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
            <a 
              href="https://line.me/R/ti/p/@placeholder" 
              className="bg-sumi text-white px-10 py-4 text-xs tracking-[0.2em] uppercase hover:bg-bronze transition-colors duration-500 min-w-[200px]"
            >
              Contact (LINE)
              <span className="block text-[0.6em] mt-1 opacity-80">お問い合わせ</span>
            </a>
            <Link 
              to="/service" 
              className="border border-sumi px-10 py-4 text-xs tracking-[0.2em] uppercase hover:bg-white hover:border-bronze hover:text-bronze transition-colors duration-500 min-w-[200px]"
            >
              Download
              <span className="block text-[0.6em] mt-1 opacity-80">資料ダウンロード</span>
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* Brand & Service Overview (Dark - Depth/Logic) */}
      <section className="py-24 md:py-32 bg-sumi relative z-10 text-stone">
         <div className="container mx-auto px-6 md:px-12">
            
            {/* Brand Concept */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-24 items-start">
               <div className="md:col-span-4">
                  <FadeIn>
                    <h2 className="font-heading text-3xl md:text-4xl mb-4 text-white">Quiet Architecture</h2>
                    <p className="font-jp text-sm text-stone/60 mb-8">静寂の設計</p>
                    <div className="w-12 h-1 bg-bronze mb-8"></div>
                    <p className="font-serif italic text-stone/40">About Us <span className="text-[0.6em] not-italic ml-2">私たちについて</span></p>
                  </FadeIn>
               </div>
               <div className="md:col-span-8">
                  <FadeIn delay={0.2}>
                    <p className="font-jp text-base leading-loose text-stone/80 text-justify">
                      {BRAND.description}
                      <br /><br />
                      私たちは、ただ美しいだけのデザインは作りません。
                      <Link to="/about" className="inline-block ml-2 text-xs border-b border-stone/30 pb-0.5 hover:text-bronze hover:border-bronze transition-colors text-white">
                        READ MORE <span className="text-[0.8em] opacity-80 ml-1">詳しく見る</span> <ArrowRight className="inline w-3 h-3 ml-1" />
                      </Link>
                    </p>
                  </FadeIn>
               </div>
            </div>

            {/* Service Summary - Revised */}
            <div className="border-t border-white/10 pt-24">
               <FadeIn className="mb-16">
                  <h3 className="font-heading text-2xl mb-2 text-white">Our Services</h3>
                  <p className="text-[10px] tracking-widest text-stone/50 uppercase">Integrated Solutions <span className="ml-2">提供サービス</span></p>
               </FadeIn>
               
               <FadeIn delay={0.2}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
                    {/* Left: Headlines */}
                    <div>
                       <h4 className="font-heading text-4xl md:text-5xl leading-tight text-white mb-6">
                         Build the <br/>
                         <span className="text-bronze italic">Brand Architecture.</span>
                       </h4>
                       <p className="font-jp text-lg md:text-xl text-stone/90 leading-relaxed border-l-2 border-bronze pl-6">
                         美意識と戦略を統合した、<br/>構造的なSNSマーケティング。
                       </p>
                    </div>

                    {/* Right: Description & Action */}
                    <div className="flex flex-col items-start gap-8">
                       <p className="font-jp text-sm leading-8 text-stone/70 text-justify">
                         一過性のバズや、単発の施策ではなく、事業を支え続ける盤石な「構造」を。<br/>
                         SNS、広告、CRM、そしてクリエイティブ。
                         すべてが緻密に連動するエコシステムを構築し、ブランドの永続的な価値を築きます。
                       </p>
                       
                       <Link 
                          to="/service" 
                          className="group flex items-center gap-4 bg-white text-sumi px-8 py-4 text-xs tracking-[0.2em] uppercase hover:bg-bronze hover:text-white transition-all duration-500"
                       >
                          <span>View Services</span>
                          <span className="text-[0.7em] opacity-60 group-hover:opacity-100">サービスについて</span>
                          <ArrowRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                       </Link>
                    </div>
                 </div>
               </FadeIn>
            </div>

         </div>
      </section>

      {/* Abstract Image Strip */}
      <section className="w-full h-[50vh] overflow-hidden relative">
         <img 
            src="https://picsum.photos/1920/1080?grayscale" 
            alt="Architecture abstract" 
            className="w-full h-full object-cover img-quiet opacity-60"
         />
         <div className="absolute inset-0 bg-sumi/40 mix-blend-multiply"></div>
      </section>
    </div>
  );
};