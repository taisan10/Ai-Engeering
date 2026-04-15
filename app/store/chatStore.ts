import { create } from "zustand";
import { persist } from "zustand/middleware";

type Message = {
  role: "user" | "assistant";
  content: string;
   timestamp: number; 
};

type Chat = {
  id: string;
  title: string; 
  messages: Message[];
   isTyping?: boolean;
};



type ChatStore = {
  chats: Chat[];
  currentChatId: string;

  addMessage: (msg: Message) => void;
  createChat: () => void;
  switchChat: (id: string) => void;
  clearMessages: () => void;
  renameChat: (id: string, title: string) => void;
  deleteChat: (id: string) => void;
  setTyping: (id: string, typing: boolean) => void;
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
    chats: [{ id: "1", title: "New Chat", messages: [] }],
      currentChatId: "1",

      addMessage: (msg) => {
        const { chats, currentChatId } = get();

        const updatedChats = chats.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, msg] }
            : chat
        );

        set({ chats: updatedChats });
      },

      createChat: () => {
  const newChat = {
    id: Date.now().toString(),
    title: "New Chat", // 🔥 default name
    messages: [],
  };

  set((state) => ({
    chats: [...state.chats, newChat],
    currentChatId: newChat.id,
  }));
},

      switchChat: (id) => set({ currentChatId: id }),

      clearMessages: () => {
        const { chats, currentChatId } = get();

        const updatedChats = chats.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [] }
            : chat
        );

        set({ chats: updatedChats });
      },

      renameChat: (id: string, title: string) => {
  set((state) => ({
    chats: state.chats.map((chat) =>
      chat.id === id ? { ...chat, title } : chat
    ),
  }));
},

deleteChat: (id: string) => {
  set((state) => {
    const filtered = state.chats.filter((chat) => chat.id !== id);

    return {
      chats: filtered,
      currentChatId: filtered[0]?.id || "",
    };
  });
},
setTyping: (id: string, typing: boolean) => {
  set((state) => ({
    chats: state.chats.map((chat) =>
      chat.id === id ? { ...chat, isTyping: typing } : chat
    ),
  }));
},

    }),
    {
      name: "chat-storage",
    }
  )
);