import React from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from '../context/AppContext'

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
})

// Custom render function with providers
export const renderWithProviders = (ui, options = {}) => {
  const {
    queryClient = createTestQueryClient(),
    initialRoute = '/',
    ...renderOptions
  } = options

  // Set initial route
  window.history.pushState({}, 'Test page', initialRoute)

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          {children}
        </AppProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

// Mock user data
export const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  avatar: '/test-avatar.jpg',
  respectBalance: 500,
}

// Mock artist data
export const mockArtist = {
  id: '1',
  name: 'Test Artist',
  avatar: '/test-artist.jpg',
  description: 'Test artist description',
  respectCount: 1000,
  followerCount: 500,
}

// Mock song data
export const mockSong = {
  id: '1',
  title: 'Test Song',
  artist: 'Test Artist',
  cover: '/test-song.jpg',
  respectCount: 200,
  duration: 180,
}

// Mock feed item
export const mockFeedItem = {
  id: '1',
  type: 'respect',
  user: mockUser,
  artist: mockArtist,
  amount: 50,
  timestamp: new Date().toISOString(),
  message: 'Great music!',
}

// Wait for async operations
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Create mock API responses
export const createMockApiResponse = (data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
})

// Mock error response
export const createMockErrorResponse = (message = 'API Error', status = 500) => ({
  response: {
    data: { message },
    status,
    statusText: 'Internal Server Error',
  },
  message,
})

export * from '@testing-library/react' 