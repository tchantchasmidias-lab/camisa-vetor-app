/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 🚀 OTIMIZAÇÃO: WebP apenas (sem AVIF para preservar qualidade das artes)
    formats: ['image/webp'],
    deviceSizes: [390, 430, 768, 1024, 1280, 1400, 1920],
    imageSizes: [64, 128, 256, 384, 512, 750, 1000],
    minimumCacheTTL: 31536000, // 1 ano de cache para imagens otimizadas
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'firebasestorage.app' },
    ],
  },
  async redirects() {
    return [
      // Redireciona camisavetor.com.br → camisavetor.com (domínio principal)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'camisavetor.com.br' }],
        destination: 'https://camisavetor.com/:path*',
        permanent: true, // 301 - melhor para SEO
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.camisavetor.com.br' }],
        destination: 'https://camisavetor.com/:path*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: `https://camisa-vetor-app.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
};
export default nextConfig;