
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { Ribbon } from './Ribbon';
import { TreeTopper } from './TreeTopper';
import { GoldDust } from './GoldDust';
import { AppState } from '../types';

interface ExperienceProps {
  appState: AppState;
}

const SceneContent: React.FC<ExperienceProps> = ({ appState }) => {
  return (
    <>
      <color attach="background" args={['#4A0E2E']} />
      <fog attach="fog" args={['#4A0E2E', 20, 90]} />
      
      <ambientLight intensity={0.8} color="#FFD1DC" />
      <pointLight position={[10, 10, 10]} intensity={2.0} color="#FFFFFF" />
      <pointLight position={[-10, 5, -10]} intensity={2.0} color="#FF007F" />
      <spotLight position={[0, 25, 5]} angle={0.6} penumbra={0.5} intensity={3} color="#E8E8E8" />

      <group position={[0, -2, 0]}>
         <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
            <Foliage appState={appState} />
            <Ornaments appState={appState} />
            <Ribbon appState={appState} />
            <TreeTopper appState={appState} />
            <GoldDust appState={appState} />
         </Float>
      </group>

      <Stars radius={100} depth={50} count={3000} factor={4} saturation={1} fade speed={1} />

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.65} luminanceSmoothing={0.7} height={300} intensity={1.5} radius={0.8} />
        <Noise opacity={0.03} />
      </EffectComposer>

      <OrbitControls 
        enablePan={false} 
        minDistance={10} 
        maxDistance={50} 
        autoRotate 
        autoRotateSpeed={0.5}
        makeDefault
      />
    </>
  );
};

export const Experience: React.FC<ExperienceProps> = (props) => {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 22], fov: 45, near: 0.1, far: 200 }}
      gl={{ antialias: false, alpha: false, stencil: false, depth: true }}
    >
      <Suspense fallback={null}>
        <SceneContent {...props} />
      </Suspense>
    </Canvas>
  );
};
