'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import ProductCard from './ProductCard';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, limit, startAfter, where } from 'firebase/firestore';
import { normalizeSearchTerm } from '@/lib/stringUtils';



export default function ProductGrid({

  selectedCategory,

  searchQuery = ''

}: {

  selectedCategory: string,

  searchQuery?: string

}) {

  const [products, setProducts] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const [lastDoc, setLastDoc] = useState<any>(null); // Para o Infinite Scroll real

  const [hasMore, setHasMore] = useState(true);

  const loaderRef = useRef<HTMLDivElement>(null);



  // 1. Busca Inicial de Produtos do Firestore

  const fetchInitialProducts = async () => {

    setIsLoading(true);

    try {

      const productsRef = collection(db, 'products');

      let q = query(productsRef, orderBy('createdAt', 'desc'), limit(8));



      // Filtro de categoria direto na consulta do Firebase (Mais rápido)

      if (selectedCategory && selectedCategory !== 'Todos') {

        q = query(productsRef, where('category', '==', selectedCategory), orderBy('createdAt', 'desc'), limit(8));

      }



      const querySnapshot = await getDocs(q);

      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

     

      setProducts(items);

      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);

      setHasMore(querySnapshot.docs.length === 8);

    } catch (error) {

      console.error("Erro ao carregar artes:", error);

    } finally {

      setIsLoading(false);

    }

  };



  // Reiniciar busca quando mudar a categoria

  useEffect(() => {

    fetchInitialProducts();

  }, [selectedCategory]);



  // 2. Lógica de Infinite Scroll Real com Firestore

  const loadMoreProducts = async () => {

    if (isLoading || !hasMore || searchQuery !== '' || (selectedCategory !== 'Todos' && selectedCategory !== '')) return;



    setIsLoading(true);

    try {

      const productsRef = collection(db, 'products');

      const q = query(

        productsRef,

        orderBy('createdAt', 'desc'),

        startAfter(lastDoc),

        limit(8)

      );



      const querySnapshot = await getDocs(q);

      const newItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));



      if (newItems.length > 0) {

        setProducts(prev => [...prev, ...newItems]);

        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);

        setHasMore(querySnapshot.docs.length === 8);

      } else {

        setHasMore(false);

      }

    } catch (error) {

      console.error("Erro ao carregar mais artes:", error);

    } finally {

      setIsLoading(false);

    }

  };



  // Filtro de Busca por Texto (Normalizado e Instantâneo)
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const normalizedQuery = normalizeSearchTerm(searchQuery);

    return products.filter(product => {
      const normalizedName = normalizeSearchTerm(product.name || '');
      const normalizedCategory = normalizeSearchTerm(product.category || '');
      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedCategory.includes(normalizedQuery)
      );
    });
  }, [products, searchQuery]);



  // Observer para o scroll infinito

  useEffect(() => {

    const observer = new IntersectionObserver(

      (entries) => {

        if (entries[0].isIntersecting && !isLoading && hasMore) {

          loadMoreProducts();

        }

      },

      { threshold: 0.1 }

    );

    if (loaderRef.current) observer.observe(loaderRef.current);

    return () => { if (loaderRef.current) observer.unobserve(loaderRef.current); };

  }, [isLoading, hasMore, searchQuery]);



  return (

    <div className="py-2">

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">

        {filteredProducts.map(product => (

          <ProductCard key={product.id} product={product} />

        ))}

      </div>



      {/* Mensagem customizada para busca vazia */}

      {filteredProducts.length === 0 && !isLoading && (

        <div className="flex flex-col items-center py-20 text-gray-400">

          <p className="font-bold uppercase tracking-widest text-[10px] text-center">

            {searchQuery

              ? `Nenhum resultado para "${searchQuery}"`

              : `Nenhuma arte encontrada em ${selectedCategory}`}

          </p>

        </div>

      )}



      {/* Loader condicional */}

      {searchQuery === '' && (selectedCategory === 'Todos' || selectedCategory === '') && hasMore && (

        <div ref={loaderRef} className="flex justify-center items-center py-12">

          {isLoading && (

            <span className="text-[#fe7302] font-black animate-pulse uppercase tracking-[0.2em] text-[10px]">

              Carregando artes...

            </span>

          )}

        </div>

      )}

    </div>

  );

}