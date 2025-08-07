import React from 'react'
import { useBreakpoint } from '../../hooks/useMediaQuery'

const ResponsiveLayout = ({ children }) => {
  const { isDesktop, current } = useBreakpoint()

  const isDevelopment = !import.meta.env.PROD

  return (
    <div className={`responsive-layout layout-${current}`}>
      {/* Debug info - remove in production */}
      {isDevelopment && (
        <div className="breakpoint-indicator">
          {current.toUpperCase()} - {window.innerWidth}px
        </div>
      )}
      
      {/* Main content */}
      <div className="responsive-content">
        {children}
      </div>
      
      {/* Desktop-specific sidebar or extra elements could go here */}
      {isDesktop && (
        <div className="desktop-sidebar">
          {/* Desktop sidebar content */}
        </div>
      )}
    </div>
  )
}

export default ResponsiveLayout 