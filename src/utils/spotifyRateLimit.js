// Spotify API Rate Limiting Utility

class SpotifyRateLimiter {
  constructor() {
    this.requestMap = new Map();
    this.lastResetTime = Date.now();
  }

  // Rate limit kontrolü
  async checkRateLimit(endpoint, userId = 'default') {
    const key = `${endpoint}_${userId}`;
    const now = Date.now();
    
    // Son istek zamanını kontrol et
    const lastRequest = this.requestMap.get(key);
    
    if (lastRequest) {
      const timeSinceLastRequest = now - lastRequest;
      
      // Spotify API rate limits:
      // - 100 requests per 100 seconds for most endpoints
      // - 1000 requests per 100 seconds for search endpoints
      const minInterval = endpoint.includes('search') ? 100 : 1000; // ms
      
      if (timeSinceLastRequest < minInterval) {
        const waitTime = minInterval - timeSinceLastRequest;
        console.log(`⏳ Rate limiting: Waiting ${waitTime}ms before ${endpoint} request`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // İstek zamanını kaydet
    this.requestMap.set(key, Date.now());
    
    // Map'i temizle (memory leak önlemek için)
    if (this.requestMap.size > 1000) {
      const oldestKey = this.requestMap.keys().next().value;
      this.requestMap.delete(oldestKey);
    }
  }

  // Rate limited fetch wrapper
  async rateLimitedFetch(url, options = {}, userId = 'default') {
    const endpoint = new URL(url).pathname;
    await this.checkRateLimit(endpoint, userId);
    
    const response = await fetch(url, options);
    
    // Rate limit headers'ı kontrol et
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    
    if (remaining === '0' || response.status === 429) {
      console.warn('⚠️ Spotify API rate limit reached, waiting...');
      const resetTime = reset ? parseInt(reset) * 1000 : Date.now() + 60000;
      const waitTime = Math.max(0, resetTime - Date.now());
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    return response;
  }

  // Batch request için rate limiting
  async batchRequest(requests, userId = 'default') {
    const results = [];
    
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      await this.checkRateLimit(request.endpoint, userId);
      
      try {
        const response = await fetch(request.url, request.options);
        results.push({ success: true, data: await response.json() });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
      
      // Batch request'ler arasında kısa bekleme
      if (i < requests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
}

// Singleton instance
const spotifyRateLimiter = new SpotifyRateLimiter();

export default spotifyRateLimiter;
