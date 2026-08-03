'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Star, Download, Shirt, Info, CheckCircle2, Loader2, ExternalLink, Megaphone, Search, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useGeo } from '@/lib/i18n/GeoContext';

export default function ProductDetailView({ product }: { product: any }) {
  const [selectedImage, setSelectedImage] = useState(product?.urls?.destaque || '');
  const [isAdding, setIsAdding] = useState(false);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [sidebarBanner, setSidebarBanner] = useState<{ imageUrl: string, link: string } | null>(null);
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  
  // ESTADOS PARA O ZOOM E SLIDER
  const [zoomPos, setZoomPos] = useState('center');
  const [isZoomed, setIsZoomed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ESTADOS DE AVALIAÇÃO
  const [user, setUser] = useState<User | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  
  const { t, tp, formatPrice } = useGeo();

  const router = useRouter();

  // 0. VERIFICAÇÃO DE USUÁRIO
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 0.5 CARREGAR AVALIAÇÕES
  useEffect(() => {
    if (!product?.id) return;
    
    const fetchRatings = async () => {
      try {
        const ratingsRef = collection(db, "products", product.id, "ratings");
        const rSnap = await getDocs(ratingsRef);
        
        let sum = 0;
        let count = 0;
        let currentUserRating = null;

        rSnap.forEach(doc => {
          const data = doc.data();
          sum += data.rating;
          count += 1;
          if (user && doc.id === user.uid) {
            currentUserRating = data.rating;
          }
        });

        if (count > 0) {
          setAverageRating(sum / count);
        }
        setTotalRatings(count);
        if (currentUserRating !== null) {
          setUserRating(currentUserRating);
        }
      } catch (e) {
        console.error("Erro ao carregar avaliações", e);
      }
    };

    fetchRatings();
  }, [product?.id, user]);

  // FUNÇÃO DE ENVIAR AVALIAÇÃO
  const handleRate = async (rating: number) => {
    if (!user || !product?.id) return;
    setIsSubmittingRating(true);
    try {
      const ratingDocRef = doc(db, "products", product.id, "ratings", user.uid);
      await setDoc(ratingDocRef, {
        rating,
        createdAt: serverTimestamp()
      });
      setUserRating(rating);
      
      const newTotal = totalRatings + 1;
      const newAverage = ((averageRating * totalRatings) + rating) / newTotal;
      setAverageRating(newAverage);
      setTotalRatings(newTotal);

    } catch (e) {
      console.error("Erro ao enviar avaliação", e);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // 1. CARREGAR DADOS DA SIDEBAR
  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const cSnap = await getDocs(query(collection(db, "categories"), orderBy("name", "asc")));
        const catNames = cSnap.docs.map(d => d.data().name as string);
        catNames.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
        setDbCategories(catNames);
        const bSnap = await getDoc(doc(db, "configuracoes", "sidebar_banner"));
        if (bSnap.exists()) setSidebarBanner(bSnap.data() as any);
      } catch (e) { console.error(e); } finally { setLoadingSidebar(false); }
    };
    fetchSidebarData();
    if (product?.urls?.destaque) setSelectedImage(product.urls.destaque);
  }, [product]);

  if (!product) return null;

  const galleryImages = Array.from(
    new Set([
      product.urls?.destaque,
      ...(product.urls?.galeria || [])
    ].filter(Boolean))
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomPos(`${x}% ${y}%`);
  };

  const handleThumbnailClick = (url: string, index: number) => {
    setSelectedImage(url);
    setIsZoomed(false);
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({ left: width * index, behavior: 'smooth' });
    }
  };

  const handleBuyNow = () => {
    setIsAdding(true);
    const cartItem = {
      id: product.id, name: product.name, price: Number(product.price),
      image: product.urls?.capa || product.urls?.destaque, quantity: 1
    };
    const currentCart = JSON.parse(localStorage.getItem('camisavetor_cart') || '[]');
    if (!currentCart.some((item: any) => item.id === product.id)) currentCart.push(cartItem);
    localStorage.setItem('camisavetor_cart', JSON.stringify(currentCart));
    window.dispatchEvent(new Event('cart-updated'));
    setTimeout(() => router.push('/carrinho'), 500);
  };

  return (
    <div className="w-full bg-white font-sans text-[#4a4a4a] animate-in fade-in duration-700">
      <div className="max-w-[1400px] mx-auto px-4 pt-0 pb-4">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">

          {/* COLUNA 1: GALERIA INTERATIVA */}
          <div className="w-full lg:w-[45%]">
            <div 
              ref={scrollRef}
              className={`relative aspect-square w-full bg-[#f8f9fa] rounded-[2.5rem] overflow-x-auto lg:overflow-hidden flex snap-x snap-mandatory no-scrollbar border border-[#dadce0] shadow-sm ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
              onClick={() => setIsZoomed(!isZoomed)}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => { setIsZoomed(false); setZoomPos('center'); }}
            >
               {galleryImages.map((url, idx) => (
                 <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
                    <Image 
                      src={url} 
                      alt={idx === 0 ? tp(product.name) : `${tp(product.name)} — imagem ${idx + 1}`}
                      fill 
                      quality={100}
                      unoptimized={true}
                      sizes="(max-width: 768px) 100vw, 1000px"
                      className={`object-cover transition-transform duration-300 ease-out pointer-events-none lg:pointer-events-auto ${isZoomed && selectedImage === url ? 'scale-[1.8]' : 'scale-100'}`}
                      style={{ transformOrigin: zoomPos }}
                      priority={idx === 0}
                    />
                 </div>
               ))}
               {!isZoomed && (
                 <div className="hidden lg:flex absolute bottom-6 right-6 bg-white/80 backdrop-blur p-3 rounded-full shadow-lg pointer-events-none animate-bounce">
                    <Search size={18} className="text-[#fe7302]" />
                 </div>
               )}
            </div>
           
            <div className="grid grid-cols-4 gap-3 mt-4">
              {galleryImages.map((url: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleThumbnailClick(url, index)}
                  className={`aspect-square relative rounded-2xl overflow-hidden border-2 transition-all duration-300 ${selectedImage === url ? 'border-[#fe7302] shadow-md shadow-orange-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <Image src={url} alt={`${tp(product.name)} — preview ${index + 1}`} fill sizes="128px" quality={100} className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* COLUNA 2: DETALHES E COMPRA - ALINHAMENTO DINÂMICO */}
          <div className="flex-1 w-full space-y-6 md:space-y-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[#202124] uppercase tracking-tight leading-[1.1] mb-3 text-center md:text-left">
                {tp(product.name)}
              </h1>
              
              {/* MÉDIA DE AVALIAÇÕES E SISTEMA DE VOTO */}
              <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      disabled={!!(isSubmittingRating || (user && userRating !== null))}
                      onMouseEnter={() => !userRating && setHoverRating(star)}
                      onMouseLeave={() => !userRating && setHoverRating(0)}
                      onClick={() => {
                        if (!user) {
                          router.push('/login');
                        } else if (!userRating) {
                          handleRate(star);
                        }
                      }}
                      className={`transition-all transform ${!userRating ? 'hover:scale-125 active:scale-95' : 'cursor-default'} disabled:opacity-80`}
                      title={!user ? t('loginToReview') : userRating ? t('ratingSuccess') : `${t('rate')} ${star} ${t('stars')}`}
                    >
                      <Star 
                        size={20} 
                        className={`transition-colors ${
                          star <= (hoverRating || (userRating || Math.round(averageRating))) 
                            ? "text-[#fe7302] fill-[#fe7302]" 
                            : "text-gray-300"
                        }`} 
                      />
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-[12px] font-bold text-[#5f6368]">
                    {averageRating > 0 ? averageRating.toFixed(1) : t('new')}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    ({totalRatings} {totalRatings === 1 ? t('review') : t('reviews')})
                  </span>
                  {isSubmittingRating && <Loader2 size={12} className="animate-spin text-[#fe7302]" />}
                  {userRating && <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider ml-2">{t('ratingSuccess')}</span>}
                </div>
              </div>

              <p className="text-[#5f6368] mt-6 text-[15px] leading-relaxed max-w-xl font-medium mx-auto md:mx-0 text-center md:text-left">
                {tp(product.description)}
              </p>
              
              <div className="mt-8 p-5 bg-[#e6f4ea]/60 border border-[#ceead6] rounded-[1.5rem] flex flex-col md:flex-row items-center md:items-start gap-4 shadow-sm shadow-green-900/5">
                <Info size={20} className="text-[#1e8e3e] flex-shrink-0 mt-0.5" />
                <div className="text-center md:text-left">
                  <span className="text-[11px] font-bold text-[#1e8e3e] uppercase tracking-wider block mb-0.5">{t('digitalProduct')}</span>
                  <span className="text-[11px] text-[#185a2d] uppercase font-medium leading-relaxed">
                    {t('digitalProductDesc')}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center md:text-left">
              <h3 className="text-[10px] font-bold text-[#999] uppercase tracking-[0.2em] mb-4">{t('availableFormats')}:</h3>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {(product.formats || ['CDR']).map((fmt: string) => (
                  <span key={fmt} className="border border-[#dadce0] bg-white rounded-xl py-2 px-4 text-[11px] font-bold text-[#202124] shadow-sm">.{fmt}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-6">
              <span className="text-3xl md:text-4xl font-black text-[#202124] tracking-tighter">
                {formatPrice(product.price || 0)}
              </span>
            </div>

            <button
              onClick={handleBuyNow}
              disabled={isAdding}
              className={`w-full max-w-md mx-auto md:mx-0 font-bold py-6 rounded-2xl flex items-center justify-center transition-all shadow-xl uppercase tracking-[0.2em] text-[12px] ${
                isAdding ? 'bg-[#202124] text-white' : 'bg-[#fe7302] text-white hover:bg-[#202124]'
              }`}
            >
              {isAdding ? <><Loader2 size={18} className="animate-spin mr-3"/> {t('processing')}...</> : t('addToCart')}
            </button>

            <button
              onClick={() => {
                const url = window.location.href;
                const text = `Olha essa estampa incrível na Camisa Vetor: ${product.name}`;
                const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n' + url)}`;
                window.open(whatsappUrl, '_blank');
              }}
              className="w-full max-w-md mx-auto md:mx-0 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border border-[#25D366]/30 text-[#25D366] bg-transparent hover:bg-[#25D366]/10 uppercase tracking-widest text-[10px]"
            >
              <MessageCircle size={16} />
              Compartilhar no WhatsApp
            </button>
          </div>

          {/* SIDEBAR: CATEGORIAS + PUBLICIDADE */}
          <aside className="hidden xl:block w-[240px]">
            <div className="mb-12">
              <nav className="space-y-1">
                {dbCategories.map((cat: string) => (
                  <Link key={cat} href={`/?category=${encodeURIComponent(cat)}`} className="flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-[#f8f9fa] transition-all group">
                    <Shirt size={16} className="text-[#dadce0] group-hover:text-[#fe7302] flex-shrink-0" />
                    <span className="text-[12px] font-bold text-[#5f6368] uppercase tracking-wider group-hover:text-[#202124]">{tp(cat)}</span>
                  </Link>
                ))}
              </nav>
            </div>

          </aside>

        </div>
      </div>
    </div>
  );
}