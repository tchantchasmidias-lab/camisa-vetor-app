import { adminDb } from '@/lib/firebaseAdmin';
import { notFound, permanentRedirect } from 'next/navigation';
import ProductDetailsWrapper from '@/components/ProductDetailsWrapper';
import { Metadata, ResolvingMetadata } from 'next';
import { buildCleanImageUrl } from '@/lib/mediaUtils';

interface Props {
  params: { id: string };
}

// 🚀 GERADOR DE METADATA (SEO PREMIUM)
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;
  
  // Busca o produto (tenta por ID primeiro, depois por Slug)
  let product: any = null;
  const docRef = adminDb.collection('products').doc(id);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    product = { id: docSnap.id, ...docSnap.data() };
    // Se o acesso foi por ID mas o produto tem slug, redireciona permanentemente (SEO 301/308)
    if (product.slug && product.slug !== id) {
      permanentRedirect(`/product/${product.slug}`);
    }
  } else {
    // Tenta buscar por slug (RG)
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
  const description = product.description || `Baixe agora o ${name} em alta resolução. Arte editável ideal para sublimação, serigrafia e transfer. Download imediato após a compra.`;

  // 🚀 TAREFA 1: Exposição de URLs limpas e amigáveis para mídias
  const rawOgImages = [
    product.urls?.destaque ? buildCleanImageUrl(product.urls.destaque, slug, 'destaque') : null,
    product.urls?.capa ? buildCleanImageUrl(product.urls.capa, slug, 'capa') : null,
    ...(product.urls?.galeria || []).map((imgUrl: string, i: number) =>
      imgUrl ? buildCleanImageUrl(imgUrl, slug, `galeria-${i + 1}`) : null
    ),
  ].filter(Boolean) as string[];

  const ogImages = rawOgImages.length > 0 ? rawOgImages : ['https://camisavetor.com.br/opengraph-image'];
  const primaryImage = ogImages[0];

  return {
    title: `${name} | Vetor Editável Profissional`,
    description: description,
    openGraph: {
      title: `${name} | Camisa Vetor`,
      description: description,
      images: ogImages.length > 0 ? ogImages : ['/logo-social.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description: description,
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
      canonical: `https://camisavetor.com.br/product/${product.slug || product.id}`,
    }
  };
}

export default async function Page({ params }: Props) {
  const id = params.id;
  
  try {
    let product: any = null;
    const docRef = adminDb.collection('products').doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      product = { id: docSnap.id, ...docSnap.data() };
      // Se o acesso foi por ID mas o produto tem slug, redireciona permanentemente (SEO 301/308)
      if (product.slug && product.slug !== id) {
        permanentRedirect(`/product/${product.slug}`);
      }
    } else {
      // Tenta buscar por slug (RG)
      const slugQuery = await adminDb.collection('products').where('slug', '==', id).limit(1).get();
      if (!slugQuery.empty) {
        const doc = slugQuery.docs[0];
        product = { id: doc.id, ...doc.data() };
      }
    }

    if (!product) {
      return notFound();
    }

    // 🧹 LIMPEZA DE DADOS (IMPORTANTE PARA SERVER COMPONENTS)
    // Converte Timestamps e outros objetos do Firebase em tipos simples (string/number)
    const serializedProduct = JSON.parse(JSON.stringify(product));

    // 🛡️ SEGURANÇA: Remove links diretos de download do payload público enviado ao navegador
    if (serializedProduct.urls) {
      delete serializedProduct.urls.download;
    }
    delete serializedProduct.downloadUrl;
    delete serializedProduct.fileUrl;

    // Dados Estruturados (JSON-LD) para o Google
    // Monta array completo de imagens: destaque primeiro (vitrine principal),
    // depois capa, depois galeria — o Google usa a 1ª como imagem principal
    const slug = serializedProduct.slug || serializedProduct.id;
    const productImages = [
      serializedProduct.urls?.destaque ? buildCleanImageUrl(serializedProduct.urls.destaque, slug, 'destaque') : null,
      serializedProduct.urls?.capa ? buildCleanImageUrl(serializedProduct.urls.capa, slug, 'capa') : null,
      ...(serializedProduct.urls?.galeria || []).map((imgUrl: string, i: number) =>
        imgUrl ? buildCleanImageUrl(imgUrl, slug, `galeria-${i + 1}`) : null
      ),
    ].filter(Boolean);

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': serializedProduct.name,
      'image': productImages.length === 1 ? productImages[0] : productImages,
      'description': serializedProduct.description || `Vetor editável de ${serializedProduct.name}`,
      // Atributos obrigatórios do Google Merchant Center para produtos de vestuário/arte
      // Usa campo do Firestore se existir, senão aplica padrão ideal para produtos digitais
      'color': serializedProduct.color || 'Multicolor',
      'gender': serializedProduct.gender || 'unisex',
      'age_group': serializedProduct.ageGroup || 'adult',
      'size': serializedProduct.size || 'One Size',
      'brand': {
        '@type': 'Brand',
        'name': 'Camisa Vetor'
      },
      'offers': {
        '@type': 'Offer',
        'price': serializedProduct.price,
        'priceCurrency': 'BRL',
        'availability': 'https://schema.org/InStock',
        'url': `https://camisavetor.com.br/product/${serializedProduct.slug || serializedProduct.id}`
      }
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ProductDetailsWrapper product={serializedProduct} />
      </>
    );
  } catch (error) {
    console.error("Erro ao renderizar produto:", error);
    return notFound();
  }
}