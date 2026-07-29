'use client';

/**
 * VerticalToolbox — Barra de ferramentas estilo CorelDRAW.
 *
 * Cada botão:
 *  1. Chama console.log('[Studio] Clicou em <Ferramenta>')
 *  2. Atualiza activeTool no contexto (feedback visual imediato)
 *  3. Chama a ação correspondente no canvas Fabric.js ativo
 *
 * Garantias de pointer-events:
 *  - O aside tem z-index explícito para garantir que está acima de qualquer overlay
 *  - Nenhum elemento filho tem pointer-events:none exceto os spans de tooltip
 */

import { useStudio, type ActiveTool } from './StudioContext';

// ─── Mapeamento ferramenta → ação ─────────────────────────────────────────────

type ToolDef = {
  id: ActiveTool;
  label: string;
  shortcut: string;
  svg: React.ReactNode;
};

const TOOLS: ToolDef[] = [
  // ── Manipulação ──
  {
    id: 'select', label: 'Selecionar', shortcut: 'V',
    svg: <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]"><path d="M3.5 1.5l13 7.5-6.5 1.8-2.8 6.7L3.5 1.5z" /></svg>,
  },
  {
    id: 'shape', label: 'Forma (Nós)', shortcut: 'F10',
    svg: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]"><path d="M5 5l5-2 5 2v10l-5 2-5-2V5z" /><circle cx="5" cy="5" r="1.5" fill="currentColor"/><circle cx="15" cy="5" r="1.5" fill="currentColor"/><circle cx="10" cy="17" r="1.5" fill="currentColor"/></svg>,
  },
  {
    id: 'crop', label: 'Cortar', shortcut: 'C',
    svg: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]"><path d="M4 4h10v10H4zM14 4h4M4 14v4M14 14h4M14 14v4" /></svg>,
  },
  {
    id: 'bspline', label: 'B-Spline', shortcut: 'B',
    svg: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]"><path d="M3 15c4-8 10-8 14 0" /><circle cx="3" cy="15" r="1" fill="currentColor"/><circle cx="10" cy="7" r="1" fill="currentColor"/><circle cx="17" cy="15" r="1" fill="currentColor"/></svg>,
  },
  
  // ── Formas & Desenho ──
  {
    id: 'text', label: 'Texto', shortcut: 'T',
    svg: <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]"><path d="M2 4h16v2.5h-6.5V16h-3V6.5H2V4z" /></svg>,
  },
  {
    id: 'rect', label: 'Retângulo', shortcut: 'R',
    svg: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]"><rect x="3" y="5" width="14" height="10" rx="1" /></svg>,
  },
  {
    id: 'circle', label: 'Elipse', shortcut: 'E',
    svg: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]"><ellipse cx="10" cy="10" rx="7" ry="5" /></svg>,
  },
  {
    id: 'polygon', label: 'Polígono', shortcut: 'Y',
    svg: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]"><path d="M10 2l6.93 4v8L10 18l-6.93-4V6L10 2z" /></svg>,
  },
  {
    id: 'star', label: 'Estrela', shortcut: 'S',
    svg: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]"><path d="M10 2l2.4 5.3 5.6.6-4.2 3.8 1.2 5.3-4.8-2.8-4.8 2.8 1.2-5.3-4.2-3.8 5.6-.6L10 2z" /></svg>,
  },
  {
    id: 'spiral', label: 'Espiral', shortcut: 'A',
    svg: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]"><path d="M10 10c-1.5 0-3-1-3-3s2-4 5-3 5 4 4 7-4 6-7 5-6-4-5-8 3-7 7-6" /></svg>,
  },

  // ── Efeitos & Cores ──
  {
    id: 'contour', label: 'Contorno', shortcut: 'O',
    svg: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]"><rect x="6" y="6" width="8" height="8" rx="1"/><rect x="3" y="3" width="14" height="14" rx="2" strokeDasharray="2 2"/></svg>,
  },
  {
    id: 'transparency', label: 'Transparência', shortcut: 'X',
    svg: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]"><rect x="4" y="4" width="12" height="12" rx="1"/><path d="M4 16L16 4" strokeDasharray="2 2"/></svg>,
  },
  {
    id: 'eyedropper', label: 'Conta-gotas', shortcut: 'I',
    svg: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]"><path d="M13 7l-6 6M16 4L13.5 6.5 12 5l-8 8v3h3l8-8-1.5-1.5L16 4z" /></svg>,
  },
  {
    id: 'interactive_fill', label: 'Preenchimento Interativo', shortcut: 'G',
    svg: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[18px] h-[18px]"><rect x="4" y="4" width="12" height="12" rx="1"/><path d="M4 10h12" /><circle cx="4" cy="10" r="1.5" fill="currentColor"/><circle cx="16" cy="10" r="1.5" fill="currentColor"/></svg>,
  },
];

// Upload separado dos demais (tem divisor antes)
const UPLOAD_TOOL: ToolDef = {
  id: 'upload',
  label: 'Importar SVG/PNG',
  shortcut: 'U',
  svg: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]">
      <path d="M10 2.5l4.5 4.5H11.5v5.5h-3V7H5.5L10 2.5z" />
      <path d="M3 14.5h14V17H3v-2.5z" />
    </svg>
  ),
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function VerticalToolbox() {
  const {
    activeTool, setActiveTool,
    addText, addRect, addEllipse, addPolygon, addStar, addSpiral,
    triggerUpload, triggerEyedropper,
  } = useStudio();

  /**
   * Despacha a ação correta para cada ferramenta.
   * console.log garante que o clique está chegando ao JS.
   */
  const handleClick = (tool: ActiveTool) => {
    console.log(`[Studio] 🖱 Clicou no botão: "${tool}"`);
    setActiveTool(tool);

    switch (tool) {
      case 'text':       addText(); break;
      case 'rect':       addRect(); break;
      case 'circle':     addEllipse(); break;
      case 'polygon':    addPolygon(); break;
      case 'star':       addStar(); break;
      case 'spiral':     addSpiral(); break;
      case 'upload':     triggerUpload(); break;
      case 'eyedropper': triggerEyedropper(); break;
      case 'select':
        console.log('[Studio] Modo seleção ativado');
        break;
      // As ferramentas abaixo ainda não têm ação imperativa direta no Context (exceto a mudança de state activeTool)
      // O FabricPartCanvas vai reagir ao activeTool via useEffect
      case 'shape':
      case 'crop':
      case 'bspline':
        console.log(`[Studio] Ferramenta Interativa ativada: ${tool}`);
        break;

      case 'contour':
      case 'transparency':
      case 'interactive_fill':
        console.log(`[Studio] 🚧 Ferramenta "${tool}" acessível pelos painéis laterais`);
        break;
    }
  };

  const renderButton = (tool: ToolDef) => {
    const isActive = activeTool === tool.id;

    return (
      <button
        key={tool.id}
        // onClick com handler direto — sem wrappers que possam bloquear o evento
        onClick={() => handleClick(tool.id)}
        title={`${tool.label} (${tool.shortcut})`}
        // pointer-events:auto explícito para garantir clicabilidade
        style={{ pointerEvents: 'auto' }}
        className={`
          relative group flex items-center justify-center
          w-9 h-9 rounded-lg cursor-pointer
          transition-all duration-150 select-none
          ${isActive
            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40'
            : 'text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/20'
          }
        `}
      >
        {/* Ícone da ferramenta */}
        {tool.svg}

        {/* Indicador laranja na borda esquerda quando ativo */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2
                           w-0.5 h-5 bg-orange-300 rounded-r-full" />
        )}

        {/* Tooltip flutuante à direita — pointer-events:none para não bloquear */}
        <span
          style={{ pointerEvents: 'none' }}
          className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg
                     bg-[#2a2d36] text-white text-[11px] font-medium
                     whitespace-nowrap z-[9999]
                     border border-white/10 shadow-2xl
                     opacity-0 group-hover:opacity-100
                     translate-x-1 group-hover:translate-x-0
                     transition-all duration-150"
        >
          {tool.label}
          <span className="ml-2 text-gray-500 font-mono text-[10px]">
            [{tool.shortcut}]
          </span>
        </span>
      </button>
    );
  };

  return (
    <aside
      // z-index 30 garante que fica acima de qualquer overlay do canvas
      // Usa overflow-y-auto e no-scrollbar para ferramentas caberem em telas pequenas
      className="flex flex-col items-center py-3 gap-1.5 w-12 flex-shrink-0
                 bg-[#1e2128] border-r border-white/[0.06] overflow-y-auto no-scrollbar"
      style={{ zIndex: 30, position: 'relative' }}
    >
      {/* Ferramentas principais mapeadas */}
      {TOOLS.map(t => renderButton(t))}

      {/* Separador antes do Upload */}
      <div className="w-8 h-px bg-white/10 my-1" />

      {/* Upload */}
      {renderButton(UPLOAD_TOOL)}
    </aside>
  );
}
