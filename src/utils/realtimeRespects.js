import { supabase } from '../config/supabase'

class RealtimeRespects {
  constructor() {
    this.subscriptions = new Map()
    this.callbacks = new Map()
  }

  // Respect gönderimlerini dinle
  subscribeToRespects(userId, callback) {
    if (this.subscriptions.has(userId)) {
      // Zaten dinleniyorsa, callback'i güncelle
      this.callbacks.set(userId, callback)
      return () => this.unsubscribeFromRespects(userId)
    }

    console.log('🎧 Subscribing to respect transactions for user:', userId)

    const subscription = supabase
      .channel(`respect_transactions_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'respect_transactions',
          filter: `from_user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔄 New respect transaction detected:', payload.new)
          this.handleNewRespect(payload.new, userId)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'respect_transactions',
          filter: `from_user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔄 Respect transaction updated:', payload.new)
          this.handleUpdatedRespect(payload.new, payload.old, userId)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'respect_transactions',
          filter: `from_user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔄 Respect transaction deleted:', payload.old)
          this.handleDeletedRespect(payload.old, userId)
        }
      )
      .subscribe()

    this.subscriptions.set(userId, subscription)
    this.callbacks.set(userId, callback)

    return () => this.unsubscribeFromRespects(userId)
  }

  // Yeni respect gönderimi
  async handleNewRespect(transaction, userId) {
    const callback = this.callbacks.get(userId)
    if (callback) {
      try {
        // Artist ve song bilgilerini al
        let artistData = null
        let songData = null

        if (transaction.to_artist_id) {
          const { data: artist } = await supabase
            .from('artists')
            .select('id, name, avatar_url')
            .eq('id', transaction.to_artist_id)
            .single()
          artistData = artist
        }

        if (transaction.song_id) {
          const { data: song } = await supabase
            .from('songs')
            .select(`
              id, title, cover_url,
              artists (id, name)
            `)
            .eq('id', transaction.song_id)
            .single()
          songData = song
        }

        // Transaction'ı formatla
        const formattedTransaction = {
          ...transaction,
          recipient_name: artistData?.name || songData?.artists?.name,
          recipient_image: artistData?.avatar_url || songData?.cover_url,
          item_title: songData?.title
        }
        
        callback({
          type: 'NEW_RESPECT',
          transaction: formattedTransaction
        })
      } catch (error) {
        console.error('Error formatting new respect transaction:', error)
        // Basit format ile devam et
        const formattedTransaction = {
          ...transaction,
          recipient_name: 'Bilinmeyen',
          recipient_image: '/assets/artist/Image.png'
        }
        
        callback({
          type: 'NEW_RESPECT',
          transaction: formattedTransaction
        })
      }
    }
  }

  // Respect güncelleme
  handleUpdatedRespect(newTransaction, oldTransaction, userId) {
    const callback = this.callbacks.get(userId)
    if (callback) {
      const formattedTransaction = {
        ...newTransaction,
        recipient_name: newTransaction.artist_name || newTransaction.song_artist_name,
        recipient_image: newTransaction.artist_avatar_url || newTransaction.song_cover_url,
        item_title: newTransaction.song_title
      }
      
      callback({
        type: 'UPDATED_RESPECT',
        transaction: formattedTransaction,
        oldTransaction
      })
    }
  }

  // Respect silme
  handleDeletedRespect(transaction, userId) {
    const callback = this.callbacks.get(userId)
    if (callback) {
      callback({
        type: 'DELETED_RESPECT',
        transaction
      })
    }
  }

  // Dinlemeyi durdur
  unsubscribeFromRespects(userId) {
    const subscription = this.subscriptions.get(userId)
    if (subscription) {
      console.log('🔇 Unsubscribing from respect transactions for user:', userId)
      supabase.removeChannel(subscription)
      this.subscriptions.delete(userId)
      this.callbacks.delete(userId)
    }
  }

  // Tüm dinlemeleri durdur
  unsubscribeAll() {
    console.log('🔇 Unsubscribing from all respect transactions')
    this.subscriptions.forEach((subscription, userId) => {
      supabase.removeChannel(subscription)
    })
    this.subscriptions.clear()
    this.callbacks.clear()
  }
}

// Singleton instance
const realtimeRespects = new RealtimeRespects()

export default realtimeRespects 