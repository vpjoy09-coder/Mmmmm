export interface UserProfile {
  name: string;
  habits: string[];
  preferences: string[];
  routine: string[];
  importantDates: { date: string; event: string }[];
}

export interface Conversation {
  timestamp: string;
  summary: string;
  mood: string;
}

const STORAGE_KEYS = {
  PROFILE: (userId: string) => `shreya_profile_${userId}`,
  CONVERSATIONS: (userId: string) => `shreya_convs_${userId}`,
  LOGS: (userId: string) => `shreya_logs_${userId}`,
};

export const MemoryService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE(userId));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Memory Error (Get Profile):', error);
      return null;
    }
  },

  async saveUserProfile(userId: string, profile: Partial<UserProfile>) {
    try {
      const current = await this.getUserProfile(userId) || { 
        name: 'User', habits: [], preferences: [], routine: [], importantDates: [] 
      };
      const updated = { ...current, ...profile };
      localStorage.setItem(STORAGE_KEYS.PROFILE(userId), JSON.stringify(updated));
    } catch (error) {
      console.error('Memory Error (Save Profile):', error);
    }
  },

  async addConversation(userId: string, conversation: Conversation) {
    try {
      const key = STORAGE_KEYS.CONVERSATIONS(userId);
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      current.unshift(conversation);
      localStorage.setItem(key, JSON.stringify(current.slice(0, 50))); // Keep last 50
    } catch (error) {
      console.error('Memory Error (Add Conv):', error);
    }
  },

  async getRecentConversations(userId: string, count: number = 5) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS(userId));
      const convs = data ? JSON.parse(data) : [];
      return convs.slice(0, count);
    } catch (error) {
      console.error('Memory Error (Get Convs):', error);
      return [];
    }
  },

  async logImprovement(userId: string, type: 'improvement' | 'problem', content: string) {
    try {
      const key = STORAGE_KEYS.LOGS(userId);
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      current.push({
        type,
        content,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(key, JSON.stringify(current));
    } catch (error) {
      console.error('Memory Error (Log):', error);
    }
  }
};
