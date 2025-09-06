import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import type {ReactNode} from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { userApi, chatApi } from '../utils/api'
import type { User, ChatGroup, Message } from '../utils/api'
import type { 
  NewMessagePayload, 
  MessageUpdatedPayload, 
  UserTypingPayload, 
  GroupTypingStatusPayload,
  LeaderboardUpdatePayload,
  ChatCreatedPayload 
} from '../utils/socket'

// State interfaces
interface ChatState {
  // User state
  user: User | null
  isAuthenticated: boolean
  
  // Chat state
  chatGroups: ChatGroup[]
  currentChatGroup: ChatGroup | null
  messages: Message[]
  typingUsers: Array<{
    userID: string
    username: string
    isTyping: boolean
  }>
  
  // Leaderboard state
  leaderboard: User[]
  
  // Loading states
  isLoading: boolean
  isConnecting: boolean
  
  // Connection state
  isConnected: boolean
  
  // Error states
  error: string | null
  connectionError: string | null
}

// Action types
type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTION_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_CHAT_GROUPS'; payload: ChatGroup[] }
  | { type: 'SET_CURRENT_CHAT_GROUP'; payload: ChatGroup | null }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { messageId: string; updates: Partial<Message> } }
  | { type: 'SET_TYPING_USERS'; payload: Array<{ userID: string; username: string; isTyping: boolean }> }
  | { type: 'SET_LEADERBOARD'; payload: User[] }
  | { type: 'ADD_CHAT_GROUP'; payload: ChatGroup }

// Initial state
const initialState: ChatState = {
  user: null,
  isAuthenticated: false,
  chatGroups: [],
  currentChatGroup: null,
  messages: [],
  typingUsers: [],
  leaderboard: [],
  isLoading: false,
  isConnecting: false,
  isConnected: false,
  error: null,
  connectionError: null,
}

// Reducer
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_CONNECTING':
      return { ...state, isConnecting: action.payload }
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_CONNECTION_ERROR':
      return { ...state, connectionError: action.payload }
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload }
    case 'SET_CHAT_GROUPS':
      return { ...state, chatGroups: action.payload }
    case 'SET_CURRENT_CHAT_GROUP':
      return { ...state, currentChatGroup: action.payload }
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload }
    case 'ADD_MESSAGE': {
      const incoming = action.payload
      const existsById = state.messages.some(msg => msg.id === incoming.id)
      if (existsById) {
        return {
          ...state,
          messages: state.messages.map(msg =>
            msg.id === incoming.id ? { ...msg, ...incoming } : msg
          ),
        }
      }
      // Deduplicate near-identical messages (optimistic vs server echo)
      const incomingTime = Date.parse(incoming.timestamp || '') || Date.now()
      const duplicateIndex = state.messages.findIndex(msg => {
        const sameSender = msg.senderID === incoming.senderID
        const sameContent = msg.encryptedContent === incoming.encryptedContent
        const msgTime = Date.parse(msg.timestamp || '') || 0
        const timeDiff = Math.abs(incomingTime - msgTime)
        return sameSender && sameContent && timeDiff < 3000
      })
      if (duplicateIndex >= 0) {
        const next = state.messages.slice()
        next[duplicateIndex] = { ...next[duplicateIndex], ...incoming }
        return { ...state, messages: next }
      }
      return { ...state, messages: [...state.messages, incoming] }
    }
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, ...action.payload.updates }
            : msg
        ),
      }
    case 'SET_TYPING_USERS':
      return { ...state, typingUsers: action.payload }
    case 'SET_LEADERBOARD':
      return { ...state, leaderboard: action.payload }
    case 'ADD_CHAT_GROUP':
      return { ...state, chatGroups: [...state.chatGroups, action.payload] }
    default:
      return state
  }
}

// Context interface
interface ChatContextType {
  // State
  state: ChatState
  
  // User actions
  setupUser: (username: string, avatar?: string) => Promise<void>
  logout: () => void
  
  // Chat actions
  loadChatGroups: () => Promise<void>
  joinChatGroup: (groupID: string) => Promise<void>
  sendMessage: (content: string, replyToMessageID?: string) => void
  addReaction: (messageID: string, emoji: string) => void
  removeReaction: (messageID: string, emoji: string) => void
  sendTyping: (isTyping: boolean) => void
  
  // Leaderboard actions
  loadLeaderboard: () => Promise<void>
  refreshUserProfile: () => Promise<void>
  
  // WebSocket connection
  connectWebSocket: (userID: string, username: string) => Promise<void>
  disconnectWebSocket: () => void
}

// Create context
const ChatContext = createContext<ChatContextType | undefined>(undefined)

// Provider component
interface ChatProviderProps {
  children: ReactNode
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const lastJoinedGroupRef = useRef<string | null>(null)

  // WebSocket hook
  const {
    isConnected,
    connectionError,
    connect: connectWS,
    disconnect: disconnectWS,
    joinChat,
    sendMessage: sendWSMessage,
    addReaction: addWSReaction,
    removeReaction: removeWSReaction,
    sendTyping: sendWSTyping,
  } = useWebSocket({
    onMessage: (payload: any) => {
      const p = payload || {}
      // Determine message object
      const messageObj = p.message ?? p.msg ?? p.data ?? (p.id && p.encryptedContent ? p : null)
      if (!messageObj) return
      // Determine group id (optional)
      const rawIncomingGroup = p.groupID ?? p.groupId ?? messageObj.groupID ?? messageObj.groupId
      const incomingGroup = rawIncomingGroup != null ? String(rawIncomingGroup) : null
      const currentGroup = state.currentChatGroup?.groupID != null ? String(state.currentChatGroup.groupID) : null
      if (!currentGroup) return
      if (incomingGroup && incomingGroup !== currentGroup) return
      dispatch({ type: 'ADD_MESSAGE', payload: messageObj })
    },
    onMessageUpdate: (payload: any) => {
      const p = payload || {}
      const messageObj = p.message ?? p.msg ?? p.data ?? (p.id && p.encryptedContent ? p : null)
      if (!messageObj) return
      const rawIncomingGroup = p.groupID ?? p.groupId ?? messageObj.groupID ?? messageObj.groupId
      const incomingGroup = rawIncomingGroup != null ? String(rawIncomingGroup) : null
      const currentGroup = state.currentChatGroup?.groupID != null ? String(state.currentChatGroup.groupID) : null
      if (!currentGroup) return
      if (incomingGroup && incomingGroup !== currentGroup) return
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: { messageId: messageObj.id, updates: messageObj },
      })
    },
    onTyping: (payload: UserTypingPayload) => {
      if (payload.groupID === state.currentChatGroup?.groupID) {
        const updatedTypingUsers = state.typingUsers.filter(
          user => user.userID !== payload.userID
        )
        if (payload.isTyping) {
          updatedTypingUsers.push({
            userID: payload.userID,
            username: payload.username,
            isTyping: payload.isTyping,
          })
        }
        const same =
          updatedTypingUsers.length === state.typingUsers.length &&
          updatedTypingUsers.every((u, i) =>
            u.userID === state.typingUsers[i]?.userID &&
            u.username === state.typingUsers[i]?.username &&
            u.isTyping === state.typingUsers[i]?.isTyping
          )
        if (!same) {
          dispatch({ type: 'SET_TYPING_USERS', payload: updatedTypingUsers })
        }
      }
    },
    onGroupTypingStatus: (payload: GroupTypingStatusPayload) => {
      if (payload.groupID === state.currentChatGroup?.groupID) {
        const current = state.typingUsers
        const next = payload.activeTypers
        const same =
          next.length === current.length &&
          next.every((u, i) =>
            u.userID === current[i]?.userID &&
            u.username === current[i]?.username &&
            u.isTyping === current[i]?.isTyping
          )
        if (!same) {
          dispatch({ type: 'SET_TYPING_USERS', payload: next })
        }
      }
    },
    onLeaderboardUpdate: (payload: LeaderboardUpdatePayload) => {
      const leaderboardUsers = payload.leaderboard.map(user => ({
        userID: user.userID,
        username: user.username,
        points: user.points,
        level: Math.floor(user.points / 100) + 1,
        avatar: '🎯',
      }))
      dispatch({ type: 'SET_LEADERBOARD', payload: leaderboardUsers })

      // Also update current user's points/level if present in the update
      const updatedSelf = payload.leaderboard.find(u => u.userID === state.user?.userID)
      if (updatedSelf && state.user) {
        const nextLevel = Math.floor(updatedSelf.points / 100) + 1
        const maybeChanged =
          state.user.points !== updatedSelf.points || (state.user.level ?? 1) !== nextLevel
        if (maybeChanged) {
          dispatch({
            type: 'SET_USER',
            payload: { ...state.user, points: updatedSelf.points, level: nextLevel },
          })
        }
      }
    },
    onChatCreated: (payload: ChatCreatedPayload) => {
      const newChatGroup: ChatGroup = {
        groupID: payload.groupChat.id,
        name: payload.groupChat.name,
        description: payload.groupChat.description,
        type: payload.groupChat.type,
        createdByUserID: payload.groupChat.createdByUserID,
        createdAt: payload.groupChat.createdAt,
        isActive: true,
      }
      dispatch({ type: 'ADD_CHAT_GROUP', payload: newChatGroup })
    },
    onConnect: () => {
      dispatch({ type: 'SET_CONNECTING', payload: false })
      dispatch({ type: 'SET_CONNECTED', payload: true })
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: null })
    },
    onDisconnect: () => {
      dispatch({ type: 'SET_CONNECTING', payload: false })
      dispatch({ type: 'SET_CONNECTED', payload: false })
    },
    onError: (error: any) => {
      // Avoid dispatch loops if error text is unchanged
      const next = error.message || 'WebSocket error'
      if (state.connectionError !== next) {
        dispatch({ type: 'SET_CONNECTION_ERROR', payload: next })
      }
      if (state.isConnected) {
        dispatch({ type: 'SET_CONNECTED', payload: false })
      }
    },
  })

  // Connection status is updated via onConnect/onDisconnect/onError handlers

  // User actions
  const setupUser = async (username: string, avatar?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const response = await userApi.setupUser(username, avatar)
      
      const user: User = {
        userID: response.data.userID,
        username: response.data.username,
        avatar: response.data.avatar,
        points: 0,
        level: 1,
        badges: [],
      }

      dispatch({ type: 'SET_USER', payload: user })
      dispatch({ type: 'SET_AUTHENTICATED', payload: true })
      
      // Store user data in localStorage
      localStorage.setItem('auth-token', `token-${response.data.userID}`)
      localStorage.setItem('user-data', JSON.stringify(user))
      
      // Connect to WebSocket
      await connectWebSocket(user.userID, user.username)
      
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to setup user' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const logout = () => {
    disconnectWebSocket()
    dispatch({ type: 'SET_USER', payload: null })
    dispatch({ type: 'SET_AUTHENTICATED', payload: false })
    dispatch({ type: 'SET_CURRENT_CHAT_GROUP', payload: null })
    dispatch({ type: 'SET_MESSAGES', payload: [] })
    dispatch({ type: 'SET_TYPING_USERS', payload: [] })
    
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user-data')
  }

  // Chat actions
  const loadChatGroups = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await chatApi.getAllChatGroups()
      dispatch({ type: 'SET_CHAT_GROUPS', payload: response.data })
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load chat groups' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const joinChatGroup = async (groupID: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // Get chat group details
      const groupResponse = await chatApi.getChatGroupDetails(groupID)
      const chatGroup = groupResponse.data
      
      // Get messages for the group
      const messagesResponse = await chatApi.getGroupMessages(groupID)
      
      dispatch({ type: 'SET_CURRENT_CHAT_GROUP', payload: chatGroup })
      dispatch({ type: 'SET_MESSAGES', payload: messagesResponse.data })
      dispatch({ type: 'SET_TYPING_USERS', payload: [] })
      
      // Join the chat via WebSocket
      if (isConnected) {
        if (lastJoinedGroupRef.current !== groupID) {
          joinChat(groupID)
          lastJoinedGroupRef.current = groupID
        }
      } else {
        // Will be joined in the connection-effect below
        lastJoinedGroupRef.current = null
      }
      
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to join chat group' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const sendMessage = (content: string, replyToMessageID?: string) => {
    if (!state.currentChatGroup || !isConnected) return
    
    sendWSMessage(state.currentChatGroup.groupID, content, replyToMessageID)
  }

  const addReaction = (messageID: string, emoji: string) => {
    if (!state.currentChatGroup || !isConnected) return
    
    addWSReaction(state.currentChatGroup.groupID, messageID, emoji)
  }

  const removeReaction = (messageID: string, emoji: string) => {
    if (!state.currentChatGroup || !isConnected) return
    
    removeWSReaction(state.currentChatGroup.groupID, messageID, emoji)
  }

  const sendTyping = (isTyping: boolean) => {
    if (!state.currentChatGroup || !isConnected) return
    
    sendWSTyping(state.currentChatGroup.groupID, isTyping)
  }

  // Leaderboard actions
  const loadLeaderboard = async () => {
    try {
      const response = await userApi.getLeaderboard()
      dispatch({ type: 'SET_LEADERBOARD', payload: response.data })
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load leaderboard' })
    }
  }

  // User profile refresh
  const refreshUserProfile = async () => {
    try {
      if (!state.user?.userID) return
      const response = await userApi.getUserProfile(state.user.userID)
      const apiUser = response.data
      const nextLevel = Math.floor((apiUser.points || 0) / 100) + 1
      const changed =
        state.user.points !== apiUser.points || (state.user.level ?? 1) !== nextLevel ||
        state.user.avatar !== apiUser.avatar
      if (changed) {
        dispatch({
          type: 'SET_USER',
          payload: { ...state.user, points: apiUser.points, level: nextLevel, avatar: apiUser.avatar },
        })
      }
    } catch (error) {
      // Silent failure; chat can proceed without profile refresh
    }
  }

  // WebSocket connection actions
  const connectWebSocket = async (userID: string, username: string) => {
    try {
      dispatch({ type: 'SET_CONNECTING', payload: true })
      await connectWS(userID, username)
    } catch (error: any) {
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: error.message || 'Failed to connect to WebSocket' })
    }
  }

  const disconnectWebSocket = () => {
    disconnectWS()
  }

  // Initialize user from localStorage on mount (do not auto-connect here)
  useEffect(() => {
    const userData = localStorage.getItem('user-data')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        dispatch({ type: 'SET_USER', payload: user })
        dispatch({ type: 'SET_AUTHENTICATED', payload: true })
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error)
        localStorage.removeItem('user-data')
        localStorage.removeItem('auth-token')
      }
    }
  }, [])

  // Refresh user profile once authenticated/user is known
  useEffect(() => {
    if (state.isAuthenticated && state.user?.userID) {
      refreshUserProfile()
    }
  }, [state.isAuthenticated, state.user?.userID])

  // Connect WebSocket once when authenticated and not yet connected
  useEffect(() => {
    if (state.isAuthenticated && !isConnected && state.user) {
      connectWebSocket(state.user.userID, state.user.username)
    }
  }, [state.isAuthenticated, isConnected, state.user?.userID, state.user?.username])

  // Join current chat group once socket is connected
  useEffect(() => {
    if (!isConnected || !state.currentChatGroup) return
    const groupID = state.currentChatGroup.groupID
    if (lastJoinedGroupRef.current !== groupID) {
      joinChat(groupID)
      lastJoinedGroupRef.current = groupID
    }
  }, [isConnected, state.currentChatGroup?.groupID])

  const contextValue: ChatContextType = {
    state,
    setupUser,
    logout,
    loadChatGroups,
    joinChatGroup,
    sendMessage,
    addReaction,
    removeReaction,
    sendTyping,
    loadLeaderboard,
    refreshUserProfile,
    connectWebSocket,
    disconnectWebSocket,
  }

  // expose dispatch for optimistic UI where needed
  ;(window as any).__chatDispatch = dispatch

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
}

// Custom hook to use the context
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
