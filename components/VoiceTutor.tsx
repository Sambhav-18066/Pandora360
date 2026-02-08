
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createLiveSession } from '../services/gemini';
import { Mic, MicOff, Volume2, MessageSquare, Terminal } from 'lucide-react';
import { TranscriptionItem } from '../types';

const VoiceTutor: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcriptions, setTranscriptions] = useState<TranscriptionItem[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Refs to track transcription text to avoid stale closures in the Live API message handler
  const inputRef = useRef('');
  const outputRef = useRef('');

  // Helper: Encode to base64 manually as per GenAI SDK guidelines
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Helper: Decode base64 manually as per GenAI SDK guidelines
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Helper: Decode PCM bytes as per GenAI SDK guidelines
  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const startSession = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      sessionPromiseRef.current = createLiveSession({
        onopen: () => {
          setIsActive(true);
          const source = audioContextRef.current!.createMediaStreamSource(stream);
          const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
            
            // Correctly encode PCM data to base64
            const base64 = encode(new Uint8Array(int16.buffer));

            sessionPromiseRef.current?.then(session => {
              session.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
            });
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(audioContextRef.current!.destination);
        },
        onmessage: async (msg: any) => {
          // Handle Audio
          const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio) {
            setIsSpeaking(true);
            const bytes = decode(base64Audio);
            
            const ctx = outputAudioContextRef.current!;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const buffer = await decodeAudioData(bytes, ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            source.onended = () => {
              sourcesRef.current.delete(source);
              if (sourcesRef.current.size === 0) setIsSpeaking(false);
            };
            sourcesRef.current.add(source);
          }

          // Handle Transcriptions
          if (msg.serverContent?.inputTranscription) {
            const text = msg.serverContent.inputTranscription.text;
            inputRef.current += text;
            setCurrentInput(prev => prev + text);
          }
          if (msg.serverContent?.outputTranscription) {
            const text = msg.serverContent.outputTranscription.text;
            outputRef.current += text;
            setCurrentOutput(prev => prev + text);
          }
          if (msg.serverContent?.turnComplete) {
            // Fix type error and handle stale closures by capturing current ref values
            const finalInput = inputRef.current;
            const finalOutput = outputRef.current;
            
            setTranscriptions(prev => {
              const newItems: TranscriptionItem[] = [
                { text: finalInput, sender: 'user', timestamp: Date.now() },
                { text: finalOutput, sender: 'tutor', timestamp: Date.now() }
              ];
              return [...prev, ...newItems].slice(-10);
            });
            
            inputRef.current = '';
            outputRef.current = '';
            setCurrentInput('');
            setCurrentOutput('');
          }

          if (msg.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => s.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
            setIsSpeaking(false);
          }
        },
        onerror: (e: any) => {
          console.error("Live session error", e);
          setError("Connection lost. Please try reconnecting.");
        },
        onclose: () => setIsActive(false),
      });

    } catch (err: any) {
      console.error(err);
      setError("Could not access microphone.");
    }
  };

  const stopSession = () => {
    sessionPromiseRef.current?.then(s => s.close());
    setIsActive(false);
    setIsSpeaking(false);
  };

  return (
    <div className="absolute bottom-6 right-6 z-50 flex flex-col items-end gap-4 w-full max-sm:max-w-xs max-w-sm">
      {/* Transcript window */}
      <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
        <div className="p-3 bg-slate-800/50 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <MessageSquare className="w-4 h-4" />
            AI Tutor Session
          </div>
          {isActive && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">Live</span>
            </div>
          )}
        </div>
        
        <div className="h-48 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {transcriptions.length === 0 && !isActive && (
            <p className="text-slate-500 text-sm text-center italic py-10">Start the session to begin practicing your English.</p>
          )}
          {transcriptions.map((t, i) => (
            <div key={i} className={`flex flex-col ${t.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                t.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-100 rounded-bl-none'
              }`}>
                {t.text}
              </div>
            </div>
          ))}
          {(currentInput || currentOutput) && (
             <div className="flex flex-col space-y-2 opacity-60 italic text-xs text-slate-400 animate-pulse">
               {currentInput && <div>You: {currentInput}</div>}
               {currentOutput && <div>Tutor: {currentOutput}</div>}
             </div>
          )}
          {error && <div className="text-red-400 text-xs p-2 bg-red-900/20 rounded-lg">{error}</div>}
        </div>

        <div className="p-4 flex items-center justify-between gap-4">
          <div className="flex-1">
             {isSpeaking && (
               <div className="flex items-center gap-1">
                 <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                 <div className="flex gap-1 h-3 items-end">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-0.5 bg-emerald-400 animate-bounce" style={{animationDelay: `${i*0.1}s`, height: `${Math.random()*100}%`}}></div>
                    ))}
                 </div>
               </div>
             )}
          </div>
          <button
            onClick={isActive ? stopSession : startSession}
            className={`p-4 rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-lg ${
              isActive ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
            }`}
          >
            {isActive ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceTutor;
