import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  MessageCircle,
  Users,
  Trophy,
  ArrowRight,
  Plus,
  Crown,
} from 'lucide-react'
import { XPBar } from '@/components/gamification/XPBar'
import { chatApi } from '@/utils/api'
import { useChatStore } from '@/store/UseChatStore'
import { useAuthStore } from '@/store/UseAuthStore'
import { toast } from 'sonner'

interface ChatGroup {
  id: string
  name: string
  description: string
  memberCount: number
  isActive: boolean
}

export const ChatListPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { chatGroups, setChatGroups } = useChatStore()

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    loadChatGroups()
  }, [user, navigate])

  const loadChatGroups = async () => {
    try {
      const response = await chatApi.getChatGroups()
      setChatGroups(response.data)
    } catch (error) {
      console.error('Failed to load chat groups:', error)
      toast.error('Failed to load chat groups')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinChat = (chatId: string) => {
    navigate(`/chat/${chatId}`)
  }

  const handleViewLeaderboard = () => {
    navigate('/leaderboard')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-semibold text-foreground">
                  {user.username}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Anonymous Chatter
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewLeaderboard}
                className="gap-2"
              >
                <Trophy className="h-4 w-4" />
                Leaderboard
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* XP Progress */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="chat-glow">
            <CardContent className="p-4">
              <XPBar currentXP={user.xp} level={user.level} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Chat Groups Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Chat Rooms</h2>
            <p className="text-muted-foreground">
              Join a conversation and start earning XP!
            </p>
          </div>
        </div>

        {/* Chat Groups Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-card rounded-lg animate-pulse"
                />
              ))
            : chatGroups.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="hover-lift hover-glow cursor-pointer group"
                    onClick={() => handleJoinChat(group.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                            <MessageCircle className="h-4 w-4 text-primary-foreground" />
                          </div>
                          {group.name}
                        </CardTitle>
                        {group.isActive && (
                          <Badge
                            variant="secondary"
                            className="bg-success/20 text-success"
                          >
                            Active
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{group.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {group.memberCount} members
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-primary to-primary-glow group-hover:from-primary-glow group-hover:to-primary opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Join <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Ready to Level Up?
            </h3>
            <p className="text-muted-foreground">
              Join conversations, send messages, and react to earn XP points!
            </p>

            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-success">
                <MessageCircle className="h-4 w-4" />
                +10 XP per message
              </div>
              <div className="flex items-center gap-2 text-accent">
                <Plus className="h-4 w-4" />
                +5 XP per reaction
              </div>
              <div className="flex items-center gap-2 text-xp-gold">
                <Crown className="h-4 w-4" />
                Bonus XP for streaks
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ChatListPage
