'use client';

/**
 * ThreeDMockup — Viewer 3D em tempo real da camiseta com estampa aplicada.
 *
 * Usa o modelo procedural ProceduralTShirt (sem .glb) por padrão.
 * Quando o arquivo /public/models/tshirt.glb for adicionado,
 * basta trocar <ProceduralTShirt /> por <TShirtGLTF /> no JSX abaixo.
 *
 * Stack:
 *  • @react-three/fiber@8  — React renderer para Three.js (React 18 compat)
 *  • @react-three/drei@9   — helpers (OrbitControls, Environment, ContactShadows)
 *  • three                 — motor 3D
 */

import { useRef, useCallback, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Grid,
} from '@react-three/drei';
import ProceduralTShirt from './ProceduralTShirt';

// ─── Capturador de screenshot (injeta função global via ref do gl) ─────────────

function ScreenshotCapture({
  onCapture,
}: {
  onCapture: (blob: Blob) => void;
}) {
  const { gl } = useThree();

  useEffect(() => {
    const win = window as Window & { __studioCapture?: () => void };
    win.__studioCapture = () => {
      // gl.domElement é o <canvas> Three.js — toBlob funciona com preserveDrawingBuffer: true
      gl.domElement.toBlob(
        (blob) => {
          if (blob) onCapture(blob);
        },
        'image/webp',
        0.92,
      );
    };
    return () => {
      delete win.__studioCapture;
    };
  }, [gl, onCapture]);

  return null;
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface ThreeDMockupProps {
  onScreenshot?: (blob: Blob) => void;
}

export default function ThreeDMockup({ onScreenshot }: ThreeDMockupProps) {
  const handleCapture = useCallback(
    (blob: Blob) => {
      if (onScreenshot) {
        onScreenshot(blob);
      } else {
        // Download direto se nenhum handler externo for fornecido
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mockup-3d-${Date.now()}.webp`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5_000);
      }
    },
    [onScreenshot],
  );

  const triggerCapture = () => {
    (window as Window & { __studioCapture?: () => void }).__studioCapture?.();
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0e1014]">
      {/* ── Dica de interação ── */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 z-10
                   bg-black/60 backdrop-blur-sm text-[11px] text-gray-400
                   px-3 py-1.5 rounded-full pointer-events-none select-none
                   whitespace-nowrap"
      >
        🖱 Arraste para girar · Scroll para zoom
      </div>

      {/* ── Canvas Three.js ── */}
      <div className="flex-1">
        <Canvas
          gl={{
            preserveDrawingBuffer: true, // Necessário para toBlob()
            antialias: true,
            alpha: true,
            toneMapping: 2, // THREE.ACESFilmicToneMapping
            toneMappingExposure: 1.1,
          }}
          shadows
          camera={{ position: [0, 0.3, 4.5], fov: 42 }}
          style={{ background: 'transparent' }}
        >
          {/* ── Iluminação ── */}
          <ambientLight intensity={0.55} />
          <directionalLight
            position={[4, 8, 5]}
            intensity={1.4}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-4, 2, -4]} intensity={0.25} color="#b0c8ff" />
          <pointLight position={[0, -2, 3]} intensity={0.3} color="#fff8e0" />

          {/* ── Modelo procedural da camiseta ── */}
          {/*
            SWAP: quando tiver o .glb real, substitua por:
            <Suspense fallback={<ProceduralTShirt />}>
              <TShirtGLTF />
            </Suspense>
          */}
          <ProceduralTShirt />

          {/* ── Sombra de contato no chão ── */}
          <ContactShadows
            position={[0, -1.15, 0]}
            opacity={0.45}
            scale={4}
            blur={2.5}
            far={1.5}
          />

          {/* ── Ambiente HDRI (reflexos realistas) ── */}
          <Environment preset="studio" />

          {/* ── Controles orbitais ── */}
          <OrbitControls
            enablePan={false}
            minDistance={2.5}
            maxDistance={9}
            minPolarAngle={Math.PI / 8}
            maxPolarAngle={Math.PI - Math.PI / 8}
            enableDamping
            dampingFactor={0.07}
          />

          {/* ── Captura de screenshot ── */}
          <ScreenshotCapture onCapture={handleCapture} />
        </Canvas>
      </div>

      {/* ── Rodapé com botão de captura ── */}
      <div className="p-3 bg-[#1a1d24] border-t border-white/5 flex-shrink-0">
        <button
          onClick={triggerCapture}
          className="w-full flex items-center justify-center gap-2
                     bg-gradient-to-r from-orange-500 to-orange-600
                     hover:from-orange-400 hover:to-orange-500
                     text-white text-sm font-semibold py-2.5 px-4 rounded-lg
                     transition-all duration-200 active:scale-[0.97]
                     shadow-lg shadow-orange-500/20"
        >
          📸 Capturar Ângulo (.webp)
        </button>
      </div>
    </div>
  );
}
