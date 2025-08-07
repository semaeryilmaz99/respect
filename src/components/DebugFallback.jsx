import React from 'react'

const DebugFallback = ({ message = 'Loading...' }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #f9dc38 0%, #ffffff 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '20px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#1b262e', marginBottom: '10px' }}>🔄 {message}</h2>
        <p style={{ color: '#6c757d' }}>Lütfen bekleyin...</p>
      </div>
    </div>
  )
}

export default DebugFallback 