'use client';

/**
 * StudioContext — Estado global e AÇÕES do Studio.
 *
 * Inclui:
 *  • Estado da parte ativa e texturas (sincronizadas ao Three.js)
 *  • activeObject: objeto Fabric.js atualmente selecionado
 *  • canvasObjects: lista de todos os objetos no canvas ativo (para o painel de camadas)
 *  • Ações de inserção: addText, addRect, addEllipse
 *  • Ações de cor: setObjectFill, setObjectStroke
 *  • Ações de camada: bringToFront, sendToBack, deleteActiveObject
 *  • Upload de imagem/SVG
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useEffect,
} from 'react';
import type { Canvas as FabricCanvas, FabricObject } from 'fabric';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CanvasPart = 'front' | 'back' | 'sleeve-right' | 'sleeve-left';

export const PARTS: { id: CanvasPart; label: string; icon: string }[] = [
  { id: 'front',         label: 'Frente',        icon: '👕' },
  { id: 'back',          label: 'Costas',         icon: '🔙' },
  { id: 'sleeve-right',  label: 'Manga Direita',  icon: '💪' },
  { id: 'sleeve-left',   label: 'Manga Esquerda', icon: '💪' },
];

export const PART_DIMENSIONS: Record<CanvasPart, { width: number; height: number }> = {
  front:          { width: 520, height: 640 },
  back:           { width: 520, height: 640 },
  'sleeve-right': { width: 220, height: 380 },
  'sleeve-left':  { width: 220, height: 380 },
};

export type TextureMap = Record<CanvasPart, string | null>;
export type ActiveTool = 
  | 'select' | 'shape' | 'crop' | 'bspline' 
  | 'text' | 'rect' | 'circle' | 'polygon' | 'star' | 'spiral' 
  | 'contour' | 'transparency' | 'eyedropper' | 'interactive_fill' 
  | 'upload';

/** Informações resumidas de um objeto no canvas (para o painel de camadas) */
export interface CanvasObjectInfo {
  id: string;
  type: string;
  label: string;
  fabricObject: FabricObject;
}

// ─── Interface do contexto ────────────────────────────────────────────────────

interface StudioContextValue {
  // Estado de parte / textura
  activePart:    CanvasPart;
  setActivePart: (p: CanvasPart) => void;
  textures:      TextureMap;
  updateTexture: (p: CanvasPart, dataUrl: string) => void;

  // Refs diretas dos canvas Fabric (registradas pelo FabricPartCanvas)
  canvasRefs: React.MutableRefObject<Partial<Record<CanvasPart, FabricCanvas>>>;

  // Cor base da camiseta 3D
  tshirtColor:    string;
  setTshirtColor: (c: string) => void;

  // Ferramenta ativa
  activeTool:    ActiveTool;
  setActiveTool: (t: ActiveTool) => void;

  // Objeto selecionado e lista de objetos do canvas
  activeObject:     FabricObject | null;
  setActiveObject:  (o: FabricObject | null) => void;
  canvasObjects:    CanvasObjectInfo[];
  setCanvasObjects: (objs: CanvasObjectInfo[]) => void;

  // Ações de inserção
  addText:    () => void;
  addRect:    () => void;
  addEllipse: () => void;
  addPolygon: () => void;
  addStar:    () => void;
  addSpiral:  () => void;

  // Ferramentas interativas (fase 1/2)
  triggerEyedropper: () => void;

  // Ações de cor e estilo (aplicadas ao objeto ativo)
  setObjectFill:   (color: string) => void;
  setObjectStroke: (color: string) => void;
  applyGradient:   (type: 'linear' | 'radial', color1: string, color2: string, angle?: number) => void;
  applyContour:    (width: number, color: string) => void;

  // Ações de camada
  bringToFront:        () => void;
  sendToBack:          () => void;
  deleteActiveObject:  () => void;
  renameObject:        (obj: FabricObject, newName: string) => void;

  // Drawer de Assets
  isAssetDrawerOpen:    boolean;
  setIsAssetDrawerOpen: (v: boolean) => void;

  // Upload
  uploadInputRef:   React.MutableRefObject<HTMLInputElement | null>;
  triggerUpload:    () => void;
  handleUploadFile: (file: File) => void;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [activePart, setActivePart]       = useState<CanvasPart>('front');
  const [tshirtColor, setTshirtColor]     = useState('#FFFFFF');
  const [activeTool, setActiveTool]       = useState<ActiveTool>('select');
  const [activeObject, setActiveObject]   = useState<FabricObject | null>(null);
  const [canvasObjects, setCanvasObjects] = useState<CanvasObjectInfo[]>([]);
  const [isAssetDrawerOpen, setIsAssetDrawerOpen] = useState(false);
  const [textures, setTextures]           = useState<TextureMap>({
    front: null, back: null, 'sleeve-right': null, 'sleeve-left': null,
  });

  const canvasRefs     = useRef<Partial<Record<CanvasPart, FabricCanvas>>>({});
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const activePartRef  = useRef<CanvasPart>(activePart);
  activePartRef.current = activePart;

  const updateTexture = useCallback((part: CanvasPart, dataUrl: string) => {
    setTextures(prev => ({ ...prev, [part]: dataUrl }));
  }, []);

  // ── Helper interno ─────────────────────────────────────────────────────────
  const getCanvas = useCallback((): FabricCanvas | null => {
    const c = canvasRefs.current[activePartRef.current] ?? null;
    if (!c) console.warn('[Studio] Canvas ainda não pronto para:', activePartRef.current);
    return c;
  }, []);

  // ── Gera label legível para o painel de camadas ────────────────────────────
  const makeLabel = (obj: FabricObject, index: number): string => {
    // Se o objeto tiver um nome customizado salvo
    if ((obj as any).name) return (obj as any).name;

    const type = obj.type ?? 'objeto';
    if (type === 'i-text' || type === 'text') {
      const t = (obj as { text?: string }).text ?? '';
      return `T: ${t.slice(0, 18)}${t.length > 18 ? '…' : ''}`;
    }
    if (type === 'rect')    return `▭ Retângulo ${index + 1}`;
    if (type === 'ellipse') return `○ Elipse ${index + 1}`;
    if (type === 'image')   return `🖼 Imagem ${index + 1}`;
    if (type === 'group')   return `⊞ Grupo ${index + 1}`;
    return `${type} ${index + 1}`;
  };

  /** Reconstrói a lista de objetos do canvas ativo */
  const refreshObjectList = useCallback(() => {
    const canvas = canvasRefs.current[activePartRef.current];
    if (!canvas) return;
    const objs = canvas.getObjects();
    setCanvasObjects(
      [...objs].reverse().map((o, i) => ({
        id:           (o as { __uid?: string }).__uid ?? `obj-${objs.length - 1 - i}`,
        type:         o.type ?? 'unknown',
        label:        makeLabel(o, objs.length - 1 - i),
        fabricObject: o,
      }))
    );
  }, []);

  // ── Inserção de objetos ────────────────────────────────────────────────────
  const addText = useCallback(async () => {
    console.log('[Studio] 🖱 Clicou em Texto (T)');
    const canvas = getCanvas();
    if (!canvas) return;
    const { IText } = await import('fabric');
    const dims = PART_DIMENSIONS[activePartRef.current];
    const obj  = new IText('NOVA ESTAMPA', {
      left: dims.width / 2 - 80, top: dims.height / 2 - 20,
      fontSize: 36, fill: '#FFFFFF',
      fontFamily: 'Inter, Arial, sans-serif',
      textAlign: 'center', fontWeight: 'bold',
    });
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    refreshObjectList();
    console.log('[Studio] ✅ Texto adicionado');
  }, [getCanvas, refreshObjectList]);

  const addRect = useCallback(async () => {
    console.log('[Studio] 🖱 Clicou em Retângulo (R)');
    const canvas = getCanvas();
    if (!canvas) return;
    const { Rect } = await import('fabric');
    const dims = PART_DIMENSIONS[activePartRef.current];
    const obj  = new Rect({
      left: dims.width / 2 - 60, top: dims.height / 2 - 40,
      width: 120, height: 80,
      fill: 'rgba(255,165,0,0.15)', stroke: '#FE7302', strokeWidth: 2, rx: 4,
    });
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    refreshObjectList();
    console.log('[Studio] ✅ Retângulo adicionado');
  }, [getCanvas, refreshObjectList]);

  const addEllipse = useCallback(async () => {
    console.log('[Studio] 🖱 Clicou em Elipse (E)');
    const canvas = getCanvas();
    if (!canvas) return;
    const { Ellipse } = await import('fabric');
    const dims = PART_DIMENSIONS[activePartRef.current];
    const obj  = new Ellipse({
      left: dims.width / 2 - 55, top: dims.height / 2 - 40,
      rx: 55, ry: 40,
      fill: 'rgba(255,165,0,0.15)', stroke: '#FE7302', strokeWidth: 2,
    });
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    refreshObjectList();
    console.log('[Studio] ✅ Elipse adicionada');
  }, [getCanvas, refreshObjectList]);

  const addPolygon = useCallback(async () => {
    console.log('[Studio] 🖱 Clicou em Polígono');
    const canvas = getCanvas();
    if (!canvas) return;
    const { Polygon } = await import('fabric');
    const dims = PART_DIMENSIONS[activePartRef.current];
    // Cria um hexágono
    const radius = 50;
    const points = [];
    for (let i = 0; i < 6; i++) {
      points.push({
        x: radius * Math.cos((i * Math.PI) / 3),
        y: radius * Math.sin((i * Math.PI) / 3)
      });
    }
    const obj = new Polygon(points, {
      left: dims.width / 2 - radius, top: dims.height / 2 - radius,
      fill: 'rgba(30,136,229,0.15)', stroke: '#1E88E5', strokeWidth: 2,
    });
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    refreshObjectList();
    console.log('[Studio] ✅ Polígono adicionado');
  }, [getCanvas, refreshObjectList]);

  const addStar = useCallback(async () => {
    console.log('[Studio] 🖱 Clicou em Estrela');
    const canvas = getCanvas();
    if (!canvas) return;
    const { Polygon } = await import('fabric');
    const dims = PART_DIMENSIONS[activePartRef.current];
    
    // Gerador de pontos para uma estrela de 5 pontas
    const points = [];
    const outerRadius = 50;
    const innerRadius = 20;
    const numPoints = 5;
    for (let i = 0; i < numPoints * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / numPoints - Math.PI / 2;
      points.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle)
      });
    }
    const obj = new Polygon(points, {
      left: dims.width / 2 - outerRadius, top: dims.height / 2 - outerRadius,
      fill: 'rgba(255,179,0,0.15)', stroke: '#FFB300', strokeWidth: 2,
    });
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    refreshObjectList();
    console.log('[Studio] ✅ Estrela adicionada');
  }, [getCanvas, refreshObjectList]);

  const addSpiral = useCallback(async () => {
    console.log('[Studio] 🖱 Clicou em Espiral');
    const canvas = getCanvas();
    if (!canvas) return;
    const { Path } = await import('fabric');
    const dims = PART_DIMENSIONS[activePartRef.current];
    
    // Gera path data (SVG) para uma espiral de Arquimedes
    const cx = 0, cy = 0;
    const coils = 3;
    const radius = 50;
    const numPoints = 100;
    let pathData = `M ${cx} ${cy}`;
    const a = radius / (2 * Math.PI * coils);
    for (let i = 1; i <= numPoints; i++) {
      const theta = (i / numPoints) * (2 * Math.PI * coils);
      const r = a * theta;
      pathData += ` L ${cx + r * Math.cos(theta)} ${cy + r * Math.sin(theta)}`;
    }
    
    const obj = new Path(pathData, {
      left: dims.width / 2 - radius, top: dims.height / 2 - radius,
      fill: 'transparent', stroke: '#8E24AA', strokeWidth: 2,
    });
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    refreshObjectList();
    console.log('[Studio] ✅ Espiral adicionada');
  }, [getCanvas, refreshObjectList]);

  // ── Cor do objeto ativo ────────────────────────────────────────────────────
  const setObjectFill = useCallback((color: string) => {
    const canvas = getCanvas();
    const obj    = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    obj.set('fill', color);
    canvas.requestRenderAll();
  }, [getCanvas]);

  const setObjectStroke = useCallback((color: string) => {
    const canvas = getCanvas();
    const obj    = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    obj.set('stroke', color);
    canvas.requestRenderAll();
  }, [getCanvas]);

  // ── Camadas ────────────────────────────────────────────────────────────────
  const bringToFront = useCallback(() => {
    const canvas = getCanvas();
    const obj    = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    canvas.bringObjectToFront(obj);
    canvas.requestRenderAll();
    refreshObjectList();
  }, [getCanvas, refreshObjectList]);

  const sendToBack = useCallback(() => {
    const canvas = getCanvas();
    const obj    = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    canvas.sendObjectToBack(obj);
    canvas.requestRenderAll();
    refreshObjectList();
  }, [getCanvas, refreshObjectList]);

  const deleteActiveObject = useCallback(() => {
    const canvas = getCanvas();
    const obj    = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    
    // Se for um ActiveSelection (vários objetos), precisamos iterar e remover um por um
    if (obj.type === 'activeSelection') {
      const objects = (obj as any)._objects;
      if (objects) {
        objects.forEach((o: any) => canvas.remove(o));
      }
    } else {
      canvas.remove(obj);
    }
    
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    canvas.requestRenderAll();
    refreshObjectList();
  }, [getCanvas, refreshObjectList]);

  const applyGradient = useCallback(async (type: 'linear' | 'radial', color1: string, color2: string, angle = 0) => {
    const canvas = getCanvas();
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;

    const { Gradient } = await import('fabric');
    
    // Dimensões relativas do objeto (0 a 1 em modo percentage, mas usaremos pixels padrão)
    const w = obj.width ?? 100;
    const h = obj.height ?? 100;
    
    let coords;
    if (type === 'linear') {
      // Coords básicos simplificados (diagonal)
      coords = { x1: 0, y1: 0, x2: w, y2: h };
    } else {
      // Radial (centro para borda)
      coords = { x1: w/2, y1: h/2, x2: w/2, y2: h/2, r1: 0, r2: Math.max(w, h)/2 };
    }

    const gradient = new Gradient({
      type,
      coords,
      colorStops: [
        { offset: 0, color: color1 },
        { offset: 1, color: color2 }
      ]
    });
    
    obj.set('fill', gradient);
    canvas.requestRenderAll();
  }, [getCanvas]);

  const applyContour = useCallback((width: number, color: string) => {
    const canvas = getCanvas();
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    
    obj.set({
      stroke: color,
      strokeWidth: width,
      strokeUniform: true,
      paintFirst: 'stroke',
    });
    canvas.requestRenderAll();
  }, [getCanvas]);

  const renameObject = useCallback((obj: FabricObject, newName: string) => {
    obj.set('name', newName);
    refreshObjectList();
  }, [refreshObjectList]);

  const triggerEyedropper = useCallback(async () => {
    console.log('[Studio] 🖱 Clicou no Conta-gotas');
    if (!('EyeDropper' in window)) {
      alert('Seu navegador não suporta o Conta-gotas (EyeDropper API). Tente usar o Chrome ou Edge Desktop.');
      return;
    }
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      
      const canvas = getCanvas();
      const obj = canvas?.getActiveObject();
      if (obj) {
        setObjectFill(result.sRGBHex);
        console.log('[Studio] ✅ Cor aplicada ao objeto selecionado:', result.sRGBHex);
      } else {
        console.log('[Studio] ℹ️ Cor lida:', result.sRGBHex, '(nenhum objeto selecionado para aplicar)');
      }
    } catch (err) {
      console.log('[Studio] Conta-gotas cancelado ou falhou', err);
    }
  }, [getCanvas, setObjectFill]);

  // ── Upload / Assets ────────────────────────────────────────────────────────
  const triggerUpload = useCallback(() => {
    console.log('[Studio] 🖱 Abrindo gaveta de assets');
    setIsAssetDrawerOpen(true);
    // Não abrimos o input de arquivo direto aqui mais
  }, []);

  const handleUploadFile = useCallback(async (file: File) => {
    console.log('[Studio] 📁 Arquivo selecionado:', file.name, file.type);
    const canvas = getCanvas();
    if (!canvas) return;
    const isSvg = file.type === 'image/svg+xml';
    const url   = URL.createObjectURL(file);
    const dims  = PART_DIMENSIONS[activePartRef.current];

    if (isSvg) {
      const { loadSVGFromURL, util } = await import('fabric');
      const { objects, options }     = await loadSVGFromURL(url);
      const group = util.groupSVGElements(objects as Parameters<typeof util.groupSVGElements>[0], options);
      const scale = Math.min(
        (dims.width * 0.6) / (group.width ?? 1),
        (dims.height * 0.6) / (group.height ?? 1)
      );
      group.scale(scale);
      group.set({ left: dims.width / 2, top: dims.height / 2, originX: 'center', originY: 'center' });
      canvas.add(group);
      canvas.setActiveObject(group);
    } else {
      const { FabricImage } = await import('fabric');
      const img   = await FabricImage.fromURL(url);
      const scale = Math.min(
        (dims.width * 0.6) / (img.width ?? 1),
        (dims.height * 0.6) / (img.height ?? 1)
      );
      img.scale(scale);
      img.set({ left: dims.width / 2, top: dims.height / 2, originX: 'center', originY: 'center' });
      canvas.add(img);
      canvas.setActiveObject(img);
    }

    canvas.requestRenderAll();
    // Fechar a gaveta após inserir no canvas
    setIsAssetDrawerOpen(false);
    refreshObjectList();
    console.log('[Studio] ✅ Arquivo importado');
  }, [getCanvas, refreshObjectList]);

  // ── Atalhos de Teclado ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se estiver digitando num input/textarea (ex: editando texto no canvas ou painel)
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault(); // Evita voltar a página no browser em alguns casos
        deleteActiveObject();
        return;
      }

      // Atalhos de Ferramentas
      const key = e.key.toUpperCase();
      switch (key) {
        case 'V': setActiveTool('select'); break;
        case 'T': setActiveTool('text'); addText(); break;
        case 'R': setActiveTool('rect'); addRect(); break;
        case 'E': setActiveTool('circle'); addEllipse(); break;
        case 'Y': setActiveTool('polygon'); addPolygon(); break;
        case 'S': setActiveTool('star'); addStar(); break;
        case 'A': setActiveTool('spiral'); addSpiral(); break;
        case 'U': setActiveTool('upload'); triggerUpload(); break;
        case 'I': setActiveTool('eyedropper'); triggerEyedropper(); break;
        
        // Fase 2 e 3 placeholders
        case 'F10': e.preventDefault(); setActiveTool('shape'); break;
        case 'C': setActiveTool('crop'); break;
        case 'B': setActiveTool('bspline'); break;
        case 'O': setActiveTool('contour'); break;
        case 'X': setActiveTool('transparency'); break;
        case 'G': setActiveTool('interactive_fill'); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteActiveObject, setActiveTool, addText, addRect, addEllipse, addPolygon, addStar, addSpiral, triggerUpload, triggerEyedropper]);

  return (
    <StudioContext.Provider value={{
      activePart, setActivePart,
      textures, updateTexture,
      canvasRefs,
      tshirtColor, setTshirtColor,
      activeTool, setActiveTool,
      activeObject, setActiveObject,
      canvasObjects, setCanvasObjects,
      addText, addRect, addEllipse, addPolygon, addStar, addSpiral,
      triggerEyedropper,
      setObjectFill, setObjectStroke, applyGradient, applyContour,
      bringToFront, sendToBack, deleteActiveObject, renameObject,
      isAssetDrawerOpen, setIsAssetDrawerOpen,
      uploadInputRef, triggerUpload, handleUploadFile,
    }}>
      {children}
      {/* Input de arquivo oculto */}
      <input
        type="file"
        ref={uploadInputRef}
        accept=".svg,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleUploadFile(file);
          e.target.value = '';
        }}
      />
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio deve ser usado dentro de <StudioProvider>');
  return ctx;
}
