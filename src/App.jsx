import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import './App.css'
import './styles/header-responsive.css'
import './styles/feed-desktop.css'

// Context Provider
import { AppProvider } from './context/AppContext'
import { queryClient } from './config/queryClient'

// Import all page components
import OnboardingPage from './components/OnboardingPage'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import AuthCallback from './components/AuthCallback'
import SpotifyCallback from './components/auth/SpotifyCallback'
import FeedPage from './components/FeedPage'
import ArtistPage from './components/ArtistPage'
import SongPage from './components/SongPage'
import SendRespectPage from './components/SendRespectPage'
import PurchasePage from './components/PurchasePage'
import UserPage from './components/UserPage'
import ProfileSettingsPage from './components/ProfileSettingsPage'
import ArtistsPage from './components/ArtistsPage'
import SongsPage from './components/SongsPage'

import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import ToastContainer from './components/Toast'
import ScrollToTop from './components/ScrollToTop'

function App() {

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <Router>
            <div className="App">
              {/* Sidebar */}
              <Sidebar />
              
              {/* Toast Container */}
              <ToastContainer />
              
              {/* Scroll to Top Button */}
              <ScrollToTop />
            
              <Routes>
                  {/* Onboarding route - Special case without ProtectedRoute */}
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  
                  {/* Auth callback routes */}
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/auth/spotify/callback" element={<SpotifyCallback />} />
                  <Route path="/spotify-callback" element={<SpotifyCallback />} />
                  
                  {/* Public routes - Only accessible when not authenticated */}
                  <Route path="/login" element={
                    <ProtectedRoute requireAuth={false}>
                      <LoginPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/signup" element={
                    <ProtectedRoute requireAuth={false}>
                      <SignupPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/forgot-password" element={
                    <ProtectedRoute requireAuth={false}>
                      <LoginPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Protected routes - Only accessible when authenticated */}
                  <Route path="/feed" element={
                    <ProtectedRoute>
                      <FeedPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/search" element={
                    <ProtectedRoute>
                      <FeedPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/artist/:id" element={
                    <ProtectedRoute>
                      <ArtistPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/song/:id" element={
                    <ProtectedRoute>
                      <SongPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/send-respect" element={
                    <ProtectedRoute>
                      <SendRespectPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/purchase" element={
                    <ProtectedRoute>
                      <PurchasePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/user/:id" element={
                    <ProtectedRoute>
                      <UserPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <UserPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile/settings" element={
                    <ProtectedRoute requireAuth={true}>
                      <ProfileSettingsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/artists" element={
                    <ProtectedRoute>
                      <ArtistsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/songs" element={
                    <ProtectedRoute>
                      <SongsPage />
                    </ProtectedRoute>
                  } />


                
                {/* Default redirects */}
                <Route path="/" element={<Navigate to="/onboarding" replace />} />
                <Route path="*" element={<Navigate to="/onboarding" replace />} />
              </Routes>
            </div>
          </Router>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
