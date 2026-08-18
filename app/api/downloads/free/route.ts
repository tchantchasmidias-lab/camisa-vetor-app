import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticacao do usuario
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Nao autorizado. Faca login para baixar." }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Token invalido." }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: "productId obrigatorio." }, { status: 400 });
    }

    // 2. Buscar produto e confirmar que e gratuito (seguranca server-side)
    const productSnap = await adminDb.collection("products").doc(productId).get();
    if (!productSnap.exists) {
      return NextResponse.json({ error: "Produto nao encontrado." }, { status: 404 });
    }
    const product = productSnap.data()!;
    const isFree = Boolean(product.isFree) || Number(product.price) === 0;
    if (!isFree) {
      return NextResponse.json({ error: "Este produto nao e gratuito." }, { status: 403 });
    }

    const downloadUrl = product.urls?.download || product.urls?.destaque || "#";

    // 3. Registrar download gratuito no Firestore (pedidos)
    //    Verifica se o usuario ja baixou este produto para evitar registro duplicado
    const existingQuery = await adminDb
      .collection("pedidos")
      .where("userId", "==", decoded.uid)
      .where("paymentMethod", "==", "free")
      .get();

    const alreadyDownloaded = existingQuery.docs.some((d) =>
      d.data().items?.some((item: any) => item.id === productId)
    );

    if (!alreadyDownloaded) {
      const orderId = uuidv4();
      await adminDb.collection("pedidos").doc(orderId).set({
        userId: decoded.uid,
        email: decoded.email || "",
        transactionId: orderId,
        paymentMethod: "free",
        status: "pago",
        verified: true,
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        total: 0,
        items: [
          {
            id: productId,
            name: product.name,
            price: 0,
            quantity: 1,
            image: product.urls?.capa || product.urls?.destaque || "",
          },
        ],
      });
      console.log(`[FreeDownload] Usuario ${decoded.uid} baixou produto ${productId} (${product.name}) gratuitamente.`);
    }

    return NextResponse.json({ success: true, downloadUrl });
  } catch (error: any) {
    console.error("[FreeDownload] Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
