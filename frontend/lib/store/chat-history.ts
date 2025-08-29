import { create } from 'zustand';

interface ChatHistory {
  id: string;
  title: string;
  preview: string;
  createdAt: Date;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system' | 'data';
    content: string;
    createdAt?: Date;
    display?: React.ReactNode;
  }>;
}

interface ChatHistoryStore {
  history: ChatHistory[];
  addHistory: (chat: Omit<ChatHistory, 'createdAt'>) => void;
  updateHistory: (id: string, updates: Partial<ChatHistory>) => void;
  removeHistory: (id: string) => void;
  historyExists: (id: string) => boolean;
  getGroupedHistory: () => Record<string, ChatHistory[]>;
}

export const useChatHistory = create<ChatHistoryStore>((set, get) => ({
  history: [],
  addHistory: (chat) =>
    set((state) => ({
      history: [...state.history, { ...chat, createdAt: new Date() }].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      ),
    })),
  updateHistory: (id, updates) =>
    set((state) => ({
      history: state.history
        .map((h) => (h.id === id ? { ...h, ...updates } : h))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    })),
  removeHistory: (id) =>
    set((state) => ({
      history: state.history.filter((h) => h.id !== id),
    })),
  historyExists: (id) => {
    const history = get().history;
    return history.some((h) => h.id === id);
  },
  getGroupedHistory: () => {
    const history = get().history;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const grouped: Record<string, ChatHistory[]> = {
      今天: [],
      昨天: [],
      '7天内': [],
      '30天内': [],
    };

    history.forEach((chat) => {
      const chatDate = new Date(chat.createdAt);
      const chatDay = new Date(
        chatDate.getFullYear(),
        chatDate.getMonth(),
        chatDate.getDate()
      );

      if (chatDay.getTime() === today.getTime()) {
        grouped['今天'].push(chat);
      } else if (chatDay.getTime() === yesterday.getTime()) {
        grouped['昨天'].push(chat);
      } else if (chatDate > sevenDaysAgo) {
        grouped['7天内'].push(chat);
      } else if (chatDate > thirtyDaysAgo) {
        grouped['30天内'].push(chat);
      } else {
        const monthKey = `${chatDate.getFullYear()}-${(chatDate.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;
        if (!grouped[monthKey]) {
          grouped[monthKey] = [];
        }
        grouped[monthKey].push(chat);
      }
    });

    // 移除空分组
    Object.keys(grouped).forEach((key) => {
      if (
        grouped[key].length === 0 &&
        key !== '今天' &&
        key !== '昨天' &&
        key !== '7天内' &&
        key !== '30天内'
      ) {
        delete grouped[key];
      }
    });

    return grouped;
  },
}));
