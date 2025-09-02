// Mock API data
const mockUsers = [
  { id: '1', username: 'ChatMaster', avatar: '👑', xp: 2500, level: 5 },
  { id: '2', username: 'QuickWit', avatar: '⚡', xp: 1800, level: 4 },
  { id: '3', username: 'CodeNinja', avatar: '🥷', xp: 1200, level: 3 },
  { id: '4', username: 'ByteBuster', avatar: '🚀', xp: 800, level: 2 },
]

const mockChatGroups = [
  {
    id: 'general',
    name: 'General Chat',
    description: 'Talk about anything and everything',
    memberCount: 45,
    isActive: true,
  },
  {
    id: 'tech',
    name: 'Tech Talk',
    description: 'Discuss the latest in technology',
    memberCount: 28,
    isActive: true,
  },
  {
    id: 'random',
    name: 'Random',
    description: 'Random conversations and fun topics',
    memberCount: 32,
    isActive: false,
  },
  {
    id: 'gaming',
    name: 'Gaming Zone',
    description: 'Share your gaming experiences',
    memberCount: 19,
    isActive: true,
  },
]

const mockMessages: { [key: string]: any[] } = {
  general: [
    {
      id: '1',
      userId: '1',
      username: 'ChatMaster',
      avatar: '👑',
      content: 'Welcome to the general chat!',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      reactions: { '👍': ['2', '3'], '🔥': ['4'] },
    },
    {
      id: '2',
      userId: '2',
      username: 'QuickWit',
      avatar: '⚡',
      content: 'Thanks! Excited to be here',
      timestamp: new Date(Date.now() - 240000).toISOString(),
      reactions: {},
    },
    {
      id: '3',
      userId: '3',
      username: 'CodeNinja',
      avatar: '🥷',
      content: 'This chat app looks amazing!',
      timestamp: new Date(Date.now() - 180000).toISOString(),
      reactions: { '💯': ['1', '2'] },
    },
  ],
  tech: [
    {
      id: '4',
      userId: '4',
      username: 'ByteBuster',
      avatar: '🚀',
      content: 'Anyone working on React projects?',
      timestamp: new Date(Date.now() - 360000).toISOString(),
      reactions: { '⚛️': ['1', '3'] },
    },
    {
      id: '5',
      userId: '1',
      username: 'ChatMaster',
      avatar: '👑',
      content: 'Yes! Building this chat app with React + Vite',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      reactions: {},
    },
  ],
}

// Mock API functions
export const authApi = {
  setupUser: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network delay
    const userId = Math.random().toString(36).substr(2, 9)
    const username = `User${Math.floor(Math.random() * 1000)}`
    const avatars = ['😄', '🚀', '🌟', '🎉', '💫', '🔥', '⚡', '🎯']
    const avatar = avatars[Math.floor(Math.random() * avatars.length)]

    return {
      success: true,
      data: {
        userId,
        username,
        avatar,
        token: `mock-token-${userId}`,
        xp: 0,
        level: 1,
      },
    }
  },

  getLeaderboard: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const usersWithRanks = mockUsers
      .sort((a, b) => b.xp - a.xp)
      .map((user, index) => ({ ...user, rank: index + 1 }))

    return {
      success: true,
      data: usersWithRanks,
    }
  },
}

export const chatApi = {
  getChatGroups: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return {
      success: true,
      data: mockChatGroups,
    }
  },

  getChatMessages: async (groupId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return {
      success: true,
      data: mockMessages[groupId] || [],
    }
  },
}
