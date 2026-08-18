import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[Webhook MP] Payload recebido:", JSON.stringify(body));

    // O Mercado Pago envia: { action, type, data: { id } }
    // Tambem pode enviar um formato legado: { topic, id }
    const paymentId = body?.data?.id || body?.id;
    const type = body?.type || body?.topic;

    // Processar apenas notificacoes de pagamento
    if (type !== "payment" || !paymentId) {
      return NextResponse.json({ ignored: true });
    }

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      console.error("[Webhook MP] MERCADOPAGO_ACCESS_TOKEN nao configurado");
      return NextResponse.json({ error: "Token MP nao configurado" }, { status: 500 });
    }

    // 1. Consultar status real no Mercado Pago
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
    const payment = new Payment(client);
    const result = await payment.get({ id: paymentId });

    console.log(`[Webhook MP] Payment ${paymentId} status: ${result.status}, external_ref: ${result.external_reference}`);

    if (result.status !== "approved") {
      return NextResponse.json({ message: "Pagamento nao aprovado, ignorado." });
    }

    const transactionId = result.external_reference;
    if (!transactionId) {
      console.error("[Webhook MP] external_reference ausente no pagamento", paymentId);
      return NextResponse.json({ error: "external_reference ausente" }, { status: 400 });
    }

    // 2. Buscar pedido no Firestore
    const pedidoSnap = await adminDb.collection("pedidos").doc(transactionId).get();
    if (!pedidoSnap.exists) {
      console.error("[Webhook MP] Pedido nao encontrado para transactionId:", transactionId);
      return NextResponse.json({ error: "Pedido nao encontrado" }, { status: 404 });
    }

    const pedido = pedidoSnap.data()!;

    // 3. Evitar processamento duplicado
    if (pedido.status === "pago" && pedido.verified === true) {
      console.log("[Webhook MP] Pedido ja processado, ignorando:", transactionId);
      return NextResponse.json({ message: "Ja processado" });
    }

    // 4. Buscar links de download de cada produto
    const productsLinks = await Promise.all(
      (pedido.items || []).map(async (item: any) => {
        let directLink = "#";
        try {
          const productSnap = await adminDb.collection("products").doc(item.id).get();
          if (productSnap.exists) {
            const data = productSnap.data();
            directLink = data?.urls?.download || data?.urls?.destaque || "#";
          }
        } catch (e) {
          console.error("[Webhook MP] Erro ao buscar link do produto:", e);
        }
        return { ...item, directLink };
      })
    );

    // 5. Atualizar pedido como pago e verificado
    await adminDb.collection("pedidos").doc(transactionId).set(
      {
        status: "pago",
        verified: true,
        providerPaymentId: String(paymentId),
        paidAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // 6. Enviar e-mail de entrega
    if (!process.env.RESEND_API_KEY) {
      console.warn("[Webhook MP] RESEND_API_KEY ausente, e-mail nao enviado.");
      return NextResponse.json({ success: true, emailSent: false });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const [configDoc, userDoc] = await Promise.all([
      adminDb.collection("configuracoes").doc("email_templates").get(),
      pedido.userId ? adminDb.collection("users").doc(pedido.userId).get() : Promise.resolve(null),
    ]);

    let subject = "Seus vetores chegaram!";
    let emailBody = "Ola {{nome}}, muito obrigado pela compra. Seguem abaixo os links para baixar seus arquivos.\n\n{{links}}";

    if (configDoc.exists) {
      const data = configDoc.data();
      if (data?.deliverySubject) subject = data.deliverySubject;
      if (data?.deliveryBody) emailBody = data.deliveryBody;
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
    let htmlBody = emailBody.replace(/{{nome}}/g, customerName).replace(/\n/g, "<br>");
    htmlBody = htmlBody.replace(/{{links}}/g, linksHtml);

    await resend.emails.send({
      from: "Camisa Vetor <contato@camisavetor.com>",
      to: pedido.email,
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

    console.log(`[Webhook MP] E-mail de entrega enviado para ${pedido.email} (pedido: ${transactionId})`);

    return NextResponse.json({ success: true, emailSent: true });
  } catch (error: any) {
    console.error("[Webhook MP] Erro ao processar webhook:", error);
    // Retorna 200 para o MP nao retentar indefinidamente em erros de negocio
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}
