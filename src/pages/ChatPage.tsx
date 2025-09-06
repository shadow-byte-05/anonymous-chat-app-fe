import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useChat } from '../contexts/ChatContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { MessageBubble } from '../components/chat/MessageBubble'
import { TypingIndicator } from '../components/chat/TypingIndicator'
import { XPBar } from '../components/gamification/XPBar'
import { toast } from 'sonner'

interface ChatPageProps {
  groupID: string
}

export const ChatPage: React.FC<ChatPageProps> = ({ groupID }) => {
  const {
    state,
    joinChatGroup,
    sendMessage,
    addReaction,
    removeReaction,
    sendTyping,
    refreshUserProfile,
  } = useChat()

  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [replyToMessage, setReplyToMessage] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [state.messages, scrollToBottom])

  // Join chat group when component mounts or groupID changes
  useEffect(() => {
    if (!groupID || !state.isAuthenticated) return
    if (state.currentChatGroup?.groupID === groupID) return
    joinChatGroup(groupID)
  }, [groupID, state.isAuthenticated])

  // Ensure user points/level are up-to-date for XP bar
  useEffect(() => {
    if (state.isAuthenticated && state.user?.userID) {
      refreshUserProfile()
    }
  }, [state.isAuthenticated, state.user?.userID])

  // Handle typing indicator
  const handleTyping = useCallback((value: string) => {
    setMessageInput(value)
    
    if (!isTyping && value.trim()) {
      setIsTyping(true)
      sendTyping(true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false)
        sendTyping(false)
      }
    }, 1000)
  }, [isTyping, sendTyping])

  // Handle message send
  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim() || !state.currentChatGroup) return

    try {
      // Optimistic UI: append a local message placeholder
      const tempId = `temp-${Date.now()}`
      const optimistic = {
        id: tempId,
        senderID: state.user?.userID || 'me',
        senderUsername: state.user?.username || 'Me',
        senderAvatar: state.user?.avatar || '',
        encryptedContent: messageInput.trim(),
        timestamp: new Date().toISOString(),
        reactions: {},
      } as any
      // Let reducer handle dedupe when server echo arrives
      ;(window as any).__chatDispatch?.({ type: 'ADD_MESSAGE', payload: optimistic })

      sendMessage(messageInput.trim(), replyToMessage?.id)
      setMessageInput('')
      setReplyToMessage(null)
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false)
        sendTyping(false)
      }
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message')
    }
  }, [messageInput, state.currentChatGroup, replyToMessage, sendMessage, isTyping, sendTyping, state.user?.userID, state.user?.username, state.user?.avatar])

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  // Handle reaction
  const handleReaction = useCallback((messageId: string, emoji: string) => {
    try {
      const message = state.messages.find(msg => msg.id === messageId)
      if (!message) return
      const reactions = (message.reactions && typeof message.reactions === 'object') ? message.reactions : {}
      const rawUsersForEmoji = (reactions as any)[emoji]
      const usersForEmoji: string[] = Array.isArray(rawUsersForEmoji) ? rawUsersForEmoji : []
      const currentUserId = state.user?.userID || ''
      const hasReacted = usersForEmoji.includes(currentUserId)
      
      if (hasReacted) {
        removeReaction(messageId, emoji)
      } else {
        addReaction(messageId, emoji)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add reaction')
    }
  }, [state.messages, state.user, addReaction, removeReaction])

  // Reply handling currently unused in UI

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // Show loading state
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (state.error) {
    console.log(state.error)
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6 text-center max-w-md">
          <div className="text-destructive mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <p className="text-muted-foreground mb-4">{state.error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  // Show not authenticated state
  if (!state.isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6 text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">Not Authenticated</h3>
          <p className="text-muted-foreground mb-4">Please log in to access the chat.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </Card>
      </div>
    )
  }

  // Show no chat group selected
  if (!state.currentChatGroup) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6 text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">No Chat Selected</h3>
          <p className="text-muted-foreground">Please select a chat group to start messaging.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg">💬</span>
            </div>
            <div>
              <h2 className="font-semibold">{state.currentChatGroup.name}</h2>
              <p className="text-sm text-muted-foreground">
                {state.currentChatGroup.description}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {state.connectionError && (
              <Badge variant="destructive" className="text-xs">
                Connection Error
              </Badge>
            )}
            <Badge variant={state.isConnected ? "default" : "secondary"} className="text-xs">
              {state.isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>
        
        {/* XP Bar */}
        {state.user && (
          <div className="mt-3">
            <XPBar 
              currentXP={Number(state.user.points) || 0}
              level={Number(state.user.level) || 1}
            />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
        {state.messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <div className="text-4xl mb-4">💬</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          state.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderID === state.user?.userID}
              onReaction={handleReaction}
            />
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyToMessage && (
        <div className="border-t bg-muted/50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Replying to:</span>
              <span className="text-sm font-medium">{replyToMessage.senderUsername}</span>
              <span className="text-sm text-muted-foreground truncate max-w-xs">
                {replyToMessage.encryptedContent}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyToMessage(null)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Message Input pinned to bottom */}
      <div className="mt-auto border-t bg-background p-3 sticky bottom-0">
        {/* Typing Indicator (moved here to avoid being hidden behind input) */}
        {state.typingUsers.length > 0 && (
          <div className="mb-2">
            <TypingIndicator typingUsers={state.typingUsers.map(u => u.username)} />
          </div>
        )}
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={messageInput}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={!state.isConnected}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || !state.isConnected}
            size="icon"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
        
        {/* Connection Status */}
        {!state.isConnected && (
          <div className="mt-2 text-center">
            <p className="text-sm text-muted-foreground">
              {state.connectionError || "Connecting to chat..."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
