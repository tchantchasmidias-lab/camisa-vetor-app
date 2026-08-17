'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, getDocs, query,
  orderBy, doc, getDoc, setDoc, serverTimestamp
} from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  Star, Shirt, Info, Loader2, Search, MessageCircle,
  ChevronDown, ChevronUp, FileText, Zap, Package,
  CheckCircle2, Download, X, ChevronLeft, ChevronRight, Maximize2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useGeo } from '@/lib/i18n/GeoContext';
import RelatedProducts from '@/components/RelatedProducts';

// ─── Especificações Técnicas ──────────────────────────────────────────────────
const TECH_SPECS = [
  {
    icon: <FileText size={15} className="text-[#fe7302] flex-shrink-0 mt-0.5" />,
    label: 'Compatibilidade',
    value: 'CorelDRAW (versões recentes e legadas) · Illustrator · Inkscape · Softwares de corte e impressão',
  },
  {
    icon: <Zap size={15} className="text-[#fe7302] flex-shrink-0 mt-0.5" />,
    label: 'Perfil de Aplicação',
    value: 'Sublimação Total · DTF · Serigrafia · Transfer',
  },
  {
    icon: <CheckCircle2 size={15} className="text-[#fe7302] flex-shrink-0 mt-0.5" />,
    label: 'Edição',
    value: 'Arquivo 100% vetorizado e editável — cores e elementos separados por camadas',
  },
  {
    icon: <Download size={15} className="text-[#fe7302] flex-shrink-0 mt-0.5" />,
    label: 'Envio',
    value: 'Download automático e imediato após aprovação do pagamento',
  },
];

// ─── FAQ Items ────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    question: 'Como recebo o acesso aos arquivos após a compra?',
    answer:
      'O envio é 100% automático e imediato. Assim que o pagamento via Pix ou cartão for aprovado pelo sistema, o link de download é liberado instantaneamente na tela do seu pedido e também enviado diretamente para o seu e-mail cadastrado. Você poderá baixar os arquivos no seu computador ou celular sempre que precisar através do painel da sua conta.',
  },
  {
    question: 'Quais programas consigo usar para abrir e editar as artes?',
    answer:
      'Você recebe o pacote completo pronto para produção em 4 formatos: .CDR (CorelDRAW 100% editável com camadas e cores separadas), .PDF Vetorial (compatível com Corel, Illustrator e Photoshop), .SVG (ideal para plotters e softwares de corte) e .PNG em alta resolução com fundo transparente pronto para impressão ou mockups.',
  },
  {
    question: 'A arte serve para quais tipos de estamparia (Sublimação, DTF, Serigrafia)?',
    answer:
      'Sim, a arte é desenvolvida em curvas e alta definição, sendo perfeitamente compatível com qualquer técnica: Sublimação total ou localizada sem perda de qualidade, DTF Têxtil / Transfer Digital com fundo transparente, e Serigrafia / Silk-Screen com separação simples de cores.',
  },
];

// ─── FAQ Accordion Component ──────────────────────────────────────────────────
function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
              isOpen ? 'border-[#fe7302]/30 shadow-sm shadow-orange-50' : 'border-[#dadce0]'
            }`}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[#f8f9fa] transition-colors"
              aria-expanded={isOpen}
            >
              <span className="text-[13px] font-bold text-[#202124] leading-snug pr-2">
                {item.question}
              </span>
              {isOpen ? (
                <ChevronUp size={16} className="text-[#fe7302] flex-shrink-0" />
              ) : (
                <ChevronDown size={16} className="text-[#5f6368] flex-shrink-0" />
              )}
            </button>
            {isOpen && (
              <div className="px-5 pb-5 text-[13px] text-[#5f6368] leading-relaxed border-t border-[#f1f3f4]">
                <p className="mt-3">{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Breadcrumbs Component ────────────────────────────────────────────────────
function Breadcrumbs({ name, category }: { name: string; category?: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#5f6368] font-medium uppercase tracking-wider">
        <li>
          <Link href="/" className="hover:text-[#fe7302] transition-colors">
            Início
          </Link>
        </li>
        {category && (
          <>
            <li className="text-[#dadce0]">/</li>
            <li>
              <Link
                href={`/?category=${encodeURIComponent(category)}`}
                className="hover:text-[#fe7302] transition-colors"
              >
                {category}
              </Link>
            </li>
          </>
        )}
        <li className="text-[#dadce0]">/</li>
        <li className="text-[#202124] truncate max-w-[180px] md:max-w-[300px]" aria-current="page">
          {name}
        </li>
      </ol>
    </nav>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductDetailView({ product }: { product: any }) {
  const [selectedImage, setSelectedImage] = useState(product?.urls?.destaque || '');
  const [isAdding, setIsAdding] = useState(false);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [zoomPos, setZoomPos] = useState('center');
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const { t, tp, formatPrice } = useGeo();
  const router = useRouter();

  // ── 1. PRÉ-CARREGAMENTO EM SEGUNDO PLANO (0ms DELAY NA TROCA) ──
  useEffect(() => {
    if (typeof window === 'undefined' || !product) return;
    const imgsToPreload = Array.from(
      new Set([product.urls?.destaque, ...(product.urls?.galeria || [])].filter(Boolean))
    );
    imgsToPreload.forEach((imgUrl: any) => {
      if (imgUrl) {
        const img = new window.Image();
        img.src = imgUrl;
      }
    });
  }, [product]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!product?.id) return;
    const fetchRatings = async () => {
      try {
        const rSnap = await getDocs(collection(db, 'products', product.id, 'ratings'));
        let sum = 0, count = 0, cur: number | null = null;
        rSnap.forEach((d) => {
          const data = d.data();
          sum += data.rating; count++;
          if (user && d.id === user.uid) cur = data.rating;
        });
        if (count > 0) setAverageRating(sum / count);
        setTotalRatings(count);
        if (cur !== null) setUserRating(cur);
      } catch (e) { console.error(e); }
    };
    fetchRatings();
  }, [product?.id, user]);

  const handleRate = async (rating: number) => {
    if (!user || !product?.id) return;
    setIsSubmittingRating(true);
    try {
      await setDoc(doc(db, 'products', product.id, 'ratings', user.uid), {
        rating, createdAt: serverTimestamp()
      });
      setUserRating(rating);
      const newTotal = totalRatings + 1;
      setAverageRating((averageRating * totalRatings + rating) / newTotal);
      setTotalRatings(newTotal);
    } catch (e) { console.error(e); }
    finally { setIsSubmittingRating(false); }
  };

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const cSnap = await getDocs(query(collection(db, 'categories'), orderBy('name', 'asc')));
        const cats = cSnap.docs.map((d) => d.data().name as string);
        cats.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
        setDbCategories(cats);
      } catch (e) { console.error(e); }
    };
    fetchSidebarData();
    if (product?.urls?.destaque) setSelectedImage(product.urls.destaque);
  }, [product]);

  if (!product) return null;

  const productName = tp(product.name) || product.name || '';
  const productCategory = product.category || '';

  const galleryImages = Array.from(
    new Set([product.urls?.destaque, ...(product.urls?.galeria || [])].filter(Boolean))
  );

  // Troca direta e instantânea no clique (0ms de delay)
  const handleThumbnailClick = (url: string) => {
    setSelectedImage(url);
    setIsZoomed(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    setZoomPos(`${((e.pageX - left) / width) * 100}% ${((e.pageY - top) / height) * 100}%`);
  };

  const handleBuyNow = () => {
    setIsAdding(true);
    const cart = JSON.parse(localStorage.getItem('camisavetor_cart') || '[]');
    if (!cart.some((i: any) => i.id === product.id)) {
      cart.push({ id: product.id, name: product.name, price: Number(product.price), image: product.urls?.capa || product.urls?.destaque, quantity: 1 });
    }
    localStorage.setItem('camisavetor_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    setTimeout(() => router.push('/carrinho'), 500);
  };

  const handlePrevLightbox = () => {
    const currentIndex = galleryImages.indexOf(selectedImage);
    const prevIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    setSelectedImage(galleryImages[prevIndex]);
  };

  const handleNextLightbox = () => {
    const currentIndex = galleryImages.indexOf(selectedImage);
    const nextIndex = (currentIndex + 1) % galleryImages.length;
    setSelectedImage(galleryImages[nextIndex]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft') handlePrevLightbox();
      if (e.key === 'ArrowRight') handleNextLightbox();
    };
    if (isLightboxOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isLightboxOpen, selectedImage, galleryImages]);

  return (
    <div className="w-full bg-white font-sans text-[#4a4a4a] animate-in fade-in duration-700">
      <div className="max-w-[1400px] mx-auto px-4 pt-4 pb-12">

        {/* ══════════════════════════════════════════════════════
            BLOCO 1 — BREADCRUMBS
        ══════════════════════════════════════════════════════ */}
        <Breadcrumbs name={productName} category={productCategory} />

        {/* ══════════════════════════════════════════════════════
            BLOCO 2 — GRID PRINCIPAL: Galeria | Detalhes | Sidebar
        ══════════════════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 xl:gap-16 items-start">

          {/* ── COL 1: GALERIA ─────────────────────────────────── */}
          <div className="w-full lg:w-[42%] xl:w-[45%]">
            {/* Imagem Principal com Zoom & Fullscreen Lightbox */}
            <div
              className={`product-image-wrapper relative aspect-square w-full bg-[#f8f9fa] rounded-xl overflow-hidden border border-[#dadce0] shadow-sm select-none group cursor-pointer ${
                isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={() => setIsLightboxOpen(true)}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => { setIsZoomed(false); setZoomPos('center'); }}
            >
              {selectedImage && (
                <Image
                  src={selectedImage}
                  alt={`Arte em vetor para camiseta ${productName} - CDR, PDF, SVG, PNG`}
                  fill
                  quality={90}
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 700px"
                  className={`product-gallery-main-image object-cover transition-transform duration-300 ease-out pointer-events-none lg:pointer-events-auto rounded-xl ${
                    isZoomed ? 'scale-[1.8]' : 'scale-100'
                  }`}
                  style={{ transformOrigin: zoomPos }}
                  priority
                />
              )}
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-2.5 rounded-full shadow-md text-gray-700 group-hover:bg-[#fe7302] group-hover:text-white transition-all flex items-center justify-center">
                <Maximize2 size={16} />
              </div>
            </div>

            {/* Thumbnails — lazy load */}
            {galleryImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3 mt-4">
                {galleryImages.map((url: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleThumbnailClick(url)}
                    className={`aspect-square relative rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                      selectedImage === url
                        ? 'border-[#fe7302] shadow-md shadow-orange-100'
                        : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={url}
                      alt={`${productName} — preview ${index + 1}`}
                      fill
                      sizes="128px"
                      quality={70}
                      loading="lazy"
                      className="object-cover rounded-lg"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Card de Aviso — Imagem meramente ilustrativa */}
            <div className="product-mockup-disclaimer bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-[12px_14px] mt-[14px] text-center">
              <p className="disclaimer-title text-[13px] font-bold text-[#1e293b] mb-1">
                Imagem meramente ilustrativa
              </p>
              <p className="disclaimer-text text-[12.5px] leading-[1.45] text-[#475569] mb-1.5">
                Você receberá o <strong className="font-semibold text-[#1e293b]">arquivo digital aberto e 100% editável</strong> (frente, costas e mangas separadas), pronto para personalizar e produzir.
              </p>
              <p className="disclaimer-subtitle text-[11.5px] text-[#64748b] italic m-0">
                Essa imagem serve apenas para demonstrar o resultado final da estampa.
              </p>
            </div>
          </div>

          {/* ── COL 2: DETALHES DE COMPRA ──────────────────────── */}
          <div className="flex-1 w-full min-w-0 space-y-6">

            {/* 1. H1 — Nome */}
            <h1 className="text-2xl md:text-3xl font-black text-[#202124] uppercase tracking-tight leading-[1.1] text-center md:text-left">
              {productName}
            </h1>

            {/* 2. Contador de Downloads */}
            <div className="flex items-center justify-center md:justify-start gap-1.5 text-[12px] md:text-[13px] font-semibold text-[#fe7302]">
              <span>🔥 + Mais de {product.salesCount || product.downloadsCount || 100} downloads realizados</span>
            </div>

            {/* 3, 4, 5. BLOCO DE AÇÃO DE COMPRA (Preço, Botão Adicionar ao Carrinho, Selos de Confiança) */}
            <div className="space-y-4">
              {/* Preço em Destaque */}
              <div className="text-center md:text-left">
                <span className="text-3xl md:text-4xl font-black text-[#202124] tracking-tighter">
                  {formatPrice(product.price || 0)}
                </span>
              </div>

              {/* Botão Comprar */}
              <button
                onClick={handleBuyNow}
                disabled={isAdding}
                className={`w-full max-w-md mx-auto md:mx-0 font-bold py-5 rounded-2xl flex items-center justify-center transition-all shadow-xl uppercase tracking-[0.2em] text-[12px] ${
                  isAdding ? 'bg-[#202124] text-white' : 'bg-[#fe7302] text-white hover:bg-[#202124]'
                }`}
              >
                {isAdding ? (
                  <><Loader2 size={18} className="animate-spin mr-3" />{t('processing')}...</>
                ) : t('addToCart')}
              </button>

              {/* Linha de Badges de Confiança */}
              <div className="w-full max-w-md mx-auto md:mx-0 pt-1 flex items-center justify-center gap-2.5 md:gap-3 text-[13px] md:text-[14px] font-semibold text-[#1a202c]">
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="#2563eb" className="inline-block shrink-0">
                    <path d="M18 10v-4c0-3.313-2.687-6-6-6s-6 2.687-6 6v4h-3v14h18v-14h-3zm-10-4c0-2.206 1.794-4 4-4s4 1.794 4 4v4h-8v-4zm6 10.722v2.278c0 .552-.447 1-1 1s-1-.448-1-1v-2.278c-.595-.347-1-.984-1-1.722 0-1.104.896-2 2-2s2 .896 2 2c0 .738-.405 1.375-1 1.722z"/>
                  </svg>
                  <span>Compra segura</span>
                </span>
                <span className="text-gray-300 font-normal">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[16px]">⚡</span>
                  <span>Liberação rápida</span>
                </span>
                <span className="text-gray-300 font-normal">•</span>
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#25D366" className="inline-block shrink-0">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                  </svg>
                  <span>Suporte</span>
                </span>
              </div>
            </div>

            {/* 6. Card "PRODUTO DIGITAL" */}
            <div className="p-4 bg-[#e6f4ea]/60 border border-[#ceead6] rounded-[1.25rem] flex items-start gap-3 shadow-sm">
              <Info size={18} className="text-[#1e8e3e] flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-[#1e8e3e] uppercase tracking-wider block mb-0.5">
                  {t('digitalProduct')}
                </span>
                <span className="text-[11px] text-[#185a2d] font-medium leading-relaxed">
                  {t('digitalProductDesc')}
                </span>
              </div>
            </div>

            {/* 7. Badges de Formatos Disponíveis */}
            <div className="text-center md:text-left">
              <h3 className="text-[10px] font-bold text-[#999] uppercase tracking-[0.2em] mb-3">
                {t('availableFormats')}:
              </h3>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {(product.formats || ['CDR', 'PDF', 'SVG', 'PNG']).map((fmt: string) => (
                  <span
                    key={fmt}
                    className="border border-[#dadce0] bg-white rounded-xl py-1.5 px-4 text-[11px] font-bold text-[#202124] shadow-sm"
                  >
                    .{fmt}
                  </span>
                ))}
              </div>
            </div>

            {/* 8. Descrição curta do produto */}
            <p className="text-[#5f6368] text-[15px] leading-relaxed font-medium mx-auto md:mx-0 text-center md:text-left max-w-xl">
              {tp(product.description)}
            </p>

            {/* 9. Botão / Ação: Compartilhar no WhatsApp (Logo após a Descrição) */}
            <div className="product-share-whatsapp pt-1 flex items-center justify-center md:justify-start">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Olha essa arte em vetor para camisetas: ${product.name} - ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-share-wpp inline-flex items-center border border-[#e2e8f0] bg-white px-3.5 py-2 rounded-full text-[13px] font-semibold text-[#334155] no-underline hover:bg-[#f8fafc] hover:border-[#25D366] hover:text-[#16a34a] transition-all shadow-xs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#25D366" style={{ verticalAlign: 'middle', marginRight: '6px' }} className="shrink-0">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                </svg>
                <span>Compartilhar no WhatsApp</span>
              </a>
            </div>
          </div>

          {/* ── COL 3: SIDEBAR — CATEGORIAS ────────────────────── */}
          <aside className="hidden xl:block w-[220px] flex-shrink-0 pt-2">
            <h4 className="text-[10px] font-bold text-[#999] uppercase tracking-[0.2em] mb-4 px-3">
              Categorias
            </h4>
            <nav className="space-y-0.5">
              {dbCategories.map((cat: string) => (
                <Link
                  key={cat}
                  href={`/?category=${encodeURIComponent(cat)}`}
                  className={`flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-[#f8f9fa] transition-all group ${
                    cat === productCategory ? 'bg-[#fff4ec]' : ''
                  }`}
                >
                  <Shirt
                    size={14}
                    className={`flex-shrink-0 ${
                      cat === productCategory ? 'text-[#fe7302]' : 'text-[#dadce0] group-hover:text-[#fe7302]'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider truncate ${
                      cat === productCategory ? 'text-[#fe7302]' : 'text-[#5f6368] group-hover:text-[#202124]'
                    }`}
                  >
                    {tp(cat)}
                  </span>
                </Link>
              ))}
            </nav>
          </aside>
        </div>

        {/* ══════════════════════════════════════════════════════
            DIVISÓRIA SUTIL
        ══════════════════════════════════════════════════════ */}
        <div className="my-12 border-t border-[#f1f3f4]" />

        {/* ══════════════════════════════════════════════════════
            BLOCO 3 — ESPECIFICAÇÕES (50%) + FAQ (50%)
        ══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">

          {/* Coluna Esquerda — Especificações Técnicas */}
          <div>
            <h3 className="text-[11px] font-bold text-[#999] uppercase tracking-[0.2em] mb-5">
              Especificações Técnicas do Arquivo
            </h3>
            <div className="border border-[#dadce0] rounded-[1.5rem] overflow-hidden py-2">
              <ul>
                {TECH_SPECS.map((spec, i) => (
                  <li key={i} className="flex items-start gap-3 px-5 py-3.5">
                    {spec.icon}
                    <div>
                      <span className="text-[10px] font-bold text-[#5f6368] uppercase tracking-wider block mb-0.5">
                        {spec.label}
                      </span>
                      <span className="text-[12px] text-[#202124] font-medium leading-snug">
                        {spec.value}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Coluna Direita — FAQ Accordion */}
          <div>
            <h3 className="text-[11px] font-bold text-[#999] uppercase tracking-[0.2em] mb-5">
              Dúvidas Frequentes
            </h3>
            <FaqAccordion />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            BLOCO 4 — PRODUTOS RELACIONADOS
        ══════════════════════════════════════════════════════ */}
        {productCategory && (
          <RelatedProducts
            category={productCategory}
            currentProductId={product.id}
          />
        )}

        {/* ══════════════════════════════════════════════════════
            MODAL LIGHTBOX — FULLSCREEN ZOOM
        ══════════════════════════════════════════════════════ */}
        {isLightboxOpen && (
          <div
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-6 animate-in fade-in duration-200"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Barra Superior */}
            <div className="flex items-center justify-between w-full max-w-7xl mx-auto z-10 pt-2 px-2">
              <span className="text-white/80 text-[12px] md:text-[13px] font-bold tracking-widest uppercase truncate pr-4">
                {productName} {galleryImages.length > 1 ? `— (${galleryImages.indexOf(selectedImage) + 1}/${galleryImages.length})` : ''}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
                className="p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all shrink-0 active:scale-95"
                aria-label="Fechar zoom"
              >
                <X size={22} />
              </button>
            </div>

            {/* Container da Imagem em Tela Cheia */}
            <div
              className="relative flex-1 w-full max-w-6xl mx-auto my-3 flex items-center justify-center overflow-hidden select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedImage && (
                <Image
                  src={selectedImage}
                  alt={productName}
                  fill
                  quality={100}
                  unoptimized
                  className="object-contain max-h-[82vh] rounded-lg"
                />
              )}

              {/* Botões de Navegação Anterior / Próxima */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrevLightbox(); }}
                    className="absolute left-1 md:left-4 top-1/2 -translate-y-1/2 p-3 text-white bg-black/60 hover:bg-[#fe7302] rounded-full transition-all border border-white/10 shadow-xl active:scale-90"
                    aria-label="Imagem anterior"
                  >
                    <ChevronLeft size={28} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNextLightbox(); }}
                    className="absolute right-1 md:right-4 top-1/2 -translate-y-1/2 p-3 text-white bg-black/60 hover:bg-[#fe7302] rounded-full transition-all border border-white/10 shadow-xl active:scale-90"
                    aria-label="Próxima imagem"
                  >
                    <ChevronRight size={28} />
                  </button>
                </>
              )}
            </div>

            {/* Faixa de Miniaturas no Rodapé */}
            {galleryImages.length > 1 && (
              <div
                className="flex items-center justify-center gap-2 max-w-xl mx-auto z-10 py-1"
                onClick={(e) => e.stopPropagation()}
              >
                {galleryImages.map((url: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(url)}
                    className={`w-12 h-12 relative rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === url ? 'border-[#fe7302] scale-105 shadow-md shadow-orange-500/30' : 'border-transparent opacity-40 hover:opacity-100'
                    }`}
                  >
                    <Image src={url} alt={`Thumb ${index}`} fill className="object-cover rounded-lg" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}