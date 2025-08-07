import api from '../utils/axios'

// Artist service
const artistService = {
  // Get artist by ID
  getArtistById: async (artistId) => {
    const response = await api.get(`/artists/${artistId}`)
    return response
  },

  // Get artist's songs
  getArtistSongs: async (artistId, page = 1, limit = 20) => {
    const response = await api.get(`/artists/${artistId}/songs?page=${page}&limit=${limit}`)
    return response
  },

  // Get artist's top supporters
  getArtistTopSupporters: async (artistId, timeframe = 'all') => {
    const response = await api.get(`/artists/${artistId}/supporters?timeframe=${timeframe}`)
    return response
  },

  // Get artist's recent supporters
  getArtistRecentSupporters: async (artistId, limit = 10) => {
    const response = await api.get(`/artists/${artistId}/recent-supporters?limit=${limit}`)
    return response
  },

  // Follow/unfollow artist
  toggleFollowArtist: async (artistId) => {
    const response = await api.post(`/artists/${artistId}/follow`)
    return response
  },

  // Get artist's chat messages
  getArtistChat: async (artistId, page = 1, limit = 50) => {
    const response = await api.get(`/artists/${artistId}/chat?page=${page}&limit=${limit}`)
    return response
  },

  // Send message to artist chat
  sendArtistMessage: async (artistId, message) => {
    const response = await api.post(`/artists/${artistId}/chat`, {
      message
    })
    return response
  },

  // Search artists
  searchArtists: async (query, page = 1, limit = 20) => {
    const response = await api.get(`/artists/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)
    return response
  },

  // Get all artists (discover)
  getAllArtists: async (page = 1, limit = 20, sortBy = 'respect') => {
    const response = await api.get(`/artists?page=${page}&limit=${limit}&sort=${sortBy}`)
    return response
  },

  // Get artist statistics
  getArtistStats: async (artistId) => {
    const response = await api.get(`/artists/${artistId}/stats`)
    return response
  },

  // Get similar artists
  getSimilarArtists: async (artistId, limit = 10) => {
    const response = await api.get(`/artists/${artistId}/similar?limit=${limit}`)
    return response
  }
}

export default artistService 