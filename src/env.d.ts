/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly POLAR_ACCESS_TOKEN: string;
    readonly POLAR_WEBHOOK_SECRET: string;
  }
}
