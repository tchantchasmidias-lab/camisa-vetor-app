/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'firebase/messaging',
      '@google/generative-ai',
    ],
  },
  images: {
    // Mantém WebP para preservar qualidade das artes (sem recompressão AVIF)
    formats: ['image/webp'],
    imageSizes: [64, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
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
      // Rota de catálogo reescrita para a Home com filtros
      {
        source: '/catalog',
        destination: '/',
      },
    ];
  },
};
export default nextConfig;