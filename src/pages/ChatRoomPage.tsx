import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'motion/react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Send, Users, Trophy } from 'lucide-react'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { TypingIndicator } from '@/components/chat/TypingIndicator'
import { XPBar } from '@/components/gamification/XPBar'
import { chatApi } from '@/utils/api'
import { socketService } from '@/utils/socket'
import { useChatStore } from '@/store/UseChatStore'
import { useAuthStore } from '@/store/UseAuthStore'
import { toast } from 'sonner'

export const ChatRoomPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const {
    messages,
    typingUsers,
    setMessages,
    addMessage,
    updateMessage,
    setTypingUsers,
  } = useChatStore()

  const [messageText, setMessageText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!chatId || !user) {
      navigate('/')
      return
    }

    loadMessages()
    setupSocket()

    return () => {
      socketService.sendTyping(chatId, false)
    }
  }, [chatId, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    if (!chatId) return

    try {
      const response = await chatApi.getChatMessages(chatId)
      setMessages(response.data)
    } catch (error) {
      console.error('Failed to load messages:', error)
      toast.error('Failed to load chat messages')
    } finally {
      setIsLoading(false)
    }
  }

  const setupSocket = () => {
    if (!user || !chatId) return

    const socket = socketService.connect(user.id)
    socketService.joinChat(chatId)

    // Listen for new messages
    socketService.onMessage((message) => {
      addMessage(message)
    })

    // Listen for reactions
    socketService.onReaction((data) => {
      updateMessage(data.messageId, { reactions: data.reactions })
    })

    // Listen for typing
    socketService.onTyping((data) => {
      if (data.userId !== user.id) {
        setTypingUsers(
          data.typingUsers.filter((u: string) => u !== user.username)
        )
      }
    })

    // Listen for XP updates
    socketService.onXPUpdate((data) => {
      if (data.userId === user.id) {
        setUser({ ...user, xp: data.xp, level: data.level })
        toast.success(`+${data.xpGained} XP`, {
          description: `Total: ${data.xp} XP`,
          duration: 2000,
        })
      }
    })
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = () => {
    if (!messageText.trim() || !chatId) return

    socketService.sendMessage(chatId, messageText)
    setMessageText('')

    // Stop typing indicator
    if (isTyping) {
      socketService.sendTyping(chatId, false)
      setIsTyping(false)
    }
  }

  const handleTyping = (value: string) => {
    setMessageText(value)

    if (!chatId) return

    if (value && !isTyping) {
      setIsTyping(true)
      socketService.sendTyping(chatId, true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        socketService.sendTyping(chatId, false)
        setIsTyping(false)
      }
    }, 2000)
  }

  const handleReaction = (messageId: string, emoji: string) => {
    socketService.addReaction(messageId, emoji)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!user) {
    navigate('/')
    return null
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/chats')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Chat Room</h1>
              <p className="text-xs text-muted-foreground">
                {messages.length} messages
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/leaderboard')}
            className="gap-2"
          >
            <Trophy className="h-4 w-4" />
            Leaderboard
          </Button>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="bg-card/50 px-4 py-2 border-b border-border/50">
        <XPBar currentXP={user.xp} level={user.level} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center h-full"
          >
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-2xl mx-auto flex items-center justify-center">
                <Users className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Start the Conversation
                </h3>
                <p className="text-muted-foreground">
                  Be the first to send a message and earn XP!
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.userId === user.id}
                onReaction={handleReaction}
              />
            ))}
            <TypingIndicator typingUsers={typingUsers} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-card border-t border-border p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            size="sm"
            className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          Earn 10 XP for each message • 5 XP for reactions
        </p>
      </div>
    </div>
  )
}

export default ChatRoomPage
