'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Home, Shirt, MessageCircle, User, ShoppingCart, Search, X, ChevronRight, Loader2, PenTool } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useGeo } from '@/lib/i18n/GeoContext';

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
    
    const { t, tp } = useGeo();

    useEffect(() => {
        setIsMounted(true);

        const fetchCategories = async () => {
            try {
                const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
                const snap = await getDocs(q);
                setDbCategories([t('allCategories'), ...snap.docs.map(d => d.data().name)]);
            } catch {
                setDbCategories([t('allCategories'), 'Formatura', 'Futebol', 'Gospel', '9º Ano']);
            } finally {
                setLoadingCats(false);
            }
        };

        const updateCart = () => {
            try {
                const cart = JSON.parse(localStorage.getItem('camisavetor_cart') || '[]');
                setCartCount(cart.reduce((acc: number, item: any) => acc + item.quantity, 0));
            } catch { setCartCount(0); }
        };

        fetchCategories();
        updateCart();
        window.addEventListener('cart-updated', updateCart);
        window.addEventListener('storage', updateCart);
        return () => {
            window.removeEventListener('cart-updated', updateCart);
            window.removeEventListener('storage', updateCart);
        };
    }, []);

    // 🛡️ PROTEÇÃO ADMIN: Não renderiza o menu na página de admin
    if (pathname === '/admin') return null;

    const navigate = (type: 'search' | 'category', value: string) => {
        setDrawerOpen(false);
        setMobileSearchOpen(false);
        const term = value.trim();
        if (!term || (type === 'category' && term === t('allCategories'))) { router.push('/'); return; }
        router.push(`/?${type === 'category' ? 'category' : 'search'}=${encodeURIComponent(term)}`);
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
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
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
                            dbCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => navigate('category', cat)}
                                    className={`w-full flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-all group border-b border-gray-50 text-left ${searchParams.get('category') === cat ? 'bg-orange-50/40' : ''}`}
                                >
                                    <span className={`text-[12px] font-semibold uppercase tracking-wide transition-colors ${searchParams.get('category') === cat ? 'text-[#fe7302]' : 'text-[#5f6368] group-hover:text-[#202124]'}`}>{tp(cat)}</span>
                                    <ChevronRight size={13} className={`${searchParams.get('category') === cat ? 'text-[#fe7302]' : 'text-gray-300'} group-hover:translate-x-1 transition-transform`} />
                                </button>
                            ))
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
                MOBILE LAYOUT
            ═══════════════════════════════════════ */}

            {/* ═══ MOBILE: Pill horizontal no topo (ajustado para w-[90%] igual ao menu) ═══ */}
            <div className="md:hidden fixed top-3 left-1/2 -translate-x-1/2 w-[90%] z-50 flex items-center justify-center bg-[#1c1c1e]/95 backdrop-blur-xl rounded-full h-12 px-4 shadow-xl border border-white/5 relative">
                {/* Esquerda: logo icon (absoluto) */}
                <Link href="/" className="absolute left-4">
                    <img src="/logo-icon.png" alt="Camisa Vetor" className="w-7 h-7 object-contain" />
                </Link>

                {/* Centro: logo nome */}
                <Link href="/" className="flex items-center">
                    <Image priority src="/logo.svg" alt="Camisa Vetor" width={100} height={18} className="h-[15px] w-auto" />
                </Link>

                {/* Direita: só pesquisa (absoluto) */}
                <button onClick={openMobileSearch} className={`absolute right-4 text-white/60 ${laranjaHover}`}>
                    <Search size={20} />
                </button>
            </div>

            {/* Mobile Search bar — expande sobre o pill */}
            <div
                className={`md:hidden fixed top-3 left-1/2 -translate-x-1/2 w-[90%] z-[55] flex items-center rounded-full bg-[#1c1c1e]/98 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-300 ease-out ${isMobileSearchOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{ height: 48 }}
            >
                <Search size={16} className="text-[#fe7302] ml-4 flex-shrink-0" />
                <input
                    ref={mobileSearchRef}
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && navigate('search', searchTerm)}
                    className="flex-1 bg-transparent text-white placeholder-white/30 text-[13px] outline-none px-3 font-medium"
                />
                <button onClick={() => { setMobileSearchOpen(false); setSearchTerm(''); }} className="p-2 mr-2 text-white/40 hover:text-white transition-colors">
                    <X size={17} />
                </button>
            </div>

            {/* Bottom tab bar (mobile) */}
            <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] z-50">
                <div className="flex items-center justify-around rounded-full bg-[#1a1a1a]/95 backdrop-blur-xl h-14 shadow-lg border border-white/5 px-2">
                    <Link href="/" className="p-2 text-white/70"><Home size={23} className={laranjaHover} /></Link>
                    <button onClick={() => setDrawerOpen(true)} className="p-2 text-white/70"><Shirt size={23} className={laranjaHover} /></button>
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-white/70">
                        <MessageCircle size={23} className="hover:text-[#25D366] transition-colors" />
                    </a>
                    <Link href="/carrinho" className="relative p-2 text-white/70">
                        <ShoppingCart size={23} className={laranjaHover} />
                        <CartBadge size={15} />
                    </Link>
                    <Link href="/perfil" className="p-2 text-white/70"><User size={23} className={laranjaHover} /></Link>
                </div>
            </nav>

            {/* ═══════════════════════════════════════
                DESKTOP — Pill vertical flutuante (top-left)
            ═══════════════════════════════════════ */}
            <aside className="hidden md:block fixed left-4 top-4 z-50 group/pill">
                {/*
                  Estratégia de centralização:
                  - Pill fecha em w-[52px]
                  - Cada item tem um "slot" de ícone de 52px com justify-center
                  - Labels expandem além do slot quando hover (max-w-0 → max-w-[140px])
                  - Assim os ícones ficam sempre perfeitamente centrados no estado fechado
                */}
                <div className="flex flex-col bg-[#1c1c1e] rounded-3xl py-3 shadow-2xl transition-[width] duration-300 ease-out overflow-hidden w-[52px] group-hover/pill:w-[230px]">

                    {/* Logo row */}
                    <div className="flex items-center h-11">
                        <div className="w-[52px] flex-shrink-0 flex items-center justify-center">
                            <img src="/logo-icon.png" alt="Camisa Vetor" className="w-7 h-7 object-contain" />
                        </div>
                        <div className="overflow-hidden max-w-0 group-hover/pill:max-w-[178px] opacity-0 group-hover/pill:opacity-100 transition-all duration-250 pr-5">
                            <Image priority src="/logo.svg" alt="Camisa Vetor" width={108} height={20} className="h-[18px] w-auto" />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="mx-3 h-px bg-white/8 mb-1" />

                    {/* Search row */}
                    <div className="flex items-center h-10">
                        <button
                            onClick={() => setTimeout(() => desktopSearchRef.current?.focus(), 80)}
                            className={`w-[52px] flex-shrink-0 flex items-center justify-center text-white/50 ${laranjaHover}`}
                        >
                            <Search size={19} />
                        </button>
                        <div className="overflow-hidden max-w-0 group-hover/pill:max-w-[178px] opacity-0 group-hover/pill:opacity-100 transition-all duration-250 pr-5">
                            <input
                                ref={desktopSearchRef}
                                type="text"
                                placeholder={t('searchPlaceholderDesktop')}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && navigate('search', searchTerm)}
                                className="w-[160px] bg-white/10 text-white placeholder-white/25 text-[12px] rounded-xl px-3 py-1.5 outline-none border border-white/10 focus:border-[#fe7302]/50 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="mx-3 h-px bg-white/8 my-1" />

                    {/* Nav items */}
                    <nav className="flex flex-col gap-0.5 py-1">
                        {[
                            { href: '/', icon: <Home size={19} />, label: t('navHome') },
                            { href: '/carrinho', icon: <ShoppingCart size={19} />, label: t('navCart'), badge: true },
                            { icon: <Shirt size={19} />, label: t('navCategories'), action: () => setDrawerOpen(true) },
                            { href: '/perfil', icon: <User size={19} />, label: t('navProfile') },
                            { href: whatsappUrl, icon: <MessageCircle size={19} />, label: t('navSupport'), external: true },
                        ].map((item, i) => {
                            const inner = (
                                <div className="flex items-center h-9 group/navitem">
                                    {/* Ícone: sempre no slot de 52px, centrado */}
                                    <div className="w-[52px] flex-shrink-0 flex items-center justify-center relative text-white/50 group-hover/navitem:text-[#fe7302] transition-colors">
                                        {item.icon}
                                        {item.badge && isMounted && cartCount > 0 && (
                                            <span className="absolute top-1 right-2 bg-[#fe7302] text-white font-bold flex items-center justify-center rounded-full border border-[#1c1c1e]" style={{ fontSize: 8, minWidth: 13, height: 13 }}>
                                                {cartCount}
                                            </span>
                                        )}
                                    </div>
                                    {/* Label: expande no hover */}
                                    <span className="overflow-hidden max-w-0 group-hover/pill:max-w-[178px] opacity-0 group-hover/pill:opacity-100 transition-all duration-200 whitespace-nowrap text-[12px] font-medium text-white/55 group-hover/navitem:text-white pr-5">
                                        {tp(item.label)}
                                    </span>
                                </div>
                            );
                            const cls = 'rounded-2xl hover:bg-white/8 transition-all block';
                            if (item.action) return <button key={i} onClick={item.action} className={cls}>{inner}</button>;
                            if (item.external) return <a key={i} href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>;
                            return <Link key={i} href={item.href!} className={cls}>{inner}</Link>;
                        })}
                    </nav>
                </div>
            </aside>
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