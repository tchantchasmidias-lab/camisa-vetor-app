export default function DigitalNoticeBar() {
  return (
    <div
      role="region"
      aria-label="Aviso de Produto Digital"
      className="w-full bg-[#f4f4f5] border-b border-slate-200/80 py-1.5 sm:py-2 px-4 text-center transition-colors mt-[20px] sm:mt-[22px] lg:mt-0"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center text-center">
        <p className="text-[11px] sm:text-xs text-slate-700 font-medium leading-relaxed tracking-normal break-words text-center">
          Arquivos digitais para download. Não vendemos camisetas físicas.
        </p>
      </div>
    </div>
  );
}
