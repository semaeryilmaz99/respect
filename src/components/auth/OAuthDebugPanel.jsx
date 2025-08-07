import React, { useState, useEffect, useRef } from 'react';
import logger from '../../utils/logger';

/**
 * OAuth kimlik doğrulama sürecinde debug bilgilerini gösteren panel
 */
const OAuthDebugPanel = ({ visible = false }) => {
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(visible);
  const panelRef = useRef(null);
  
  // Orijinal console metodlarını kaydet ve loglama ekle
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };
    
    // Konsol metodlarını özelleştir
    console.log = (...args) => {
      originalConsole.log(...args);
      captureLogs('LOG', args);
    };
    
    console.info = (...args) => {
      originalConsole.info(...args);
      captureLogs('INFO', args);
    };
    
    console.warn = (...args) => {
      originalConsole.warn(...args);
      captureLogs('WARN', args);
    };
    
    console.error = (...args) => {
      originalConsole.error(...args);
      captureLogs('ERROR', args);
    };
    
    console.debug = (...args) => {
      originalConsole.debug(...args);
      captureLogs('DEBUG', args);
    };
    
    // Temizleme işlevi
    return () => {
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.debug = originalConsole.debug;
    };
  }, []);
  
  // Logları yakala
  const captureLogs = (level, args) => {
    // Sadece kimlik doğrulama ile ilgili logları filtrele
    const logText = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    const isAuthRelated = logText.toLowerCase().includes('auth') || 
                          logText.toLowerCase().includes('spotify') ||
                          logText.toLowerCase().includes('oauth');
    
    if (isAuthRelated) {
      const newLog = {
        timestamp: new Date().toISOString(),
        level,
        message: logText,
        id: Date.now() + Math.random()
      };
      
      setLogs(prevLogs => {
        const updatedLogs = [...prevLogs, newLog];
        // Sadece son 100 logu tut
        return updatedLogs.slice(-100);
      });
      
      // Paneli aşağı kaydır
      if (panelRef.current) {
        setTimeout(() => {
          panelRef.current.scrollTop = panelRef.current.scrollHeight;
        }, 100);
      }
    }
  };
  
  // Paneli aç/kapat
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  
  // Logları temizle
  const clearLogs = () => {
    setLogs([]);
  };
  
  // Alt+D ile paneli aç/kapat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'd') {
        toggleVisibility();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible]);
  
  if (!isVisible) return null;
  
  return (
    <div className="oauth-debug-panel" ref={panelRef}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span>OAuth Debug Panel (Alt+D ile aç/kapat)</span>
        <div>
          <button 
            onClick={clearLogs} 
            style={{ 
              background: '#333', 
              border: 'none', 
              color: 'white', 
              padding: '2px 8px', 
              cursor: 'pointer',
              marginRight: '5px'
            }}
          >
            Temizle
          </button>
          <button 
            onClick={toggleVisibility}
            style={{ 
              background: '#333', 
              border: 'none', 
              color: 'white', 
              padding: '2px 8px', 
              cursor: 'pointer' 
            }}
          >
            Kapat
          </button>
        </div>
      </div>
      
      {logs.length === 0 ? (
        <div>Henüz log yok...</div>
      ) : (
        logs.map(log => (
          <div key={log.id} className="oauth-debug-entry">
            <span className="oauth-debug-timestamp">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            &nbsp;
            <span style={{ color: getColorForLevel(log.level) }}>
              [{log.level}]
            </span>
            &nbsp;
            <span className="oauth-debug-message">{log.message}</span>
          </div>
        ))
      )}
    </div>
  );
};

// Log seviyesine göre renk belirleme
function getColorForLevel(level) {
  switch (level) {
    case 'ERROR': return '#ff5252';
    case 'WARN': return '#ffab40';
    case 'INFO': return '#40c4ff';
    case 'DEBUG': return '#69f0ae';
    default: return '#ffffff';
  }
}

export default OAuthDebugPanel;