export type Personality = 'caring' | 'witty' | 'empathetic' | 'curious' | 'girlfriend' | 'friend' | 'best_friend' | 'mom' | 'wife' | 'romantic' | 'cute' | 'sexual';

export type Outfit = 'casual' | 'formal' | 'sporty' | 'romantic' | 'party' | 'traditional';

export type Activity = 'idle' | 'dancing' | 'singing' | 'walking_forward';

export interface AppSettings {
  safetyLevel: 'strict' | 'moderate' | 'relaxed' | 'none';
  explicitContentEnabled: boolean;
  nlpNuance: 'standard' | 'high' | 'suggestive';
  continuousLearning: boolean;
  ethicalGuidelines: boolean;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
