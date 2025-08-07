import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { respectService } from '../api'
import Header from './Header'
import BackButton from './common/BackButton'
import LoadingSpinner from './LoadingSpinner'
import SuccessPopup from './SuccessPopup'

const PurchasePage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userBalance, setUserBalance] = useState(0)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Respect paketleri
  const respectPackages = [
    { id: 1, amount: 100, price: 10, bonus: 0, popular: false },
    { id: 2, amount: 250, price: 20, bonus: 25, popular: false },
    { id: 3, amount: 500, price: 35, bonus: 75, popular: true },
    { id: 4, amount: 1000, price: 60, bonus: 200, popular: false },
    { id: 5, amount: 2000, price: 100, bonus: 500, popular: false }
  ]

  // Kullanıcı balance'ını al
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const { data, error } = await respectService.getRespectBalance()
        if (!error && data) {
          setUserBalance(data.respect_balance || 0)
        }
      } catch (err) {
        console.error('Balance fetch error:', err)
      }
    }

    fetchBalance()
  }, [])

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg)
    setError('')
  }

  const handlePurchase = async () => {
    if (!selectedPackage) {
      setError('Lütfen bir paket seçin')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Dummy ödeme simülasyonu - 2 saniye bekle
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Başarılı ödeme sonrası balance güncelleme
      const totalAmount = selectedPackage.amount + selectedPackage.bonus
      const { data, error } = await respectService.addRespectToBalance(totalAmount)
      
      if (error) {
        throw new Error('Balance güncellenirken hata oluştu')
      }
      
      // Local state'i güncelle
      setUserBalance(data.respect_balance)

      // Başarı popup'ını göster
      setSuccessMessage(`${selectedPackage.amount + selectedPackage.bonus} Respect başarıyla satın alındı!`)
      setShowSuccessPopup(true)

      // 3 saniye sonra yönlendir
      setTimeout(() => {
        setShowSuccessPopup(false)
        // Eğer respect gönderme sayfasından geldiyse geri dön
        if (location.state?.returnTo) {
          navigate(location.state.returnTo, { 
            state: { 
              ...location.state.returnToState,
              balanceUpdated: true 
            } 
          })
        } else {
          navigate('/feed')
        }
      }, 3000)

    } catch (err) {
      setError('Satın alma işlemi başarısız oldu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="purchase-page">
      <div className="purchase-header mobile-only" style={{ 
        display: 'flex', 
        justifyContent: 'flex-start', 
        alignItems: 'center',
        padding: '16px 20px',
        background: 'transparent'
      }}>
        <BackButton />
      </div>
      <Header />

      <div className="purchase-container">
        <div className="purchase-header-section">
          <h1 className="purchase-title">Respect Satın Al</h1>
          <p className="purchase-subtitle">
            Favori sanatçılarınızı desteklemek için respect satın alın
          </p>
          
          <div className="current-balance">
            <span className="balance-label">Mevcut Balance:</span>
            <span className="balance-amount">{userBalance.toLocaleString()} Respect</span>
          </div>
        </div>

        {error && (
          <div className="error-message" style={{ 
            color: 'red', 
            marginBottom: '1rem', 
            textAlign: 'center',
            padding: '12px',
            background: '#fee',
            borderRadius: '8px',
            border: '1px solid #fcc'
          }}>
            {error}
          </div>
        )}

        <div className="packages-grid">
          {respectPackages.map((pkg) => (
            <div 
              key={pkg.id} 
              className={`package-card ${selectedPackage?.id === pkg.id ? 'selected' : ''} ${pkg.popular ? 'popular' : ''}`}
              onClick={() => handlePackageSelect(pkg)}
            >
              {pkg.popular && (
                <div className="popular-badge">En Popüler</div>
              )}
              
              <div className="package-amount">
                <span className="amount-number">{pkg.amount}</span>
                <span className="amount-label">Respect</span>
              </div>

              {pkg.bonus > 0 && (
                <div className="bonus-amount">
                  +{pkg.bonus} Bonus
                </div>
              )}

              <div className="package-price">
                <span className="price-currency">₺</span>
                <span className="price-amount">{pkg.price}</span>
              </div>

              <div className="package-total">
                Toplam: {pkg.amount + pkg.bonus} Respect
              </div>
            </div>
          ))}
        </div>

        <div className="purchase-actions">
          <button 
            className="purchase-button"
            onClick={handlePurchase}
            disabled={!selectedPackage || loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                <span>İşleniyor...</span>
              </>
            ) : (
              `₺${selectedPackage?.price || 0} - Satın Al`
            )}
          </button>
        </div>

        <div className="purchase-info">
          <div className="info-item">
            <span className="info-icon">💳</span>
            <span className="info-text">Güvenli ödeme sistemi</span>
          </div>
          <div className="info-item">
            <span className="info-icon">⚡</span>
            <span className="info-text">Anında hesabınıza yüklenir</span>
          </div>
          <div className="info-item">
            <span className="info-icon">🎁</span>
            <span className="info-text">Bonus respect'ler hediye</span>
          </div>
        </div>
      </div>
      
      {/* Success Popup */}
      <SuccessPopup
        isVisible={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="Respect Satın Alındı!"
        message={successMessage}
        autoClose={false}
      />
    </div>
  )
}

export default PurchasePage;