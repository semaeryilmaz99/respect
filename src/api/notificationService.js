import { supabase } from '../config/supabase'

const notificationService = {
  // Kullanıcının bildirimlerini getir
  getNotifications: async (page = 1, limit = 20, unreadOnly = false) => {
    try {
      console.log('🔔 Getting notifications')
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (unreadOnly) {
        query = query.eq('is_read', false)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      console.log('✅ Notifications fetched:', data?.length || 0)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Get notifications error:', error)
      return { data: [], error }
    }
  },

  // Bildirimi okundu olarak işaretle
  markAsRead: async (notificationId) => {
    try {
      console.log('✅ Marking notification as read:', notificationId)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      console.log('✅ Notification marked as read:', data)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Mark as read error:', error)
      return { data: null, error }
    }
  },

  // Tüm bildirimleri okundu olarak işaretle
  markAllAsRead: async () => {
    try {
      console.log('✅ Marking all notifications as read')
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .select()

      if (error) {
        throw error
      }

      console.log('✅ All notifications marked as read:', data?.length || 0)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Mark all as read error:', error)
      return { data: null, error }
    }
  },

  // Okunmamış bildirim sayısını getir
  getUnreadCount: async () => {
    try {
      console.log('🔔 Getting unread notification count')
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        throw error
      }

      console.log('✅ Unread count:', count)
      return { data: count || 0, error: null }
    } catch (error) {
      console.error('❌ Get unread count error:', error)
      return { data: 0, error }
    }
  },

  // Bildirim oluştur (sistem tarafından)
  createNotification: async (userId, type, title, message, data = null) => {
    try {
      console.log('🔔 Creating notification for user:', userId, 'type:', type)
      
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      console.log('✅ Notification created:', notification)
      return { data: notification, error: null }
    } catch (error) {
      console.error('❌ Create notification error:', error)
      return { data: null, error }
    }
  },

  // Bildirim sil
  deleteNotification: async (notificationId) => {
    try {
      console.log('🗑️ Deleting notification:', notificationId)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      console.log('✅ Notification deleted:', data)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Delete notification error:', error)
      return { data: null, error }
    }
  }
}

export default notificationService 