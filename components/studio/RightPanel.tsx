'use client';

/**
 * RightPanel — Painel lateral direito do Studio.
 *
 * Seções:
 *  1. Cor do Objeto — aplica fill/stroke ao objeto Fabric.js ativo
 *  2. Cor da Camiseta — altera a cor base do modelo 3D
 *  3. Camadas — lista de objetos no canvas com ações de ordem e exclusão
 */

import { useState, useRef, useEffect } from 'react';
import { useStudio } from './StudioContext';
import { Edit2 } from 'lucide-react';

// ─── Paleta de cores pré-definidas ────────────────────────────────────────────

const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#FE7302', '#E53935',
  '#8E24AA', '#1E88E5', '#00ACC1', '#43A047',
  '#FFB300', '#6D4C41', '#546E7A', '#F06292',
];

const TSHIRT_COLORS = [
  { hex: '#FFFFFF', label: 'Branco' },
  { hex: '#1a1a1a', label: 'Preto' },
  { hex: '#2563EB', label: 'Azul' },
  { hex: '#DC2626', label: 'Vermelho' },
  { hex: '#16A34A', label: 'Verde' },
  { hex: '#D97706', label: 'Âmbar' },
  { hex: '#7C3AED', label: 'Roxo' },
  { hex: '#0891B2', label: 'Ciano' },
  { hex: '#BE185D', label: 'Rosa' },
  { hex: '#374151', label: 'Cinza' },
];

// ─── Sub-componente: Título de seção ─────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
      {children}
    </h3>
  );
}

// ─── Sub-componente: Swatch de cor ───────────────────────────────────────────

function ColorSwatch({
  color,
  active,
  onClick,
  title,
}: {
  color: string;
  active?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title ?? color}
      className={`
        w-8 h-8 rounded-lg border-2 transition-all duration-150 hover:scale-110
        ${active
          ? 'border-orange-500 scale-110 shadow-lg shadow-orange-500/30'
          : 'border-transparent hover:border-white/30'
        }
      `}
      style={{ backgroundColor: color }}
    />
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function RightPanel() {
  const {
    activeObject,
    canvasObjects,
    setObjectFill,
    setObjectStroke,
    tshirtColor,
    setTshirtColor,
    bringToFront,
    sendToBack,
    deleteActiveObject,
    renameObject,
    canvasRefs,
    activePart,
    activeTool,
    applyGradient,
    applyContour,
  } = useStudio();

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingLayerName, setEditingLayerName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingLayerId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingLayerId]);

  const startEditing = (id: string, currentName: string) => {
    setEditingLayerId(id);
    setEditingLayerName(currentName);
  };

  const finishEditing = (obj: Parameters<typeof renameObject>[0]) => {
    if (editingLayerId && editingLayerName.trim()) {
      renameObject(obj, editingLayerName.trim());
    }
    setEditingLayerId(null);
  };

  const hasObject = !!activeObject;

  // Cor atual do fill do objeto ativo (para o color picker)
  const currentFill   = hasObject ? String((activeObject as { fill?: unknown }).fill   ?? '#FFFFFF') : '#FFFFFF';
  const currentStroke = hasObject ? String((activeObject as { stroke?: unknown }).stroke ?? '#000000') : '#000000';

  // Seleciona um objeto a partir do painel de camadas
  const selectObject = (fabricObj: any) => {
    const canvas = canvasRefs.current[activePart];
    if (!canvas) return;
    canvas.setActiveObject(fabricObj);
    canvas.requestRenderAll();
  };

  return (
    <aside className="w-60 flex flex-col bg-[#1e2128] border-l border-white/[0.06] overflow-y-auto
                      flex-shrink-0 text-white">

      {/* ══ 1. COR DO OBJETO ATIVO ══════════════════════════════════════════ */}
      <section className="p-3.5 border-b border-white/[0.06]">
        <SectionTitle>Cor do Objeto</SectionTitle>

        {!hasObject ? (
          <p className="text-[11px] text-gray-600 italic leading-relaxed">
            Selecione um objeto no canvas para alterar sua cor.
          </p>
        ) : (
          <>
            {/* Preenchimento */}
            <p className="text-[10px] text-gray-500 mb-1.5">Preenchimento</p>
            <div className="grid grid-cols-6 gap-1.5 mb-2">
              {PRESET_COLORS.map(c => (
                <ColorSwatch
                  key={c}
                  color={c}
                  active={currentFill === c}
                  onClick={() => setObjectFill(c)}
                />
              ))}
            </div>
            {/* Color picker livre */}
            <div className="flex items-center gap-2 mb-3">
              <input
                type="color"
                value={currentFill.startsWith('#') ? currentFill : '#FFFFFF'}
                onChange={e => setObjectFill(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-white/10 bg-transparent p-0.5"
              />
              <span className="text-[11px] text-gray-400 font-mono">{currentFill.toUpperCase()}</span>
            </div>

            {/* Contorno */}
            <p className="text-[10px] text-gray-500 mb-1.5">Contorno</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentStroke.startsWith('#') ? currentStroke : '#000000'}
                onChange={e => setObjectStroke(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-white/10 bg-transparent p-0.5"
              />
              <span className="text-[11px] text-gray-400 font-mono">{currentStroke.toUpperCase()}</span>
              <button
                onClick={() => setObjectStroke('transparent')}
                className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors ml-auto"
              >
                Sem contorno
              </button>
            </div>

            {/* ── Painéis de Ferramentas Ativas (Fase 2) ── */}
            {activeTool === 'interactive_fill' && (
              <div className="mt-4 p-2.5 bg-black/20 rounded-lg border border-orange-500/30">
                <p className="text-[10px] text-orange-400 font-bold mb-2 flex items-center gap-1">
                  <span>🎨</span> PREENCHIMENTO EM GRADIENTE
                </p>
                <div className="flex gap-2 mb-2">
                  <button 
                    onClick={() => applyGradient('linear', '#FE7302', '#8E24AA')} 
                    className="flex-1 text-[10px] bg-white/10 px-2 py-1.5 rounded hover:bg-white/20 transition-colors"
                  >
                    Linear
                  </button>
                  <button 
                    onClick={() => applyGradient('radial', '#FE7302', '#8E24AA')} 
                    className="flex-1 text-[10px] bg-white/10 px-2 py-1.5 rounded hover:bg-white/20 transition-colors"
                  >
                    Radial
                  </button>
                </div>
                <p className="text-[9px] text-gray-500 leading-tight">
                  Aplica um gradiente padrão. Para editar as pontas, utilize os seletores de cor de preenchimento acima (funcionalidade completa nas próximas atualizações).
                </p>
              </div>
            )}

            {activeTool === 'contour' && (
              <div className="mt-4 p-2.5 bg-black/20 rounded-lg border border-orange-500/30">
                <p className="text-[10px] text-orange-400 font-bold mb-2 flex items-center gap-1">
                  <span>◎</span> ESPESSURA DO CONTORNO
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-gray-400 w-8">Tamanho</span>
                  <input 
                    type="range" min="0" max="100" defaultValue="5" 
                    onChange={(e) => applyContour(parseInt(e.target.value), currentStroke.startsWith('#') ? currentStroke : '#000000')} 
                    className="flex-1 accent-orange-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer" 
                  />
                </div>
                <p className="text-[9px] text-gray-500 leading-tight">
                  Simulação de offset exterior. A cor do contorno pode ser alterada no seletor acima.
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* ══ 2. COR DA CAMISETA ══════════════════════════════════════════════ */}
      <section className="p-3.5 border-b border-white/[0.06]">
        <SectionTitle>Cor da Camiseta</SectionTitle>
        <div className="grid grid-cols-5 gap-1.5 mb-2">
          {TSHIRT_COLORS.map(c => (
            <ColorSwatch
              key={c.hex}
              color={c.hex}
              active={tshirtColor === c.hex}
              onClick={() => setTshirtColor(c.hex)}
              title={c.label}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={tshirtColor}
            onChange={e => setTshirtColor(e.target.value)}
            className="w-8 h-8 rounded-lg cursor-pointer border border-white/10 bg-transparent p-0.5"
          />
          <span className="text-[11px] text-gray-400 font-mono">{tshirtColor.toUpperCase()}</span>
        </div>
      </section>

      {/* ══ 3. CAMADAS ══════════════════════════════════════════════════════ */}
      <section className="p-3.5 flex-1">
        <div className="flex items-center justify-between mb-2.5">
          <SectionTitle>Camadas</SectionTitle>
          {/* Ações rápidas da camada ativa */}
          {hasObject && (
            <div className="flex items-center gap-1">
              <button
                onClick={bringToFront}
                title="Trazer para frente"
                className="w-7 h-7 flex items-center justify-center rounded-md
                           text-gray-400 hover:text-white hover:bg-white/10
                           transition-all text-sm"
              >⬆</button>
              <button
                onClick={sendToBack}
                title="Enviar para trás"
                className="w-7 h-7 flex items-center justify-center rounded-md
                           text-gray-400 hover:text-white hover:bg-white/10
                           transition-all text-sm"
              >⬇</button>
              <button
                onClick={deleteActiveObject}
                title="Excluir objeto"
                className="w-7 h-7 flex items-center justify-center rounded-md
                           text-red-500 hover:text-red-300 hover:bg-red-500/10
                           transition-all text-sm"
              >🗑</button>
            </div>
          )}
        </div>

        {canvasObjects.length === 0 ? (
          <p className="text-[11px] text-gray-600 italic leading-relaxed">
            Nenhum objeto no canvas ainda. Use as ferramentas para adicionar texto, formas ou imagens.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {canvasObjects.map((obj) => {
              const isActive = activeObject === obj.fabricObject;
              const isEditing = editingLayerId === obj.id;
              
              return (
                <li key={obj.id} className="group relative">
                  <button
                    onClick={() => selectObject(obj.fabricObject as any)}
                    onDoubleClick={() => startEditing(obj.id, obj.label)}
                    className={`
                      w-full flex items-center gap-2 px-2.5 py-2 rounded-lg
                      text-[11px] text-left transition-all duration-150
                      ${isActive
                        ? 'bg-orange-500/20 text-orange-200 ring-1 ring-orange-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/8'
                      }
                    `}
                  >
                    {/* Mini preview de cor */}
                    <span
                      className="w-3.5 h-3.5 rounded-sm border border-white/20 flex-shrink-0"
                      style={{
                        backgroundColor: String(
                          (obj.fabricObject as { fill?: unknown }).fill ?? 'transparent'
                        ),
                      }}
                    />
                    
                    {isEditing ? (
                      <input
                        ref={editInputRef}
                        value={editingLayerName}
                        onChange={(e) => setEditingLayerName(e.target.value)}
                        onBlur={() => finishEditing(obj.fabricObject as Parameters<typeof renameObject>[0])}
                        onKeyDown={(e) => e.key === 'Enter' && finishEditing(obj.fabricObject as Parameters<typeof renameObject>[0])}
                        className="flex-1 bg-black/40 text-white px-1.5 py-0.5 rounded outline-none border border-orange-500/50"
                        onClick={(e) => e.stopPropagation()} // Evita selecionar o objeto ao clicar no input
                      />
                    ) : (
                      <span className="truncate flex-1 pr-6">{obj.label}</span>
                    )}
                    
                    {isActive && !isEditing && (
                      <span className="text-orange-400 text-[10px] flex-shrink-0">●</span>
                    )}
                  </button>

                  {/* Ícone de editar rápido (só aparece no hover da camada se não estiver editando) */}
                  {!isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(obj.id, obj.label);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Renomear Camada"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </aside>
  );
}
