import type { Metadata } from 'next';
import PlansClient from '@/components/PlansClient';

export const metadata: Metadata = {
  title: 'Clube PRO | Assinatura de Vetores para Sublimação - Camisa Vetor',
  description:
    'Assine o Clube PRO e baixe até 40 vetores por mês em .CDR e .PDF. A partir de R$ 1,99 por arte. Cancele quando quiser.',
  alternates: { canonical: 'https://camisavetor.com.br/planos' },
};

const FAQ = [
  {
    q: 'Em quais formatos recebo os arquivos?',
    a: 'Todos os vetores são entregues em .CDR (CorelDRAW editável, com camadas e cores separadas) e .PDF vetorial, compatível com Corel, Illustrator e Photoshop.',
  },
  {
    q: 'Como funciona a renovação mensal?',
    a: 'A cobrança é automática a cada 30 dias no Mercado Pago. A cada pagamento aprovado, seu saldo de downloads é recarregado com a cota do plano. Créditos não utilizados não acumulam para o ciclo seguinte.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. O cancelamento é simples, sem multa nem fidelidade. Você continua usando seus créditos restantes até o fim do período já pago.',
  },
  {
    q: 'O que acontece se eu baixar a mesma arte de novo?',
    a: 'Vetores já resgatados com crédito podem ser baixados novamente sem consumir novo crédito enquanto sua assinatura estiver ativa.',
  },
  {
    q: 'Qual a diferença para a compra avulsa?',
    a: 'Na compra avulsa (R$ 12 a R$ 15 por arte) o download é vitalício e individual. Na assinatura você paga uma mensalidade fixa e baixa várias artes por um custo bem menor por vetor.',
  },
];

export default function PlanosPage() {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-10 md:py-14">
      <header className="mb-10 text-center">
        <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#fe7302]">Clube PRO</span>
        <h1 className="mt-2 text-[28px] font-extrabold tracking-tight text-[#0f172a] md:text-[40px]">
          Baixe mais, pague menos por arte
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] text-[#475569]">
          Compare: comprando avulso cada vetor custa de R$ 12 a R$ 30. Com o Clube PRO, o custo cai para
          cerca de <strong>R$ 2,66</strong> — e na Gráfica, para cerca de <strong>R$ 1,99</strong>.
        </p>
      </header>

      <PlansClient />

      <section className="mx-auto mt-16 max-w-3xl" aria-labelledby="faq-title">
        <h2 id="faq-title" className="mb-6 text-center text-xl font-bold text-[#0f172a]">
          Perguntas frequentes
        </h2>
        <div className="space-y-2">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-2xl border border-[#dadce0] bg-white">
              <summary className="cursor-pointer list-none px-5 py-4 text-[14px] font-bold text-[#0f172a] marker:hidden">
                {item.q}
              </summary>
              <p className="border-t border-[#f1f3f4] px-5 pb-5 pt-3 text-[14px] leading-relaxed text-[#334155]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
