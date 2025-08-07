import config from '../config/environment'

// Performance monitoring utilities
export const performanceMonitor = {
  // Mark performance timing
  mark: (name) => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name)
    }
  },

  // Measure performance between marks
  measure: (name, startMark, endMark) => {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark)
        const measure = performance.getEntriesByName(name)[0]
        if (config.DEBUG_MODE) {
          console.log(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`)
        }
        return measure.duration
      } catch (error) {
        console.warn('Performance measurement failed:', error)
      }
    }
  },

  // Get navigation timing
  getNavigationTiming: () => {
    if (typeof performance !== 'undefined' && performance.timing) {
      const timing = performance.timing
      return {
        pageLoadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstPaint: timing.responseStart - timing.navigationStart,
        domComplete: timing.domComplete - timing.navigationStart,
      }
    }
    return null
  },

  // Log performance metrics
  logMetrics: () => {
    const metrics = performanceMonitor.getNavigationTiming()
    if (metrics && config.DEBUG_MODE) {
      console.log('📊 Performance Metrics:', metrics)
    }
  }
}

// Image lazy loading utility
export const lazyLoadImage = (img, src) => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      img.src = src
      img.classList.add('loaded')
      resolve()
    }
    image.onerror = reject
    image.src = src
  })
}

// Component performance wrapper
export const withPerformanceTracking = (WrappedComponent, componentName) => {
  return function PerformanceTrackedComponent(props) {
    React.useEffect(() => {
      performanceMonitor.mark(`${componentName}-mount-start`)
      
      return () => {
        performanceMonitor.mark(`${componentName}-mount-end`)
        performanceMonitor.measure(
          `${componentName}-mount-time`,
          `${componentName}-mount-start`,
          `${componentName}-mount-end`
        )
      }
    }, [])

    return React.createElement(WrappedComponent, props)
  }
}

// Bundle analyzer helper
export const analyzeBundle = () => {
  if (config.DEBUG_MODE && typeof window !== 'undefined') {
    // Log bundle information
    console.log('📦 Bundle Analysis:')
    console.log('- React version:', React.version)
    console.log('- User agent:', navigator.userAgent)
    console.log('- Screen resolution:', `${screen.width}x${screen.height}`)
    console.log('- Memory:', navigator.deviceMemory || 'Unknown')
    console.log('- Connection:', navigator.connection?.effectiveType || 'Unknown')
  }
}

// Memory usage monitor
export const memoryMonitor = {
  getUsage: () => {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576), // MB
      }
    }
    return null
  },

  log: () => {
    const usage = memoryMonitor.getUsage()
    if (usage && config.DEBUG_MODE) {
      console.log(`🧠 Memory Usage: ${usage.used}MB / ${usage.total}MB (Limit: ${usage.limit}MB)`)
    }
  }
}

// Error boundary performance tracking
export const trackErrorBoundary = (error, errorInfo) => {
  console.error('🚨 Error Boundary Triggered:', error, errorInfo)
  
  // In production, send to error reporting service
  if (!config.DEBUG_MODE && config.SENTRY_DSN) {
    // TODO: Send to Sentry or other error reporting service
    console.log('Would send to error reporting service:', { error, errorInfo })
  }
}

// API performance tracking
export const trackApiCall = async (apiCall, endpoint) => {
  const startTime = performance.now()
  
  try {
    const result = await apiCall()
    const endTime = performance.now()
    const duration = endTime - startTime
    
    if (config.DEBUG_MODE) {
      console.log(`🌐 API Call [${endpoint}]: ${duration.toFixed(2)}ms`)
    }
    
    return result
  } catch (error) {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    console.error(`🌐 API Error [${endpoint}]: ${duration.toFixed(2)}ms`, error)
    throw error
  }
}

export default performanceMonitor 