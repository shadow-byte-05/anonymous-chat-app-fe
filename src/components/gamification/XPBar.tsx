import React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Zap } from 'lucide-react'

interface XPBarProps {
  currentXP: number
  level: number
  maxXP?: number
  className?: string
}

export const XPBar: React.FC<XPBarProps> = ({
  currentXP,
  level,
  maxXP = 1000,
  className = '',
}) => {
  const progress = (currentXP % maxXP) / maxXP
  const nextLevelXP = maxXP - (currentXP % maxXP)

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="badge-glow">
            <Zap className="h-3 w-3 mr-1" />
            Level {level}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {currentXP.toLocaleString()} XP
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {nextLevelXP} to next level
        </span>
      </div>

      <div className="xp-bar">
        <motion.div
          className="xp-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
