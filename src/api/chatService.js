import { supabase } from '../config/supabase'

const chatService = {
  // Chat room oluştur veya mevcut olanı getir
  getOrCreateChatRoom: async (roomId, roomType, roomName = null, roomDescription = null) => {
    try {
      console.log('💬 Getting or creating chat room:', roomId, roomType)
      
      // Önce mevcut chat room'u kontrol et
      const { data: existingRoom, error: checkError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('room_id', roomId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw checkError
      }

      if (existingRoom) {
        console.log('✅ Existing chat room found:', existingRoom)
        return { data: existingRoom, error: null }
      }

      // Yeni chat room oluştur
      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({
          room_id: roomId,
          room_type: roomType,
          room_name: roomName,
          room_description: roomDescription
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      console.log('✅ New chat room created:', newRoom)
      return { data: newRoom, error: null }
    } catch (error) {
      console.error('❌ Get or create chat room error:', error)
      return { data: null, error }
    }
  },

  // Chat room'a katıl
  joinChatRoom: async (roomId, roomType) => {
    try {
      console.log('👥 Joining chat room:', roomId, roomType)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      // Chat room'a katıl
      const { data, error } = await supabase
        .from('chat_room_members')
        .insert({
          room_id: roomId,
          room_type: roomType,
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log('✅ Already a member of this chat room')
          return { data: null, error: null }
        }
        throw error
      }

      console.log('✅ Joined chat room successfully:', data)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Join chat room error:', error)
      return { data: null, error }
    }
  },

  // Chat room'dan çık
  leaveChatRoom: async (roomId) => {
    try {
      console.log('👋 Leaving chat room:', roomId)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      const { data, error } = await supabase
        .from('chat_room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      console.log('✅ Left chat room successfully:', data)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Leave chat room error:', error)
      return { data: null, error }
    }
  },

  // Mesaj gönder
  sendMessage: async (roomId, roomType, message, messageType = 'text') => {
    try {
      console.log('💬 Sending message to room:', roomId)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          room_type: roomType,
          user_id: user.id,
          message,
          message_type: messageType
        })
        .select(`
          *,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .single()

      if (error) {
        throw error
      }

      // Chat room'un last_message_at'ini güncelle
      await supabase
        .from('chat_rooms')
        .update({ last_message_at: new Date().toISOString() })
        .eq('room_id', roomId)

      console.log('✅ Message sent successfully:', data)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Send message error:', error)
      return { data: null, error }
    }
  },

  // Mesajları getir
  getMessages: async (roomId, page = 1, limit = 50) => {
    try {
      console.log('📨 Getting messages for room:', roomId)
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (error) {
        throw error
      }

      console.log('✅ Messages fetched:', data?.length || 0)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Get messages error:', error)
      return { data: [], error }
    }
  },

  // Mesaj düzenle
  editMessage: async (messageId, newMessage) => {
    try {
      console.log('✏️ Editing message:', messageId)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .update({
          message: newMessage,
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      console.log('✅ Message edited successfully:', data)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Edit message error:', error)
      return { data: null, error }
    }
  },

  // Mesaj sil
  deleteMessage: async (messageId) => {
    try {
      console.log('🗑️ Deleting message:', messageId)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      console.log('✅ Message deleted successfully:', data)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Delete message error:', error)
      return { data: null, error }
    }
  },

  // Chat room üyelerini getir
  getChatRoomMembers: async (roomId) => {
    try {
      console.log('👥 Getting chat room members:', roomId)
      
      const { data, error } = await supabase
        .from('chat_room_members')
        .select(`
          *,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .eq('is_active', true)
        .order('joined_at', { ascending: true })

      if (error) {
        throw error
      }

      console.log('✅ Chat room members fetched:', data?.length || 0)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Get chat room members error:', error)
      return { data: [], error }
    }
  },

  // Kullanıcının chat room'larını getir
  getUserChatRooms: async () => {
    try {
      console.log('🏠 Getting user chat rooms')
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      const { data, error } = await supabase
        .from('chat_room_members')
        .select(`
          *,
          chat_rooms (
            id,
            room_id,
            room_type,
            room_name,
            room_description,
            member_count,
            last_message_at
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('joined_at', { ascending: false })

      if (error) {
        throw error
      }

      console.log('✅ User chat rooms fetched:', data?.length || 0)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Get user chat rooms error:', error)
      return { data: [], error }
    }
  }
}

export default chatService 