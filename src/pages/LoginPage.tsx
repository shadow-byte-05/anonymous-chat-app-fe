import React, { useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Gamepad2, Sparkles, Users, MessageCircle } from 'lucide-react'
import { authApi } from '@/utils/api'
import { useAuthStore } from '@/store/UseAuthStore'
import { toast } from 'sonner'

export const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser, setToken } = useAuthStore()

  const generateUsername = () => {
    const adjectives = [
      'Cool',
      'Epic',
      'Swift',
      'Brave',
      'Mystic',
      'Cyber',
      'Ninja',
      'Phantom',
    ]
    const nouns = [
      'Gamer',
      'Warrior',
      'Explorer',
      'Hunter',
      'Wizard',
      'Knight',
      'Rebel',
      'Hero',
    ]
    const number = Math.floor(Math.random() * 1000)

    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${
      nouns[Math.floor(Math.random() * nouns.length)]
    }${number}`
  }

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      const response = await authApi.setupUser()
      const { userId, username, avatar, token, xp, level } = response.data
      setUser({
        id: userId,
        username,
        avatar,
        xp,
        level,
        badges: [],
        createdAt: new Date().toISOString(),
      })
      setToken(token)

      toast.success(`Welcome, ${username}!`, {
        description: "You're ready to start chatting and earning XP!",
      })

      navigate('/chats')
    } catch (error) {
      console.error('Login failed:', error)
      toast.error('Failed to create user. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-glow rounded-2xl mx-auto flex items-center justify-center chat-glow">
              <MessageCircle className="h-10 w-10 text-primary-foreground" />
            </div>
          </motion.div>

          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Anonymous Chat
            </h1>
            <p className="text-muted-foreground mt-2">
              Connect, chat, and level up with gamified messaging
            </p>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4"
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-card rounded-xl mx-auto flex items-center justify-center">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <p className="text-xs text-muted-foreground">Anonymous</p>
          </div>

          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-card rounded-xl mx-auto flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-xp-gold" />
            </div>
            <p className="text-xs text-muted-foreground">Earn XP</p>
          </div>

          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-card rounded-xl mx-auto flex items-center justify-center">
              <Gamepad2 className="h-6 w-6 text-success" />
            </div>
            <p className="text-xs text-muted-foreground">Leaderboard</p>
          </div>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="chat-glow">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center gap-2 justify-center">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {generateUsername()[0]}
                  </AvatarFallback>
                </Avatar>
                Get Started
              </CardTitle>
              <CardDescription>
                Jump right into anonymous chatting with auto-generated profile
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your anonymous identity:
                </p>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-medium text-foreground">
                    {generateUsername()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Auto-generated • Private • Secure
                  </p>
                </div>
              </div>

              <Button
                onClick={handleLogin}
                disabled={isLoading}
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Start Chatting
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                No registration required • Start earning XP immediately
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage
