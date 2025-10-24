/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REOWN_PROJECT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.glsl' {
  const content: string;
  export default content;
}

declare module '*.glsl?raw' {
  const content: string;
  export default content;
}

declare module '*.vert' {
  const content: string;
  export default content;
}

declare module '*.frag' {
  const content: string;
  export default content;
}

