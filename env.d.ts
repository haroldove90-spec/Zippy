
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}

interface Window {
  // Restored 'readonly' modifier to match existing ambient declarations in the environment.
  // This ensures that all merging declarations of 'aistudio' on the Window interface have identical modifiers.
  readonly aistudio: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  };
}
