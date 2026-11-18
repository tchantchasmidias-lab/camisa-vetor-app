export default function HowItWorksSection() {
  const steps = [
    {
      num: 1,
      title: 'Escolha sua arte',
      description: 'Navegue pelas categorias e encontre o seu estilo.',
    },
    {
      num: 2,
      title: 'Personalize',
      description: 'Edite no programa compatível com o arquivo adquirido.',
    },
    {
      num: 3,
      title: 'Produza',
      description: 'Use a arte na sua confecção e dê vida ao seu projeto.',
    },
  ];

  return (
    <section id="como-funciona" className="mt-6 sm:mt-10 mb-2 sm:mb-4 pt-6 sm:pt-8 border-t border-slate-200/80 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* TÍTULO À ESQUERDA */}
          <div className="lg:col-span-4 text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-slate-900 tracking-tight leading-[1.15]">
              Escolha.<br />
              Personalize.<br />
              Produza.
            </h2>
          </div>

          {/* TRÊS PASSOS À DIREITA */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {steps.map((step) => (
                <div key={step.num} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#fe7302] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
