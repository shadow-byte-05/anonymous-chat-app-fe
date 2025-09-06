import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '@/contexts/ChatContext'

const Index = () => {
  const navigate = useNavigate()
  const { state } = useChat()

  useEffect(() => {
    // Redirect based on authentication status
    if (state.isAuthenticated) {
      navigate('/chats')
    } else {
      navigate('/login')
    }
  }, [state.isAuthenticated, navigate])

  // Loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export default Index
