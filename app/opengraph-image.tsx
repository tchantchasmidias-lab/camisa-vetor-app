import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Camisa Vetor — Vetores Profissionais para Estamparia';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0d0d0d',
          backgroundImage: 'radial-gradient(circle at 25px 25px, #1a1a1a 2%, transparent 0%)',
          backgroundSize: '50px 50px',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: '40px 60px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '24px',
              backgroundColor: '#fe7302',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '44px',
              fontWeight: 'bold',
              color: 'white',
              marginRight: '24px',
              boxShadow: '0 12px 36px rgba(254, 115, 2, 0.45)',
            }}
          >
            CV
          </div>
          <span
            style={{
              fontSize: '68px',
              fontWeight: '900',
              letterSpacing: '-2px',
              color: '#ffffff',
            }}
          >
            Camisa <span style={{ color: '#fe7302' }}>Vetor</span>
          </span>
        </div>

        <div
          style={{
            fontSize: '30px',
            fontWeight: '600',
            color: '#a1a1aa',
            maxWidth: '850px',
            lineHeight: 1.4,
            marginBottom: '36px',
          }}
        >
          Vetores Profissionais para Estamparia & Sublimação
        </div>

        <div
          style={{
            display: 'flex',
            gap: '14px',
          }}
        >
          {['.CDR', '.PDF', '.SVG', '.PNG', '.AI'].map((fmt) => (
            <div
              key={fmt}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '14px',
                padding: '10px 22px',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#f4f4f5',
              }}
            >
              {fmt}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
