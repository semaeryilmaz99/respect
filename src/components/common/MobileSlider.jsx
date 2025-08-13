import React, { useState, useEffect, useRef } from 'react'

const MobileSlider = ({ 
  children, 
  autoPlay = true, 
  interval = 3000, 
  showDots = true,
  showArrows = false,
  className = ''
}) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay)
  const sliderRef = useRef(null)
  const autoPlayRef = useRef(null)

  const totalSlides = React.Children.count(children)

  // Otomatik oynatma
  useEffect(() => {
    if (!autoPlay || totalSlides <= 1) return

    const startAutoPlay = () => {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % totalSlides)
      }, interval)
    }

    if (isAutoPlaying) {
      startAutoPlay()
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [autoPlay, interval, totalSlides, isAutoPlaying])

  // Touch events için
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1)
    } else if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1)
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  // Pause on hover (mobile'da touch ile)
  const handleSliderEnter = () => {
    if (autoPlay) {
      setIsAutoPlaying(false)
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }

  const handleSliderLeave = () => {
    if (autoPlay) {
      setIsAutoPlaying(true)
    }
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % totalSlides)
  }

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides)
  }

  if (totalSlides <= 1) {
    return <div className={`mobile-slider-single ${className}`}>{children}</div>
  }

  return (
    <div 
      className={`mobile-slider ${className}`}
      ref={sliderRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleSliderEnter}
      onMouseLeave={handleSliderLeave}
    >
      <div 
        className="mobile-slider-container"
        style={{
          transform: `translateX(-${currentSlide * 100}%)`,
          transition: 'transform 0.5s ease-in-out'
        }}
      >
        {React.Children.map(children, (child, index) => (
          <div key={index} className="mobile-slide">
            {child}
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      {showDots && totalSlides > 1 && (
        <div className="mobile-slider-dots">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              className={`mobile-slider-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Navigation Arrows (mobile'da genelde gizli) */}
      {showArrows && totalSlides > 1 && (
        <>
          <button
            className="mobile-slider-arrow mobile-slider-arrow-prev"
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            className="mobile-slider-arrow mobile-slider-arrow-next"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            ›
          </button>
        </>
      )}

      {/* Auto-play indicator */}
      {autoPlay && totalSlides > 1 && (
        <div className="mobile-slider-indicator">
          <div 
            className="mobile-slider-progress"
            style={{
              width: `${((currentSlide + 1) / totalSlides) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  )
}

export default MobileSlider
