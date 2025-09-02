// Mock WebSocket service for demonstration
class SocketService {
  private listeners: { [key: string]: Function[] } = {}
  private connected = false
  private currentUser: any = null

  connect(userId: string) {
    console.log('Mock socket connected')
    this.connected = true
    this.currentUser = JSON.parse(
      localStorage.getItem('auth-storage') || '{}'
    ).state

    // Simulate connection
    setTimeout(() => {
      this.emit('connect')
    }, 100)

    return this
  }

  joinChat(chatId: string) {
    console.log('Joined chat:', chatId)
  }

  sendMessage(chatId: string, content: string) {
    if (!this.currentUser) return

    // Create mock message
    const message = {
      id: Math.random().toString(36).substr(2, 9),
      userId: this.currentUser.userId,
      username: this.currentUser.username,
      avatar: this.currentUser.avatar,
      content,
      timestamp: new Date().toISOString(),
      reactions: {},
    }

    // Simulate message receiving
    setTimeout(() => {
      this.emit('new_message', message)

      // Simulate XP gain
      const newXP = (this.currentUser.xp || 0) + 10
      const newLevel = Math.floor(newXP / 100) + 1

      this.emit('xp_updated', {
        userId: this.currentUser.userId,
        xp: newXP,
        level: newLevel,
        gained: 10,
      })
    }, 200)
  }

  addReaction(messageId: string, emoji: string) {
    setTimeout(() => {
      this.emit('reaction_added', {
        messageId,
        emoji,
        userId: this.currentUser?.userId,
      })
    }, 100)
  }

  removeReaction(messageId: string, emoji: string) {
    setTimeout(() => {
      this.emit('reaction_removed', {
        messageId,
        emoji,
        userId: this.currentUser?.userId,
      })
    }, 100)
  }

  sendTyping(chatId: string, isTyping: boolean) {
    if (isTyping) {
      setTimeout(() => {
        this.emit('user_typing', {
          userId: 'other-user',
          username: 'Someone',
          chatId,
          isTyping: true,
        })
      }, 500)

      setTimeout(() => {
        this.emit('user_typing', {
          userId: 'other-user',
          username: 'Someone',
          chatId,
          isTyping: false,
        })
      }, 3000)
    }
  }

  // Event listener methods
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(data))
    }
  }

  onMessage(callback: (message: any) => void) {
    this.on('new_message', callback)
  }

  onReaction(callback: (data: any) => void) {
    this.on('reaction_added', callback)
    this.on('reaction_removed', callback)
  }

  onTyping(callback: (data: any) => void) {
    this.on('user_typing', callback)
  }

  onXPUpdate(callback: (data: any) => void) {
    this.on('xp_updated', callback)
  }

  disconnect() {
    this.connected = false
    this.listeners = {}
    console.log('Mock socket disconnected')
  }
}

export const socketService = new SocketService()
