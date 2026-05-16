import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso | Camisa Vetor',
  description: 'Termos de Uso e Condições da plataforma Camisa Vetor.',
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-white pt-[28px] md:pt-4 pb-20">
      <div className="max-w-3xl mx-auto px-6 font-sans text-[#4a4a4a]">
        
        <h1 className="text-3xl font-black text-[#202124] uppercase tracking-tighter mb-8">
          Termos de Uso
        </h1>
        
        <div className="space-y-6 text-[15px] leading-relaxed">
          <p>
            Bem-vindo à <strong>Camisa Vetor</strong>. Ao acessar e utilizar nosso site, você concorda em cumprir e ficar vinculado aos seguintes termos e condições de uso.
          </p>

          <h2 className="text-xl font-bold text-[#202124] mt-8 mb-4">1. Licença de Uso dos Vetores</h2>
          <p>
            Ao adquirir um vetor na nossa plataforma, você recebe uma licença de uso comercial e pessoal não exclusiva. 
            Você <strong>pode</strong> utilizar a arte para estampar produtos físicos (camisetas, canecas, bonés, etc.) e comercializá-los. 
            Você <strong>não pode</strong> revender, redistribuir ou compartilhar o arquivo digital original (vetor) em nenhuma plataforma, grupo de WhatsApp, Telegram ou afins.
          </p>

          <h2 className="text-xl font-bold text-[#202124] mt-8 mb-4">2. Pagamento e Entrega</h2>
          <p>
            Os pagamentos são processados de forma segura via Mercado Pago (PIX e Cartão) ou PayPal. 
            Como se trata de um produto 100% digital, a entrega é feita imediatamente após a confirmação do pagamento pelo sistema. 
            Os arquivos ficarão disponíveis na sua área de cliente ("Meu Perfil") e o link de download também será enviado para o seu e-mail cadastrado.
          </p>

          <h2 className="text-xl font-bold text-[#202124] mt-8 mb-4">3. Política de Reembolso</h2>
          <p>
            Devido à natureza dos produtos digitais (arquivos baixáveis que não podem ser devolvidos), 
            <strong> não oferecemos reembolsos após a conclusão do download do arquivo</strong>. 
            Garantimos, no entanto, a qualidade e integridade do arquivo fornecido. Caso o arquivo apresente algum defeito técnico ou corrompimento, 
            nossa equipe fornecerá um novo link ou consertará o arquivo o mais rápido possível.
          </p>

          <h2 className="text-xl font-bold text-[#202124] mt-8 mb-4">4. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo presente no site, incluindo logotipos, textos, layout e a curadoria dos vetores, são de propriedade da Camisa Vetor ou de seus respectivos parceiros, sendo protegidos pelas leis de direitos autorais.
          </p>

          <h2 className="text-xl font-bold text-[#202124] mt-8 mb-4">5. Alterações nos Termos</h2>
          <p>
            A Camisa Vetor reserva-se o direito de atualizar ou modificar estes Termos de Uso a qualquer momento, sem aviso prévio. Recomendamos revisar esta página periodicamente.
          </p>
          
          <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-500">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
}
