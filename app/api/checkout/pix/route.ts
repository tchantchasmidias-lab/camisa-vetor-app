import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendCriticalErrorAlert } from '@/lib/errorNotifier';
import { cleanCPF, cleanPhone, isValidCPF } from '@/lib/validationUtils';

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY || 're_stub');
  let body: any = null;
  try {
    body = await req.json();
    const { items, email, firstName, lastName, phone, cpf, userId, couponCode } = body;
    
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
    }

    // Sanitização de CPF e Telefone (apenas números)
    const sanitizedCpf = cleanCPF(cpf);
    const sanitizedPhone = cleanPhone(phone);

    // Validação estrita de CPF no servidor
    if (sanitizedCpf && !isValidCPF(sanitizedCpf)) {
      return NextResponse.json({
        error: 'CPF inválido. Por favor, verifique os dígitos digitados.',
        code: 'INVALID_CPF',
        success: false,
      }, { status: 400 });
    }

    const client = new MercadoPagoConfig({ 
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN, 
      options: { timeout: 10000 } 
    });
    const payment = new Payment(client);

    // Validação de Preços no Servidor
    let realCartTotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const docSnap = await adminDb.collection('products').doc(item.id).get();
      if (!docSnap.exists) {
        throw new Error(`Produto não encontrado: ${item.id}`);
      }
      const data = docSnap.data()!;
      const realPrice = Number(data.price) || 0;
      realCartTotal += realPrice * (item.quantity || 1);
      
      verifiedItems.push({
        ...item,
        price: realPrice,
        name: data.name || item.name
      });
    }

    // Validação de Cupom no Servidor
    let finalTotal = realCartTotal;
    if (couponCode) {
      const couponRef = adminDb.collection('coupons').doc(couponCode.trim().toUpperCase());
      const snap = await couponRef.get();
      if (snap.exists) {
        const coupon = snap.data()!;
        if (coupon.active) {
          let isValid = true;
          if (coupon.expiresAt) {
            const expiresAt = coupon.expiresAt.toDate ? coupon.expiresAt.toDate() : new Date(coupon.expiresAt);
            if (new Date() > expiresAt) isValid = false;
          }
          if (coupon.minOrder && realCartTotal < coupon.minOrder) isValid = false;
          
          if (isValid) {
            let discount = 0;
            if (coupon.type === 'percent') {
              discount = (realCartTotal * coupon.value) / 100;
            } else if (coupon.type === 'fixed') {
              discount = coupon.value;
            }
            discount = Math.min(discount, realCartTotal);
            finalTotal = Math.max(0, realCartTotal - discount);
          }
        }
      }
    }

    const totalAmount = parseFloat(finalTotal.toFixed(2));
    const transactionId = uuidv4();

    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    const phoneArea = sanitizedPhone.length >= 10 ? sanitizedPhone.substring(0, 2) : '';
    const phoneNumber = sanitizedPhone.length >= 10 ? sanitizedPhone.substring(2) : sanitizedPhone;

    // Estrutura rigorosamente sanitizada para o Mercado Pago
    const request = {
      body: {
        transaction_amount: totalAmount,
        description: `Compra Camisa Vetor - ${verifiedItems.map(i => i.name).join(', ').substring(0, 200)}`,
        payment_method_id: 'pix',
        date_of_expiration: expirationDate.toISOString(),
        payer: {
          email: (email || '').trim(),
          first_name: (firstName || 'Cliente').trim(),
          last_name: lastName ? lastName.trim() : undefined,
          identification: sanitizedCpf ? {
            type: 'CPF',
            number: sanitizedCpf
          } : undefined,
          ...(phoneArea && phoneNumber ? {
            phone: {
              area_code: phoneArea,
              number: phoneNumber
            }
          } : {})
        },
        additional_info: {
          items: verifiedItems.map(item => ({
            id: String(item.id),
            title: String(item.name || 'Vetor Camisa'),
            description: String(item.name || 'Vetor Camisa').substring(0, 250),
            picture_url: item.image || item.urls?.capa || item.urls?.destaque || 'https://camisavetor.com.br/logo.png',
            category_id: 'others',
            quantity: Number(item.quantity || 1),
            unit_price: Number(item.price || 0)
          })),
          payer: {
            first_name: (firstName || 'Cliente').trim(),
            last_name: lastName ? lastName.trim() : undefined,
            ...(phoneArea && phoneNumber ? {
              phone: {
                area_code: phoneArea,
                number: phoneNumber
              }
            } : {})
          }
        },
        notification_url: 'https://camisavetor.com.br/api/checkout/pix/webhook',
        external_reference: transactionId,
      },
      requestOptions: { idempotencyKey: transactionId }
    };

    const result = await payment.create(request);

    if (!result.point_of_interaction?.transaction_data) {
      throw new Error("Não foi possível obter os dados do Pix");
    }

    const { qr_code, qr_code_base64 } = result.point_of_interaction.transaction_data;

    // Salvar pedido inicial como "pendente"
    if (userId) {
      await adminDb.collection('pedidos').doc(transactionId).set({
        userId,
        email,
        items: verifiedItems,
        total: totalAmount,
        transactionId,
        paymentMethod: 'pix',
        createdAt: new Date().toISOString(),
        status: 'pendente',
        verified: false
      });
    }

    // Disparar E-mail de Aguardando Pagamento (Pix)
    if (process.env.RESEND_API_KEY) {
      try {
        const configDoc = await adminDb.collection('configuracoes').doc('email_templates').get();
        let subject = '⏳ Seu pedido está quase lá!';
        let body = 'Identificamos o seu pedido. Faça o pagamento para liberar seus arquivos imediatamente.';
        
        if (configDoc.exists) {
          const tpl = configDoc.data()?.pixWaiting;
          if (tpl) {
            if (tpl.subject) subject = tpl.subject;
            if (tpl.body) body = tpl.body;
          }
        }

        const customerName = firstName || 'Cliente';
        const finalSubject = subject.replace(/{{nome}}/g, customerName);
        const htmlBody = body
          .replace(/{{nome}}/g, customerName)
          .replace(/\n/g, '<br>');

        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #111; color: #fff; padding: 40px; border-radius: 16px; border: 1px solid #222;">
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="https://camisavetor.com" style="text-decoration: none;">
                <img src="https://camisavetor.com/logo-email.png" alt="Camisa Vetor" width="180" style="display: block; margin: 0 auto; border: none;" />
              </a>
            </div>
            
            <div style="font-size: 16px; line-height: 1.6; color: #ccc;">
              ${htmlBody}
            </div>

            <div style="background-color: #1c1c1e; border: 1px solid #333; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
              <p style="color: #fe7302; font-weight: bold; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Pague via Pix Copia e Cola:</p>
              
              <div style="background-color: #000; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 11px; word-break: break-all; color: #fff; margin-bottom: 20px; border: 1px dashed #444;">
                ${qr_code}
              </div>

              <p style="font-size: 12px; color: #888; margin-bottom: 0;">Após a confirmação do pagamento pelo seu banco, os links de download serão liberados imediatamente e enviados também por e-mail.</p>
            </div>

            <hr style="border: 0; border-top: 1px solid #222; margin: 30px 0;" />
            <p style="font-size: 12px; color: #555; text-align: center;">
              &copy; ${new Date().getFullYear()} Camisa Vetor
            </p>
          </div>
        `;

        resend.emails.send({
          from: 'Camisa Vetor <contato@camisavetor.com>',
          to: [email],
          subject: finalSubject,
          html: emailHtml,
        }).catch(console.error);

      } catch (e) {
        console.error("Erro ao tentar enviar e-mail do Pix:", e);
      }
    }

    return NextResponse.json({
      id: result.id, // Mercado Pago Payment ID
      transactionId,
      qr_code,
      qr_code_base64
    });

  } catch (error: any) {
    console.error('Erro ao gerar Pix:', error);
    if (error?.cause) {
      console.error('Mercado Pago error cause:', JSON.stringify(error.cause, null, 2));
    }
    
    // Tratamento de erros de validação específicos do Mercado Pago
    const causeArray = Array.isArray(error?.cause) ? error.cause : [];
    const isCpfError = causeArray.some((c: any) => 
      c?.code === 2067 || 
      c?.code === 3014 || 
      String(c?.description || '').toLowerCase().includes('identification') ||
      String(c?.description || '').toLowerCase().includes('cpf')
    ) || String(error?.message || '').toLowerCase().includes('identification');

    if (isCpfError) {
      return NextResponse.json({
        error: 'CPF inválido. Por favor, verifique os dígitos digitados.',
        code: 'INVALID_CPF',
        success: false,
      }, { status: 400 });
    }

    const errorMessage = error?.cause?.[0]?.description || error?.message || 'Erro ao processar pagamento via Pix';

    // 🚨 Dispara alerta imediato por e-mail para o administrador
    sendCriticalErrorAlert({
      subject: `🚨 [ALERTA] Falha na Geração de Pix - Cliente: ${body?.email || 'Desconhecido'}`,
      context: 'Checkout / Geração de Pix Mercado Pago',
      errorMessage: `${errorMessage}${error?.cause ? ` | Detalhes: ${JSON.stringify(error.cause)}` : ''}`,
      stack: error?.stack,
      error,
      req,
      requestData: body,
      orderData: {
        total: body?.total,
        email: body?.email,
        name: `${body?.firstName || ''} ${body?.lastName || ''}`.trim(),
        items: body?.items,
        couponCode: body?.couponCode,
      },
      userEmail: body?.email,
      userId: body?.userId,
      level: 'CRÍTICO',
    }).catch(err => console.error('[PixRoute] Erro ao disparar alerta de falha:', err));

    return NextResponse.json({
      error: errorMessage,
      success: false,
      message: 'Não foi possível gerar a chave Pix no momento. Tente novamente em instantes.',
    }, { status: 500 });
  }
}
