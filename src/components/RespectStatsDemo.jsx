import React, { useState } from 'react'
import { useRespectStats } from '../hooks/useRespectStats'
import respectService from '../api/respectService'
import respectStatsService from '../api/respectStatsService'
import { useAppContext } from '../context/AppContext'

const RespectStatsDemo = () => {
  const { state } = useAppContext()
  const { user } = state
  const [testAmount, setTestAmount] = useState(50)
  const [isLoading, setIsLoading] = useState(false)

  // Use the real-time respect stats hook
  const { 
    stats, 
    isLoading: statsLoading, 
    error, 
    respectBalance, 
    totalRespectSent, 
    totalRespectReceived,
    totalRespectActivity,
    refreshStats 
  } = useRespectStats(user?.id)

  // Test functions
  const addRespectToBalance = async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    try {
      const { data, error } = await respectService.addRespectToBalance(testAmount)
      if (error) {
        console.error('Error adding respect:', error)
        alert('Hata: ' + error.message)
      } else {
        console.log('Respect added successfully:', data)
        alert(`${testAmount} respect bakiye eklendi!`)
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Hata oluştu: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const sendTestRespect = async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    try {
      // Send respect to a test artist (you'll need to replace with a real artist ID)
      const { data, error } = await respectService.sendRespectToArtist(
        '00000000-0000-0000-0000-000000000001', // Replace with real artist ID
        testAmount,
        'Test respect gönderimi'
      )
      
      if (error) {
        console.error('Error sending respect:', error)
        alert('Hata: ' + error.message)
      } else {
        console.log('Respect sent successfully:', data)
        alert(`${testAmount} respect gönderildi!`)
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Hata oluştu: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const updateBalanceManually = async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    try {
      const { data, error } = await respectStatsService.updateUserRespectBalance(
        user.id, 
        respectBalance + testAmount
      )
      
      if (error) {
        console.error('Error updating balance:', error)
        alert('Hata: ' + error.message)
      } else {
        console.log('Balance updated successfully:', data)
        alert(`Bakiye ${testAmount} artırıldı!`)
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Hata oluştu: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const testRealtimeUpdate = async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    try {
      const { data, error } = await respectStatsService.testRealtimeSubscription(user.id)
      
      if (error) {
        console.error('Error testing real-time:', error)
        alert('Hata: ' + error.message)
      } else {
        console.log('Real-time test completed:', data)
        alert('Real-time test tamamlandı! İstatistiklerin güncellendiğini kontrol edin.')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Hata oluştu: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user?.id) {
    return (
      <div className="respect-stats-demo">
        <h3>Respect Stats Demo</h3>
        <p>Lütfen giriş yapın</p>
      </div>
    )
  }

  return (
    <div className="respect-stats-demo">
      <h3>Respect Stats Demo - Real-time Test</h3>
      
      {/* Current Stats Display */}
      <div className="current-stats">
        <h4>Mevcut İstatistikler:</h4>
        {statsLoading ? (
          <p>Yükleniyor...</p>
        ) : error ? (
          <p className="error">Hata: {error.message}</p>
        ) : (
          <div className="stats-grid">
            <div className="stat-item">
              <strong>Respect Bakiyesi:</strong> {respectBalance?.toLocaleString() || '0'}
            </div>
            <div className="stat-item">
              <strong>Gönderilen Respect:</strong> {totalRespectSent?.toLocaleString() || '0'}
            </div>
            <div className="stat-item">
              <strong>Alınan Respect:</strong> {totalRespectReceived?.toLocaleString() || '0'}
            </div>
            <div className="stat-item">
              <strong>Toplam Aktivite:</strong> {totalRespectActivity?.toLocaleString() || '0'}
            </div>
          </div>
        )}
      </div>

      {/* Test Controls */}
      <div className="test-controls">
        <h4>Test Kontrolleri:</h4>
        
        <div className="control-group">
          <label>
            Test Miktarı:
            <input
              type="number"
              value={testAmount}
              onChange={(e) => setTestAmount(parseInt(e.target.value) || 0)}
              min="1"
              max="10000"
            />
          </label>
        </div>

        <div className="button-group">
          <button 
            onClick={addRespectToBalance}
            disabled={isLoading}
            className="test-btn add-btn"
          >
            {isLoading ? 'İşleniyor...' : 'Bakiye Ekle'}
          </button>

          <button 
            onClick={updateBalanceManually}
            disabled={isLoading}
            className="test-btn update-btn"
          >
            {isLoading ? 'İşleniyor...' : 'Bakiye Manuel Güncelle'}
          </button>

          <button 
            onClick={sendTestRespect}
            disabled={isLoading}
            className="test-btn send-btn"
          >
            {isLoading ? 'İşleniyor...' : 'Test Respect Gönder'}
          </button>

          <button 
            onClick={refreshStats}
            disabled={statsLoading}
            className="test-btn refresh-btn"
          >
            {statsLoading ? 'Yükleniyor...' : 'İstatistikleri Yenile'}
          </button>

          <button 
            onClick={testRealtimeUpdate}
            disabled={isLoading}
            className="test-btn realtime-btn"
          >
            {isLoading ? 'Test Ediliyor...' : 'Real-time Test'}
          </button>
        </div>
      </div>

      {/* Raw Data Display */}
      <div className="raw-data">
        <h4>Ham Veri:</h4>
        <pre>{JSON.stringify(stats, null, 2)}</pre>
      </div>

      <style jsx>{`
        .respect-stats-demo {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          margin: 20px 0;
        }

        .current-stats {
          margin-bottom: 20px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }

        .stat-item {
          background: white;
          padding: 10px;
          border-radius: 6px;
          border-left: 4px solid #667eea;
        }

        .test-controls {
          margin-bottom: 20px;
        }

        .control-group {
          margin-bottom: 15px;
        }

        .control-group label {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .control-group input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 100px;
        }

        .button-group {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .test-btn {
          padding: 10px 15px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .test-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .add-btn {
          background: #10b981;
          color: white;
        }

        .update-btn {
          background: #3b82f6;
          color: white;
        }

        .send-btn {
          background: #f59e0b;
          color: white;
        }

        .refresh-btn {
          background: #6b7280;
          color: white;
        }

        .realtime-btn {
          background: #8b5cf6;
          color: white;
        }

        .raw-data {
          background: white;
          padding: 15px;
          border-radius: 6px;
          margin-top: 20px;
        }

        .raw-data pre {
          background: #f1f5f9;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
        }

        .error {
          color: #ef4444;
        }
      `}</style>
    </div>
  )
}

export default RespectStatsDemo 