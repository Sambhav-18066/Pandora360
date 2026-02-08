
import React, { useState } from 'react';
import { PanoramaData } from '../types';
import { generatePanorama } from '../services/gemini';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface SceneGeneratorProps {
  onComplete: (data: PanoramaData) => void;
  onBack: () => void;
}

const SceneGenerator: React.FC<SceneGeneratorProps> = ({ onComplete, onBack }) => {
  const [prompt, setPrompt] = useState('A modern bank interior with people standing in a queue at teller counters');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const steps = [
    "Constructing 3D perspectives...",
    "Simulating photorealistic lighting...",
    "Rendering bank interior details...",
    "Aligning equirectangular edges...",
    "Optimizing for VR immersion..."
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    // Step timer
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % steps.length);
    }, 4000);

    try {
      const imageUrl = await generatePanorama(prompt);
      onComplete({
        imageUrl,
        prompt,
        timestamp: Date.now()
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate scene. Please check your API key and try again.');
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-6">
      <div className="w-full max-w-xl bg-slate-800/80 backdrop-blur-2xl p-8 rounded-3xl border border-slate-700 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Sparkles className="text-blue-400" />
          Environment Architect
        </h2>

        {!isGenerating ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Describe the scene you want to practice in:
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                placeholder="e.g., A busy airport terminal with travelers..."
              />
            </div>

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-800 rounded-xl flex items-start gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={onBack}
                className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleGenerate}
                className="flex-[2] py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105"
              >
                Generate Scene
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-medium text-slate-100">Creating Your World</h3>
              <p className="text-slate-400 animate-pulse min-h-[1.5rem]">
                {steps[loadingStep]}
              </p>
            </div>
            <p className="text-xs text-slate-500 max-w-xs">
              This process usually takes about 15-30 seconds for a high-quality VR panorama.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SceneGenerator;
