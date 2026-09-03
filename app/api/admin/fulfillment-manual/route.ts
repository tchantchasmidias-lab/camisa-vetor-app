import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { Resend } from "resend";
import { sendCriticalErrorAlert } from "@/lib/errorNotifier";

const ADMIN_EMAIL = "camisavetor@gmail.com";

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticacao de admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const { orderId, userId, email, items } = await req.json();

    if (!orderId || !email || !items?.length) {
      return NextResponse.json({ error: "Parametros obrigatorios ausentes" }, { status: 400 });
    }

    // 1. Buscar links de download de cada produto
    const productsLinks = await Promise.all(
      items.map(async (item: any) => {
        let directLink = "#";
        try {
          const productSnap = await adminDb.collection("products").doc(item.id).get();
          if (productSnap.exists) {
            const data = productSnap.data();
            directLink = data?.urls?.download || data?.urls?.destaque || "#";
          }
        } catch (e) {
          console.error("[FulfillManual] Erro ao buscar link do produto:", e);
        }
        return { ...item, directLink };
      })
    );

    // 2. Marcar pedido como verificado no Firestore
    await adminDb.collection("pedidos").doc(orderId).set(
      { status: "pago", verified: true, paidAt: new Date().toISOString(), manuallyApproved: true },
      { merge: true }
    );

    // 3. Enviar e-mail com links de download via Resend
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY nao configurado" }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Buscar template e nome do cliente
    const [configDoc, userDoc] = await Promise.all([
      adminDb.collection("configuracoes").doc("email_templates").get(),
      userId ? adminDb.collection("users").doc(userId).get() : Promise.resolve(null),
    ]);

    let subject = "Seus vetores chegaram!";
    let body = "Ola {{nome}}, muito obrigado pela compra. Seguem abaixo os links para baixar seus arquivos.\n\n{{links}}";

    if (configDoc.exists) {
      const data = configDoc.data();
      if (data?.deliverySubject) subject = data.deliverySubject;
      if (data?.deliveryBody) body = data.deliveryBody;
    }

    const customerName = userDoc?.exists ? userDoc.data()?.nome || "Cliente" : "Cliente";

    const linksHtml = productsLinks
      .map(
        (item: any) => `
        <div style="margin-bottom: 15px; padding: 20px; background-color: #222; border: 1px solid #333; border-radius: 12px;">
          <strong style="color: #fff; display: block; margin-bottom: 10px; font-size: 16px;">${item.name}</strong>
          <a href="${item.directLink}" style="background-color: #fe7302; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Fazer Download Seguro</a>
        </div>
      `
      )
      .join("");

    const finalSubject = subject.replace(/{{nome}}/g, customerName);
    let htmlBody = body.replace(/{{nome}}/g, customerName).replace(/\n/g, "<br>");
    htmlBody = htmlBody.replace(/{{links}}/g, linksHtml);

    await resend.emails.send({
      from: "Camisa Vetor <contato@camisavetor.com>",
      to: email,
      subject: finalSubject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #111; color: #fff; padding: 40px; border-radius: 16px; border: 1px solid #222;">
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="https://camisavetor.com" style="text-decoration: none;">
              <img src="https://camisavetor.com/logo-email.png" alt="Camisa Vetor" width="180" style="display: block; margin: 0 auto; border: none;" />
            </a>
          </div>
          <div style="font-size: 16px; line-height: 1.6; color: #ccc;">
            ${htmlBody}
          </div>
          <hr style="border: 0; border-top: 1px solid #222; margin: 30px 0;" />
          <p style="font-size: 12px; color: #555; text-align: center;">
            &copy; ${new Date().getFullYear()} Camisa Vetor
          </p>
        </div>
      `,
    });

    console.log(`[FulfillManual] E-mail de entrega enviado para ${email} (pedido: ${orderId})`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[FulfillManual] Erro:", error);

    // 🚨 Alerta de falha no fulfillment manual
    sendCriticalErrorAlert({
      subject: `🚨 [ALERTA] Falha no Envio Manual de Arquivos`,
      context: 'Administração / Fulfillment Manual',
      errorMessage: error?.message || 'Erro no fulfillment manual',
      stack: error?.stack,
      error,
      req,
      level: 'ALERTA',
    }).catch(err => console.error('[FulfillManual] Erro ao disparar alerta:', err));

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
