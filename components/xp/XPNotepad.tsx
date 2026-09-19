'use client';

import React, { useState } from 'react';

const DEFAULT_README = `=====================================================
CAMISA VETOR - WINDOWS XP EDITION (v2026.1)
=====================================================

Bem-vindo ao modo retro da Camisa Vetor!

Aqui voce encontra artes vetoriais profissionais 
e exclusivas para estampas de camisetas, sublimacao, 
serigrafia e uniformes esportivos.

Destaques dos Nossos Vetores:
* 100% Editaveis em CorelDRAW (.CDR)
* Compatibilidade com Adobe Illustrator e Photoshop
* Arquivos vetoriais abertos em PDF e SVG
* Cores configuradas em padrao CMYK de alta fidelidade
* Fontes e textos convertidos em curvas e editaveis
* Download imediato logo apos a aprovacao do Pix

Como Usar o Windows XP da Camisa Vetor:
1. Abra o icone 'Catálogo de Camisas' no Desktop
2. Selecione a categoria desejada (Futebol, Gospel, etc.)
3. De um duplo clique no arquivo para abrir o Visualizador
4. Adicione ao carrinho e finalize seu pedido com total seguranca!

Para voltar a loja moderna convencional a qualquer momento, 
clique em 'Iniciar' -> 'Desligar o computador' ou no icone
'Loja Oficial Moderna' na sua area de trabalho.

Equipe Camisa Vetor (Pesqueira - PE, Brasil)
Suporte: contato@camisavetor.com
=====================================================`;

export default function XPNotepad() {
  const [content, setContent] = useState(DEFAULT_README);

  return (
    <div className="flex flex-col h-full bg-white font-mono text-xs text-black select-text">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        className="flex-1 p-3 outline-none resize-none bg-white text-black font-mono text-xs leading-relaxed border-none"
        spellCheck={false}
      />
    </div>
  );
}
