import { adminDb } from '@/lib/firebaseAdmin';
import { notFound, permanentRedirect } from 'next/navigation';
import ProductDetailsWrapper from '@/components/ProductDetailsWrapper';
import { Metadata, ResolvingMetadata } from 'next';

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

  const name = product.name || 'Vetor Profissional';
  const description = product.description || `Baixe agora o ${name} em alta resolução. Arte editável ideal para sublimação, serigrafia e transfer. Download imediato após a compra.`;

  // Prioridade: destaque (vitrine principal) → capa → logo do site
  // O Google usa a primeira imagem como principal nos resultados
  const ogImages = [
    product.urls?.destaque,
    product.urls?.capa,
    ...(product.urls?.galeria || []),
  ].filter(Boolean) as string[];
  const primaryImage = ogImages[0] || '/logo-social.png';

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
    alternates: {
      canonical: `https://camisavetor.com/product/${product.slug || product.id}`,
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

    // Dados Estruturados (JSON-LD) para o Google
    // Monta array completo de imagens: destaque primeiro (vitrine principal),
    // depois capa, depois galeria — o Google usa a 1ª como imagem principal
    const productImages = [
      serializedProduct.urls?.destaque,
      serializedProduct.urls?.capa,
      ...(serializedProduct.urls?.galeria || []),
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
        'url': `https://camisavetor.com/product/${serializedProduct.slug || serializedProduct.id}`
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