export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
    }
  }

  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}