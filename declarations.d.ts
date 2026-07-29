declare module "*.css" {
  const content: any;
  export default content;
}

// Tipos para assets 3D (Three.js / React Three Fiber)
declare module "*.glb" {
  const src: string;
  export default src;
}

declare module "*.gltf" {
  const src: string;
  export default src;
}

declare module "*.hdr" {
  const src: string;
  export default src;
}