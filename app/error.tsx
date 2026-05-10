'use client';

import { useGeo } from '@/lib/i18n/GeoContext';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useGeo();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-xl font-bold uppercase tracking-widest text-gray-900 mb-2">
        {t('somethingWentWrong')}
      </h2>
      <p className="text-gray-500 mb-4">{error.message}</p>
      <button
        onClick={() => reset()}
        className="bg-[#fe7302] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-orange-100 hover:bg-black transition-all"
      >
        {t('tryAgain')}
      </button>
    </div>
  );
}