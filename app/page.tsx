import type { Metadata } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import HomeClient, { Product } from '@/components/HomeClient';
import { Category } from '@/components/CategoryCarousel';
import { formatTitleCase } from '@/lib/stringUtils';
import { HomePromotions, DEFAULT_HOME_PROMOTIONS } from '@/lib/promotions';

export const revalidate = 300; // ISR: revalidação a cada 5 minutos para TTFB ultrarrápido com cache de borda

export const metadata: Metadata = {
  title: 'Camisa Vetor | Artes e Vetores Editáveis para Sublimação',
  description: 'Compre e baixe artes vetoriais profissionais editáveis em CorelDraw, PDF e SVG. Estampas exclusivas para sublimação, camisas personalizadas e eventos com download imediato.',
  keywords: [
    'vetor camisa',
    'artes para sublimação',
    'estampas editáveis coreldraw',
    'vetor interclasse',
    'camisa personalizada vetor',
    'download vetor sublimação'
  ],
  alternates: {
    canonical: 'https://camisavetor.com.br',
  },
  openGraph: {
    title: 'Camisa Vetor | Artes e Vetores Editáveis para Sublimação',
    description: 'Vetores profissionais e editáveis em CorelDraw, PDF e SVG para sublimação e estamparia.',
    url: 'https://camisavetor.com.br',
    siteName: 'Camisa Vetor',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: 'https://camisavetor.com.br/icon.png',
        width: 512,
        height: 512,
        alt: 'Camisa Vetor — Artes e Vetores Editáveis para Sublimação',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

async function getInitialProducts(): Promise<Product[]> {
  try {
    const productsSnap = await adminDb.collection('products').get();

    const productsData = productsSnap.docs.map(doc => {
      const data = doc.data();
      const rawCreated = data.createdAt;
      const rawUpdated = data.updatedAt;
      
      let createdTime = 0;
      if (rawCreated?.toMillis) {
        createdTime = rawCreated.toMillis();
      } else if (rawCreated?.seconds) {
        createdTime = rawCreated.seconds * 1000;
      } else if (typeof rawCreated === 'string' || typeof rawCreated === 'number') {
        createdTime = new Date(rawCreated).getTime() || 0;
      } else if (rawUpdated?.toMillis) {
        createdTime = rawUpdated.toMillis();
      } else if (rawUpdated?.seconds) {
        createdTime = rawUpdated.seconds * 1000;
      } else if (typeof rawUpdated === 'string' || typeof rawUpdated === 'number') {
        createdTime = new Date(rawUpdated).getTime() || 0;
      } else {
        createdTime = Date.now();
      }

      const formatsList: string[] = Array.isArray(data.formats)
        ? data.formats.map((f: any) => String(f).toUpperCase())
        : data.format
        ? [String(data.format).toUpperCase()]
        : [];

      return {
        id: doc.id,
        name: formatTitleCase(data.name || 'Sem nome'),
        price: Number(data.price) || 0,
        isFree: Boolean(data.isFree) || Number(data.price) === 0,
        category: data.category || 'Geral',
        slug: data.slug || doc.id,
        createdAt: createdTime,
        formats: formatsList,
        urls: {
          capa: data.urls?.capa || data.urls?.destaque || '',
          destaque: data.urls?.destaque || '',
        },
      };
    });

    // Ordena: mais recentes primeiro
    productsData.sort((a, b) => b.createdAt - a.createdAt);

    // Converte para JSON puro para evitar erros de serialização no Next.js
    return JSON.parse(JSON.stringify(productsData));
  } catch (error) {
    console.error('Erro ao carregar produtos no servidor (SSR):', error);
    return [];
  }
}

async function getInitialCategories(): Promise<Category[]> {
  try {
    const snap = await adminDb.collection('categories').get();
    const list = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        imageUrl: data.imageUrl || '',
      };
    });
    list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
    return JSON.parse(JSON.stringify(list));
  } catch (error) {
    console.error('Erro ao carregar categorias no servidor (SSR):', error);
    return [];
  }
}

async function getHomePromotions(): Promise<HomePromotions> {
  try {
    const docSnap = await adminDb.collection('configuracoes').doc('home_promotions').get();
    if (docSnap.exists) {
      const data = docSnap.data();
      // Retorna estritamente dados públicos e sanitizados para o cliente
      return {
        hero: {
          imageUrl: data?.hero?.imageUrl || '',
          mobileImageUrl: data?.hero?.mobileImageUrl || '',
          altText: data?.hero?.altText || 'Sua próxima estampa começa aqui — Camisa Vetor',
          linkUrl: data?.hero?.linkUrl || '',
        },
        collectionHighlight: {
          imageUrl: data?.collectionHighlight?.imageUrl || '',
          mobileImageUrl: data?.collectionHighlight?.mobileImageUrl || '',
          altText: data?.collectionHighlight?.altText || 'Coleção de Carnaval em cada detalhe — Camisa Vetor',
          linkUrl: data?.collectionHighlight?.linkUrl || '',
        },
      };
    }
  } catch (error) {
    console.warn('Configurações de promoções da home não encontradas ou erro no SSR, usando fallback:', error);
  }
  return DEFAULT_HOME_PROMOTIONS;
}

export default async function HomePage() {
  const [initialProducts, initialCategories, homePromotions] = await Promise.all([
    getInitialProducts(),
    getInitialCategories(),
    getHomePromotions(),
  ]);

  return (
    <HomeClient
      initialProducts={initialProducts}
      initialCategories={initialCategories}
      homePromotions={homePromotions}
    />
  );
}