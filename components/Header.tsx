'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Home, Shirt, MessageCircle, User, ShoppingCart, Search, X } from 'lucide-react';

export default function Header() {
    const [isSearchOpen, setSearchOpen] = useState(false);
    const [isMobileHeaderVisible, setMobileHeaderVisible] = useState(true);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            if (window.innerWidth < 768) {
                const currentScrollY = window.scrollY;
                if (currentScrollY < 10) {
                    setMobileHeaderVisible(true);
                    lastScrollY = currentScrollY;
                    return;
                }
                if (currentScrollY > lastScrollY) {
                    setMobileHeaderVisible(false);
                } else {
                    setMobileHeaderVisible(true);
                }
                lastScrollY = currentScrollY;
            } else {
                setMobileHeaderVisible(true);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    const laranjaGlow = "hover:text-[#fe7302] hover:drop-shadow-[0_0_12px_#fe7302]";
    const verdeGlow = "hover:text-[#07e02b] hover:drop-shadow-[0_0_12px_#07e02b]";

    const desktopNavItems = [
        { href: "/", icon: Home, hoverClasses: laranjaGlow },
        { href: "#", icon: Shirt, hoverClasses: laranjaGlow },
        { href: "#", icon: MessageCircle, hoverClasses: verdeGlow },
        { href: "#", icon: User, hoverClasses: laranjaGlow },
        { href: "#", icon: ShoppingCart, hoverClasses: laranjaGlow },
    ];

    const mobileBottomNavItems = [
        { href: "/", icon: Home, hoverClasses: laranjaGlow },
        { href: "#", icon: Shirt, hoverClasses: laranjaGlow },
        { href: "#", icon: MessageCircle, hoverClasses: verdeGlow },
        { href: "#", icon: User, hoverClasses: laranjaGlow },
    ];

    const handleSearchToggle = () => setSearchOpen(!isSearchOpen);
    const handleCloseSearch = () => setSearchOpen(false);

    return (
        <>
            {/* Desktop Header */}
            <header className="hidden md:block fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50">
                 <div className="flex items-center justify-between rounded-full bg-black/70 backdrop-blur-lg border border-white/10 px-6 py-3">
                    <Link href="/">
                        <Image priority src="/logo.svg" alt="CamisaVetor Logo" width={112} height={28} className="h-7 w-auto" />
                    </Link>
                    <div className="relative flex-1 max-w-lg">
                        <input type="search" placeholder="Pesquisar Vetor" className="w-full pl-10 pr-4 py-2 border-none rounded-full bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fe7302]/50"/>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                    </div>
                    <nav className="flex items-center space-x-6">
                        {desktopNavItems.map((item, index) => (
                            <Link key={index} href={item.href}>
                                <item.icon className={`text-white transition-all duration-300 transform-gpu hover:scale-110 ${item.hoverClasses}`} size={24} />
                            </Link>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Mobile Header */}
            <header className={`md:hidden fixed top-2 left-0 right-0 w-full z-50 px-2 transition-transform duration-500 ease-in-out ${isMobileHeaderVisible ? 'translate-y-0' : '-translate-y-[150%]'}`}>
                <div className="relative flex items-center justify-between rounded-full bg-black/80 backdrop-blur-lg h-14 px-4 shadow-lg">
                    <div className={`absolute left-2 right-2 h-full transition-all duration-300 ease-in-out ${isSearchOpen ? 'w-auto' : 'w-0'} overflow-hidden`}>
                        <div className="relative w-full h-full">
                             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-20" size={18}/>
                             <input ref={searchInputRef} type="search" placeholder="Pesquisar Vetor" className="w-full h-full rounded-full bg-gray-100 pl-12 pr-12 text-gray-800 placeholder-gray-500 focus:outline-none" onBlur={handleCloseSearch} />
                             <button onClick={handleCloseSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 z-20">
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    <div className={`flex justify-between items-center w-full h-full transition-opacity duration-200 ${isSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        <button onClick={handleSearchToggle} className="p-2">
                            <Search className={`text-white transition-all duration-300 ${laranjaGlow}`} size={24} />
                        </button>
                        <Link href="/">
                            {/* LOGO MOBILE AJUSTE FINAL: Tamanho aumentado para 168x42 */}
                            <Image priority src="/logo.svg" alt="Logo" width={168} height={42} />
                        </Link>
                        <Link href="#" className="p-2">
                            <ShoppingCart className={`text-white transition-all duration-300 ${laranjaGlow}`} size={24}/>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-2 left-0 right-0 w-full z-50 px-2">
                <div className="flex items-center justify-around rounded-full bg-black/80 backdrop-blur-lg h-14 max-w-sm mx-auto shadow-lg">
                    {mobileBottomNavItems.map((item, index) => (
                        <Link key={index} href={item.href} className="p-2">
                            <item.icon className={`text-white transition-all duration-300 transform-gpu hover:scale-110 ${item.hoverClasses}`} size={26} />
                        </Link>
                    ))}
                </div>
            </nav>
        </>
    );
}
