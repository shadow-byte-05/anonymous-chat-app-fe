import type { Message } from './api'
import { config } from '../config/environment'

// WebSocket message types
export interface WebSocketMessage {
  type: string
  payload: any
}

export interface NewMessagePayload {
  groupID: string
  message: Message
}

export interface MessageUpdatedPayload {
  groupID: string
  message: Message
}

export interface UserTypingPayload {
  groupID: string
  userID: string
  username: string
  isTyping: boolean
}

export interface GroupTypingStatusPayload {
  groupID: string
  activeTypers: Array<{
    userID: string
    username: string
    isTyping: boolean
  }>
}

export interface LeaderboardUpdatePayload {
  leaderboard: Array<{
    userID: string
    username: string
    points: number
  }>
}

export interface ChatCreatedPayload {
  groupChat: {
    id: string
    name: string
    description: string
    type: string
    createdByUserID: string
    createdAt: string
  }
}

// WebSocket service class
class SocketService {
  private ws: WebSocket | null = null
  private listeners: { [key: string]: Function[] } = {}
  private connected = false
  private connecting = false
  private shouldReconnect = true
  private reconnectAttempts = 0
  private maxReconnectAttempts = config.websocket.reconnectAttempts
  private reconnectDelay = config.websocket.reconnectDelay
  private currentUser: { userID: string; username: string } | null = null
  // Removed unused currentGroupID

  connect(userID: string, username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.connected || this.connecting) {
          resolve()
          return
        }
        this.connecting = true
        this.shouldReconnect = true

        if (this.ws) {
          try {
            const prev = this.ws
            // prevent old socket from triggering reconnect
            prev.onclose = null as any
            prev.onerror = null as any
            prev.onmessage = null as any
            prev.onopen = null as any
            prev.close()
          } catch {}
        }
        const wsUrl = config.websocket.url
        this.ws = new WebSocket(wsUrl)
        const currentSocket = this.ws
        this.currentUser = { userID, username }

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.connected = true
          this.connecting = false
          this.reconnectAttempts = 0
          
          // Register user with WebSocket
          this.send({
            type: 'register_user_ws',
            payload: { userID, username }
          })
          
          this.emit('connect')
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            try { console.log('[WS:inbound]', JSON.stringify(message)) } catch {}
            this.handleMessage(message)
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }

        this.ws.onclose = (event) => {
          if (this.ws !== currentSocket) {
            // Stale socket closed; ignore
            return
          }
          console.log('WebSocket disconnected', {
            code: (event as any).code,
            reason: (event as any).reason,
            wasClean: (event as any).wasClean,
          })
          this.connected = false
          this.connecting = false
          this.emit('disconnect')
          
          // Attempt to reconnect if not manually disconnected
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
            setTimeout(() => {
              if (this.currentUser) {
                this.connect(this.currentUser.userID, this.currentUser.username)
              }
            }, this.reconnectDelay * this.reconnectAttempts)
          }
        }

        this.ws.onerror = (error) => {
          if (this.ws !== currentSocket) {
            return
          }
          console.error('WebSocket error:', error)
          this.connecting = false
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private handleMessage(message: WebSocketMessage) {
    const { type, payload } = message

    switch (type) {
      case 'new_message':
      case 'newMessage':
      case 'message':
        this.emit('new_message', payload as NewMessagePayload)
        break
      case 'message_updated':
      case 'messageUpdated':
      case 'message_update':
        this.emit('message_updated', payload as MessageUpdatedPayload)
        break
      case 'user_typing':
        this.emit('user_typing', payload as UserTypingPayload)
        break
      case 'group_typing_status':
        this.emit('group_typing_status', payload as GroupTypingStatusPayload)
        break
      case 'leaderboard_update':
        this.emit('leaderboard_update', payload as LeaderboardUpdatePayload)
        break
      case 'chat_created':
        this.emit('chat_created', payload as ChatCreatedPayload)
        break
      case 'error':
        try {
          console.error('WebSocket server error:', typeof payload === 'string' ? payload : JSON.stringify(payload))
        } catch {
          console.error('WebSocket server error:', payload)
        }
        this.emit('server_error', payload)
        break
      default:
        console.warn('Unknown WebSocket message type:', type)
    }
  }

  private send(message: WebSocketMessage) {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, cannot send message:', message)
    }
  }

  joinChat(groupID: string) {
    if (!this.currentUser) {
      console.error('User not authenticated')
      return
    }

    const frame: WebSocketMessage = {
      type: 'join_chat',
      payload: {
        groupID,
        groupId: groupID,
        userID: this.currentUser.userID
      }
    }
    try { console.log('[WS:outbound]', JSON.stringify(frame)) } catch {}
    this.send(frame)
  }

  sendMessage(groupID: string, content: string, replyToMessageID?: string) {
    if (!this.currentUser) {
      console.error('User not authenticated')
      return
    }

    const frame: WebSocketMessage = {
      type: 'send_message',
      payload: {
        groupID,
        groupId: groupID,
        senderID: this.currentUser.userID,
        userID: this.currentUser.userID,
        encryptedContent: content, // In a real app, you'd encrypt this
        content,
        replyToMessageID,
        replyToMessageId: replyToMessageID,
      },
    }
    try {
      console.log('[WS:outbound]', JSON.stringify(frame))
    } catch {}
    this.send(frame)
  }

  addReaction(groupID: string, messageID: string, emoji: string) {
    if (!this.currentUser) {
      console.error('User not authenticated')
      return
    }

    this.send({
      type: 'add_reaction',
      payload: {
        groupID,
        messageID,
        userID: this.currentUser.userID,
        emoji
      }
    })
  }

  removeReaction(groupID: string, messageID: string, emoji: string) {
    if (!this.currentUser) {
      console.error('User not authenticated')
      return
    }

    this.send({
      type: 'remove_reaction',
      payload: {
        groupID,
        messageID,
        userID: this.currentUser.userID,
        emoji
      }
    })
  }

  sendTyping(groupID: string, isTyping: boolean) {
    if (!this.currentUser) {
      console.error('User not authenticated')
      return
    }

    this.send({
      type: 'typing',
      payload: {
        groupID,
        userID: this.currentUser.userID,
        isTyping
      }
    })
  }

  // Event listener methods
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
  }

  private emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(data))
    }
  }

  // Convenience methods for common events
  onMessage(callback: (payload: NewMessagePayload) => void) {
    this.on('new_message', callback)
  }

  onMessageUpdate(callback: (payload: MessageUpdatedPayload) => void) {
    this.on('message_updated', callback)
  }

  onTyping(callback: (payload: UserTypingPayload) => void) {
    this.on('user_typing', callback)
  }

  onGroupTypingStatus(callback: (payload: GroupTypingStatusPayload) => void) {
    this.on('group_typing_status', callback)
  }

  onLeaderboardUpdate(callback: (payload: LeaderboardUpdatePayload) => void) {
    this.on('leaderboard_update', callback)
  }

  onChatCreated(callback: (payload: ChatCreatedPayload) => void) {
    this.on('chat_created', callback)
  }

  onConnect(callback: () => void) {
    this.on('connect', callback)
  }

  onDisconnect(callback: () => void) {
    this.on('disconnect', callback)
  }

  onError(callback: (error: any) => void) {
    this.on('error', callback)
  }

  disconnect() {
    this.connected = false
    this.connecting = false
    this.shouldReconnect = false
    this.currentUser = null
    this.listeners = {}
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN
  }
}

export const socketService = new SocketService()
