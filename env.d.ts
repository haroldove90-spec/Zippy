
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}

interface Window {
  // Removing 'readonly' as it often conflicts with existing ambient declarations in the environment.
  // This ensures that all merging declarations of 'aistudio' on the Window interface have identical modifiers.
  aistudio: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  };
}
