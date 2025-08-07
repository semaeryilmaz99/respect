import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import LoadingSpinner from './LoadingSpinner'
import DebugFallback from './DebugFallback'

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { state } = useAppContext()
  const { isAuthenticated, loading, onboardingCompleted, profileCompleted } = state

  // Debug logging
  console.log('🔍 ProtectedRoute Debug:', {
    isAuthenticated,
    loading,
    onboardingCompleted,
    profileCompleted,
    requireAuth
  })

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('⏳ Loading state, showing spinner')
    return <LoadingSpinner />
  }

  // Fallback for unexpected states
  if (typeof isAuthenticated === 'undefined' || typeof onboardingCompleted === 'undefined') {
    console.log('❓ Unexpected state, showing fallback')
    return <DebugFallback message="Uygulama başlatılıyor..." />
  }

  // If onboarding is not completed, always redirect to onboarding
  if (!onboardingCompleted) {
    console.log('🔄 Onboarding not completed, redirecting to onboarding')
    return <Navigate to="/onboarding" replace />
  }

  // Redirect to login if authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    console.log('🔐 Not authenticated, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // Profile completion check removed - users can access all routes after authentication

  // Redirect to feed if user is authenticated but trying to access public routes
  if (!requireAuth && isAuthenticated) {
    console.log('🏠 Authenticated user on public route, redirecting to feed')
    return <Navigate to="/feed" replace />
  }

  console.log('✅ Route access granted, rendering children')
  return children
}

export default ProtectedRoute 