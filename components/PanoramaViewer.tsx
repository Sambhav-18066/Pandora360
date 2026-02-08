
import React, { useEffect, useRef } from 'react';

interface PanoramaViewerProps {
  imageUrl: string;
}

// Extend JSX namespace for A-Frame elements in TSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': any;
      'a-sky': any;
      'a-assets': any;
      'a-entity': any;
      'a-camera': any;
    }
  }
}

const PanoramaViewer: React.FC<PanoramaViewerProps> = ({ imageUrl }) => {
  const sceneRef = useRef<any>(null);

  useEffect(() => {
    // A-Frame sometimes needs a kick to resize correctly if parent was 0px initially
    const resizeHandler = () => {
      if (sceneRef.current) {
        sceneRef.current.resize();
      }
    };
    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden">
      <a-scene 
        ref={sceneRef}
        embedded 
        vr-mode-ui="enabled: true"
        loading-screen="enabled: false"
        className="w-full h-full"
      >
        <a-assets>
          {/* We use the crossOrigin attribute to ensure textures load from base64 or external URLs correctly */}
          <img id="sky-texture" src={imageUrl} crossOrigin="anonymous" alt="VR Panorama" />
        </a-assets>

        {/* 
          A-Frame Sky component for equirectangular panoramas.
          Rotation is adjusted to center the typical "forward" view.
        */}
        <a-sky 
          src="#sky-texture" 
          rotation="0 -90 0"
          animation="property: opacity; from: 0; to: 1; dur: 1000"
        ></a-sky>

        {/* 
          Camera setup: reverseMouseDrag makes looking around feel natural for desktop users 
          while maintaining standard VR behavior for Quest/Vive.
        */}
        <a-entity 
          camera 
          look-controls="reverseMouseDrag: true; touchEnabled: true" 
          position="0 1.6 0"
        ></a-entity>
      </a-scene>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/50 backdrop-blur-md rounded-full text-white/70 text-xs pointer-events-none z-10 border border-white/10 uppercase tracking-widest">
        Drag to explore • Enter VR for immersion
      </div>
    </div>
  );
};

export default PanoramaViewer;
