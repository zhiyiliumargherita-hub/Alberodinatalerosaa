
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState } from '../types';
import { COLORS, CONFIG, getRandomColor, randomRange } from '../constants';
import { easing } from 'maath';

const FoliageMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uMorphFactor: { value: 0 }, 
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uMorphFactor;
    uniform float uPixelRatio;

    attribute vec3 aScatterPos;
    attribute vec3 aTreePos;
    attribute float aSize;
    attribute vec3 aColor;
    attribute float aPhase;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      float t = uMorphFactor;
      vec3 pos = mix(aScatterPos, aTreePos, t);

      // Breathing
      float breath = sin(uTime * 1.5 + aPhase) * 0.05 * t; 
      float scatterFloat = sin(uTime * 0.5 + aPhase) * 0.2 * (1.0 - t); 
      
      pos += breath + scatterFloat;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      gl_PointSize = aSize * uPixelRatio * (20.0 / -mvPosition.z);

      vColor = aColor;
      vAlpha = 0.8 + 0.2 * sin(uTime * 3.0 + aPhase); 
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      float r = distance(gl_PointCoord, vec2(0.5));
      if (r > 0.5) discard;
      float strength = 1.0 - (r * 2.0);
      strength = pow(strength, 1.5);
      gl_FragColor = vec4(vColor, vAlpha * strength);
    }
  `
};

interface FoliageProps {
  appState: AppState;
}

export const Foliage: React.FC<FoliageProps> = ({ appState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, scatterPositions, treePositions, colors, sizes, phases } = useMemo(() => {
    const count = CONFIG.FOLIAGE_COUNT;
    const scatterPos = new Float32Array(count * 3);
    const treePos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const szs = new Float32Array(count);
    const phs = new Float32Array(count);
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const r = CONFIG.SCATTER_RADIUS * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      scatterPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      scatterPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      scatterPos[i * 3 + 2] = r * Math.cos(phi);

      const hNorm = Math.random(); 
      const h = hNorm * CONFIG.TREE_HEIGHT - CONFIG.TREE_HEIGHT / 2;
      const yPos = (hNorm - 0.5) * CONFIG.TREE_HEIGHT; 
      const radiusAtHeight = (1 - hNorm) * CONFIG.TREE_RADIUS_BASE;
      const angle = Math.random() * Math.PI * 2;
      const radiusJitter = radiusAtHeight * Math.sqrt(Math.random()); 
      treePos[i * 3] = radiusJitter * Math.cos(angle);
      treePos[i * 3 + 1] = yPos;
      treePos[i * 3 + 2] = radiusJitter * Math.sin(angle);

      const isHot = Math.random() > 0.4;
      const palette = isHot ? COLORS.HOT_PINKS : COLORS.PALE_PINKS;
      tempColor.set(getRandomColor(palette));
      cols[i * 3] = tempColor.r;
      cols[i * 3 + 1] = tempColor.g;
      cols[i * 3 + 2] = tempColor.b;

      szs[i] = randomRange(5.0, 9.0);
      phs[i] = Math.random() * Math.PI * 2;
    }

    return { positions: scatterPos, scatterPositions: scatterPos, treePositions: treePos, colors: cols, sizes: szs, phases: phs };
  }, []);

  useFrame((state, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      const targetMorph = appState === AppState.TREE_SHAPE ? 1 : 0;
      easing.damp(shaderRef.current.uniforms.uMorphFactor, 'value', targetMorph, 0.2, delta);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aScatterPos" count={scatterPositions.length / 3} array={scatterPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aTreePos" count={treePositions.length / 3} array={treePositions} itemSize={3} />
        <bufferAttribute attach="attributes-aColor" count={colors.length / 3} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={sizes.length} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aPhase" count={phases.length} array={phases} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial ref={shaderRef} args={[FoliageMaterial]} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};
