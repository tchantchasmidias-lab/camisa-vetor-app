import { Metadata } from 'next';
import { Mail, MapPin, ShieldCheck, Star, Package, HeartHandshake, Zap, Users } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sobre Nós | Camisa Vetor',
  description: 'Conheça a Camisa Vetor: sua plataforma especializada em vetores profissionais para estamparia e sublimação. Saiba quem somos, nossa missão e nossos valores.',
  alternates: {
    canonical: 'https://camisavetor.com/sobre',
  },
  openGraph: {
    title: 'Sobre Nós | Camisa Vetor',
    description: 'Conheça a Camisa Vetor: vetores profissionais para estamparia e sublimação.',
    url: 'https://camisavetor.com/sobre',
  },
};

const values = [
  {
    icon: ShieldCheck,
    title: 'Responsabilidade',
    description: 'Garantimos a qualidade, integridade e autoria de cada arquivo comercializado. Nossos vetores são curados e testados antes de serem disponibilizados.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    icon: Star,
    title: 'Qualidade Premium',
    description: 'Trabalhamos apenas com arquivos de alta resolução e precisão técnica, prontos para uso em plotagem, serigrafia, DTF, DTG e sublimação.',
    color: 'text-[#fe7302]',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
  },
  {
    icon: HeartHandshake,
    title: 'Transparência',
    description: 'Acreditamos em relações honestas com nossos clientes. Preços claros, licenças bem definidas e suporte acessível para todas as dúvidas.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: Zap,
    title: 'Entrega Imediata',
    description: 'Como plataforma 100% digital, seus arquivos ficam disponíveis imediatamente após a confirmação do pagamento — sem espera.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
  },
];

const formats = ['CDR', 'PDF', 'SVG', 'PNG', 'AI'];

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-white pt-[28px] md:pt-4 pb-20">

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#fe7302] to-orange-600 text-white py-16 md:py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.35em] text-orange-100 mb-4">
            Nossa História
          </span>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-[1.05] mb-6">
            Sobre a<br />Camisa Vetor
          </h1>
          <p className="text-[16px] text-orange-100 leading-relaxed max-w-xl mx-auto font-medium">
            Somos uma plataforma brasileira especializada em vetores profissionais para o mercado de estamparia, 
            sublimação e personalização de produtos.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 font-sans text-[#4a4a4a]">

        {/* QUEM SOMOS */}
        <section className="mt-14 mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#fe7302] block mb-3">
            Quem Somos
          </span>
          <h2 className="text-2xl font-black text-[#202124] uppercase tracking-tight mb-5">
            Uma plataforma criada para profissionais da estamparia
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-[#5f6368]">
            <p>
              A <strong className="text-[#202124]">Camisa Vetor</strong> nasceu da necessidade real de artistas, 
              estampadores, donos de confecções e prestadores de serviços de personalização de encontrar vetores 
              de alta qualidade em um só lugar — com praticidade, preço justo e entrega instantânea.
            </p>
            <p>
              Oferecemos uma coleção curada de arquivos vetoriais profissionais nas categorias mais populares do mercado: 
              times de futebol, formatura, gospel, carnaval, personagens infantis, datas comemorativas e muito mais.
            </p>
            <p>
              Todos os nossos produtos são arquivos digitais entregues nos formatos mais utilizados pelas principais 
              ferramentas de design e equipamentos de estamparia do Brasil.
            </p>
          </div>
        </section>

        {/* FORMATOS */}
        <section className="mb-12 p-6 bg-[#f8f9fa] rounded-[1.5rem] border border-[#dadce0]">
          <div className="flex items-center gap-3 mb-4">
            <Package size={18} className="text-[#fe7302]" />
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#202124]">
              Formatos Disponíveis
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {formats.map((fmt) => (
              <span
                key={fmt}
                className="border border-[#dadce0] bg-white rounded-xl py-2 px-4 text-[11px] font-bold text-[#202124] shadow-sm"
              >
                .{fmt}
              </span>
            ))}
          </div>
          <p className="text-[13px] text-[#5f6368] mt-4 leading-relaxed">
            Compatíveis com CorelDRAW, Adobe Illustrator, Inkscape, Silhouette Studio e 
            qualquer equipamento de corte, DTF, DTG, serigrafia e sublimação.
          </p>
        </section>

        {/* MISSÃO */}
        <section className="mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#fe7302] block mb-3">
            Nossa Missão
          </span>
          <h2 className="text-2xl font-black text-[#202124] uppercase tracking-tight mb-5">
            Democratizar o acesso a arte de qualidade
          </h2>
          <p className="text-[15px] leading-relaxed text-[#5f6368]">
            Nossa missão é ser a referência em vetores profissionais no Brasil, oferecendo aos profissionais 
            da estamparia acesso rápido, seguro e acessível a arquivos de alta qualidade. Acreditamos que 
            uma boa arte transforma um produto comum em algo especial — e queremos ser parte dessa transformação 
            com responsabilidade, ética e excelência.
          </p>
        </section>

        {/* NOSSOS VALORES */}
        <section className="mb-14">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#fe7302] block mb-3">
            Nossos Valores
          </span>
          <h2 className="text-2xl font-black text-[#202124] uppercase tracking-tight mb-8">
            O que nos guia
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {values.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className={`p-5 rounded-2xl border ${item.border} ${item.bg}`}
                >
                  <div className={`flex items-center gap-3 mb-3`}>
                    <Icon size={18} className={item.color} />
                    <span className={`text-[11px] font-black uppercase tracking-wider ${item.color}`}>
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#5f6368] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* PARA QUEM */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <Users size={18} className="text-[#fe7302]" />
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#202124]">
              Para Quem é a Camisa Vetor?
            </span>
          </div>
          <ul className="space-y-3 text-[15px] text-[#5f6368] leading-relaxed">
            {[
              'Estúdios e gráficas de estamparia e sublimação',
              'Profissionais autônomos de plotagem e corte a laser',
              'Confecções e ateliês de personalização',
              'Designers gráficos em busca de bases para projetos',
              'Pequenos empreendedores do setor de camisetas e brindes',
              'Prestadores de serviço para eventos, formaturas e empresas',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-[#fe7302] font-black mt-0.5">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CONTATO */}
        <section className="p-6 bg-[#f8f9fa] rounded-[1.5rem] border border-[#dadce0] mb-10">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#202124] block mb-5">
            Fale Conosco
          </span>
          <div className="space-y-4">
            <a
              href="mailto:contato@camisavetor.com"
              className="flex items-center gap-3 text-[14px] font-medium text-[#5f6368] hover:text-[#fe7302] transition-colors"
            >
              <Mail size={16} className="text-[#fe7302] flex-shrink-0" />
              contato@camisavetor.com
            </a>
            <div className="flex items-start gap-3 text-[14px] font-medium text-[#5f6368]">
              <MapPin size={16} className="text-[#fe7302] flex-shrink-0 mt-0.5" />
              <span>Rua Marieta Pita, nº 09, Loteamento José Gerônimo — Pesqueira, PE — Brasil</span>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-[#dadce0]">
            <Link
              href="https://wa.me/558791425634"
              target="_blank"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold text-[11px] uppercase tracking-widest py-3 px-6 rounded-xl hover:bg-[#1da852] transition-colors"
            >
              💬 Falar pelo WhatsApp
            </Link>
          </div>
        </section>

        {/* DISCLAIMER */}
        <div className="text-[12px] text-gray-400 leading-relaxed border-t border-gray-100 pt-6">
          <p>
            A Camisa Vetor é uma plataforma independente de venda de produtos digitais, 
            sediada em Pesqueira, Pernambuco, Brasil. Todos os produtos comercializados são arquivos digitais 
            (vetores). Ao comprar, o cliente adquire licença de uso comercial e pessoal conforme os{' '}
            <Link href="/termos" className="underline hover:text-[#fe7302]">Termos de Uso</Link>.
          </p>
        </div>

      </div>
    </div>
  );
}
