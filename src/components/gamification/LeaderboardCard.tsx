import React from 'react'
import { motion } from 'framer-motion'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Crown, Trophy, Medal } from 'lucide-react'

interface LeaderboardUser {
  id: string
  username: string
  avatar: string
  xp: number
  level: number
  rank: number
}

interface LeaderboardCardProps {
  user: LeaderboardUser
  index: number
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  user,
  index,
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-xp-gold" />
      case 2:
        return <Trophy className="h-5 w-5 text-xp-silver" />
      case 3:
        return <Medal className="h-5 w-5 text-warning" />
      default:
        return (
          <span className="text-lg font-bold text-muted-foreground">
            #{rank}
          </span>
        )
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-xp-gold/20 to-warning/20 border-xp-gold/30'
      case 2:
        return 'from-xp-silver/20 to-muted/20 border-xp-silver/30'
      case 3:
        return 'from-warning/20 to-warning/10 border-warning/30'
      default:
        return 'from-card to-secondary border-border'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        className={`hover-lift bg-gradient-to-r ${getRankColor(user.rank)}`}
      >
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex items-center justify-center w-12">
            {getRankIcon(user.rank)}
          </div>

          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
            <AvatarImage src={user.avatar} alt={user.username} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{user.username}</h3>
            <p className="text-sm text-muted-foreground">
              Level {user.level} • {user.xp.toLocaleString()} XP
            </p>
          </div>

          {user.rank <= 3 && (
            <Badge variant="secondary" className="badge-glow">
              Top {user.rank}
            </Badge>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
