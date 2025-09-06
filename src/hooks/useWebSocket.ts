import { useEffect, useRef, useCallback, useState } from 'react'
import { socketService } from '../utils/socket'
import type { 
  NewMessagePayload, 
  MessageUpdatedPayload, 
  UserTypingPayload, 
  GroupTypingStatusPayload,
  LeaderboardUpdatePayload,
  ChatCreatedPayload 
} from '../utils/socket'

interface UseWebSocketOptions {
  onMessage?: (payload: NewMessagePayload) => void
  onMessageUpdate?: (payload: MessageUpdatedPayload) => void
  onTyping?: (payload: UserTypingPayload) => void
  onGroupTypingStatus?: (payload: GroupTypingStatusPayload) => void
  onLeaderboardUpdate?: (payload: LeaderboardUpdatePayload) => void
  onChatCreated?: (payload: ChatCreatedPayload) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: any) => void
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const optionsRef = useRef(options)

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const connect = useCallback(async (userID: string, username: string) => {
    try {
      setConnectionError(null)
      await socketService.connect(userID, username)
      setIsConnected(true)
    } catch (error: any) {
      setConnectionError(error.message || 'Failed to connect to WebSocket')
      setIsConnected(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    socketService.disconnect()
    setIsConnected(false)
    setConnectionError(null)
  }, [])

  const joinChat = useCallback((groupID: string) => {
    socketService.joinChat(groupID)
  }, [])

  const sendMessage = useCallback((groupID: string, content: string, replyToMessageID?: string) => {
    socketService.sendMessage(groupID, content, replyToMessageID)
  }, [])

  const addReaction = useCallback((groupID: string, messageID: string, emoji: string) => {
    socketService.addReaction(groupID, messageID, emoji)
  }, [])

  const removeReaction = useCallback((groupID: string, messageID: string, emoji: string) => {
    socketService.removeReaction(groupID, messageID, emoji)
  }, [])

  const sendTyping = useCallback((groupID: string, isTyping: boolean) => {
    socketService.sendTyping(groupID, isTyping)
  }, [])

  // Set up event listeners
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true)
      setConnectionError(null)
      optionsRef.current.onConnect?.()
    }

    const handleDisconnect = () => {
      setIsConnected(false)
      optionsRef.current.onDisconnect?.()
    }

    const handleError = (error: any) => {
      setConnectionError(error.message || 'WebSocket error occurred')
      optionsRef.current.onError?.(error)
    }

    const handleMessage = (payload: any) => {
      optionsRef.current.onMessage?.(payload)
    }

    const handleMessageUpdate = (payload: any) => {
      optionsRef.current.onMessageUpdate?.(payload)
    }

    const handleTyping = (payload: UserTypingPayload) => {
      optionsRef.current.onTyping?.(payload)
    }

    const handleGroupTypingStatus = (payload: GroupTypingStatusPayload) => {
      optionsRef.current.onGroupTypingStatus?.(payload)
    }

    const handleLeaderboardUpdate = (payload: LeaderboardUpdatePayload) => {
      optionsRef.current.onLeaderboardUpdate?.(payload)
    }

    const handleChatCreated = (payload: ChatCreatedPayload) => {
      optionsRef.current.onChatCreated?.(payload)
    }

    // Register event listeners
    socketService.onConnect(handleConnect)
    socketService.onDisconnect(handleDisconnect)
    socketService.onError(handleError)
    socketService.onMessage(handleMessage)
    // Back-compat aliases (if socket service exposes different events)
    socketService.on('message', handleMessage as any)
    socketService.on('newMessage', handleMessage as any)
    socketService.onMessageUpdate(handleMessageUpdate)
    socketService.onTyping(handleTyping)
    socketService.onGroupTypingStatus(handleGroupTypingStatus)
    socketService.onLeaderboardUpdate(handleLeaderboardUpdate)
    socketService.onChatCreated(handleChatCreated)

    // Cleanup function
    return () => {
      socketService.off('connect', handleConnect)
      socketService.off('disconnect', handleDisconnect)
      socketService.off('error', handleError)
      socketService.off('new_message', handleMessage)
      socketService.off('message', handleMessage as any)
      socketService.off('newMessage', handleMessage as any)
      socketService.off('message_updated', handleMessageUpdate)
      socketService.off('user_typing', handleTyping)
      socketService.off('group_typing_status', handleGroupTypingStatus)
      socketService.off('leaderboard_update', handleLeaderboardUpdate)
      socketService.off('chat_created', handleChatCreated)
    }
  }, [])

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    joinChat,
    sendMessage,
    addReaction,
    removeReaction,
    sendTyping,
  }
}
