import React, { useState } from 'react'
import { testSupabaseConnection, testRespectTransaction, checkTableStructure, debugRespectTransaction } from '../utils/supabaseTest'
import { useAppContext } from '../context/AppContext'

const SupabaseTest = () => {
  const { state } = useAppContext()
  const { user } = state
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const runConnectionTest = async () => {
    setLoading(true)
    try {
      const result = await testSupabaseConnection()
      setResults({ type: 'connection', ...result })
    } catch (error) {
      setResults({ type: 'connection', success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const runTableStructureTest = async () => {
    setLoading(true)
    try {
      const result = await checkTableStructure()
      setResults({ type: 'structure', success: true, data: result })
    } catch (error) {
      setResults({ type: 'structure', success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const runRespectTransactionTest = async () => {
    if (!user?.id) {
      alert('Lütfen önce giriş yapın')
      return
    }

    setLoading(true)
    try {
      // Test için bir artist ID kullanın (gerçek bir artist ID ile değiştirin)
      const result = await testRespectTransaction(user.id, '550e8400-e29b-41d4-a716-446655440001', 10)
      setResults({ type: 'transaction', ...result })
    } catch (error) {
      setResults({ type: 'transaction', success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const runDebugRespectTransaction = async () => {
    if (!user?.id) {
      alert('Lütfen önce giriş yapın')
      return
    }

    setLoading(true)
    try {
      // Test için bir artist ID kullanın (gerçek bir artist ID ile değiştirin)
      const result = await debugRespectTransaction(user.id, '550e8400-e29b-41d4-a716-446655440001', 10)
      setResults({ type: 'debug', ...result })
    } catch (error) {
      setResults({ type: 'debug', success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="supabase-test" style={{ padding: '20px', background: '#f5f5f5', margin: '20px', borderRadius: '8px' }}>
      <h3>🔍 Supabase Bağlantı Testi</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Kullanıcı Durumu:</strong> {user ? `Giriş yapılmış (${user.id})` : 'Giriş yapılmamış'}</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={runConnectionTest}
          disabled={loading}
          style={{ padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {loading ? 'Test Ediliyor...' : 'Bağlantı Testi'}
        </button>

        <button 
          onClick={runTableStructureTest}
          disabled={loading}
          style={{ padding: '10px 15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {loading ? 'Test Ediliyor...' : 'Tablo Yapısı Testi'}
        </button>

        <button 
          onClick={runRespectTransactionTest}
          disabled={loading || !user}
          style={{ padding: '10px 15px', background: '#ffc107', color: 'black', border: 'none', borderRadius: '4px' }}
        >
          {loading ? 'Test Ediliyor...' : 'Respect Transaction Testi'}
        </button>

        <button 
          onClick={runDebugRespectTransaction}
          disabled={loading || !user}
          style={{ padding: '10px 15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {loading ? 'Debug Ediliyor...' : 'Debug Respect Transaction'}
        </button>
      </div>

      {results && (
        <div style={{ 
          padding: '15px', 
          background: results.success ? '#d4edda' : '#f8d7da', 
          border: `1px solid ${results.success ? '#c3e6cb' : '#f5c6cb'}`, 
          borderRadius: '4px',
          color: results.success ? '#155724' : '#721c24'
        }}>
          <h4>{results.type === 'connection' ? 'Bağlantı Testi' : 
               results.type === 'structure' ? 'Tablo Yapısı Testi' : 
               results.type === 'debug' ? 'Debug Respect Transaction' :
               'Respect Transaction Testi'}</h4>
          
          <p><strong>Durum:</strong> {results.success ? '✅ Başarılı' : '❌ Başarısız'}</p>
          
          {results.error && (
            <div>
              <p><strong>Hata:</strong> {results.error}</p>
              {results.details && (
                <pre style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                  {JSON.stringify(results.details, null, 2)}
                </pre>
              )}
            </div>
          )}
          
          {results.data && (
            <div>
              <p><strong>Veri:</strong></p>
              <pre style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                {JSON.stringify(results.data, null, 2)}
              </pre>
            </div>
          )}
          
          {results.message && (
            <p><strong>Mesaj:</strong> {results.message}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default SupabaseTest 