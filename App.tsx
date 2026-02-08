
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, PanoramaData } from './types';
import SceneGenerator from './components/SceneGenerator';
import PanoramaViewer from './components/PanoramaViewer';
import VoiceTutor from './components/VoiceTutor';
import { Camera, Mic, Key, Layers, ArrowRight } from 'lucide-react';

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
      setHasApiKey(true); // Assume success per instructions
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
    <div className="relative w-full h-screen overflow-hidden bg-slate-900">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,_#3b82f6_0%,_transparent_70%)]"></div>

      {appState === AppState.SETUP && (
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-6 text-center">
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
                  To use high-quality image generation (Gemini 3 Pro), please select a paid API key. 
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
                  <h3 className="font-semibold text-blue-300 mb-1">Recommended Scene:</h3>
                  <p className="text-sm text-slate-400 italic">"A modern bank interior with people standing in a queue at teller counters..."</p>
                </div>
                <button
                  onClick={() => setAppState(AppState.GENERATING)}
                  className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  Generate My VR Environment
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {appState === AppState.GENERATING && (
        <SceneGenerator onComplete={handleGenerationComplete} onBack={resetApp} />
      )}

      {appState === AppState.IMMERSION && currentPanorama && (
        <div className="w-full h-full">
          <PanoramaViewer imageUrl={currentPanorama.imageUrl} />
          <VoiceTutor />
          
          {/* HUD Overlay */}
          <div className="absolute top-6 left-6 z-50">
            <button 
              onClick={resetApp}
              className="px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-800"
            >
              Exit Scene
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
