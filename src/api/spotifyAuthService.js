import { supabase } from '../config/supabase'
import spotifyService from './spotifyService'

class SpotifyAuthService {
  // Spotify ile kayıt olma
  async signUpWithSpotify(authCode) {
    try {
      console.log('🎵 Spotify ile kayıt olma başladı')
      
      // 1. Authorization code ile token al
      const tokens = await spotifyService.getTokens(authCode)
      console.log('✅ Spotify token alındı')
      
      // 2. Spotify'dan kullanıcı bilgilerini al
      const userProfile = await spotifyService.getUserProfile(tokens.accessToken)
      console.log('✅ Spotify kullanıcı profili alındı:', userProfile)
      
      // 3. Kullanıcı zaten var mı kontrol et
      const existingUser = await this.checkUserExists(userProfile.id)
      
      if (existingUser.exists) {
        console.log('✅ Kullanıcı zaten mevcut, giriş yapılıyor')
        return await this.signInWithSpotify(userProfile.id, tokens, userProfile)
      }
      
      // 4. Yeni kullanıcı oluştur
      console.log('🆕 Yeni kullanıcı oluşturuluyor')
      await this.createNewUser(userProfile, tokens)
      
      // 5. Supabase auth session oluştur
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userProfile.email,
        password: this.generateSpotifyPassword(userProfile.id)
      })
      
      if (authError) {
        console.error('❌ Auth session oluşturma hatası:', authError)
        throw new Error('Oturum oluşturulamadı')
      }
      
      console.log('✅ Yeni kullanıcı başarıyla oluşturuldu ve giriş yapıldı')
      return {
        success: true,
        user: authData.user,
        session: authData.session,
        isNewUser: true
      }
      
    } catch (error) {
      console.error('❌ Spotify ile kayıt olma hatası:', error)
      throw error
    }
  }

  // Spotify ile giriş yapma
  async signInWithSpotify(spotifyUserId, tokens, userProfile) {
    try {
      console.log('🎵 Spotify ile giriş yapılıyor')
      
      // 1. Kullanıcı bilgilerini güncelle
      await this.updateUserInfo(spotifyUserId, tokens, userProfile)
      
      // 2. Supabase auth session oluştur
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userProfile.email,
        password: this.generateSpotifyPassword(spotifyUserId)
      })
      
      if (authError) {
        console.error('❌ Auth session oluşturma hatası:', authError)
        throw new Error('Giriş yapılamadı')
      }
      
      console.log('✅ Spotify ile giriş başarılı')
      return {
        success: true,
        user: authData.user,
        session: authData.session,
        isNewUser: false
      }
      
    } catch (error) {
      console.error('❌ Spotify ile giriş hatası:', error)
      throw error
    }
  }

  // Kullanıcı var mı kontrol et
  async checkUserExists(spotifyUserId) {
    try {
      const { data, error } = await supabase
        .rpc('check_spotify_user_exists', { spotify_user_id_param: spotifyUserId })
      
      if (error) {
        console.error('❌ Kullanıcı kontrol hatası:', error)
        throw error
      }
      
      return data[0] || { user_exists: false, user_id: null, email: null }
    } catch (error) {
      console.error('❌ Kullanıcı kontrol hatası:', error)
      return { exists: false, user_id: null, email: null }
    }
  }

  // Yeni kullanıcı oluştur
  async createNewUser(userProfile, tokens) {
    try {
      const { data, error } = await supabase
        .rpc('create_user_from_spotify', {
          spotify_user_id_param: userProfile.id,
          spotify_email_param: userProfile.email,
          spotify_display_name_param: userProfile.display_name,
          spotify_country_param: userProfile.country,
          spotify_product_param: userProfile.product,
          spotify_images_param: userProfile.images,
          access_token_param: tokens.accessToken,
          refresh_token_param: tokens.refreshToken,
          token_expires_at_param: new Date(Date.now() + tokens.expiresIn * 1000).toISOString()
        })
      
      if (error) {
        console.error('❌ Yeni kullanıcı oluşturma hatası:', error)
        throw error
      }
      
      console.log('✅ Yeni kullanıcı oluşturuldu:', data)
      return data
    } catch (error) {
      console.error('❌ Yeni kullanıcı oluşturma hatası:', error)
      throw error
    }
  }

  // Kullanıcı bilgilerini güncelle
  async updateUserInfo(spotifyUserId, tokens, userProfile) {
    try {
      const { data, error } = await supabase
        .rpc('update_spotify_user_info', {
          user_id_param: spotifyUserId,
          spotify_email_param: userProfile.email,
          spotify_display_name_param: userProfile.display_name,
          spotify_country_param: userProfile.country,
          spotify_product_param: userProfile.product,
          spotify_images_param: userProfile.images,
          access_token_param: tokens.accessToken,
          refresh_token_param: tokens.refreshToken,
          token_expires_at_param: new Date(Date.now() + tokens.expiresIn * 1000).toISOString()
        })
      
      if (error) {
        console.error('❌ Kullanıcı bilgileri güncelleme hatası:', error)
        throw error
      }
      
      console.log('✅ Kullanıcı bilgileri güncellendi')
      return data
    } catch (error) {
      console.error('❌ Kullanıcı bilgileri güncelleme hatası:', error)
      throw error
    }
  }

  // Spotify password oluştur (güvenlik için)
  generateSpotifyPassword(spotifyUserId) {
    // Spotify user ID'den hash oluştur
    const hash = btoa(spotifyUserId + 'RESPECT_APP_SECRET')
    return hash.substring(0, 20) // 20 karakter ile sınırla
  }

  // Spotify bağlantısını kontrol et
  async checkSpotifyConnection() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { connected: false, profile: null }
      }
      
      const { data, error } = await supabase
        .from('spotify_connections')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (error || !data) {
        return { connected: false, profile: null }
      }
      
      return { 
        connected: true, 
        profile: data,
        expiresAt: data.token_expires_at
      }
    } catch (error) {
      console.error('❌ Spotify bağlantı kontrol hatası:', error)
      return { connected: false, profile: null }
    }
  }

  // Spotify bağlantısını yenile
  async refreshSpotifyConnection() {
    try {
      const connection = await this.checkSpotifyConnection()
      
      if (!connection.connected) {
        throw new Error('Spotify bağlantısı bulunamadı')
      }
      
      // Token'ı yenile
      const newTokens = await spotifyService.refreshTokens(connection.profile.refresh_token)
      
      // Yeni token'ı güncelle
      const { error } = await supabase
        .from('spotify_connections')
        .update({
          access_token: newTokens.accessToken,
          token_expires_at: new Date(Date.now() + newTokens.expiresIn * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', connection.profile.user_id)
      
      if (error) {
        throw error
      }
      
      console.log('✅ Spotify bağlantısı yenilendi')
      return true
    } catch (error) {
      console.error('❌ Spotify bağlantısı yenileme hatası:', error)
      throw error
    }
  }
}

export default new SpotifyAuthService()