import React from 'react'
import { motion } from 'motion/react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ReactionBar } from './ReactionBar.tsx'

interface Message {
  id: string
  userId: string
  username: string
  avatar: string
  content: string
  timestamp: string
  reactions: { [emoji: string]: string[] }
}

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  onReaction: (messageId: string, emoji: string) => void
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  onReaction,
}) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : ''}`}
    >
      {!isOwn && (
        <Avatar className="h-8 w-8 ring-2 ring-border">
          <AvatarImage src={message.avatar} alt={message.username} />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            {message.username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`flex flex-col max-w-xs ${isOwn ? 'items-end' : ''}`}>
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">
              {message.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
          </div>
        )}

        <div
          className={`message-bubble ${
            isOwn ? 'message-bubble-own' : 'message-bubble-other'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>

          {isOwn && (
            <div className="text-xs text-primary-foreground/70 mt-1 text-right">
              {formatTime(message.timestamp)}
            </div>
          )}
        </div>

        <ReactionBar
          reactions={message.reactions}
          onReaction={(emoji) => onReaction(message.id, emoji)}
        />
      </div>
    </motion.div>
  )
}
