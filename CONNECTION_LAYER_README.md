# Anonymous Chat - Connection Layer

This document describes the connection layer components that connect your React frontend to the Node.js backend.

## Overview

The connection layer consists of:
- **Axios API client** for REST API calls
- **WebSocket service** for real-time communication
- **React Context** for global state management
- **Custom hooks** for WebSocket integration
- **Production-ready components** with error handling

## Components

### 1. API Client (`src/utils/api.ts`)

**Features:**
- Axios instance with interceptors
- Automatic token management
- Error handling with 401 redirects
- TypeScript interfaces for all API responses
- Timeout configuration

**Usage:**
```typescript
import { userApi, chatApi } from './utils/api'

// Setup user
const response = await userApi.setupUser('username', '😄')

// Get chat groups
const groups = await chatApi.getAllChatGroups()

// Get messages
const messages = await chatApi.getGroupMessages('groupID')
```

### 2. WebSocket Service (`src/utils/socket.ts`)

**Features:**
- Real-time messaging
- Automatic reconnection
- Event-driven architecture
- TypeScript interfaces for all WebSocket messages
- Connection state management

**Usage:**
```typescript
import { socketService } from './utils/socket'

// Connect
await socketService.connect('userID', 'username')

// Join chat
socketService.joinChat('groupID')

// Send message
socketService.sendMessage('groupID', 'Hello world!')

// Listen for events
socketService.onMessage((payload) => {
  console.log('New message:', payload.message)
})
```

### 3. WebSocket Hook (`src/hooks/useWebSocket.ts`)

**Features:**
- React-friendly WebSocket integration
- Automatic cleanup
- Connection state management
- Event handling with callbacks

**Usage:**
```typescript
import { useWebSocket } from './hooks/useWebSocket'

const {
  isConnected,
  connectionError,
  connect,
  sendMessage,
  addReaction
} = useWebSocket({
  onMessage: (payload) => {
    // Handle new message
  },
  onTyping: (payload) => {
    // Handle typing indicator
  }
})
```

### 4. Chat Context (`src/contexts/ChatContext.tsx`)

**Features:**
- Global state management
- User authentication
- Chat state management
- WebSocket integration
- Error handling

**Usage:**
```typescript
import { useChat } from './contexts/ChatContext'

const {
  state,
  setupUser,
  joinChatGroup,
  sendMessage,
  addReaction
} = useChat()

// Setup user
await setupUser('username', '😄')

// Join chat
await joinChatGroup('groupID')

// Send message
sendMessage('Hello world!')
```

### 5. Chat Page (`src/pages/ChatPage.tsx`)

**Features:**
- Real-time messaging
- Typing indicators
- Message reactions
- Reply functionality
- XP/Level display
- Error handling
- Loading states

### 6. Login Page (`src/pages/LoginPage.tsx`)

**Features:**
- User setup with username and avatar
- Random username generator
- Form validation
- Error handling
- Beautiful UI

### 7. Chat List Page (`src/pages/ChatListPage.tsx`)

**Features:**
- List of available chat groups
- Search functionality
- Connection status
- XP progress display
- Error handling

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in your frontend root:

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
VITE_APP_NAME=Anonymous Chat
VITE_APP_VERSION=1.0.0
```

### 2. Install Dependencies

```bash
npm install axios
```

### 3. Update App.tsx

The `App.tsx` has been updated to include the `ChatProvider`:

```typescript
import { ChatProvider } from './contexts/ChatContext'

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ChatProvider>
      {/* Your app content */}
    </ChatProvider>
  </QueryClientProvider>
)
```

### 4. Usage in Components

```typescript
import { useChat } from './contexts/ChatContext'

const MyComponent = () => {
  const { state, setupUser, sendMessage } = useChat()
  
  // Use the chat functionality
  return <div>Chat component</div>
}
```

## API Endpoints

The connection layer expects these backend endpoints:

### User Endpoints
- `POST /api/users/setup` - Setup user
- `GET /api/users/:userID` - Get user profile
- `GET /api/users/leaderboard` - Get leaderboard

### Chat Endpoints
- `POST /api/chats` - Create chat group
- `GET /api/chats` - Get all chat groups
- `GET /api/chats/:groupID` - Get chat group details
- `GET /api/chats/:groupID/messages` - Get group messages

## WebSocket Events

### Client to Server
- `register_user_ws` - Register user with WebSocket
- `join_chat` - Join a chat group
- `send_message` - Send a message
- `add_reaction` - Add reaction to message
- `remove_reaction` - Remove reaction from message
- `typing` - Send typing indicator

### Server to Client
- `new_message` - New message received
- `message_updated` - Message updated (reactions)
- `user_typing` - User typing indicator
- `group_typing_status` - Group typing status
- `leaderboard_update` - Leaderboard updated
- `chat_created` - New chat group created

## Error Handling

The connection layer includes comprehensive error handling:

- **API Errors**: Automatic retry and user feedback
- **WebSocket Errors**: Automatic reconnection with exponential backoff
- **Authentication Errors**: Automatic logout and redirect
- **Network Errors**: User-friendly error messages

## Production Considerations

### Security
- All API calls include authentication tokens
- WebSocket connections are authenticated
- Input validation on all user inputs
- XSS protection through proper escaping

### Performance
- Message pagination for large chat histories
- Efficient reconnection logic
- Optimized re-renders with React.memo
- Lazy loading of components

### Monitoring
- Connection status indicators
- Error logging and reporting
- Performance metrics
- User activity tracking

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if backend WebSocket server is running
   - Verify `VITE_WS_URL` environment variable
   - Check browser console for CORS errors

2. **API Calls Failing**
   - Verify `VITE_API_BASE_URL` environment variable
   - Check if backend API server is running
   - Verify authentication token in localStorage

3. **Messages Not Appearing**
   - Check WebSocket connection status
   - Verify user is properly authenticated
   - Check if user has joined the chat group

### Debug Mode

Enable debug logging by setting:
```env
VITE_DEBUG=true
```

This will log all WebSocket events and API calls to the console.

## Testing

The connection layer is designed to be easily testable:

- Mock WebSocket service for unit tests
- API client can be mocked with axios-mock-adapter
- Context can be tested with React Testing Library
- Integration tests can use real WebSocket connections

## Contributing

When adding new features:

1. Update TypeScript interfaces
2. Add proper error handling
3. Include loading states
4. Update documentation
5. Add tests

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the browser console for errors
3. Verify backend server is running
4. Check network tab for failed requests
