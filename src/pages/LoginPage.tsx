import React, { useState, useEffect } from 'react'
import { useChat } from '../contexts/ChatContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { toast } from 'sonner'

const AVATARS = ['😄', '🚀', '🌟', '🎉', '💫', '🔥', '⚡', '🎯', '🎨', '🎭', '🎪', '🎸']

export const LoginPage: React.FC = () => {
  const { setupUser, state } = useChat()
  const [username, setUsername] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0])
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      window.location.href = '/'
    }
  }, [state.isAuthenticated])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim()) {
      toast.error('Please enter a username')
      return
    }

    if (username.trim().length < 2) {
      toast.error('Username must be at least 2 characters long')
      return
    }

    if (username.trim().length > 20) {
      toast.error('Username must be less than 20 characters')
      return
    }

    try {
      setIsLoading(true)
      await setupUser(username.trim(), selectedAvatar)
      toast.success('Welcome to Anonymous Chat!')
      window.location.href = '/'
    } catch (error: any) {
      toast.error(error.message || 'Failed to setup user')
    } finally {
      setIsLoading(false)
    }
  }

  const generateRandomUsername = () => {
    const adjectives = ['Cool', 'Smart', 'Funny', 'Brave', 'Kind', 'Wise', 'Swift', 'Bright']
    const nouns = ['User', 'Chatter', 'Friend', 'Buddy', 'Pal', 'Mate', 'Comrade', 'Hero']
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const number = Math.floor(Math.random() * 1000)
    return `${adjective}${noun}${number}`
  }

  const handleRandomUsername = () => {
    setUsername(generateRandomUsername())
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💬</div>
          <h1 className="text-3xl font-bold mb-2">Anonymous Chat</h1>
          <p className="text-muted-foreground">
            Join the conversation anonymously and start chatting!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Input */}
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Choose your username
            </label>
            <div className="flex space-x-2">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                maxLength={20}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleRandomUsername}
                disabled={isLoading}
                className="px-3"
              >
                🎲
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {username.length}/20 characters
            </p>
          </div>

          {/* Avatar Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Choose your avatar</label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  disabled={isLoading}
                  className={`
                    w-12 h-12 text-2xl rounded-lg border-2 transition-all
                    ${selectedAvatar === avatar
                      ? 'border-primary bg-primary/10 scale-110'
                      : 'border-border hover:border-primary/50 hover:bg-primary/5'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">{selectedAvatar}</div>
            <p className="font-medium">
              {username || 'Your username will appear here'}
            </p>
            <p className="text-sm text-muted-foreground">
              This is how others will see you
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !username.trim()}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Setting up...
              </>
            ) : (
              'Start Chatting'
            )}
          </Button>
        </form>

        {/* Features */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-sm font-medium mb-3">Features</h3>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <span>💬</span>
              <span>Real-time messaging</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🎯</span>
              <span>XP & Levels</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>😀</span>
              <span>Reactions</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🏆</span>
              <span>Leaderboard</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}