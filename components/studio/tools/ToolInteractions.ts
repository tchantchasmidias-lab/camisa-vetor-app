import type { Canvas as FabricCanvas, FabricObject } from 'fabric';

/**
 * Habilita a ferramenta Cortar (Crop).
 * Desenha um retângulo na tela e aplica como clipPath no objeto selecionado.
 * Retorna uma função de limpeza para remover os listeners.
 */
export async function enableCropTool(canvas: FabricCanvas, onCropComplete: () => void) {
  let isDrawing = false;
  let rect: any = null;
  let startX = 0, startY = 0;
  
  const { Rect } = await import('fabric');

  const onMouseDown = (o: any) => {
    // Se clicou no objeto selecionado diretamente para mover, podemos querer ignorar o crop,
    // mas o comportamento do Crop geralmente é "clique e arraste desenha a caixa de corte".
    // Vamos forçar o desenho se o mouse descer
    const pointer = canvas.getScenePoint(o.e);
    startX = pointer.x;
    startY = pointer.y;
    isDrawing = true;
    rect = new Rect({
      left: startX,
      top: startY,
      width: 0,
      height: 0,
      fill: 'rgba(0,0,0,0.1)',
      stroke: '#FE7302',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
    });
    canvas.add(rect);
  };

  const onMouseMove = (o: any) => {
    if (!isDrawing || !rect) return;
    const pointer = canvas.getScenePoint(o.e);
    
    if (pointer.x < startX) {
      rect.set({ left: pointer.x });
    }
    if (pointer.y < startY) {
      rect.set({ top: pointer.y });
    }
    
    rect.set({
      width: Math.abs(pointer.x - startX),
      height: Math.abs(pointer.y - startY),
    });
    canvas.requestRenderAll();
  };

  const onMouseUp = () => {
    isDrawing = false;
    if (rect) {
      const w = rect.width ?? 0;
      const h = rect.height ?? 0;
      
      // Se desenhou uma caixa maior que 5px, aplicamos o crop
      if (w > 5 && h > 5) {
        // Encontra o objeto selecionado antes (o crop tool requer que um objeto esteja ativo)
        const objs = canvas.getActiveObjects();
        if (objs.length === 1) {
          const target = objs[0];
          // Cria um clipPath posicionado de forma absoluta
          const clipPath = new Rect({
            left: rect.left,
            top: rect.top,
            width: w,
            height: h,
            absolutePositioned: true,
          });
          target.set('clipPath', clipPath);
          target.set('dirty', true);
        }
      }
      
      canvas.remove(rect);
      rect = null;
      canvas.requestRenderAll();
      onCropComplete(); // Retorna para a ferramenta de seleção
    }
  };

  canvas.on('mouse:down', onMouseDown);
  canvas.on('mouse:move', onMouseMove);
  canvas.on('mouse:up', onMouseUp);
  
  canvas.defaultCursor = 'crosshair';
  // Bloqueia a seleção de outros objetos enquanto está cortando
  canvas.selection = false;

  return () => {
    canvas.off('mouse:down', onMouseDown);
    canvas.off('mouse:move', onMouseMove);
    canvas.off('mouse:up', onMouseUp);
    canvas.defaultCursor = 'default';
    canvas.selection = true;
  };
}

/**
 * Habilita a ferramenta B-Spline.
 * Permite clicar para adicionar pontos e desenhar uma curva.
 * Um duplo clique finaliza o desenho.
 */
export async function enableBSplineTool(canvas: FabricCanvas, onSplineComplete: () => void) {
  let points: { x: number, y: number }[] = [];
  let isDrawing = true;
  let activeShape: any = null;
  let activeLine: any = null;
  
  const { Path, Line } = await import('fabric');

  // Converte pontos num SVG path simples (linhas por enquanto, Spline real exige matemática complexa Bezier)
  // Como simplificação robusta para a web, faremos um Polyline conectado.
  const updateShape = () => {
    if (points.length < 2) return;
    
    let pathData = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathData += ` L ${points[i].x} ${points[i].y}`;
    }
    
    if (activeShape) canvas.remove(activeShape);
    
    activeShape = new Path(pathData, {
      fill: 'transparent',
      stroke: '#FE7302',
      strokeWidth: 3,
      selectable: false,
      evented: false,
    });
    canvas.add(activeShape);
  };

  const onMouseDown = (o: any) => {
    if (!isDrawing) return;
    const pointer = canvas.getScenePoint(o.e);
    points.push({ x: pointer.x, y: pointer.y });
    updateShape();
  };

  const onMouseMove = (o: any) => {
    if (!isDrawing || points.length === 0) return;
    const pointer = canvas.getScenePoint(o.e);
    const lastPoint = points[points.length - 1];
    
    if (activeLine) canvas.remove(activeLine);
    
    activeLine = new Line([lastPoint.x, lastPoint.y, pointer.x, pointer.y], {
      fill: 'transparent',
      stroke: '#FE7302',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
    });
    canvas.add(activeLine);
    canvas.requestRenderAll();
  };

  const onDoubleClick = () => {
    isDrawing = false;
    if (activeLine) canvas.remove(activeLine);
    if (activeShape) {
      activeShape.set({
        selectable: true,
        evented: true,
        stroke: '#000000', // Torna preto após finalizado
      });
      canvas.setActiveObject(activeShape);
    }
    canvas.requestRenderAll();
    onSplineComplete();
  };

  canvas.on('mouse:down', onMouseDown);
  canvas.on('mouse:move', onMouseMove);
  canvas.on('mouse:dblclick', onDoubleClick);
  canvas.defaultCursor = 'crosshair';
  canvas.selection = false;

  return () => {
    canvas.off('mouse:down', onMouseDown);
    canvas.off('mouse:move', onMouseMove);
    canvas.off('mouse:dblclick', onDoubleClick);
    if (activeLine) canvas.remove(activeLine);
    canvas.defaultCursor = 'default';
    canvas.selection = true;
  };
}

/**
 * Habilita a ferramenta Forma (F10).
 * Permite a edição de nós (pontos) em objetos do tipo Polygon ou Polyline.
 */
export async function enableShapeTool(canvas: FabricCanvas, onShapeComplete: () => void) {
  const { Control, controlsUtils } = await import('fabric');
  
  const poly = canvas.getActiveObject() as any;
  if (!poly || (poly.type !== 'polygon' && poly.type !== 'polyline')) {
    alert('A ferramenta Forma (Nós) funciona apenas em Polígonos ou Espirais selecionadas.');
    onShapeComplete();
    return () => {};
  }

  // Clona os controles originais para restaurar depois
  const originalControls = { ...poly.controls };
  const points = poly.points;
  
  // Limpa controles padrão (redimensionamento)
  poly.controls = {};
  
  // Função que lida com o arrasto do nó
  const actionHandler = (eventData: MouseEvent, transform: import('fabric').Transform, x: number, y: number) => {
    const polygon = transform.target as any;
    const currentControl = polygon.controls[poly.__corner];
    const mouseLocalPosition = polygon.toLocalPoint(
      new (window as any).fabric.Point(x, y),
      'center',
      'center'
    );
    const size = polygon._getTransformedDimensions(0, 0);
    const finalPointPosition = {
      x: (mouseLocalPosition.x * polygon.width) / size.x + polygon.pathOffset.x,
      y: (mouseLocalPosition.y * polygon.height) / size.y + polygon.pathOffset.y,
    };
    polygon.points[currentControl.pointIndex] = finalPointPosition;
    return true;
  };

  // Renderizador do nó (um pequeno círculo azul)
  const anchorWrapper = (anchorIndex: number, fn: any) => {
    return function(eventData: MouseEvent, transform: import('fabric').Transform, x: number, y: number) {
      const fabricObject = transform.target as any;
      const absolutePoint = fabricObject.toAbsolutePoint(
        new (window as any).fabric.Point(fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x, fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y),
        'center',
        'center'
      );
      const actionPerformed = fn(eventData, transform, x, y);
      const newAbsolutePoint = fabricObject.toAbsolutePoint(
        new (window as any).fabric.Point(fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x, fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y),
        'center',
        'center'
      );
      fabricObject.setPositionByOrigin(
        new (window as any).fabric.Point(
          fabricObject.left + (absolutePoint.x - newAbsolutePoint.x),
          fabricObject.top + (absolutePoint.y - newAbsolutePoint.y)
        ),
        'center',
        'center'
      );
      return actionPerformed;
    };
  };

  // Cria um controle (nó) para cada ponto
  points.forEach((point: any, index: number) => {
    const control = new Control({
      positionHandler: (dim: any, finalMatrix: any, fabricObject: any) => {
        const pt = fabricObject.points[index];
        return fabricObject.toAbsolutePoint(
          new (window as any).fabric.Point(pt.x - fabricObject.pathOffset.x, pt.y - fabricObject.pathOffset.y),
          'center',
          'center'
        );
      },
      actionHandler: anchorWrapper(index, actionHandler),
      actionName: 'modifyPolygon',
      render: (ctx: CanvasRenderingContext2D, left: number, top: number, styleOverride: any, fabricObject: any) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(left, top, 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#1E88E5';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    });
    (control as any).pointIndex = index;
    poly.controls[`p${index}`] = control;
  });

  poly.hasBorders = false;
  canvas.requestRenderAll();

  // Quando desabilitar a ferramenta, restaura
  return () => {
    poly.controls = originalControls;
    poly.hasBorders = true;
    canvas.requestRenderAll();
  };
}
