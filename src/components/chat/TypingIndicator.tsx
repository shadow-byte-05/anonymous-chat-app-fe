import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TypingIndicatorProps {
  typingUsers: string[]
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
}) => {
  if (typingUsers.length === 0) 
    return null

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} is typing...`
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing...`
    } else {
      return `${typingUsers.length} people are typing...`
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex items-center gap-3 px-4 py-2"
      >
        <div className="flex gap-1">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
        <span className="text-sm text-muted-foreground">{getTypingText()}</span>
      </motion.div>
    </AnimatePresence>
  )
}
