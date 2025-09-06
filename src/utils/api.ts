import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { config } from '../config/environment'

// Types
export interface User {
  userID: string
  username: string
  avatar: string
  points?: number
  level?: number
  badges?: string[]
  createdAt?: string
}

export interface ChatGroup {
  groupID: string
  name: string
  description: string
  type: string
  createdByUserID: string
  createdAt: string
  memberCount?: number
  isActive?: boolean
}

export interface Message {
  id: string
  senderID: string
  senderUsername: string
  senderAvatar: string
  encryptedContent: string
  timestamp: string
  reactions: { [emoji: string]: string[] }
  replyToMessageID?: string
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

// Axios instance configuration
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: config.api.baseURL,
    timeout: config.api.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor for adding auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth-token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response
    },
    (error) => {
      if (error.response?.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('auth-token')
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )

  return instance
}

const api = createApiInstance()

// User API functions
export const userApi = {
  setupUser: async (username: string, avatar?: string): Promise<ApiResponse<{ userID: string; username: string; avatar: string }>> => {
    try {
      const response = await api.post('/users/setup', { username, avatar })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to setup user')
    }
  },

  getUserProfile: async (userID: string): Promise<ApiResponse<User>> => {
    try {
      const response = await api.get(`/users/${userID}`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get user profile')
    }
  },

  getLeaderboard: async (): Promise<ApiResponse<User[]>> => {
    try {
      const response = await api.get('/users/leaderboard')
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get leaderboard')
    }
  },
}

// Chat API functions
export const chatApi = {
  createChatGroup: async (name: string, description: string, type: string, createdByUserID: string): Promise<ApiResponse<ChatGroup>> => {
    try {
      const response = await api.post('/chats', { name, description, type, createdByUserID })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create chat group')
    }
  },

  getAllChatGroups: async (): Promise<ApiResponse<ChatGroup[]>> => {
    try {
      const response = await api.get('/chats')
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get chat groups')
    }
  },

  getChatGroupDetails: async (groupID: string): Promise<ApiResponse<ChatGroup>> => {
    try {
      const response = await api.get(`/chats/${groupID}`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get chat group details')
    }
  },

  getGroupMessages: async (groupID: string, limit: number = 50): Promise<ApiResponse<Message[]>> => {
    try {
      const response = await api.get(`/chats/${groupID}/messages`, { params: { limit } })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get group messages')
    }
  },
}

// Export the main API instance for custom requests
export { api }
