import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

interface ReactionBarProps {
  reactions: { [emoji: string]: string[] }
  onReaction: (emoji: string) => void
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🚀']

export const ReactionBar: React.FC<ReactionBarProps> = ({
  reactions,
  onReaction,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const safeReactions = reactions || {}
  const getCount = (value: any): number => {
    if (Array.isArray(value)) return value.length
    if (value && typeof value === 'object') return Object.keys(value).length
    if (typeof value === 'number') return value
    return 0
  }
  const entries = Object.entries(safeReactions).filter(([, v]) => getCount(v) > 0)
  const hasReactions = entries.length > 0

  return (
    <div className="flex items-center gap-1 mt-2">
      <AnimatePresence>
        {hasReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex gap-1 flex-wrap"
          >
            {entries.map(([emoji, users]) => (
              <Badge
                key={emoji}
                variant="secondary"
                className="h-6 px-2 text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => onReaction(emoji)}
              >
                <span className="mr-1">{emoji}</span>
                {getCount(users)}
              </Badge>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-accent hover:text-accent-foreground"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top" align="start">
          <div className="grid grid-cols-4 gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-accent"
                onClick={() => {
                  onReaction(emoji)
                  setIsOpen(false)
                }}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
