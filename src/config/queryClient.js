import { QueryClient } from '@tanstack/react-query'
import config from './environment'

// Create query client with custom configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - how long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Cache time - how long data stays in cache when not being used
      cacheTime: 10 * 60 * 1000, // 10 minutes
      
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus (when user comes back to tab)
      refetchOnWindowFocus: true,
      
      // Refetch on reconnect (when internet comes back)
      refetchOnReconnect: true,
      
      // Background refetch interval (keep data fresh)
      refetchInterval: 5 * 60 * 1000, // 5 minutes
      
      // Only refetch if tab is visible
      refetchIntervalInBackground: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      
      // Retry delay for mutations
      retryDelay: 1000,
    }
  }
})

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth
  auth: ['auth'],
  currentUser: () => [...queryKeys.auth, 'currentUser'],
  
  // Feed
  feed: ['feed'],
  feedData: (filters = {}) => [...queryKeys.feed, 'data', filters],
  
  // Artists
  artists: ['artists'],
  artist: (id) => [...queryKeys.artists, id],
  artistSongs: (id) => [...queryKeys.artists, id, 'songs'],
  artistSupporters: (id, timeframe = 'all') => [...queryKeys.artists, id, 'supporters', timeframe],
  artistChat: (id) => [...queryKeys.artists, id, 'chat'],
  
  // Songs
  songs: ['songs'],
  song: (id) => [...queryKeys.songs, id],
  songSupporters: (id, timeframe = 'all') => [...queryKeys.songs, id, 'supporters', timeframe],
  songChat: (id) => [...queryKeys.songs, id, 'chat'],
  
  // Users
  users: ['users'],
  user: (id) => [...queryKeys.users, id],
  userStats: (id) => [...queryKeys.users, id, 'stats'],
  userTopArtists: (id, timeframe = 'all') => [...queryKeys.users, id, 'topArtists', timeframe],
  userTopSongs: (id, timeframe = 'all') => [...queryKeys.users, id, 'topSongs', timeframe],
  
  // Respect
  respect: ['respect'],
  respectBalance: () => [...queryKeys.respect, 'balance'],
  respectHistory: (filters = {}) => [...queryKeys.respect, 'history', filters],
  respectPackages: () => [...queryKeys.respect, 'packages'],
  
  // Search
  search: ['search'],
  searchResults: (query, type = 'all') => [...queryKeys.search, query, type],
}

// Error handler for queries
export const defaultQueryError = (error) => {
  if (config.DEBUG_MODE) {
    console.error('Query error:', error)
  }
  
  // Handle common errors
  if (error?.response?.status === 401) {
    // Unauthorized - redirect to login
    queryClient.setQueryData(queryKeys.currentUser(), null)
    window.location.href = '/login'
  }
  
  return error
}

// Success handler for mutations
export const defaultMutationSuccess = (data, variables, context) => {
  if (config.DEBUG_MODE) {
    console.log('Mutation success:', { data, variables, context })
  }
}

// Error handler for mutations
export const defaultMutationError = (error, variables, context) => {
  if (config.DEBUG_MODE) {
    console.error('Mutation error:', { error, variables, context })
  }
  
  return error
}

// Invalidation helpers
export const invalidateQueries = {
  // Invalidate all feed-related queries
  feed: () => queryClient.invalidateQueries(queryKeys.feed),
  
  // Invalidate specific artist data
  artist: (artistId) => {
    queryClient.invalidateQueries(queryKeys.artist(artistId))
    queryClient.invalidateQueries(queryKeys.artistSongs(artistId))
    queryClient.invalidateQueries(queryKeys.artistSupporters(artistId))
  },
  
  // Invalidate specific song data
  song: (songId) => {
    queryClient.invalidateQueries(queryKeys.song(songId))
    queryClient.invalidateQueries(queryKeys.songSupporters(songId))
  },
  
  // Invalidate user data
  user: (userId) => {
    queryClient.invalidateQueries(queryKeys.user(userId))
    queryClient.invalidateQueries(queryKeys.userStats(userId))
    queryClient.invalidateQueries(queryKeys.userTopArtists(userId))
    queryClient.invalidateQueries(queryKeys.userTopSongs(userId))
  },
  
  // Invalidate respect data
  respect: () => {
    queryClient.invalidateQueries(queryKeys.respect)
  },
  
  // Invalidate all data (nuclear option)
  all: () => queryClient.invalidateQueries()
}

// Cache management helpers
export const cacheHelpers = {
  // Set cache data
  setData: (key, data) => queryClient.setQueryData(key, data),
  
  // Get cache data
  getData: (key) => queryClient.getQueryData(key),
  
  // Remove cache data
  removeData: (key) => queryClient.removeQueries(key),
  
  // Prefetch data
  prefetch: (key, queryFn, options = {}) => 
    queryClient.prefetchQuery({
      queryKey: key,
      queryFn,
      ...options
    }),
  
  // Clear all cache
  clear: () => queryClient.clear()
}

export default queryClient 