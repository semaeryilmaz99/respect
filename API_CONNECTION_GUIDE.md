# API Endpoint Bağlantı Rehberi

## 1. Environment Variables Ayarlama

Proje kök dizininde `.env` dosyası oluşturun:

```bash
# API Configuration
VITE_API_BASE_URL=https://ghbsezysczrzqezoanav.supabase.co/rest/v1
VITE_SUPABASE_URL=https://ghbsezysczrzqezoanav.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc

# Development
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=info
```

## 2. API Servislerini Kullanma

### 2.1 Import API Servisleri

```javascript
import { 
  authService, 
  feedService, 
  artistService, 
  songService, 
  userService, 
  respectService 
} from '../api'
```

### 2.2 Hook'ları Import Etme

```javascript
import { useApi, useMutation, usePaginatedApi } from '../hooks/useApi'
```

## 3. API Kullanım Örnekleri

### 3.1 Basit GET İsteği (useApi)

```javascript
const MyComponent = () => {
  const { data, loading, error, execute } = useApi(
    () => artistService.getArtists(),
    [], // dependencies
    true // immediate = true (component mount olduğunda çalışsın)
  )

  if (loading) return <div>Yükleniyor...</div>
  if (error) return <div>Hata: {error.message}</div>

  return (
    <div>
      {data?.map(artist => (
        <div key={artist.id}>{artist.name}</div>
      ))}
    </div>
  )
}
```

### 3.2 Pagination ile GET İsteği (usePaginatedApi)

```javascript
const FeedComponent = () => {
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
      <button onClick={refresh}>Yenile</button>
      
      {posts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
      
      {hasMore && (
        <button onClick={loadMore}>
          Daha Fazla Yükle
        </button>
      )}
    </div>
  )
}
```

### 3.3 POST/PUT/DELETE İsteği (useMutation)

```javascript
const CreatePostComponent = () => {
  const { mutate, loading, error } = useMutation(
    (postData) => feedService.createPost(postData)
  )

  const handleSubmit = async (formData) => {
    try {
      await mutate(formData)
      console.log('Post oluşturuldu!')
    } catch (err) {
      console.error('Hata:', err)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={loading}>
        {loading ? 'Oluşturuluyor...' : 'Oluştur'}
      </button>
    </form>
  )
}
```

## 4. Authentication (Kimlik Doğrulama)

### 4.1 Giriş Yapma

```javascript
const LoginComponent = () => {
  const { mutate: login, loading } = useMutation(
    (credentials) => authService.login(credentials)
  )

  const handleLogin = async (email, password) => {
    try {
      const result = await login({ email, password })
      console.log('Giriş başarılı:', result)
      // Kullanıcıyı yönlendir
    } catch (err) {
      console.error('Giriş hatası:', err)
    }
  }
}
```

### 4.2 Kullanıcı Durumunu Kontrol Etme

```javascript
const ProtectedComponent = () => {
  const isAuthenticated = authService.isAuthenticated()
  const user = authService.getStoredUser()

  if (!isAuthenticated) {
    return <div>Lütfen giriş yapın</div>
  }

  return <div>Hoş geldiniz, {user.name}</div>
}
```

## 5. Error Handling (Hata Yönetimi)

### 5.1 Global Error Handling

```javascript
// src/utils/axios.js dosyasında zaten yapılandırılmış
// Otomatik olarak hataları yakalar ve kullanıcı dostu mesajlar gösterir
```

### 5.2 Component Seviyesinde Error Handling

```javascript
const MyComponent = () => {
  const { data, loading, error } = useApi(
    () => someApiCall()
  )

  if (error) {
    return (
      <div className="error-container">
        <h3>Bir hata oluştu</h3>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>
          Sayfayı Yenile
        </button>
      </div>
    )
  }

  // Normal component içeriği
}
```

## 6. Loading States (Yükleme Durumları)

### 6.1 Loading Spinner

```javascript
import LoadingSpinner from '../components/LoadingSpinner'

const MyComponent = () => {
  const { data, loading } = useApi(() => someApiCall())

  if (loading) {
    return <LoadingSpinner />
  }

  return <div>{/* Component içeriği */}</div>
}
```

### 6.2 Skeleton Loading

```javascript
import SkeletonLoader from '../components/SkeletonLoader'

const MyComponent = () => {
  const { data, loading } = useApi(() => someApiCall())

  if (loading) {
    return <SkeletonLoader count={5} />
  }

  return <div>{/* Component içeriği */}</div>
}
```

## 7. Real-time Updates (Gerçek Zamanlı Güncellemeler)

### 7.1 WebSocket Bağlantısı

```javascript
import { useEffect } from 'react'
import { realtimeFeed } from '../utils/realtimeFeed'

const FeedComponent = () => {
  const { data, loading, refresh } = useApi(() => feedService.getFeed())

  useEffect(() => {
    // Real-time feed güncellemelerini dinle
    const unsubscribe = realtimeFeed.subscribe((newPost) => {
      // Yeni post geldiğinde listeyi güncelle
      refresh()
    })

    return () => unsubscribe()
  }, [])

  return <div>{/* Feed içeriği */}</div>
}
```

## 8. File Upload (Dosya Yükleme)

### 8.1 Resim Yükleme

```javascript
const ImageUploadComponent = () => {
  const { mutate: uploadImage, loading } = useMutation(
    (file) => userService.uploadProfileImage(file)
  )

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      try {
        const result = await uploadImage(file)
        console.log('Resim yüklendi:', result.url)
      } catch (err) {
        console.error('Yükleme hatası:', err)
      }
    }
  }

  return (
    <input 
      type="file" 
      accept="image/*" 
      onChange={handleFileUpload}
      disabled={loading}
    />
  )
}
```

## 9. Best Practices (En İyi Uygulamalar)

### 9.1 Dependency Array Kullanımı

```javascript
// Doğru kullanım
const { data } = useApi(
  () => userService.getUser(userId),
  [userId], // userId değiştiğinde API çağrısı yeniden yapılır
  true
)

// Yanlış kullanım
const { data } = useApi(
  () => userService.getUser(userId),
  [], // userId değişse bile API çağrısı yeniden yapılmaz
  true
)
```

### 9.2 Error Boundary Kullanımı

```javascript
import ErrorBoundary from '../components/ErrorBoundary'

const App = () => {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  )
}
```

### 9.3 Optimistic Updates

```javascript
const LikeComponent = () => {
  const { data, mutate } = useMutation(
    (postId) => feedService.likePost(postId)
  )

  const handleLike = async (postId) => {
    // Optimistic update - UI'ı hemen güncelle
    const optimisticData = { ...data, likes: data.likes + 1 }
    
    try {
      await mutate(postId)
    } catch (err) {
      // Hata durumunda eski haline geri döndür
      console.error('Like hatası:', err)
    }
  }
}
```

## 10. Debugging (Hata Ayıklama)

### 10.1 Debug Mode Aktifleştirme

```bash
# .env dosyasında
VITE_DEBUG_MODE=true
```

### 10.2 Console Logları

Debug mode aktifken tüm API istekleri ve yanıtları console'da görünür:

```
🚀 API Request: GET /artists
✅ API Response: GET /artists { data: [...] }
❌ API Error: POST /login { message: "Invalid credentials" }
```

## 11. Performance Optimization (Performans Optimizasyonu)

### 11.1 Memoization

```javascript
import { useMemo } from 'react'

const MyComponent = () => {
  const { data } = useApi(() => someApiCall())
  
  const processedData = useMemo(() => {
    return data?.map(item => ({
      ...item,
      processed: true
    }))
  }, [data])

  return <div>{/* processedData kullan */}</div>
}
```

### 11.2 Debouncing

```javascript
import { useDebounce } from 'react-use'

const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500)

  const { data } = useApi(
    () => searchService.search(debouncedSearchTerm),
    [debouncedSearchTerm],
    false
  )

  return (
    <input 
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Ara..."
    />
  )
}
```

Bu rehber ile API endpoint'lerinizi başarıyla bağlayabilir ve kullanabilirsiniz! 