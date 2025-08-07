import config from '../config/environment'

class WebSocketManager {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 1000
    this.isConnecting = false
    this.listeners = new Map()
    this.messageQueue = []
    this.heartbeatInterval = null
    this.heartbeatTimeout = null
  }

  // Connect to WebSocket server
  connect(token) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return Promise.resolve()
    }

    this.isConnecting = true

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${config.WEBSOCKET_URL}?token=${token}`
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('🔌 WebSocket connected')
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.processMessageQueue()
          this.emit('connected')
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.handleMessage(data)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason)
          this.isConnecting = false
          this.stopHeartbeat()
          this.emit('disconnected', { code: event.code, reason: event.reason })
          
          // Attempt to reconnect if not intentionally closed
          if (event.code !== 1000) {
            this.scheduleReconnect(token)
          }
        }

        this.ws.onerror = (error) => {
          console.error('🔌 WebSocket error:', error)
          this.isConnecting = false
          this.emit('error', error)
          reject(error)
        }

        // Connection timeout
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false
            reject(new Error('WebSocket connection timeout'))
          }
        }, config.WEBSOCKET_TIMEOUT)

      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  // Disconnect from WebSocket
  disconnect() {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    this.reconnectAttempts = 0
  }

  // Send message
  send(type, data = {}) {
    const message = {
      type,
      data,
      timestamp: Date.now(),
      id: this.generateMessageId()
    }

    if (this.isConnected()) {
      this.ws.send(JSON.stringify(message))
      if (config.DEBUG_MODE) {
        console.log('📤 WebSocket sent:', message)
      }
    } else {
      // Queue message for later
      this.messageQueue.push(message)
      console.warn('WebSocket not connected, message queued:', message)
    }
  }

  // Check if connected
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // Emit event to listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error)
        }
      })
    }
  }

  // Handle incoming messages
  handleMessage(message) {
    if (config.DEBUG_MODE) {
      console.log('📥 WebSocket received:', message)
    }

    const { type, data } = message

    // Handle system messages
    switch (type) {
      case 'ping':
        this.send('pong')
        break
      case 'pong':
        this.resetHeartbeatTimeout()
        break
      default:
        this.emit(type, data)
        this.emit('message', message)
    }
  }

  // Schedule reconnection
  scheduleReconnect(token) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.emit('maxReconnectAttemptsReached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      if (!this.isConnected()) {
        this.connect(token).catch(error => {
          console.error('Reconnection failed:', error)
        })
      }
    }, delay)
  }

  // Process queued messages
  processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift()
      this.ws.send(JSON.stringify(message))
    }
  }

  // Start heartbeat
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send('ping')
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('Heartbeat timeout, closing connection')
          this.ws.close()
        }, 5000)
      }
    }, 30000) // Send ping every 30 seconds
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout)
      this.heartbeatTimeout = null
    }
  }

  // Reset heartbeat timeout
  resetHeartbeatTimeout() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout)
      this.heartbeatTimeout = null
    }
  }

  // Generate unique message ID
  generateMessageId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // WebSocket-specific methods for the app

  // Join a room (artist page, song page, etc.)
  joinRoom(roomId, roomType = 'general') {
    this.send('join_room', { roomId, roomType })
  }

  // Leave a room
  leaveRoom(roomId) {
    this.send('leave_room', { roomId })
  }

  // Send chat message
  sendMessage(roomId, message, messageType = 'text') {
    this.send('message', {
      roomId,
      message,
      messageType,
      timestamp: Date.now()
    })
  }

  // Send respect notification
  sendRespectNotification(recipientId, amount, itemId, itemType) {
    this.send('respect_sent', {
      recipientId,
      amount,
      itemId,
      itemType,
      timestamp: Date.now()
    })
  }

  // Update user presence
  updatePresence(status = 'online') {
    this.send('presence_update', { status })
  }

  // Send typing indicator
  sendTyping(roomId, isTyping = true) {
    this.send('typing', { roomId, isTyping })
  }
}

// Create singleton instance
const wsManager = new WebSocketManager()

export default wsManager 