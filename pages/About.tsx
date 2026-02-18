import React from 'react';
import { FadeIn } from '../components/FadeIn';
import { TelosDiagram } from '../components/TelosDiagram';

export const About: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* Philosophy Section (Dark Theme ~40% of page) */}
      <section className="bg-sumi text-stone py-32 px-6 md:px-12 relative">
        <div className="container mx-auto max-w-4xl">
          <FadeIn className="text-center md:text-left space-y-12 mb-24">
            <div>
              <h2 className="font-heading text-4xl md:text-5xl italic mb-4 text-white">The Philosophy</h2>
              <p className="font-jp text-sm tracking-widest text-bronze">哲学</p>
            </div>
            <div className="font-jp text-lg md:text-xl leading-loose tracking-widest space-y-8 text-stone/90">
              <p>どんなに素晴らしい価値も、<br className="md:hidden"/>見えなければ存在しないのと同じだ。</p>
              <p>私たちは、あなたの内に眠る「真価」を、<br/>デザインとテクノロジーの力で鮮やかに可視化する。</p>
              <p>迷いを捨て、あるべき美しさへ。<br/>その道のりを、共に歩もう。</p>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.2} className="border-t border-white/20 pt-12 flex flex-col md:flex-row gap-12">
            <div className="md:w-1/3">
               <h3 className="font-heading text-2xl mb-2 text-white">Mission</h3>
               <p className="font-jp text-xs text-stone/50 tracking-widest">使命</p>
            </div>
            <div className="md:w-2/3">
               <p className="font-jp text-sm leading-8 text-stone/80 text-justify">
                 感性による「翻訳（クリエイティブ）」と、データによる「証明（ロジック）」を統合し、クライアントの迷いを取り去り、美学と成果が両立する場所へ導く。
               </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* System Diagram (Light Theme) */}
      <section className="bg-vapor py-24 px-6 md:px-12">
        <div className="container mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl">T.E.L.O.S System</h2>
              <p className="font-jp text-xs mt-4 tracking-widest text-bronze">構造化された美学</p>
            </div>
            <TelosDiagram />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mt-16 text-center">
              {[
                { l: 'Techne', j: '表現力', d: 'ブランドの「真価」を美しく可視化する技術' },
                { l: 'Evidence', j: '適合性', d: 'データを活用し、正しい相手に届ける根拠' },
                { l: 'Logos', j: '設計', d: '一過性の認知で終わらせず、ファン化へ導く戦略' },
                { l: 'Organosis', j: '仕組み', d: '運用の中でブランド資産が蓄積されるシステム' },
                { l: 'Sophia', j: '本質', d: 'クライアント自身も気づいていない「あるべき姿」の発見' },
              ].map((item, i) => (
                <div key={item.l} className="space-y-4 md:space-y-2 px-2">
                   <h4 className="font-heading text-xl">{item.l}</h4>
                   <p className="font-jp text-xs font-bold">{item.j}</p>
                   <p className="font-jp text-[10px] text-sumi/60 leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Founder's Story (Light Theme) */}
      <section className="bg-vapor pb-24 px-6 md:px-12">
         <div className="container mx-auto max-w-5xl bg-white px-8 py-16 md:p-24 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-stone/20"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
             <FadeIn className="order-2 md:order-1">
                <h3 className="font-heading text-3xl mb-2">The Aesthetic Guide</h3>
                <p className="font-jp text-xs text-bronze mb-8">美への導き手</p>
                
                <div className="font-jp text-sm leading-loose text-sumi/80 space-y-6 text-justify">
                  <p>
                    「美しさ」と「成果」は、なぜ分断されるのか。<br/>
                    私の原点は、アパレルD2Cブランドでの現場にあります。
                    そこで私は、クリエイティブの力がビジネスを動かす瞬間を目の当たりにしました。自ら企画・制作したリール動画が、リーチ数を47%向上させ、熱狂的なファンを生み出す。デザインが数字に変わるその瞬間、私は「表現」の持つ可能性を確信しました。
                  </p>
                  <p>
                    しかし、同時に痛感したのです。
                    「良いものを作れば売れる」時代は終わったのだと。どれほど美しいクリエイティブも、届くべき人に届かなければ、それは存在しないも同然です。
                  </p>
                  <p>
                    私はより上流の領域へ活動の場を移しました。ITスタートアップでのユーザーリサーチ、そして新規事業開発におけるAI技術の統合。
                    「誰に、何を、どう届けるか」という戦略（Logic）と、最新のテクノロジー（AI）を掛け合わせることで、クリエイティブは初めて「武器」になることを学びました。
                  </p>
                  <p>
                    感性（Magic）と論理（Logic）の融合。
                    TELOSは、この二つを分断させず、美しく統合するために生まれました。
                    あなたのブランドに眠る「真価」を、データという論理で裏付け、洗練された美意識で可視化する。
                  </p>
                  <p>
                    迷いを捨て、あるべき美しさへ。
                    デザインストラテジストとして、その到達点（TELOS）まで並走します。
                  </p>
                </div>
                <div className="mt-12 text-right">
                  <p className="font-heading text-lg">Tetsuya Miyashita</p>
                  <p className="text-xs uppercase tracking-widest text-sumi/50">Representative</p>
                </div>
             </FadeIn>
             <FadeIn className="order-1 md:order-2 h-full min-h-[400px]">
                <img src="https://picsum.photos/600/800?grayscale" alt="Founder abstract" className="w-full h-full object-cover img-quiet" />
             </FadeIn>
          </div>
        </div>

        <div className="text-center py-24">
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