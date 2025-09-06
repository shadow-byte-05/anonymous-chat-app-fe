
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trophy, Crown, Medal, Star, Zap } from 'lucide-react'
import { LeaderboardCard } from '@/components/gamification/LeaderboardCard'
import { XPBar } from '@/components/gamification/XPBar'
import { useChat } from '@/contexts/ChatContext'
import { toast } from 'sonner'

interface LeaderboardUser {
  id: string
  username: string
  avatar: string
  xp: number
  level: number
  rank: number
}

export const LeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const { state, loadLeaderboard } = useChat()

  useEffect(() => {
    ;(async () => {
      try {
        await loadLeaderboard()
      } catch (e) {
        // handled in context
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    try {
      const mapped = (state.leaderboard || []).map((u, index) => ({
        id: (u as any).userID ?? (u as any).id ?? u.username,
        username: u.username,
        avatar: (u as any).avatar ?? '🎯',
        xp: (u as any).points ?? (u as any).xp ?? 0,
        level: (u as any).level ?? 1,
        rank: index + 1,
      }))
      setLeaderboard(mapped)
    } catch (error) {
      console.error('Failed to map leaderboard:', error)
      toast.error('Failed to map leaderboard')
    }
  }, [state.leaderboard])

  const getUserRank = () => {
    if (!state.user) return null
    return (
      leaderboard.find((u) => u.id === state.user?.userID || u.username === state.user?.username)?.rank || null
    )
  }

  const topThree = leaderboard.slice(0, 3)
  const restOfList = leaderboard.slice(3)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/chats')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Leaderboard
                </h1>
                <p className="text-sm text-muted-foreground">Top XP earners</p>
              </div>
            </div>

            <Badge variant="secondary" className="gap-2">
              <Trophy className="h-4 w-4" />
              {leaderboard.length} players
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Your Progress */}
        {state.user && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="chat-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-xp-gold" />
                  Your Progress
                </CardTitle>
                <CardDescription>
                  {getUserRank()
                    ? `You're ranked #${getUserRank()}`
                    : 'Keep chatting to enter the leaderboard!'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <XPBar currentXP={(state.user.points as any) || 0} level={(state.user.level as any) || 1} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-center text-foreground">
              Hall of Fame
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              {/* 2nd Place */}
              {topThree[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="order-1 md:order-1"
                >
                  <Card className="bg-gradient-to-br from-xp-silver/20 to-muted/20 border-xp-silver/30">
                    <CardContent className="text-center p-6 space-y-4">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-xp-silver to-muted rounded-full mx-auto flex items-center justify-center">
                          <Medal className="h-10 w-10 text-background" />
                        </div>
                        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-xp-silver text-background">
                          2nd
                        </Badge>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          {topThree[1].username}
                        </h3>
                        <p className="text-muted-foreground">
                          Level {topThree[1].level}
                        </p>
                        <p className="text-sm font-medium">
                          {topThree[1].xp.toLocaleString()} XP
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* 1st Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="order-2 md:order-2"
              >
                <Card className="bg-gradient-to-br from-xp-gold/20 to-warning/20 border-xp-gold/30 scale-105 md:scale-110">
                  <CardContent className="text-center p-6 space-y-4">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-xp-gold to-warning rounded-full mx-auto flex items-center justify-center chat-glow">
                        <Crown className="h-12 w-12 text-background" />
                      </div>
                      <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-xp-gold text-background">
                        Champion
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">
                        {topThree[0].username}
                      </h3>
                      <p className="text-muted-foreground">
                        Level {topThree[0].level}
                      </p>
                      <p className="text-lg font-bold text-xp-gold">
                        {topThree[0].xp.toLocaleString()} XP
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* 3rd Place */}
              {topThree[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="order-3 md:order-3"
                >
                  <Card className="bg-gradient-to-br from-warning/20 to-warning/10 border-warning/30">
                    <CardContent className="text-center p-6 space-y-4">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-warning to-warning/80 rounded-full mx-auto flex items-center justify-center">
                          <Trophy className="h-10 w-10 text-background" />
                        </div>
                        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-warning text-background">
                          3rd
                        </Badge>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          {topThree[2].username}
                        </h3>
                        <p className="text-muted-foreground">
                          Level {topThree[2].level}
                        </p>
                        <p className="text-sm font-medium">
                          {topThree[2].xp.toLocaleString()} XP
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Rest of Leaderboard */}
        {restOfList.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold text-foreground">
              Full Rankings
            </h3>
            <div className="space-y-3">
              {restOfList.map((user, index) => (
                <LeaderboardCard key={user.id} user={user} index={index + 3} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && leaderboard.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-2xl mx-auto flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Rankings Yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Be the first to start chatting and claim the top spot!
            </p>
            <Button
              onClick={() => navigate('/chats')}
              className="bg-gradient-to-r from-primary to-primary-glow"
            >
              <Zap className="h-4 w-4 mr-2" />
              Start Earning XP
            </Button>
          </motion.div>
        )}

        {/* XP Guide */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-xp-gold" />
                How to Earn XP
              </CardTitle>
              <CardDescription>
                Level up by participating in conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-success/20 text-success rounded-full mx-auto flex items-center justify-center">
                    <span className="font-bold">+10</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Send Message</p>
                    <p className="text-xs text-muted-foreground">
                      Per message sent
                    </p>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-accent/20 text-accent rounded-full mx-auto flex items-center justify-center">
                    <span className="font-bold">+5</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Add Reaction</p>
                    <p className="text-xs text-muted-foreground">
                      Per emoji reaction
                    </p>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-xp-gold/20 text-xp-gold rounded-full mx-auto flex items-center justify-center">
                    <span className="font-bold">★</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Bonus XP</p>
                    <p className="text-xs text-muted-foreground">
                      Daily streaks & achievements
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default LeaderboardPage
