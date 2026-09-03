'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Home, Shirt, MessageCircle, User, ShoppingCart, Search, X, ChevronRight, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useGeo } from '@/lib/i18n/GeoContext';
import { safeLocalStorage } from '@/lib/safeStorage';

function HeaderContent({ onSearch }: { onSearch?: (term: string) => void }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [isMounted, setIsMounted] = useState(false);
    const [dbCategories, setDbCategories] = useState<string[]>([]);
    const [loadingCats, setLoadingCats] = useState(true);

    const desktopSearchRef = useRef<HTMLInputElement>(null);
    const mobileSearchRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const whatsappUrl = 'https://wa.me/558791425634';

    // Studio é uma aplicação separada — o Header do e-commerce não deve aparecer
    if (pathname.startsWith('/studio')) return null;

    const { t, tp } = useGeo();

    useEffect(() => {
        setIsMounted(true);

        const updateCart = () => {
            try {
                const raw = safeLocalStorage.getItem('camisavetor_cart');
                const cart = raw ? JSON.parse(raw) : [];
                setCartCount(cart.reduce((acc: number, item: any) => acc + item.quantity, 0));
            } catch { setCartCount(0); }
        };

        updateCart();
        window.addEventListener('cart-updated', updateCart);
        window.addEventListener('storage', updateCart);
        return () => {
            window.removeEventListener('cart-updated', updateCart);
            window.removeEventListener('storage', updateCart);
        };
    }, []);

    // Busca categorias sob demanda somente ao abrir o menu lateral
    useEffect(() => {
        if (!isDrawerOpen || dbCategories.length > 0) return;

        const fetchCategories = async () => {
            setLoadingCats(true);
            try {
                const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
                const snap = await getDocs(q);
                const names = snap.docs
                    .map(d => d.data().name as string)
                    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
                setDbCategories([t('allCategories'), ...names]);
            } catch {
                setDbCategories([t('allCategories'), 'Formatura', 'Futebol', 'Gospel', '9º Ano']);
            } finally {
                setLoadingCats(false);
            }
        };

        fetchCategories();
    }, [isDrawerOpen, dbCategories.length, t]);

    // Bloquear rolagem do body quando o drawer estiver aberto
    useEffect(() => {
        if (isDrawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isDrawerOpen]);

    // 🛡️ PROTEÇÃO ADMIN: Não renderiza o menu na página de admin
    if (pathname === '/admin') return null;

    const navigate = (type: 'search' | 'category', value: string) => {
        setDrawerOpen(false);
        setMobileSearchOpen(false);
        setSearchTerm('');
        const term = value.trim();
        if (!term || (type === 'category' && term === t('allCategories'))) { router.push('/'); return; }
        router.push(`/?${type === 'category' ? 'category' : 'search'}=${encodeURIComponent(term)}`);
    };

    const handleGoHome = (e: React.MouseEvent) => {
        setDrawerOpen(false);
        setMobileSearchOpen(false);
        setSearchTerm('');

        // Se já estiver na página inicial (/), previne navegação desnecessária e força o scroll ao topo
        if (pathname === '/') {
            const hasQuery = searchParams && (
                (searchParams.get ? searchParams.get('search') : null) || 
                (searchParams.get ? searchParams.get('category') : null)
            );
            if (hasQuery) {
                router.push('/');
            }
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        } else {
            // Se estiver em outra página (produto, blog, perfil), navega para a Home e rola ao topo
            router.push('/');
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        }
    };

    const openMobileSearch = () => {
        setMobileSearchOpen(true);
        setTimeout(() => mobileSearchRef.current?.focus(), 150);
    };

    const CartBadge = ({ size = 16 }: { size?: number }) =>
        (isMounted && cartCount > 0) ? (
            <span
                className="absolute -top-1 -right-1 bg-[#fe7302] text-white font-bold flex items-center justify-center rounded-full border border-[#1a1a1a] animate-in zoom-in duration-300"
                style={{ fontSize: 9, minWidth: size, height: size }}
            >
                {cartCount}
            </span>
        ) : null;

    const laranjaHover = 'hover:text-[#fe7302] transition-colors duration-200';

    /* ─────────────────────────────────────────
       CATEGORIES DRAWER (shared mobile+desktop)
    ───────────────────────────────────────── */
    const CategoriesDrawer = () => (
        <>
            {isDrawerOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] touch-none"
                    onClick={() => setDrawerOpen(false)}
                />
            )}
            <div className={`fixed top-0 right-0 h-full w-[300px] bg-white z-[70] shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="p-6 flex items-center justify-between border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <Shirt size={18} className="text-[#fe7302]" />
                            <span className="text-sm font-bold uppercase tracking-widest text-[#202124]">{t('categories')}</span>
                        </div>
                        <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                            <X size={20} />
                        </button>
                    </div>
                    <nav className="flex-1 overflow-y-auto py-2 no-scrollbar">
                        {loadingCats ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-300" /></div>
                        ) : (
                            dbCategories.map(cat => {
                                const currentCat = searchParams?.get ? searchParams.get('category') : null;
                                const isSelected = currentCat === cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => navigate('category', cat)}
                                        className={`category-drawer-item category-drawer-link w-full flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-all group border-b border-gray-50 text-left ${isSelected ? 'bg-orange-50/40' : ''}`}
                                    >
                                        <span className={`sidebar-nav-link sidebar-link uppercase text-xs font-semibold text-slate-700 tracking-[0.025em] transition-colors ${isSelected ? '!text-[#fe7302] !font-bold' : 'group-hover:text-[#0f172a]'}`}>{tp(cat)}</span>
                                        <ChevronRight size={13} className={`${isSelected ? 'text-[#fe7302]' : 'text-gray-300'} group-hover:translate-x-1 transition-transform`} />
                                    </button>
                                );
                            })
                        )}
                    </nav>
                    <div className="p-6 border-t border-gray-50 bg-gray-50/30 text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">Camisa Vetor © 2026</p>
                    </div>
                </div>
            </div>
            <style jsx global>{`.no-scrollbar::-webkit-scrollbar{display:none!important}.no-scrollbar{-ms-overflow-style:none!important;scrollbar-width:none!important}`}</style>
        </>
    );

    return (
        <>
            <CategoriesDrawer />

            {/* ═══════════════════════════════════════
                MOBILE LAYOUT — 100% inalterado
            ═══════════════════════════════════════ */}

            {/* MOBILE: Pill horizontal no topo */}
            <div className="lg:hidden fixed top-3 left-1/2 -translate-x-1/2 w-[90%] z-50 flex items-center justify-center bg-[#1c1c1e]/95 backdrop-blur-xl rounded-full h-12 px-4 shadow-xl border border-white/5 relative">
                {/* Esquerda: logo icon */}
                <Link href="/" onClick={handleGoHome} className="absolute left-4">
                    <img src="/logo-icon.png" alt="Camisa Vetor" className="w-7 h-7 object-contain" />
                </Link>

                {/* Centro: logo nome */}
                <Link href="/" onClick={handleGoHome} className="flex items-center">
                    <Image priority src="/logo.svg" alt="Camisa Vetor" width={100} height={18} className="h-[15px] w-auto" />
                </Link>

                {/* Direita: WHATSAPP */}
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={`absolute right-4 text-white/60 hover:text-[#25D366] transition-colors`}>
                    <MessageCircle size={20} />
                </a>
            </div>

            {/* Mobile Search bar — expande sobre o pill com fundo branco sólido */}
            <div
                className={`lg:hidden fixed top-3 left-1/2 -translate-x-1/2 w-[90%] z-[55] flex items-center rounded-full bg-white border border-slate-200 shadow-2xl overflow-hidden transition-all duration-300 ease-out ${isMobileSearchOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                style={{ height: 48 }}
            >
                <Search size={18} className="text-[#fe7302] ml-4 flex-shrink-0 pointer-events-none" />
                <input
                    ref={mobileSearchRef}
                    type="text"
                    placeholder={t('searchPlaceholder') || 'Pesquisar vetor...'}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && navigate('search', searchTerm)}
                    className="flex-1 bg-white text-slate-900 placeholder-slate-400 text-sm font-medium outline-none px-3 h-full"
                />
                <button
                    onClick={() => {
                        setMobileSearchOpen(false);
                        setSearchTerm('');
                    }}
                    className="p-2 mr-2 text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label="Fechar busca"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Bottom tab bar (mobile) */}
            <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] z-50">
                <div className="flex items-center justify-around rounded-full bg-[#1a1a1a]/95 backdrop-blur-xl h-14 shadow-lg border border-white/5 px-2">
                    <Link href="/" onClick={handleGoHome} className="p-2 text-white/70"><Home size={23} className={laranjaHover} /></Link>
                    <button onClick={() => setDrawerOpen(true)} className="p-2 text-white/70"><Shirt size={23} className={laranjaHover} /></button>
                    <button onClick={openMobileSearch} className="p-2 text-white/70">
                        <Search size={23} className={laranjaHover} />
                    </button>
                    <Link href="/carrinho" className="relative p-2 text-white/70">
                        <ShoppingCart size={23} className={laranjaHover} />
                        <CartBadge size={15} />
                    </Link>
                    <Link href="/perfil" className="p-2 text-white/70"><User size={23} className={laranjaHover} /></Link>
                </div>
            </nav>

            {/* ═══════════════════════════════════════
                DESKTOP — Navbar Horizontal Fixa no Topo (>= 1024px)
            ═══════════════════════════════════════ */}
            <header className="hidden lg:flex items-center justify-between sticky top-0 z-50 w-full px-8 xl:px-12 h-20 bg-[#000000] border-b border-[#1e293b] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">

                {/* ── ESQUERDA: Logo ── */}
                <Link href="/" onClick={handleGoHome} className="flex-shrink-0 flex items-center gap-3.5 group">
                    <img src="/logo-icon.png" alt="Camisa Vetor" className="w-10 h-10 object-contain group-hover:scale-105 transition-transform duration-200" />
                    <Image
                        priority
                        src="/logo.svg"
                        alt="Camisa Vetor"
                        width={145}
                        height={26}
                        className="h-[22px] w-auto group-hover:opacity-95 transition-opacity"
                    />
                </Link>

                {/* ── CENTRO: Barra de busca ── */}
                <div className="flex-1 max-w-[560px] mx-8 xl:mx-12 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#fe7302] pointer-events-none" />
                    <input
                        ref={desktopSearchRef}
                        type="text"
                        placeholder={t('searchPlaceholderDesktop') || 'Pesquisar vetor...'}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') navigate('search', searchTerm);
                            if (e.key === 'Escape') setSearchTerm('');
                        }}
                        className="w-full h-12 pl-12 pr-11 rounded-full bg-white border border-[#e2e8f0] text-[#0f172a] text-sm font-medium outline-none placeholder-[#64748b] focus:border-[#fe7302] focus:shadow-[0_0_0_3px_rgba(254,115,2,0.2)] transition-all duration-200"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569] transition-colors p-1 cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* ── DIREITA: Links e Ações ── */}
                <nav className="flex items-center gap-1.5 xl:gap-2">
                    {/* Início */}
                    <Link
                        href="/"
                        onClick={handleGoHome}
                        className="flex items-center gap-2.5 px-3.5 xl:px-4 py-2.5 rounded-xl text-slate-200 text-[15px] font-semibold hover:text-white hover:bg-white/[0.08] transition-all duration-200"
                    >
                        <Home size={20} className="text-slate-300" />
                        <span>{tp(t('navHome'))}</span>
                    </Link>

                    {/* Categorias */}
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="flex items-center gap-2.5 px-3.5 xl:px-4 py-2.5 rounded-xl text-slate-200 text-[15px] font-semibold hover:text-white hover:bg-white/[0.08] transition-all duration-200 cursor-pointer"
                    >
                        <Shirt size={20} className="text-slate-300" />
                        <span>{tp(t('navCategories'))}</span>
                    </button>

                    {/* Perfil */}
                    <Link
                        href="/perfil"
                        className="flex items-center gap-2.5 px-3.5 xl:px-4 py-2.5 rounded-xl text-slate-200 text-[15px] font-semibold hover:text-white hover:bg-white/[0.08] transition-all duration-200"
                    >
                        <User size={20} className="text-slate-300" />
                        <span>{tp(t('navProfile'))}</span>
                    </Link>

                    {/* Suporte WhatsApp */}
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-3.5 xl:px-4 py-2.5 rounded-xl text-slate-200 text-[15px] font-semibold hover:text-white hover:bg-white/[0.08] transition-all duration-200"
                    >
                        <MessageCircle size={20} className="text-slate-300" />
                        <span>{tp(t('navSupport'))}</span>
                    </a>

                    {/* Separador visual */}
                    <div className="w-px h-7 bg-white/10 mx-2" />

                    {/* Carrinho — botão destacado com badge */}
                    <Link
                        href="/carrinho"
                        className="relative flex items-center gap-2.5 px-5 py-2.5 h-11 rounded-xl bg-[#fe7302] text-white text-sm font-bold hover:bg-[#ff8520] transition-all duration-200 shadow-lg shadow-orange-600/20 active:scale-95"
                    >
                        <ShoppingCart size={19} />
                        <span>{tp(t('navCart'))}</span>
                        {isMounted && cartCount > 0 && (
                            <span
                                className="bg-white text-[#fe7302] font-black flex items-center justify-center rounded-full ml-0.5"
                                style={{ fontSize: 10.5, minWidth: 20, height: 20, paddingInline: 5 }}
                            >
                                {cartCount}
                            </span>
                        )}
                    </Link>
                </nav>
            </header>
        </>
    );
}

export default function Header(props: { onSearch?: (term: string) => void }) {
    return (
        <Suspense fallback={<div />}>
            <HeaderContent {...props} />
        </Suspense>
    );
}