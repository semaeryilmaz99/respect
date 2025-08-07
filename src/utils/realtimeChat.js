import { supabase } from '../config/supabase'

export class RealtimeChatManager {
  constructor() {
    this.subscriptions = new Map()
  }

  // Chat room'a join ol
  joinChatRoom(roomId, roomType, onMessage) {
    console.log(`🎤 Joining chat room: ${roomId} (${roomType})`)
    
    const subscription = supabase
      .channel(`chat-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        console.log('💬 New chat message received:', payload)
        console.log('💬 Payload new:', payload.new)
        console.log('💬 Payload eventType:', payload.eventType)
        onMessage(payload.new)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        console.log('🔍 All chat_messages changes:', payload)
      })
      .subscribe((status) => {
        console.log(`📡 Chat subscription status: ${status}`)
      })

    this.subscriptions.set(roomId, subscription)
    console.log(`✅ Joined chat room: ${roomId}`)
  }

  // Mesaj gönder
  async sendMessage(roomId, roomType, message) {
    try {
      console.log(`📤 Sending message to room ${roomId}: ${message}`)
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      console.log('👤 Current user:', user)

      const messageData = {
        room_id: roomId,
        room_type: roomType,
        user_id: user.id,
        message: message
      }

      console.log('📝 Message data to insert:', messageData)

      const { data, error } = await supabase
        .from('chat_messages')
        .insert(messageData)
        .select(`
          *,
          profiles(username, full_name, avatar_url)
        `)
        .single()

      if (error) {
        console.error('❌ Database insert error:', error)
        throw error
      }

      console.log('✅ Message sent successfully:', data)
      return data

    } catch (error) {
      console.error('❌ Send message error:', error)
      throw error
    }
  }

  // Chat room'dan ayrıl
  leaveChatRoom(roomId) {
    console.log(`👋 Leaving chat room: ${roomId}`)
    
    const subscription = this.subscriptions.get(roomId)
    if (subscription) {
      subscription.unsubscribe()
      this.subscriptions.delete(roomId)
      console.log(`✅ Left chat room: ${roomId}`)
    }
  }

  // Tüm chat room'lardan ayrıl
  leaveAllRooms() {
    console.log('👋 Leaving all chat rooms')
    
    this.subscriptions.forEach((subscription, roomId) => {
      subscription.unsubscribe()
      console.log(`✅ Left chat room: ${roomId}`)
    })
    
    this.subscriptions.clear()
  }
}

// Global instance
export const chatManager = new RealtimeChatManager() 