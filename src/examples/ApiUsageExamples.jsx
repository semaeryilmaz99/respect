import React from 'react'
import { useApi, useMutation, usePaginatedApi } from '../hooks/useApi'
import { 
  authService, 
  feedService, 
  artistService, 
  songService, 
  userService, 
  respectService 
} from '../api'

// 1. Basit API Kullanımı - useApi Hook ile
const LoginExample = () => {
  const { data, loading, error, execute } = useApi(
    () => authService.login({ email: 'test@example.com', password: 'password' }),
    [], // dependencies
    false // immediate = false (otomatik çalışmasın)
  )

  const handleLogin = async () => {
    try {
      await execute()
      console.log('Giriş başarılı:', data)
    } catch (err) {
      console.error('Giriş hatası:', err)
    }
  }

  return (
    <div>
      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </button>
      {error && <p style={{color: 'red'}}>Hata: {error.message}</p>}
      {data && <p>Hoş geldiniz, {data.user?.email}</p>}
    </div>
  )
}

// 2. Pagination ile API Kullanımı - usePaginatedApi Hook ile
const FeedExample = () => {
  const { 
    data: posts, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    refresh 
  } = usePaginatedApi(
    (page, limit) => feedService.getFeed(page, limit),
    [], // dependencies
    20 // limit
  )

  return (
    <div>
      <button onClick={refresh} disabled={loading}>
        Yenile
      </button>
      
      {posts.map(post => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
        </div>
      ))}
      
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
        </button>
      )}
      
      {error && <p style={{color: 'red'}}>Hata: {error.message}</p>}
    </div>
  )
}

// 3. Mutation (POST/PUT/DELETE) Kullanımı - useMutation Hook ile
const CreatePostExample = () => {
  const { mutate, loading, error, data } = useMutation(
    (postData) => feedService.createPost(postData)
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    try {
      const result = await mutate({
        title: formData.get('title'),
        content: formData.get('content'),
        image: formData.get('image')
      })
      console.log('Post oluşturuldu:', result)
    } catch (err) {
      console.error('Post oluşturma hatası:', err)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Başlık" required />
      <textarea name="content" placeholder="İçerik" required />
      <input type="file" name="image" accept="image/*" />
      <button type="submit" disabled={loading}>
        {loading ? 'Oluşturuluyor...' : 'Post Oluştur'}
      </button>
      {error && <p style={{color: 'red'}}>Hata: {error.message}</p>}
      {data && <p style={{color: 'green'}}>Post başarıyla oluşturuldu!</p>}
    </form>
  )
}

// 4. Artist Service Kullanımı
const ArtistExample = () => {
  const { data: artists, loading, error, execute } = useApi(
    () => artistService.getArtists(),
    [],
    true // immediate = true (component mount olduğunda otomatik çalışsın)
  )

  const { mutate: followArtist } = useMutation(
    (artistId) => artistService.followArtist(artistId)
  )

  const handleFollow = async (artistId) => {
    try {
      await followArtist(artistId)
      console.log('Artist takip edildi')
      // Listeyi yenile
      execute()
    } catch (err) {
      console.error('Takip hatası:', err)
    }
  }

  if (loading) return <div>Yükleniyor...</div>
  if (error) return <div>Hata: {error.message}</div>

  return (
    <div>
      <h2>Sanatçılar</h2>
      {artists?.map(artist => (
        <div key={artist.id}>
          <h3>{artist.name}</h3>
          <p>{artist.bio}</p>
          <button onClick={() => handleFollow(artist.id)}>
            Takip Et
          </button>
        </div>
      ))}
    </div>
  )
}

// 5. Song Service Kullanımı
const SongExample = () => {
  const { data: songs, loading, error } = useApi(
    () => songService.getSongs(),
    [],
    true
  )

  const { mutate: sendRespect } = useMutation(
    ({ songId, amount }) => respectService.sendRespect(songId, amount)
  )

  const handleSendRespect = async (songId, amount) => {
    try {
      await sendRespect({ songId, amount })
      console.log('Respect gönderildi')
    } catch (err) {
      console.error('Respect gönderme hatası:', err)
    }
  }

  if (loading) return <div>Yükleniyor...</div>
  if (error) return <div>Hata: {error.message}</div>

  return (
    <div>
      <h2>Şarkılar</h2>
      {songs?.map(song => (
        <div key={song.id}>
          <h3>{song.title}</h3>
          <p>{song.artist}</p>
          <button onClick={() => handleSendRespect(song.id, 10)}>
            Respect Gönder (10)
          </button>
        </div>
      ))}
    </div>
  )
}

// 6. User Service Kullanımı
const UserProfileExample = () => {
  const { data: user, loading, error } = useApi(
    () => userService.getCurrentUser(),
    [],
    true
  )

  const { mutate: updateProfile } = useMutation(
    (profileData) => userService.updateProfile(profileData)
  )

  const handleUpdateProfile = async (profileData) => {
    try {
      await updateProfile(profileData)
      console.log('Profil güncellendi')
    } catch (err) {
      console.error('Profil güncelleme hatası:', err)
    }
  }

  if (loading) return <div>Yükleniyor...</div>
  if (error) return <div>Hata: {error.message}</div>

  return (
    <div>
      <h2>Profil</h2>
      {user && (
        <div>
          <p>Ad: {user.full_name}</p>
          <p>Email: {user.email}</p>
          <p>Respect Bakiyesi: {user.respect_balance}</p>
        </div>
      )}
    </div>
  )
}

export {
  LoginExample,
  FeedExample,
  CreatePostExample,
  ArtistExample,
  SongExample,
  UserProfileExample
} 