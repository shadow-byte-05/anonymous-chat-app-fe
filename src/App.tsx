
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import { ChatProvider } from './contexts/ChatContext'
import Index from './pages/Index.tsx'
import {LoginPage} from './pages/LoginPage.tsx'
import {ChatListPage} from './pages/ChatListPage.tsx'
import { ChatPage } from './pages/ChatPage.tsx'
// Removed duplicate chat route to avoid double mounts
import LeaderboardPage from './pages/LeaderboardPage'
import NotFound from './pages/NotFound'

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ChatProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/chats" element={<ChatListPage />} />
            <Route path="/chat/:groupID" element={<ChatPageWrapper />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ChatProvider>
  </QueryClientProvider>
)

// Wrapper component to extract groupID from URL params
const ChatPageWrapper = () => {
  const { groupID } = useParams<{ groupID: string }>()
  return groupID ? <ChatPage groupID={groupID} /> : <NotFound />
}

export default App
