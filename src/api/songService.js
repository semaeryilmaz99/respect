import api from '../utils/axios'

// Song service
const songService = {
  // Get song by ID
  getSongById: async (songId) => {
    const response = await api.get(`/songs/${songId}`)
    return response
  },

  // Get song's top supporters
  getSongTopSupporters: async (songId, timeframe = 'all') => {
    const response = await api.get(`/songs/${songId}/supporters?timeframe=${timeframe}`)
    return response
  },

  // Get song's recent supporters
  getSongRecentSupporters: async (songId, limit = 10) => {
    const response = await api.get(`/songs/${songId}/recent-supporters?limit=${limit}`)
    return response
  },

  // Get song's chat messages
  getSongChat: async (songId, page = 1, limit = 50) => {
    const response = await api.get(`/songs/${songId}/chat?page=${page}&limit=${limit}`)
    return response
  },

  // Send message to song chat
  sendSongMessage: async (songId, message) => {
    const response = await api.post(`/songs/${songId}/chat`, {
      message
    })
    return response
  },

  // Like/unlike song
  toggleLikeSong: async (songId) => {
    const response = await api.post(`/songs/${songId}/like`)
    return response
  },

  // Add song to playlist
  addToPlaylist: async (songId, playlistId) => {
    const response = await api.post(`/songs/${songId}/add-to-playlist`, {
      playlistId
    })
    return response
  },

  // Search songs
  searchSongs: async (query, page = 1, limit = 20) => {
    const response = await api.get(`/songs/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)
    return response
  },

  // Get all songs (discover)
  getAllSongs: async (page = 1, limit = 20, sortBy = 'respect') => {
    const response = await api.get(`/songs?page=${page}&limit=${limit}&sort=${sortBy}`)
    return response
  },

  // Get song statistics
  getSongStats: async (songId) => {
    const response = await api.get(`/songs/${songId}/stats`)
    return response
  },

  // Get similar songs
  getSimilarSongs: async (songId, limit = 10) => {
    const response = await api.get(`/songs/${songId}/similar?limit=${limit}`)
    return response
  },

  // Report song
  reportSong: async (songId, reason) => {
    const response = await api.post(`/songs/${songId}/report`, {
      reason
    })
    return response
  },

  // Get song lyrics
  getSongLyrics: async (songId) => {
    const response = await api.get(`/songs/${songId}/lyrics`)
    return response
  }
}

export default songService 