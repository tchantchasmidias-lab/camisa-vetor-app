/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 🚀 OTIMIZAÇÃO: WebP apenas (sem AVIF para preservar qualidade das artes)
    // Qualidade 85 garante que nunca perde abaixo do WebP 80% exportado pelo CorelDraw
    formats: ['image/webp'],
    quality: 85,
    deviceSizes: [390, 430, 768, 1024, 1280, 1400, 1920],
    imageSizes: [64, 128, 256, 384, 512],
    minimumCacheTTL: 31536000, // 1 ano de cache para imagens otimizadas
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'firebasestorage.app' },
    ],
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