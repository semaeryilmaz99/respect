import React, { createContext, useContext, useReducer, useEffect } from 'react'
import config from '../config/environment'
import { ACTIONS } from '../constants/actions'

// Initial state
const initialState = {
  // Auth state
  user: null,
  isAuthenticated: false,
  token: null,
  
  // App state
  loading: true, // Start with loading true
  error: null,
  onboardingCompleted: false,
  profileCompleted: true, // Default to true to avoid profile settings redirect
  
  // UI state
  sidebarOpen: false,
  theme: 'light',
  language: 'tr',
  
  // Data cache
  feed: [],
  artists: {},
  songs: {},
  users: {},
  
  // Real-time state
  onlineUsers: [],
  messages: {},
  
  // Notifications
  notifications: [],
  unreadCount: 0
}



// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    // Auth cases
    case ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        token: action.payload?.token || state.token
      }
      
    case ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        isAuthenticated: !!state.user
      }
      
    case ACTIONS.LOGOUT:
      localStorage.removeItem(config.STORAGE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(config.STORAGE_KEYS.USER)
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        token: null,
        feed: [],
        artists: {},
        songs: {},
        users: {},
        messages: {}
      }
      
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload }
      
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false }
      
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null }
      
    case ACTIONS.COMPLETE_ONBOARDING:
      localStorage.setItem(config.STORAGE_KEYS.ONBOARDING_COMPLETED, 'true')
      return { ...state, onboardingCompleted: true }
      
    case ACTIONS.COMPLETE_PROFILE:
      localStorage.setItem(config.STORAGE_KEYS.PROFILE_COMPLETED, 'true')
      return { ...state, profileCompleted: true }
      
    // UI cases
    case ACTIONS.TOGGLE_SIDEBAR:
      return { ...state, sidebarOpen: !state.sidebarOpen }
      
    case ACTIONS.CLOSE_SIDEBAR:
      return { ...state, sidebarOpen: false }
      
    case ACTIONS.SET_THEME:
      localStorage.setItem(config.STORAGE_KEYS.THEME, action.payload)
      return { ...state, theme: action.payload }
      
    case ACTIONS.SET_LANGUAGE:
      localStorage.setItem(config.STORAGE_KEYS.LANGUAGE, action.payload)
      return { ...state, language: action.payload }
      
    // Data cases
    case ACTIONS.SET_FEED:
      return { ...state, feed: action.payload }
      
    case ACTIONS.ADD_FEED_ITEM:
      return { 
        ...state, 
        feed: [action.payload, ...state.feed]
      }
      
    case ACTIONS.UPDATE_FEED_ITEM:
      return {
        ...state,
        feed: state.feed.map(item => 
          item.id === action.payload.id ? { ...item, ...action.payload } : item
        )
      }
      
    case ACTIONS.SET_ARTIST:
      return {
        ...state,
        artists: { ...state.artists, [action.payload.id]: action.payload }
      }
      
    case ACTIONS.SET_SONG:
      return {
        ...state,
        songs: { ...state.songs, [action.payload.id]: action.payload }
      }
      
    case ACTIONS.SET_USER_DATA:
      return {
        ...state,
        users: { ...state.users, [action.payload.id]: action.payload }
      }
      
    // Real-time cases
    case ACTIONS.SET_ONLINE_USERS:
      return { ...state, onlineUsers: action.payload }
      
    case ACTIONS.ADD_MESSAGE: {
      const { roomId, message } = action.payload
      return {
        ...state,
        messages: {
          ...state.messages,
          [roomId]: [...(state.messages[roomId] || []), message]
        }
      }
    }
      
    case ACTIONS.UPDATE_MESSAGE: {
      const { roomId: updateRoomId, messageId, updates } = action.payload
      return {
        ...state,
        messages: {
          ...state.messages,
          [updateRoomId]: state.messages[updateRoomId]?.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ) || []
        }
      }
    }
      
    // Notification cases
    case ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      }
      
    case ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      }
      
    case ACTIONS.MARK_NOTIFICATION_READ:
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }
      
    case ACTIONS.SET_UNREAD_COUNT:
      return { ...state, unreadCount: action.payload }
      
    default:
      return state
  }
}

// Create context
const AppContext = createContext()

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState)
  
  // Initialize state from localStorage
  useEffect(() => {
    try {
      console.log('🔄 Initializing app state from localStorage...')
      
      // Restore user session
      const token = localStorage.getItem(config.STORAGE_KEYS.AUTH_TOKEN)
      const user = localStorage.getItem(config.STORAGE_KEYS.USER)
      
      console.log('🔍 Found token:', !!token, 'Found user:', !!user)
      
      if (token && user) {
        const userData = JSON.parse(user)
        console.log('👤 Restoring user session:', userData)
        dispatch({
          type: ACTIONS.SET_USER,
          payload: { ...userData, token }
        })
      }
      
      // Restore UI preferences
      const theme = localStorage.getItem(config.STORAGE_KEYS.THEME) || 'light'
      const language = localStorage.getItem(config.STORAGE_KEYS.LANGUAGE) || 'tr'
      const onboardingCompleted = localStorage.getItem(config.STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true'
      const profileCompleted = localStorage.getItem(config.STORAGE_KEYS.PROFILE_COMPLETED) !== 'false' // Default to true
      
      console.log('⚙️ UI preferences:', { theme, language, onboardingCompleted, profileCompleted })
      
      dispatch({ type: ACTIONS.SET_THEME, payload: theme })
      dispatch({ type: ACTIONS.SET_LANGUAGE, payload: language })
      if (onboardingCompleted) {
        console.log('✅ Completing onboarding')
        dispatch({ type: ACTIONS.COMPLETE_ONBOARDING })
      }
      if (profileCompleted) {
        console.log('✅ Completing profile')
        dispatch({ type: ACTIONS.COMPLETE_PROFILE })
      }
      
      console.log('✅ App state initialization complete')
      
      // Set loading to false after initialization
      dispatch({ type: ACTIONS.SET_LOADING, payload: false })
      
    } catch (error) {
      console.error('❌ Failed to restore state from localStorage:', error)
      // Set loading to false even if there's an error
      dispatch({ type: ACTIONS.SET_LOADING, payload: false })
    }
  }, [])
  
  // Action creators
  const actions = {
    // Auth actions
    setUser: (user) => dispatch({ type: ACTIONS.SET_USER, payload: user }),
    updateUser: (updates) => dispatch({ type: ACTIONS.UPDATE_USER, payload: updates }),
    logout: () => dispatch({ type: ACTIONS.LOGOUT }),
    setLoading: (loading) => dispatch({ type: ACTIONS.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ACTIONS.SET_ERROR, payload: error }),
    clearError: () => dispatch({ type: ACTIONS.CLEAR_ERROR }),
    
    // UI actions
    toggleSidebar: () => dispatch({ type: ACTIONS.TOGGLE_SIDEBAR }),
    closeSidebar: () => dispatch({ type: ACTIONS.CLOSE_SIDEBAR }),
    setTheme: (theme) => dispatch({ type: ACTIONS.SET_THEME, payload: theme }),
    setLanguage: (language) => dispatch({ type: ACTIONS.SET_LANGUAGE, payload: language }),
    
    // Data actions
    setFeed: (feed) => dispatch({ type: ACTIONS.SET_FEED, payload: feed }),
    addFeedItem: (item) => dispatch({ type: ACTIONS.ADD_FEED_ITEM, payload: item }),
    updateFeedItem: (item) => dispatch({ type: ACTIONS.UPDATE_FEED_ITEM, payload: item }),
    setArtist: (artist) => dispatch({ type: ACTIONS.SET_ARTIST, payload: artist }),
    setSong: (song) => dispatch({ type: ACTIONS.SET_SONG, payload: song }),
    setUserData: (user) => dispatch({ type: ACTIONS.SET_USER_DATA, payload: user }),
    
    // Real-time actions
    setOnlineUsers: (users) => dispatch({ type: ACTIONS.SET_ONLINE_USERS, payload: users }),
    addMessage: (roomId, message) => dispatch({ 
      type: ACTIONS.ADD_MESSAGE, 
      payload: { roomId, message } 
    }),
    updateMessage: (roomId, messageId, updates) => dispatch({
      type: ACTIONS.UPDATE_MESSAGE,
      payload: { roomId, messageId, updates }
    }),
    
    // Notification actions
    addNotification: (notification) => dispatch({ 
      type: ACTIONS.ADD_NOTIFICATION, 
      payload: { 
        ...notification, 
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false
      }
    }),
    removeNotification: (id) => dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: id }),
    markNotificationRead: (id) => dispatch({ type: ACTIONS.MARK_NOTIFICATION_READ, payload: id }),
    setUnreadCount: (count) => dispatch({ type: ACTIONS.SET_UNREAD_COUNT, payload: count }),
    completeOnboarding: () => dispatch({ type: ACTIONS.COMPLETE_ONBOARDING }),
    completeProfile: () => dispatch({ type: ACTIONS.COMPLETE_PROFILE })
  }
  
  const value = {
    state,
    actions,
    dispatch
  }
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// Custom hook to use context
export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

// Selector hooks for specific state slices
export const useAuth = () => {
  const { state, actions } = useAppContext()
  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    token: state.token,
    loading: state.loading,
    error: state.error,
    // Auth actions
    login: actions.login,
    logout: actions.logout,
    signup: actions.signup,
    setUser: actions.setUser
  }
}

export const useUI = () => {
  const { state, actions } = useAppContext()
  return {
    sidebarOpen: state.sidebarOpen,
    theme: state.theme,
    language: state.language,
    toggleSidebar: actions.toggleSidebar,
    closeSidebar: actions.closeSidebar,
    setTheme: actions.setTheme,
    setLanguage: actions.setLanguage
  }
}

export const useData = () => {
  const { state, actions } = useAppContext()
  return {
    feed: state.feed,
    artists: state.artists,
    songs: state.songs,
    users: state.users,
    setFeed: actions.setFeed,
    addFeedItem: actions.addFeedItem,
    updateFeedItem: actions.updateFeedItem,
    setArtist: actions.setArtist,
    setSong: actions.setSong,
    setUserData: actions.setUserData
  }
}

export const useRealTime = () => {
  const { state, actions } = useAppContext()
  return {
    onlineUsers: state.onlineUsers,
    messages: state.messages,
    setOnlineUsers: actions.setOnlineUsers,
    addMessage: actions.addMessage,
    updateMessage: actions.updateMessage
  }
}

export const useNotifications = () => {
  const { state, actions } = useAppContext()
  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    addNotification: actions.addNotification,
    removeNotification: actions.removeNotification,
    markNotificationRead: actions.markNotificationRead,
    setUnreadCount: actions.setUnreadCount
  }
} 