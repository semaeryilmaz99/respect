import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console and external service
    console.error('Error Boundary caught an error:', error, errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // TODO: Log to external error reporting service (Sentry, LogRocket, etc.)
    // errorReportingService.captureException(error, { extra: errorInfo })
  }

  handleReload = () => {
    // Reload the page to reset the error state
    window.location.reload()
  }

  handleGoHome = () => {
    // Navigate to home page
    window.location.href = '/feed'
  }

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h1 className="error-title">Bir şeyler ters gitti!</h1>
            <p className="error-message">
              Beklenmeyen bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin.
            </p>
            
            {/* Error details (only in development) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="error-details">
                <summary>Hata Detayları (Geliştirici Modu)</summary>
                <pre className="error-stack">
                  <strong>Error:</strong> {this.state.error.toString()}
                  <br />
                  <strong>Stack Trace:</strong>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div className="error-actions">
              <button onClick={this.handleReload} className="btn btn-primary">
                Sayfayı Yenile
              </button>
              <button onClick={this.handleGoHome} className="btn btn-secondary">
                Ana Sayfaya Git
              </button>
            </div>
          </div>
          
          <style jsx>{`
            .error-boundary {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              background-color: #f8f9fa;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .error-container {
              max-width: 500px;
              text-align: center;
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            
            .error-icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
            
            .error-title {
              font-size: 24px;
              font-weight: 600;
              color: #1b262e;
              margin: 0 0 16px 0;
            }
            
            .error-message {
              font-size: 16px;
              color: #666;
              margin: 0 0 32px 0;
              line-height: 1.5;
            }
            
            .error-details {
              margin: 24px 0;
              text-align: left;
              background: #f8f9fa;
              border-radius: 8px;
              padding: 16px;
            }
            
            .error-details summary {
              cursor: pointer;
              font-weight: 600;
              margin-bottom: 12px;
            }
            
            .error-stack {
              font-size: 12px;
              color: #666;
              white-space: pre-wrap;
              margin: 0;
              max-height: 200px;
              overflow-y: auto;
            }
            
            .error-actions {
              display: flex;
              gap: 12px;
              justify-content: center;
              flex-wrap: wrap;
            }
            
            .btn {
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              min-width: 120px;
            }
            
            .btn-primary {
              background-color: #f9dc38;
              color: #1b262e;
            }
            
            .btn-primary:hover {
              background-color: #f5d428;
              transform: translateY(-1px);
            }
            
            .btn-secondary {
              background-color: #f5f5f5;
              color: #666;
            }
            
            .btn-secondary:hover {
              background-color: #e8e8e8;
              transform: translateY(-1px);
            }
            
            @media (max-width: 480px) {
              .error-container {
                padding: 24px;
                margin: 20px;
              }
              
              .error-title {
                font-size: 20px;
              }
              
              .error-message {
                font-size: 14px;
              }
              
              .error-actions {
                flex-direction: column;
              }
            }
          `}</style>
        </div>
      )
    }

    // If no error, render children normally
    return this.props.children
  }
}

export default ErrorBoundary 