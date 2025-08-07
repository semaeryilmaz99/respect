import { supabase } from '../config/supabase'

export const cardService = {
  // Kullanıcının kartlarını getir
  getUserCards: async () => {
    try {
      const { data, error } = await supabase
        .from('user_cards')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get user cards error:', error)
      throw error
    }
  },

  // Yeni kart ekle
  addCard: async (cardData) => {
    try {
      // Kart numarasının son 4 hanesini al
      const lastFourDigits = cardData.card_number.slice(-4)
      
      const { data, error } = await supabase
        .from('user_cards')
        .insert({
          card_number: lastFourDigits,
          card_holder: cardData.card_holder,
          expiry_month: cardData.expiry_month,
          expiry_year: cardData.expiry_year,
          card_type: cardData.card_type || 'unknown',
          is_default: cardData.is_default || false
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Add card error:', error)
      throw error
    }
  },

  // Kart güncelle
  updateCard: async (cardId, cardData) => {
    try {
      const updateData = {}
      
      if (cardData.card_number) {
        updateData.card_number = cardData.card_number.slice(-4)
      }
      if (cardData.card_holder) {
        updateData.card_holder = cardData.card_holder
      }
      if (cardData.expiry_month) {
        updateData.expiry_month = cardData.expiry_month
      }
      if (cardData.expiry_year) {
        updateData.expiry_year = cardData.expiry_year
      }
      if (cardData.card_type) {
        updateData.card_type = cardData.card_type
      }
      if (cardData.is_default !== undefined) {
        updateData.is_default = cardData.is_default
      }

      updateData.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('user_cards')
        .update(updateData)
        .eq('id', cardId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Update card error:', error)
      throw error
    }
  },

  // Kart sil
  deleteCard: async (cardId) => {
    try {
      const { error } = await supabase
        .from('user_cards')
        .delete()
        .eq('id', cardId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Delete card error:', error)
      throw error
    }
  },

  // Varsayılan kartı ayarla
  setDefaultCard: async (cardId) => {
    try {
      // Önce tüm kartları varsayılan olmaktan çıkar
      await supabase
        .from('user_cards')
        .update({ is_default: false })

      // Sonra seçilen kartı varsayılan yap
      const { data, error } = await supabase
        .from('user_cards')
        .update({ is_default: true })
        .eq('id', cardId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Set default card error:', error)
      throw error
    }
  },

  // Kart tipini belirle (Visa, Mastercard, etc.)
  detectCardType: (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\s/g, '')
    
    if (/^4/.test(cleanNumber)) {
      return 'visa'
    } else if (/^5[1-5]/.test(cleanNumber)) {
      return 'mastercard'
    } else if (/^3[47]/.test(cleanNumber)) {
      return 'amex'
    } else if (/^6/.test(cleanNumber)) {
      return 'discover'
    } else {
      return 'unknown'
    }
  },

  // Kart numarasını formatla
  formatCardNumber: (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\s/g, '')
    const groups = cleanNumber.match(/.{1,4}/g)
    return groups ? groups.join(' ') : cleanNumber
  },

  // Kart numarasını maskele
  maskCardNumber: (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\s/g, '')
    if (cleanNumber.length <= 4) return cleanNumber
    
    const lastFour = cleanNumber.slice(-4)
    const masked = '*'.repeat(cleanNumber.length - 4)
    return masked + lastFour
  }
}

export default cardService 