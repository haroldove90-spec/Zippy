declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}

interface Window {
  // Removed readonly modifier to fix error: All declarations of 'aistudio' must have identical modifiers.
  aistudio: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  };
}
