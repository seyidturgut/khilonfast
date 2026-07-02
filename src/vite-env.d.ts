/// <reference types="vite/client" />

// vite.config.ts `define` ile build anında literal string olarak enjekte edilir
// (schema.org dateModified için sabit build tarihi).
declare const __BUILD_DATE__: string
