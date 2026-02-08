
import React, { useState, useEffect } from 'react';
import { AppState, PanoramaData } from './types';
import SceneGenerator from './components/SceneGenerator';
import PanoramaViewer from './components/PanoramaViewer';
import VoiceTutor from './components/VoiceTutor';
import { Key, Layers, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [currentPanorama, setCurrentPanorama] = useState<PanoramaData | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeyModal = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleGenerationComplete = (panorama: PanoramaData) => {
    setCurrentPanorama(panorama);
    setAppState(AppState.IMMERSION);
  };

  const resetApp = () => {
    setAppState(AppState.SETUP);
    setCurrentPanorama(null);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900">
      {/* 3D Scene Layer - Fixed position to ensure it renders behind the UI */}
      {appState === AppState.IMMERSION && currentPanorama && (
        <PanoramaViewer imageUrl={currentPanorama.imageUrl} />
      )}

      {/* UI Layer */}
      <div className="relative z-20 w-full h-full pointer-events-none">
        {appState === AppState.SETUP && (
          <div className="flex flex-col items-center justify-center w-full h-full p-6 text-center pointer-events-auto">
            {/* Background Decor */}
            <div className="absolute inset-0 z-[-1] opacity-20 bg-[radial-gradient(circle_at_50%_50%,_#3b82f6_0%,_transparent_70%)]"></div>
            
            <div className="max-w-2xl bg-slate-800/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
                  <Layers className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Immersive VR English Tutor
              </h1>
              <p className="text-slate-300 text-lg mb-8">
                Generate photorealistic 360° environments to practice your English in. 
                Step into a bank, a busy street, or a quiet park and talk with your AI coach.
              </p>

              {!hasApiKey ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">
                    To use high-quality image generation, please select a paid API key. 
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-blue-400 hover:underline ml-1">
                      Learn about billing
                    </a>
                  </p>
                  <button
                    onClick={handleOpenKeyModal}
                    className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95"
                  >
                    <Key className="w-5 h-5" />
                    Select API Key to Begin
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600 text-left">
                    <h3 className="font-semibold text-blue-300 mb-1 text-sm">Target Scene:</h3>
                    <p className="text-sm text-slate-400 italic">"A photorealistic bank interior for VR practice..."</p>
                  </div>
                  <button
                    onClick={() => setAppState(AppState.GENERATING)}
                    className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
                  >
                    Generate VR Environment
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {appState === AppState.GENERATING && (
          <div className="pointer-events-auto w-full h-full">
            <SceneGenerator onComplete={handleGenerationComplete} onBack={resetApp} />
          </div>
        )}

        {appState === AppState.IMMERSION && (
          <div className="w-full h-full relative">
            {/* Tutor Interface overlaying the 3D scene */}
            <div className="pointer-events-auto">
              <VoiceTutor />
            </div>
            
            {/* HUD Overlay */}
            <div className="absolute top-6 left-6 pointer-events-auto">
              <button 
                onClick={resetApp}
                className="px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-white/10 text-slate-300 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-lg"
              >
                Exit Environment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
