
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

/**
 * Service to handle image generation and eventually voice AI tutor sessions.
 */
export const generatePanorama = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  
  // High-quality request per user prompt: 360-degree equirectangular panorama
  // Use gemini-3-pro-image-preview for high resolution and 4K support
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        {
          text: `Generate a photorealistic 360-degree equirectangular panorama designed for VR viewing. 
          Scene: ${prompt}.
          Technical requirements:
          - Output must be a single seamless equirectangular panorama (2:1 aspect ratio).
          - Camera position at average human eye level (approximately 1.6 meters).
          - Perspective must feel natural when viewed from the center of the scene.
          - No camera tilt, no fisheye distortion.
          - Left and right edges must align perfectly for seamless looping.
          - Lighting should be realistic indoor daylight.
          - Image must be sharp and clear across the entire panorama.
          Content requirements:
          - Floor, walls, ceiling fully visible to avoid black or empty areas.
          - No exaggerated features, text, watermarks, logos, or branding.
          - Style: Photorealistic, Real-world scale, Neutral, everyday atmosphere.`
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9", // Approximate for 2:1 when model supports wide. 
        // Note: For gemini-3-pro-image-preview, 1K/2K/4K is available.
        imageSize: "2K"
      }
    },
  });

  for (const part of response.candidates![0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data received from Gemini");
};

// Functions for Live API communication
export const createLiveSession = async (callbacks: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: 'You are a friendly and helpful English tutor. You help the student describe the scene they are looking at in VR. Correct their pronunciation and grammar gently. Focus on immersive practice.',
      outputAudioTranscription: {},
      inputAudioTranscription: {},
    }
  });
};
