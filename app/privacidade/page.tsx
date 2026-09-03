import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Camisa Vetor',
  description: 'Política de Privacidade e Proteção de Dados da plataforma Camisa Vetor.',
  alternates: {
    canonical: 'https://camisavetor.com.br/privacidade',
  },
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-white pt-[28px] md:pt-4 pb-20">
      <div className="max-w-3xl mx-auto px-6 font-sans text-[#4a4a4a]">
        
        <h1 className="text-3xl font-black text-[#202124] uppercase tracking-tighter mb-8">
          Política de Privacidade
        </h1>
        
        <div className="space-y-6 text-[15px] leading-relaxed">
          <p>
            Na <strong>Camisa Vetor</strong>, a sua privacidade é nossa prioridade. Esta Política de Privacidade descreve como coletamos, usamos, protegemos e compartilhamos as suas informações pessoais ao utilizar nossa plataforma.
          </p>

          <h2 className="text-xl font-bold text-[#202124] mt-8 mb-4">1. Informações que Coletamos</h2>
          <p>
            Coletamos apenas as informações estritamente necessárias para processar suas compras e oferecer suporte:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Dados de Conta:</strong> Nome e endereço de e-mail ao fazer login via Google.</li>
            <li><strong>Dados de Faturamento:</strong> CPF/CNPJ ou dados essenciais requeridos pelos gateways de pagamento (Mercado Pago / PayPal). Note que <strong>não armazenamos os dados do seu cartão de crédito</strong> em nossos servidores; eles são processados diretamente pelas instituições financeiras.</li>
            <li><strong>Dados de Navegação:</strong> Informações anônimas sobre geolocalização básica (país) para apresentar a moeda e o idioma corretos (via API de IP).</li>
          </ul>

          <h2 className="text-xl font-bold text-[#202124] mt-8 mb-4">2. Como Usamos Suas Informações</h2>
          <p>
            Os dados coletados são utilizados exclusivamente para:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Processar seus pedidos e liberar o acesso aos downloads dos vetores.</li>
            <li>Enviar os links dos arquivos adquiridos diretamente para o seu e-mail.</li>
            <li>Melhorar sua experiência na plataforma, ajustando preços e idioma conforme a sua região.</li>
            <li>Enviar comunicações sobre atualizações de pedidos ou ofertas (você pode optar por não receber e-mails promocionais a qualquer momento).</li>
          </ul>

          <h2 className="text-xl font-bold text-[#202124] mt-8 mb-4">3. Proteção e Segurança</h2>
          <p>
            Utilizamos a infraestrutura de segurança do Google (Firebase) para armazenar os dados do seu perfil. Todas as transações financeiras são criptografadas e processadas sob os rígidos padrões do Mercado Pago e PayPal. A Camisa Vetor adota medidas de segurança robustas para evitar o acesso não autorizado, alteração ou destruição de seus dados.
          </p>

          <h2 className="text-xl font-bold text-[#202124] mt-8 mb-4">4. Compartilhamento de Dados</h2>
          <p>
            Não vendemos, trocamos ou alugamos suas informações pessoais para terceiros. Seus dados são compartilhados apenas com as ferramentas essenciais para o funcionamento da loja:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Processadores de pagamento (Mercado Pago, PayPal).</li>
            <li>Plataforma de envio de e-mails transacionais (Resend).</li>
          </ul>

          <h2 className="text-xl font-bold text-[#202124] mt-8 mb-4">5. Seus Direitos</h2>
          <p>
            Você tem o direito de solicitar a exclusão da sua conta e de todos os dados associados a ela a qualquer momento. Basta acessar o painel "Meu Perfil" ou enviar uma solicitação para a nossa equipe de suporte.
          </p>
          
          <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-500">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
}
