'use client';

/**
 * FabricPartCanvas — Canvas Fabric.js para UMA parte da camiseta.
 *
 * Responsabilidades:
 *  1. Inicializar fabric.Canvas sobre o elemento <canvas> (com SSR-safe import)
 *  2. Registrar a instância em canvasRefs[part] do StudioContext
 *     → isso permite que addText/addRect/etc. do contexto acessem o canvas
 *  3. Sincronizar textura ao Three.js (via updateTexture) a cada modificação
 *  4. Expor handle imperativo para exportação em alta resolução
 *
 * IMPORTANTE: Este componente deve ser importado com dynamic({ ssr: false }).
 */

import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import { useStudio, type CanvasPart, PART_DIMENSIONS } from './StudioContext';
import type { FabricObject } from 'fabric';
import { enableCropTool, enableBSplineTool, enableShapeTool } from './tools/ToolInteractions';

// ─── Handle exposto via ref ───────────────────────────────────────────────────

export interface FabricPartCanvasHandle {
  exportHighRes: (format?: 'png' | 'jpeg') => string;
  clear: () => void;
  toJSON: () => object;
  loadFromJSON: (json: object) => Promise<void>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FabricPartCanvasProps {
  part: CanvasPart;
  onReady?: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

const FabricPartCanvas = forwardRef<FabricPartCanvasHandle, FabricPartCanvasProps>(
  ({ part, onReady }, ref) => {
    const canvasElRef  = useRef<HTMLCanvasElement>(null);
    const fabricRef    = useRef<import('fabric').Canvas | null>(null);
    const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { updateTexture, canvasRefs, setActiveObject, setCanvasObjects, activeTool, setActiveTool } = useStudio();

    // ── Sincroniza canvas → textura Three.js (debounced) ───────────────────
    const syncTexture = useCallback(() => {
      const fc = fabricRef.current;
      if (!fc) return;
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        try {
          const dataUrl = fc.toDataURL({
            format:             'png',
            multiplier:         2,
            enableRetinaScaling: true,
          });
          updateTexture(part, dataUrl);
        } catch (err) {
          console.warn('[FabricPartCanvas] Erro ao sincronizar textura:', err);
        }
      }, 100);
    }, [part, updateTexture]);

    // ── Inicialização ───────────────────────────────────────────────────────
    useEffect(() => {
      if (!canvasElRef.current) {
        console.error('[FabricPartCanvas] Elemento <canvas> não encontrado!');
        return;
      }
      if (fabricRef.current) return; // Já inicializado

      const dims = PART_DIMENSIONS[part];
      console.log(`[FabricPartCanvas] Inicializando canvas "${part}" (${dims.width}×${dims.height})`);

      import('fabric').then(({ Canvas }) => {
        if (!canvasElRef.current) return; // Componente pode ter desmontado

        const canvas = new Canvas(canvasElRef.current, {
          width:                  dims.width,
          height:                 dims.height,
          backgroundColor:        undefined,   // Fundo transparente
          selection:              true,
          preserveObjectStacking: true,
          enablePointerEvents:    true,
        });

        fabricRef.current      = canvas;
        // ★ REGISTRO CRÍTICO: torna o canvas acessível às ações do contexto
        canvasRefs.current[part] = canvas;

        console.log(`[FabricPartCanvas] ✅ Canvas "${part}" pronto e registrado no contexto`);

        // Eventos de seleção → atualiza o objeto ativo no contexto
        canvas.on('selection:created', (e) => {
          setActiveObject((e.selected?.[0] ?? null) as FabricObject | null);
        });
        canvas.on('selection:updated', (e) => {
          setActiveObject((e.selected?.[0] ?? null) as FabricObject | null);
        });
        canvas.on('selection:cleared', () => {
          setActiveObject(null);
        });

        // Reconstrói a lista de camadas após qualquer mutação
        const refreshList = () => {
          const objs = canvas.getObjects();
          setCanvasObjects(
            [...objs].reverse().map((o, i) => {
              const type  = o.type ?? 'objeto';
              const index = objs.length - 1 - i;
              let label   = `${type} ${index + 1}`;
              if (type === 'i-text' || type === 'text') {
                const t = (o as { text?: string }).text ?? '';
                label = `T: ${t.slice(0, 18)}${t.length > 18 ? '…' : ''}`;
              } else if (type === 'rect')    label = `▭ Retângulo ${index + 1}`;
              else if (type === 'ellipse')  label = `○ Elipse ${index + 1}`;
              else if (type === 'image')    label = `🖼 Imagem ${index + 1}`;
              else if (type === 'group')    label = `⊞ Grupo ${index + 1}`;
              return { id: `obj-${index}`, type, label, fabricObject: o };
            })
          );
        };

        canvas.on('object:added',   refreshList);
        canvas.on('object:removed', refreshList);

        // Eventos que disparam sincronização de textura
        const SYNC_EVENTS = [
          'object:added', 'object:modified', 'object:removed',
          'object:scaled', 'object:rotated', 'object:moved',
          'path:created', 'text:changed', 'erasing:end',
        ] as const;

        SYNC_EVENTS.forEach(ev => canvas.on(ev, syncTexture));

        // Primeira sincronização (canvas vazio = transparente)
        syncTexture();
        onReady?.();
      }).catch(err => {
        console.error('[FabricPartCanvas] Falha ao carregar Fabric.js:', err);
      });

      return () => {
        console.log(`[FabricPartCanvas] Desmontando canvas "${part}"`);
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        delete canvasRefs.current[part];
        fabricRef.current?.dispose();
        fabricRef.current = null;
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [part]);

    // ── Gerenciamento de Ferramentas Ativas (Fase 3) ───────────────────────
    useEffect(() => {
      const canvas = canvasRefs.current[part];
      if (!canvas) return;

      let cleanupFn: (() => void) | void;

      const setupTool = async () => {
        if (activeTool === 'crop') {
          cleanupFn = await enableCropTool(canvas, () => setActiveTool('select'));
        } else if (activeTool === 'bspline') {
          cleanupFn = await enableBSplineTool(canvas, () => setActiveTool('select'));
        } else if (activeTool === 'shape') {
          cleanupFn = await enableShapeTool(canvas, () => setActiveTool('select'));
        }
      };

      setupTool();

      return () => {
        if (cleanupFn) cleanupFn();
      };
    }, [activeTool, part, canvasRefs, setActiveTool]);

    // ── Handle imperativo para exportação ──────────────────────────────────
    useImperativeHandle(ref, () => ({
      exportHighRes: (format = 'png') =>
        fabricRef.current?.toDataURL({
          format,
          multiplier:          4,
          enableRetinaScaling: true,
        }) ?? '',
      clear: () => {
        fabricRef.current?.clear();
        syncTexture();
      },
      toJSON:       () => fabricRef.current?.toJSON() ?? {},
      loadFromJSON: async (json: object) => {
        const fc = fabricRef.current;
        if (!fc) return;
        await fc.loadFromJSON(json);
        fc.requestRenderAll();
        syncTexture();
      },
    }));

    const dims = PART_DIMENSIONS[part];

    return (
      // Grade xadrez indica transparência do fundo
      <div
        className="rounded-xl overflow-hidden shadow-2xl shadow-black/40"
        style={{
          width:  dims.width,
          height: dims.height,
          backgroundImage: `
            linear-gradient(45deg, #2a2d36 25%, transparent 25%),
            linear-gradient(-45deg, #2a2d36 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #2a2d36 75%),
            linear-gradient(-45deg, transparent 75%, #2a2d36 75%)
          `,
          backgroundSize:     '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          // pointer-events:auto garante que o canvas recebe eventos do mouse
          pointerEvents: 'auto',
        }}
      >
        <canvas ref={canvasElRef} />
      </div>
    );
  }
);

FabricPartCanvas.displayName = 'FabricPartCanvas';
export default FabricPartCanvas;
