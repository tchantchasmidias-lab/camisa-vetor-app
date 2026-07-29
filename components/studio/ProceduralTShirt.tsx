'use client';

/**
 * ProceduralTShirt — Camiseta 3D construída com geometrias Three.js puras.
 *
 * Não requer arquivo .glb. Usa BoxGeometry + PlaneGeometry para montar:
 *  • Corpo principal (frente + costas texturizadas)
 *  • Manga direita (texturizada)
 *  • Manga esquerda (texturizada)
 *  • Gola arredondada (TorusGeometry cortado)
 *
 * As texturas do Fabric.js são aplicadas em tempo real via StudioContext.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStudio, type CanvasPart } from './StudioContext';

// ─── Hook: cria THREE.Texture a partir de um data URL ─────────────────────────

function useDataUrlTexture(dataUrl: string | null): THREE.Texture | null {
  const texRef = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    if (!dataUrl) return;

    if (!texRef.current) {
      texRef.current = new THREE.Texture();
      texRef.current.colorSpace = THREE.SRGBColorSpace;
      texRef.current.flipY = true; // PlaneGeometry usa Y normal (diferente do GLTF)
    }

    const img = new window.Image();
    img.onload = () => {
      texRef.current!.image = img;
      texRef.current!.needsUpdate = true;
    };
    img.src = dataUrl;
  }, [dataUrl]);

  return texRef.current;
}

// ─── Constantes de dimensão da camiseta ──────────────────────────────────────

const T = {
  // Corpo
  bodyW:   1.30,
  bodyH:   1.70,
  bodyD:   0.10,

  // Manga
  sleeveW: 0.72,
  sleeveH: 0.32,
  sleeveD: 0.08,

  // Ângulo das mangas (em radianos)
  sleeveAngle: Math.PI / 7.5, // ~24°

  // Gola
  collarRx:    0.26,
  collarRy:    0.18,
  collarD:     0.10,

  // Bainhas/bordas visuais
  hemH:        0.06,
};

// ─── Sub-componente: Plano de textura (sem SSR) ────────────────────────────────

function TexturedFace({
  texture,
  width,
  height,
  position,
  rotation,
}: {
  texture: THREE.Texture | null;
  width: number;
  height: number;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  if (!texture) return null;
  return (
    <mesh position={position} rotation={rotation ?? [0, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        map={texture}
        transparent
        alphaTest={0.01}
        roughness={0.85}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Material base da camiseta (cor sólida + aspecto de tecido) ───────────────

function useTshirtMaterial(color: string) {
  return useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.85,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
    return mat;
  }, [color]);
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ProceduralTShirt() {
  const { textures, tshirtColor } = useStudio();
  const groupRef = useRef<THREE.Group>(null);

  // Texturas de cada parte
  const frontTex     = useDataUrlTexture(textures['front']);
  const backTex      = useDataUrlTexture(textures['back']);
  const sleeveRTex   = useDataUrlTexture(textures['sleeve-right']);
  const sleeveLTex   = useDataUrlTexture(textures['sleeve-left']);

  // Material base (cor da camiseta)
  const baseMat      = useTshirtMaterial(tshirtColor);
  const sleeveMatR   = useTshirtMaterial(tshirtColor);
  const sleeveMatL   = useTshirtMaterial(tshirtColor);
  const collarMat    = useTshirtMaterial(tshirtColor);
  const hemMat       = useTshirtMaterial(tshirtColor);

  // Animação suave de flutuação (como objeto exposto num display)
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 0.6) * 0.04 - 0.1;
    groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.08;
  });

  // ── Posições e rotações das mangas ─────────────────────────────────────────
  // Manga direita: parte superior direita do corpo, angulada para cima
  const sleeveRX = (T.bodyW / 2) + (T.sleeveW / 2) * Math.cos(T.sleeveAngle);
  const sleeveRY = (T.bodyH / 2) - T.sleeveH * 0.6 + (T.sleeveW / 2) * Math.sin(T.sleeveAngle);

  // Manga esquerda: espelho da direita
  const sleeveLX = -sleeveRX;
  const sleeveLY = sleeveRY;

  return (
    <group ref={groupRef}>

      {/* ══ CORPO PRINCIPAL ══════════════════════════════════════════════════ */}
      <mesh material={baseMat} castShadow receiveShadow>
        <boxGeometry args={[T.bodyW, T.bodyH, T.bodyD]} />
      </mesh>

      {/* Textura FRENTE — sobreposta à face dianteira */}
      <TexturedFace
        texture={frontTex}
        width={T.bodyW}
        height={T.bodyH}
        position={[0, 0, T.bodyD / 2 + 0.002]}
      />

      {/* Textura COSTAS — sobreposta à face traseira */}
      <TexturedFace
        texture={backTex}
        width={T.bodyW}
        height={T.bodyH}
        position={[0, 0, -(T.bodyD / 2 + 0.002)]}
        rotation={[0, Math.PI, 0]}
      />

      {/* ══ BAINHA INFERIOR ══════════════════════════════════════════════════ */}
      <mesh
        material={hemMat}
        position={[0, -(T.bodyH / 2) - T.hemH / 2, 0]}
      >
        <boxGeometry args={[T.bodyW, T.hemH, T.bodyD * 1.02]} />
      </mesh>

      {/* ══ MANGA DIREITA ════════════════════════════════════════════════════ */}
      <group
        position={[sleeveRX, sleeveRY, 0]}
        rotation={[0, 0, T.sleeveAngle]}
      >
        <mesh material={sleeveMatR} castShadow>
          <boxGeometry args={[T.sleeveW, T.sleeveH, T.sleeveD]} />
        </mesh>

        {/* Textura na face da frente da manga direita */}
        <TexturedFace
          texture={sleeveRTex}
          width={T.sleeveW}
          height={T.sleeveH}
          position={[0, 0, T.sleeveD / 2 + 0.002]}
        />
      </group>

      {/* ══ MANGA ESQUERDA ═══════════════════════════════════════════════════ */}
      <group
        position={[sleeveLX, sleeveLY, 0]}
        rotation={[0, 0, -T.sleeveAngle]}
      >
        <mesh material={sleeveMatL} castShadow>
          <boxGeometry args={[T.sleeveW, T.sleeveH, T.sleeveD]} />
        </mesh>

        {/* Textura na face da frente da manga esquerda */}
        <TexturedFace
          texture={sleeveLTex}
          width={T.sleeveW}
          height={T.sleeveH}
          position={[0, 0, T.sleeveD / 2 + 0.002]}
        />
      </group>

      {/* ══ GOLA (elipse achatada) ════════════════════════════════════════════ */}
      <mesh
        material={collarMat}
        position={[0, T.bodyH / 2 - 0.06, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        {/*
          TorusGeometry:
            radius, tube, radialSegments, tubularSegments, arc
          Usamos apenas meia-elipse (arc = π) para simular a abertura da gola
        */}
        <torusGeometry args={[T.collarRx, 0.035, 12, 28, Math.PI]} />
      </mesh>

      {/* ══ LABEL PLACEHOLDER ════════════════════════════════════════════════ */}
      {/* Removido após adicionar tshirt.glb real */}
    </group>
  );
}
