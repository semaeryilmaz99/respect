import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { spotifyAuthService } from '../api/spotifyAuthService.js'

const OnboardingPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { actions } = useAppContext()
  const [currentStep, setCurrentStep] = useState(0)

  // Note: Spotify callback is now handled by dedicated SpotifyCallback component and AuthCallback

  const steps = [
    {
      id: 0,
      title: "Sevdiğiniz Sanatçıları Destekleyin",
      subtitle: "Onların koruyucu melekleri olun.",
      icon: "💛",
      buttonText: "İleri"
    },
    {
      id: 1,
      title: "Etkinizi Görün",
      subtitle: "Hayatınıza dokunan sanatçıların müziğine ne kadar dokunduğunuzu görün.",
      showArtistList: true,
      buttonText: "İleri"
    },
    {
      id: 2,
      title: "Topluluğun Bir Parçası Olun",
      subtitle: "Aynı müziği dinlediğiniz, aynı duyguları paylaştığınız insanlarla ve sanatçılarla iletişim kurun, keşfedin, güçlerinizi birleştirin ve müziğin değerini koruyan kahramanlar olun.",
      showCommunityImage: true,
      buttonText: "Başlayalım"
    }
  ]

  const artists = [
    { id: 1, name: "Ahmet Kaya", respect: "120 Respect", avatar: "/assets/artist/Image (1).png" },
    { id: 2, name: "Sezen Aksu", respect: "110 Respect", avatar: "/assets/artist/Image (2).png" },
    { id: 3, name: "Barış Manço", respect: "100 Respect", avatar: "/assets/artist/Image (3).png" },
    { id: 4, name: "Ajda Pekkan", respect: "90 Respect", avatar: "/assets/artist/Image (4).png" },
    { id: 5, name: "Cem Karaca", respect: "80 Respect", avatar: "/assets/artist/Image (5).png" }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Clear any existing auth data when starting fresh
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      localStorage.removeItem('profileCompleted')
      
      // Complete onboarding and navigate to login page
      actions.completeOnboarding()
      console.log('✅ Onboarding completed, navigating to login')
      navigate('/login')
    }
  }

  const handleClearStorage = () => {
    localStorage.clear()
    window.location.reload()
  }

  const currentStepData = steps[currentStep]

  return (
    <div className="onboarding-page">
      {/* Debug button - only in development */}
      {import.meta.env.DEV && (
        <button 
          onClick={handleClearStorage}
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            padding: '8px 12px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px'
          }}
        >
          🗑️ Clear Storage
        </button>
      )}

      {/* Progress Indicators */}
      <div className="progress-indicators">
        {steps.map((_, index) => (
          <div 
            key={index}
            className={`progress-dot ${index === currentStep ? 'active' : ''}`}
          />
        ))}
      </div>

      {/* Help Button (only on step 3) */}
      {currentStep === 2 && (
        <button className="help-button">?</button>
      )}

      <div className="onboarding-content">
        {/* Step 1: Heart Icon */}
        {currentStep === 0 && (
          <div className="step-icon">
            <div className="onb-hero-image">
              <img src="/assets/onb-1.png" alt="Heart with Wings" />
            </div>
          </div>
        )}

        {/* Step 2: Artist List */}
        {currentStep === 1 && (
          <div className="artist-list-container">
            <div className="artist-list-card">
              {artists.map((artist, index) => (
                <div key={artist.id} className="artist-item">
                  <span className="artist-number">{index + 1}</span>
                  <div className="artist-info">
                    <h4 className="artist-name">{artist.name}</h4>
                    <p className="artist-respect">{artist.respect}</p>
                  </div>
                  <div className="artist-avatar">
                    <img src={artist.avatar} alt={artist.name} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Community Image */}
        {currentStep === 2 && (
          <div className="step-icon">
            <div className="onb-hero-image">
              <img src="/assets/onb-3.png" alt="Community" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="step-content">
          <h1 className="step-title">{currentStepData.title}</h1>
          <p className="step-subtitle">{currentStepData.subtitle}</p>
        </div>

        {/* Action Button */}
        <div className="step-actions">
          <button className="next-button" onClick={handleNext}>
            {currentStepData.buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default OnboardingPage 