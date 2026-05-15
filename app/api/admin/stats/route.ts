import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    if (decodedToken.email !== 'camisavetor@gmail.com') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // 1. Clientes
    const usersSnap = await adminDb.collection('users').get();
    const clientes = usersSnap.size;

    // 2. Vendas e Top Vendido
    const now = new Date();
    const firstDayISO = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const pedidosSnap = await adminDb.collection('pedidos').where('status', '==', 'pago').get();
    
    let vendaMensal = 0;
    const salesCountMap: Record<string, number> = {};

    pedidosSnap.docs.forEach(doc => {
      const d = doc.data();
      const items = d.items || [];
      
      // Vendas do mês atual
      if (d.createdAt && d.createdAt >= firstDayISO) {
        vendaMensal += items.reduce((sum: number, item: any) => sum + (item.price * (item.quantity || 1)), 0);
      }

      // Contagem para Top Vendido
      items.forEach((item: any) => {
        salesCountMap[item.id] = (salesCountMap[item.id] || 0) + (item.quantity || 1);
      });
    });

    // Encontrar o ID do mais vendido
    let maxSales = 0;
    let topVendidoId: string | null = null;
    Object.entries(salesCountMap).forEach(([id, count]) => {
      if (count > maxSales) {
        maxSales = count;
        topVendidoId = id;
      }
    });

    // 3. Pegar nome do Produto Top Vendido
    let topVendidoName = 'Nenhum';
    if (topVendidoId) {
      const pDoc = await adminDb.collection('products').doc(topVendidoId).get();
      if (pDoc.exists) {
        topVendidoName = pDoc.data()?.name || 'Desconhecido';
      }
    }

    // 4. Top Avaliado (Simplificado)
    // Para simplificar, retornaremos 'Nenhum' ou podemos calcular se existissem avaliações estruturadas.
    // Como a coleção de avaliações (ratings) ainda não está bem povoada e o subcollection group query é pesado:
    let topAvaliadoName = 'Nenhum';

    return NextResponse.json({
      clientes,
      vendaMensal,
      topVendido: topVendidoName,
      topAvaliado: topAvaliadoName
    });

  } catch (error: any) {
    console.error('Erro ao buscar stats admin:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
