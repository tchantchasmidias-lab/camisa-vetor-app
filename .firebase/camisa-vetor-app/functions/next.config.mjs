// next.config.mjs
var nextConfig = {
  images: {
    // 🚀 OTIMIZAÇÃO: WebP apenas (sem AVIF para preservar qualidade das artes)
    formats: ["image/webp"],
    deviceSizes: [390, 430, 768, 1024, 1280, 1400, 1920],
    imageSizes: [64, 128, 256, 384, 512],
    minimumCacheTTL: 31536e3,
    // 1 ano de cache para imagens otimizadas
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "firebasestorage.app" }
    ]
  },
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: `https://camisa-vetor-app.firebaseapp.com/__/auth/:path*`
      }
    ];
  }
};
var next_config_default = nextConfig;
export {
  next_config_default as default
};
