/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Mantém WebP para preservar qualidade das artes (sem recompressão AVIF)
    formats: ['image/webp'],
    // Tamanhos de dispositivo — cobre todos os breakpoints do Tailwind e telas retina
    deviceSizes: [390, 430, 640, 768, 1024, 1280, 1400, 1920, 2560],
    // Tamanhos para imagens menores que o viewport (cards de produto, thumbnails)
    imageSizes: [64, 128, 256, 384, 512, 640, 750, 1000, 1200],
    minimumCacheTTL: 31536000, // 1 ano de cache para imagens otimizadas
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'firebasestorage.app' },
    ],
  },
  async redirects() {
    return [
      // Redireciona camisavetor.com → camisavetor.com.br (domínio principal)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'camisavetor.com' }],
        destination: 'https://camisavetor.com.br/:path*',
        permanent: true, // 301 - preserva SEO
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.camisavetor.com' }],
        destination: 'https://camisavetor.com.br/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.camisavetor.com.br' }],
        destination: 'https://camisavetor.com.br/:path*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      // Firebase Auth popup handler
      {
        source: '/__/auth/:path*',
        destination: `https://camisa-vetor-app.firebaseapp.com/__/auth/:path*`,
      },
      // Subdomínio studio.camisavetor.com → /studio/* (sem afetar e-commerce)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'studio.camisavetor.com' }],
        destination: '/studio/:path*',
      },
    ];
  },
};
export default nextConfig;