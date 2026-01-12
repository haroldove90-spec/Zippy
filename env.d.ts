
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}

interface Window {
  // Removed readonly to fix "identical modifiers" error with standard Window interface augmentation
  aistudio: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  };
}
