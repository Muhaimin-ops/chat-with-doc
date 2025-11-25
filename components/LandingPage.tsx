
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState } from 'react';
import { ArrowRight, Book, Globe, Shield, Zap, Database, MessageSquare, CheckCircle2, Terminal, Code2, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#E4E4E7] font-sans selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden relative">
      {/* Background Gradients & Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#09090b]/60 backdrop-blur-xl transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
        <div className="flex items-center gap-3">
           <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-500/20">
             <Book className="text-white w-5 h-5" />
           </div>
           <span className="font-bold text-xl tracking-tight text-white">Documind</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onSignIn} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Sign In
          </button>
          <button 
            onClick={onGetStarted}
            className="group relative px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-full overflow-hidden hover:bg-zinc-100 transition-all"
          >
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-white opacity-0 group-hover:opacity-50 transition-opacity" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        <div className={`transition-all duration-1000 delay-100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 hover:border-blue-500/30 transition-colors cursor-default backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]"></span>
            <span className="text-xs font-medium text-zinc-300">Intelligent Docs Assistant v2.0</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8">
            <span className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">Chat with your</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-blue-400 pb-2">Documentation</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed">
            Stop searching through endless markdown files. Documind grounds LLMs on your specific SDKs and APIs to provide accurate, code-first answers instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onGetStarted}
              className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-lg transition-all hover:scale-[1.02] shadow-[0_0_40px_-10px_rgba(37,99,235,0.3)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[spin_1.5s_infinite]" style={{ animation: 'shimmer 2s infinite' }} />
              <div className="flex items-center gap-2">
                Start Building Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
            <button 
              onClick={onSignIn}
              className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-semibold text-lg transition-all hover:scale-[1.02] backdrop-blur-sm"
            >
              Live Demo
            </button>
          </div>
        </div>

        {/* App Preview / Floating UI */}
        <div className={`mt-24 relative w-full max-w-5xl transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
          <div className="absolute inset-0 bg-blue-500/10 blur-[60px] rounded-full -z-10" />
          
          <div className="relative rounded-2xl border border-white/10 bg-[#0c0c0e]/80 shadow-2xl backdrop-blur-xl overflow-hidden ring-1 ring-white/10">
             {/* Mock Browser Header */}
             <div className="h-12 border-b border-white/5 bg-[#18181b]/50 flex items-center px-4 gap-4">
                <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-sm"></div>
                   <div className="w-3 h-3 rounded-full bg-[#FEBC2E] shadow-sm"></div>
                   <div className="w-3 h-3 rounded-full bg-[#28C840] shadow-sm"></div>
                </div>
                <div className="flex-1 max-w-2xl mx-auto h-7 bg-[#09090b] rounded-lg border border-white/5 flex items-center justify-center text-xs text-zinc-500 font-mono">
                   documind.ai/chat/sdk-implementation
                </div>
             </div>

             {/* Mock UI Body */}
             <div className="flex aspect-[16/9] md:aspect-[2/1] relative">
                {/* Sidebar */}
                <div className="w-64 border-r border-white/5 p-4 hidden md:flex flex-col gap-4 bg-[#18181b]/30">
                   <div className="h-8 w-32 bg-white/5 rounded-lg mb-2"></div>
                   <div className="space-y-2.5">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                          <div className="w-4 h-4 rounded bg-white/10"></div>
                          <div className="h-2 w-24 bg-white/10 rounded"></div>
                        </div>
                      ))}
                   </div>
                   <div className="mt-auto pt-4 border-t border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500"></div>
                         <div className="space-y-1">
                            <div className="h-2 w-20 bg-white/10 rounded"></div>
                            <div className="h-2 w-12 bg-white/5 rounded"></div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 p-8 relative flex flex-col">
                   <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-transparent pointer-events-none"></div>
                   
                   {/* Chat Bubbles */}
                   <div className="w-full max-w-3xl mx-auto space-y-6">
                      <div className="flex justify-end animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-forwards">
                         <div className="bg-[#27272a] text-zinc-100 px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-lg border border-white/5 max-w-md">
                            How do I implement streaming with the new Client SDK?
                         </div>
                      </div>
                      
                      <div className="flex justify-start animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-forwards opacity-0" style={{ animationFillMode: 'forwards' }}>
                         <div className="flex gap-4 max-w-2xl">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                              <Sparkles size={14} className="text-white" />
                            </div>
                            <div className="flex-1 space-y-3">
                               <div className="bg-[#18181b] border border-blue-500/20 rounded-2xl rounded-tl-sm p-5 shadow-lg relative overflow-hidden group">
                                  <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                                  
                                  <div className="flex items-center gap-2 mb-3">
                                     <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                                        <CheckCircle2 size={10} /> v2.4.0 Docs
                                     </span>
                                  </div>
                                  
                                  <p className="text-sm text-zinc-300 leading-relaxed mb-3">
                                    Use the <code className="text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs font-mono">generateContentStream</code> method. Here is the implementation pattern:
                                  </p>
                                  
                                  <div className="bg-black/50 rounded-lg border border-white/5 p-3 font-mono text-xs overflow-hidden relative">
                                    <div className="flex gap-1.5 absolute top-3 right-3">
                                       <div className="w-2 h-2 rounded-full bg-white/20"></div>
                                       <div className="w-2 h-2 rounded-full bg-white/20"></div>
                                    </div>
                                    <div className="text-purple-400">const <span className="text-blue-400">stream</span> = <span className="text-red-400">await</span> client.<span className="text-yellow-400">generateContentStream</span>({'{'}</div>
                                    <div className="pl-4 text-zinc-400">model: <span className="text-green-400">'gemini-pro'</span>,</div>
                                    <div className="pl-4 text-zinc-400">prompt: <span className="text-green-400">'...'</span></div>
                                    <div className="text-zinc-400">{'}'});</div>
                                    <div className="mt-2 text-purple-400">for <span className="text-red-400">await</span> (<span className="text-purple-400">const</span> chunk <span className="text-purple-400">of</span> stream) {'{'}</div>
                                    <div className="pl-4 text-zinc-400">console.<span className="text-yellow-400">log</span>(chunk.text());</div>
                                    <div className="text-zinc-400">{'}'}</div>
                                  </div>
                               </div>
                               
                               <div className="flex gap-2">
                                  <div className="h-2 w-24 bg-white/5 rounded-full"></div>
                                  <div className="h-2 w-16 bg-white/5 rounded-full"></div>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0c0c0e]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0c0c0e] to-[#0c0c0e]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
           <div className="text-center mb-20 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Engineered for Accuracy</h2>
              <p className="text-lg text-zinc-400">
                Built to reduce hallucinations by strictly grounding responses in your provided documentation and web sources.
              </p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard 
                icon={<Globe className="text-blue-400 w-6 h-6" />}
                title="Web & Doc Grounding"
                description="Documind scans official documentation URLs and performs live web searches to ensure answers are up-to-date."
                delay={0}
              />
              <FeatureCard 
                icon={<Database className="text-purple-400 w-6 h-6" />}
                title="Bring Your Own Key"
                description="Versatile model support. Use your own Gemini API key, or connect other providers for maximum flexibility."
                delay={100}
              />
              <FeatureCard 
                icon={<Shield className="text-green-400 w-6 h-6" />}
                title="Zero Data Retention"
                description="Your API keys are stored locally. Your conversations are yours. We prioritize privacy and security."
                delay={200}
              />
              <FeatureCard 
                icon={<Code2 className="text-yellow-400 w-6 h-6" />}
                title="Code-First Responses"
                description="Optimized system instructions ensure the model prioritizes syntactically correct code snippets over chatter."
                delay={300}
              />
              <FeatureCard 
                icon={<Terminal className="text-red-400 w-6 h-6" />}
                title="Strict Context"
                description="The model is instructed to only answer from the provided context, significantly reducing hallucinations."
                delay={400}
              />
              <FeatureCard 
                icon={<Zap className="text-cyan-400 w-6 h-6" />}
                title="Instant Streaming"
                description="Real-time token streaming with visual cursors provides an immediate, responsive user experience."
                delay={500}
              />
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-[#09090b] text-center text-zinc-500 text-sm relative z-10">
        <p>&copy; {new Date().getFullYear()} Documind. All rights reserved.</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) => (
  <div 
    className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all group duration-300 hover:-translate-y-1"
    style={{ animationDelay: `${delay}ms` }}
  >
     <div className="mb-6 p-4 rounded-xl bg-zinc-900/50 border border-white/5 w-fit group-hover:scale-110 transition-transform duration-300 shadow-inner">
        {icon}
     </div>
     <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors">{title}</h3>
     <p className="text-zinc-400 leading-relaxed text-sm">{description}</p>
  </div>
);

export default LandingPage;
