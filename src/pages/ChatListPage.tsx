import React, { useEffect, useState } from 'react'
import { useChat } from '../contexts/ChatContext'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { toast } from 'sonner'
import { chatApi } from '../utils/api'

export const ChatListPage: React.FC = () => {
  const { state, loadChatGroups, logout } = useChat()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newChatName, setNewChatName] = useState('')
  const [newChatDescription, setNewChatDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadChatGroups()
  }, [])

  const filteredChatGroups = state.chatGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleJoinChat = (groupID: string) => {
    window.location.href = `/chat/${groupID}`
  }

  const handleCreateChat = async () => {
    try {
      if (!state.user) {
        toast.error('You must be logged in to create a chat')
        return
      }

      if (!newChatName.trim()) {
        toast.error('Please enter a chat name')
        return
      }

      setIsSubmitting(true)
      const name = newChatName.trim()
      const description = newChatDescription.trim()
      const type = 'public'

      const res = await chatApi.createChatGroup(name, description, type, state.user.userID)
      toast.success('Chat created')
      await loadChatGroups()
      if (res?.data?.groupID) {
        window.location.href = `/chat/${res.data.groupID}`
      }
      setIsCreateOpen(false)
      setNewChatName('')
      setNewChatDescription('')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create chat')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">💬</div>
              <div>
                <h1 className="text-xl font-bold">Anonymous Chat</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome, {state.user?.username}!
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {state.connectionError && (
                <Badge variant="destructive" className="text-xs">
                  Connection Error
                </Badge>
              )}
              <Badge variant={state.isConnected ? "default" : "secondary"} className="text-xs">
                {state.isConnected ? "Connected" : "Disconnected"}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Create */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search chat groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="ml-4">
            Create Chat
          </Button>
        </div>

        {/* XP Bar */}
        {state.user && (
          <div className="mb-6">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Your Progress</span>
                <span className="text-sm text-muted-foreground">
                  Level {state.user.level || 1}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((state.user.points || 0) % 100) / 100 * 100}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{state.user.points || 0} XP</span>
                <span>{100 - ((state.user.points || 0) % 100)} XP to next level</span>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {state.isLoading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-muted border-t-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading chat groups...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <Card className="p-6 text-center mb-6">
            <div className="text-destructive mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-muted-foreground mb-4">{state.error}</p>
            <Button onClick={() => loadChatGroups()}>
              Retry
            </Button>
          </Card>
        )}

        {/* Chat Groups Grid */}
        {!state.isLoading && !state.error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChatGroups.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold mb-2">No chat groups found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Try adjusting your search terms' : 'No chat groups available yet'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleCreateChat}>
                    Create the first chat group
                  </Button>
                )}
              </div>
            ) : (
              filteredChatGroups.map((group) => (
                <Card
                  key={group.groupID}
                  className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleJoinChat(group.groupID)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg">💬</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{group.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {group.type}
                        </p>
                      </div>
                    </div>
                    <Badge variant={group.isActive ? "default" : "secondary"}>
                      {group.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {group.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {group.memberCount || 0} members
                    </span>
                    <span>
                      Created {new Date(group.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <Button className="w-full mt-4" size="sm">
                    Join Chat
                  </Button>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Connection Status */}
        {state.connectionError && (
          <Card className="p-4 mt-6 border-destructive/20 bg-destructive/5">
            <div className="flex items-center space-x-2">
              <div className="text-destructive">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-destructive">Connection Error</p>
                <p className="text-xs text-destructive/80">{state.connectionError}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-[100] bg-background/70 backdrop-blur-sm flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateOpen(false)
          }}
        >
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Create a new chat</h2>
              <p className="text-sm text-muted-foreground">Name your group and add an optional description.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input
                  placeholder="e.g., General Chat"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Input
                  placeholder="What is this chat about? (optional)"
                  value={newChatDescription}
                  onChange={(e) => setNewChatDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleCreateChat} disabled={isSubmitting || !newChatName.trim()}>
                {isSubmitting ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}