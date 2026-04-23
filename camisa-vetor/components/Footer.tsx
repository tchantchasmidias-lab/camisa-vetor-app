import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-10 mt-20">
      <div className="mx-auto px-4 md:px-[10%] lg:px-[15%] flex flex-col md:flex-row justify-between items-center text-center md:text-left">
        <p className="text-xs text-gray-400 mb-4 md:mb-0">
          © 2026 Camisa Vetor. Todos os direitos reservados.
        </p>
        <nav className="flex items-center space-x-6">
          <Link href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Termos de Uso
          </Link>
          <Link href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Política de Privacidade
          </Link>
          <Link href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Suporte
          </Link>
        </nav>
      </div>
    </footer>
  );
}
