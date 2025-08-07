import { supabase } from '../config/supabase'

export class RealtimeFeedManager {
  constructor() {
    this.subscriptions = new Map()
  }

  // Feed updates'e subscribe ol
  subscribeToFeed(onFeedUpdate) {
    console.log('📊 Subscribing to feed updates...')
    
    const subscription = supabase
      .channel('feed-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'feed_items'
      }, (payload) => {
        console.log('📈 New feed item received:', payload.new)
        onFeedUpdate(payload.new)
      })
      .subscribe()

    this.subscriptions.set('feed', subscription)
    console.log('✅ Subscribed to feed updates')
  }

  // Respect updates'e subscribe ol
  subscribeToRespectUpdates(artistId, onRespectUpdate) {
    console.log(`💰 Subscribing to respect updates for artist: ${artistId}`)
    
    const subscription = supabase
      .channel(`respect-${artistId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'respect_transactions',
        filter: `to_artist_id=eq.${artistId}`
      }, (payload) => {
        console.log('💸 New respect transaction received:', payload.new)
        onRespectUpdate(payload.new)
      })
      .subscribe()

    this.subscriptions.set(`respect-${artistId}`, subscription)
    console.log(`✅ Subscribed to respect updates for artist: ${artistId}`)
  }

  // Song respect updates'e subscribe ol
  subscribeToSongRespectUpdates(songId, onRespectUpdate) {
    console.log(`🎵 Subscribing to song respect updates: ${songId}`)
    
    const subscription = supabase
      .channel(`song-respect-${songId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'respect_transactions',
        filter: `song_id=eq.${songId}`
      }, (payload) => {
        console.log('🎵 New song respect transaction received:', payload.new)
        onRespectUpdate(payload.new)
      })
      .subscribe()

    this.subscriptions.set(`song-respect-${songId}`, subscription)
    console.log(`✅ Subscribed to song respect updates: ${songId}`)
  }

  // Online users updates'e subscribe ol
  subscribeToOnlineUsers(onUserUpdate) {
    console.log('👥 Subscribing to online users updates...')
    
    const subscription = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = subscription.presenceState()
        console.log('👥 Online users updated:', state)
        onUserUpdate(state)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 User left:', key, leftPresences)
      })
      .subscribe()

    this.subscriptions.set('online-users', subscription)
    console.log('✅ Subscribed to online users updates')
  }

  // Tüm subscription'lardan ayrıl
  unsubscribeAll() {
    console.log('👋 Unsubscribing from all real-time updates...')
    
    this.subscriptions.forEach((subscription, key) => {
      subscription.unsubscribe()
      console.log(`✅ Unsubscribed from: ${key}`)
    })
    
    this.subscriptions.clear()
  }

  // Belirli subscription'dan ayrıl
  unsubscribe(key) {
    const subscription = this.subscriptions.get(key)
    if (subscription) {
      subscription.unsubscribe()
      this.subscriptions.delete(key)
      console.log(`✅ Unsubscribed from: ${key}`)
    }
  }
}

// Global instance
export const feedManager = new RealtimeFeedManager() 