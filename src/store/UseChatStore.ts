import { create } from 'zustand'

interface Message {
  id: string
  userId: string
  username: string
  avatar: string
  content: string
  timestamp: string
  reactions: { [emoji: string]: string[] }
}

interface ChatGroup {
  id: string
  name: string
  description: string
  memberCount: number
  isActive: boolean
}

interface ChatState {
  chatGroups: ChatGroup[]
  currentChat: string | null
  messages: Message[]
  typingUsers: string[]
  setChatGroups: (groups: ChatGroup[]) => void
  setCurrentChat: (chatId: string) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  setTypingUsers: (users: string[]) => void
}

export const useChatStore = create<ChatState>((set) => ({
  chatGroups: [],
  currentChat: null,
  messages: [],
  typingUsers: [],
  setChatGroups: (chatGroups) => set({ chatGroups }),
  setCurrentChat: (currentChat) => set({ currentChat }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    })),
  setTypingUsers: (typingUsers) => set({ typingUsers }),
}))
