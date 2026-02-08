
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface SceneProps {
  imageUrl: string;
}

const Scene: React.FC<SceneProps> = ({ imageUrl }) => {
  const texture = useTexture(imageUrl);
  
  // Set texture wrapping for spherical mapping
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <Sphere args={[500, 64, 64]} scale={[-1, 1, 1]}>
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </Sphere>
  );
};

interface PanoramaViewerProps {
  imageUrl: string;
}

const PanoramaViewer: React.FC<PanoramaViewerProps> = ({ imageUrl }) => {
  return (
    <div className="w-full h-full bg-black cursor-move">
      <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }}>
        <Suspense fallback={null}>
          <Scene imageUrl={imageUrl} />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            rotateSpeed={-0.5} 
            autoRotate={false} 
          />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/50 backdrop-blur-md rounded-full text-white/70 text-sm pointer-events-none">
        Drag to look around 360°
      </div>
    </div>
  );
};

export default PanoramaViewer;
