import { adminDb } from '@/lib/firebaseAdmin';
import { notFound, permanentRedirect } from 'next/navigation';
import ProductDetailsWrapper from '@/components/ProductDetailsWrapper';
import { Metadata, ResolvingMetadata } from 'next';
import { buildCleanImageUrl } from '@/lib/mediaUtils';

interface Props {
  params: { id: string };
}

// ─────────────────────────────────────────────────────────────────
// GERADOR DE METADATA SEO PREMIUM
// ─────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;

  let product: any = null;
  const docRef = adminDb.collection('products').doc(id);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    product = { id: docSnap.id, ...docSnap.data() };
    if (product.slug && product.slug !== id) {
      permanentRedirect(`/product/${product.slug}`);
    }
  } else {
    const slugQuery = await adminDb.collection('products').where('slug', '==', id).limit(1).get();
    if (!slugQuery.empty) {
      const doc = slugQuery.docs[0];
      product = { id: doc.id, ...doc.data() };
    }
  }

  if (!product) {
    return { title: 'Produto não encontrado | Camisa Vetor' };
  }

  const slug = product.slug || product.id;
  const name = product.name || 'Vetor Profissional';
  const category = product.category || '';

  // Descrição rica para SEO (inclui formatos e técnicas)
  const description = product.description
    ? product.description
    : `Baixe ${name} em vetor editável profissional. Pacote completo com arquivos CDR, PDF, SVG e PNG em alta resolução. ` +
      `Ideal para sublimação, DTF, serigrafia e transfer. Download imediato após aprovação do pagamento.`;

  // Padrão de título com palavras-chave de cauda longa
  const title = `${name} | Vetor Editável (CDR, PDF, SVG, PNG) - Camisa Vetor`;

  // URLs limpas de mídia (SEO-friendly, sem tokens Firebase)
  const rawOgImages = [
    product.urls?.destaque ? buildCleanImageUrl(product.urls.destaque, slug, 'destaque') : null,
    product.urls?.capa ? buildCleanImageUrl(product.urls.capa, slug, 'capa') : null,
    ...(product.urls?.galeria || []).map((imgUrl: string, i: number) =>
      imgUrl ? buildCleanImageUrl(imgUrl, slug, `galeria-${i + 1}`) : null
    ),
  ].filter(Boolean) as string[];

  const ogImages = rawOgImages.length > 0 ? rawOgImages : ['https://camisavetor.com.br/icon.png'];
  const primaryImage = ogImages[0];

  // alt dinâmico da imagem principal
  const imageAlt = `Arte em vetor para camiseta ${name} - CDR, PDF, SVG, PNG`;

  return {
    title,
    description,
    openGraph: {
      title: `${name} | Camisa Vetor`,
      description,
      url: `https://camisavetor.com.br/product/${slug}`,
      siteName: 'Camisa Vetor',
      type: 'website',
      images: ogImages.map((url, i) => ({
        url,
        width: 1200,
        height: 1200,
        alt: i === 0 ? imageAlt : `${name} — imagem ${i + 1}`,
      })),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | Vetor Editável - Camisa Vetor`,
      description,
      images: [primaryImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
      },
    },
    alternates: {
      canonical: `https://camisavetor.com.br/product/${slug}`,
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// PAGE SERVER COMPONENT
// ─────────────────────────────────────────────────────────────────
export default async function Page({ params }: Props) {
  const id = params.id;

  try {
    let product: any = null;
    const docRef = adminDb.collection('products').doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      product = { id: docSnap.id, ...docSnap.data() };
      if (product.slug && product.slug !== id) {
        permanentRedirect(`/product/${product.slug}`);
      }
    } else {
      const slugQuery = await adminDb.collection('products').where('slug', '==', id).limit(1).get();
      if (!slugQuery.empty) {
        const doc = slugQuery.docs[0];
        product = { id: doc.id, ...doc.data() };
      }
    }

    if (!product) return notFound();

    // Limpeza de dados — converte Timestamps do Firebase em tipos simples
    const serializedProduct = JSON.parse(JSON.stringify(product));

    // Segurança: remove URLs de download do payload público enviado ao navegador
    if (serializedProduct.urls) delete serializedProduct.urls.download;
    delete serializedProduct.downloadUrl;
    delete serializedProduct.fileUrl;

    const slug = serializedProduct.slug || serializedProduct.id;
    const name = serializedProduct.name || 'Vetor Profissional';
    const category = serializedProduct.category || '';

    // ── IMAGENS ABSOLUTAS E LIMPAS PARA O JSON-LD ─────────────
    const rawProductImages = [
      serializedProduct.urls?.capa
        ? buildCleanImageUrl(serializedProduct.urls.capa, slug, 'capa')
        : null,
      serializedProduct.urls?.destaque
        ? buildCleanImageUrl(serializedProduct.urls.destaque, slug, 'destaque')
        : null,
      ...(serializedProduct.urls?.galeria || []).map((imgUrl: string, i: number) =>
        imgUrl ? buildCleanImageUrl(imgUrl, slug, `galeria-${i + 1}`) : null
      ),
    ].filter(Boolean) as string[];

    const productImages = Array.from(new Set(rawProductImages)).map(img =>
      img.startsWith('http') ? img : `https://camisavetor.com.br${img.startsWith('/') ? '' : '/'}${img}`
    );

    if (productImages.length === 0) {
      productImages.push('https://camisavetor.com.br/icon.png');
    }

    const priceNum = Number(serializedProduct.price || 0);
    const formattedPrice = isNaN(priceNum) ? '0.00' : priceNum.toFixed(2);

    // ── PRODUCT JSON-LD (Rich Snippet Google) ─────────────────
    const productJsonLd = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name,
      image: productImages,
      description:
        serializedProduct.description ||
        `Arte em vetor editável ${name}. Inclui CDR, PDF, SVG e PNG em alta resolução.`,
      sku: serializedProduct.id || slug,
      brand: {
        '@type': 'Brand',
        name: 'Camisa Vetor',
      },
      offers: {
        '@type': 'Offer',
        url: `https://camisavetor.com.br/product/${slug}`,
        priceCurrency: 'BRL',
        price: formattedPrice,
        priceValidUntil: '2027-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: 'Camisa Vetor',
        },
      },
    };

    // ── BREADCRUMBLIST JSON-LD ──────────────────────────────────
    const breadcrumbItems: any[] = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: 'https://camisavetor.com.br',
      },
    ];

    if (category) {
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 2,
        name: category,
        item: `https://camisavetor.com.br/?category=${encodeURIComponent(category)}`,
      });
    }

    breadcrumbItems.push({
      '@type': 'ListItem',
      position: breadcrumbItems.length + 1,
      name,
      item: `https://camisavetor.com.br/product/${slug}`,
    });

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems,
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <ProductDetailsWrapper product={serializedProduct} />
      </>
    );
  } catch (error) {
    console.error('Erro ao renderizar produto:', error);
    return notFound();
  }
}