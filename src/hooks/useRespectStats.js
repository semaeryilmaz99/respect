import { useState, useEffect, useRef } from 'react'
import respectStatsService from '../api/respectStatsService'
import { supabase } from '../config/supabase'

// Custom hook for real-time respect statistics
export const useRespectStats = (userId) => {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const subscriptionRef = useRef(null)

  // Fetch initial data
  const fetchInitialData = async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await respectStatsService.getUserRespectStats(userId)
      
      if (fetchError) {
        setError(fetchError)
      } else {
        setStats(data)
      }
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Set up real-time subscription
  useEffect(() => {
    fetchInitialData()
  }, [userId])

  useEffect(() => {
    if (!userId) {
      return
    }

    // Subscribe to real-time updates
    const subscribeToUpdates = async () => {
      try {
        console.log('🔔 Setting up real-time subscription for user:', userId)
        
        subscriptionRef.current = supabase
          .channel(`respect-stats-${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${userId}`
            },
            (payload) => {
              console.log('📊 Real-time respect stats update:', payload.new)
              
              // Calculate total activity
              const totalRespectActivity = (payload.new.total_respect_sent || 0) + (payload.new.total_respect_received || 0)
              
              const updatedStats = {
                ...payload.new,
                total_respect_activity: totalRespectActivity
              }
              
              // Update local state
              setStats(updatedStats)
            }
          )
          .subscribe((status) => {
            console.log('🔔 Subscription status:', status)
          })

      } catch (error) {
        console.error('❌ Error setting up real-time subscription:', error)
        setError(error)
      }
    }

    subscribeToUpdates()

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        console.log('🔔 Cleaning up real-time subscription for user:', userId)
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [userId])

  // Manual refresh function
  const refreshStats = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data, error } = await respectStatsService.getUserRespectStats(userId)
      
      if (error) {
        setError(error)
      } else {
        setStats(data)
      }
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Refetch function
  const refetch = () => {
    fetchInitialData()
  }

  return {
    stats,
    isLoading,
    error,
    refreshStats,
    refetch,
    // Convenience getters
    respectBalance: stats?.respect_balance || 0,
    totalRespectSent: stats?.total_respect_sent || 0,
    totalRespectReceived: stats?.total_respect_received || 0,
    totalRespectActivity: stats?.total_respect_activity || 0
  }
}

// Hook for multiple users' respect stats
export const useMultipleRespectStats = (userIds) => {
  const [statsMap, setStatsMap] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const subscriptionRefs = useRef({})
  const queryClient = useQueryClient()

  // Query key for React Query
  const queryKey = ['multipleRespectStats', userIds]

  // Fetch initial data
  const { data: initialData, error: queryError } = useQuery({
    queryKey,
    queryFn: () => respectStatsService.getMultipleUserRespectStats(userIds),
    enabled: !!userIds && userIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  })

  // Set up real-time subscriptions for all users
  useEffect(() => {
    if (!userIds || userIds.length === 0) {
      setIsLoading(false)
      return
    }

    // Set initial data
    if (initialData?.data) {
      const statsMap = {}
      initialData.data.forEach(userStats => {
        statsMap[userStats.id] = userStats
      })
      setStatsMap(statsMap)
      setIsLoading(false)
    }

    if (queryError) {
      setError(queryError)
      setIsLoading(false)
    }

    // Subscribe to real-time updates for each user
    const subscribeToUpdates = async () => {
      try {
        console.log('🔔 Setting up real-time subscriptions for users:', userIds)
        
        userIds.forEach(userId => {
          if (subscriptionRefs.current[userId]) {
            // Already subscribed
            return
          }

          subscriptionRefs.current[userId] = supabase
            .channel(`respect-stats-${userId}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${userId}`
              },
              (payload) => {
                console.log('📊 Real-time respect stats update for user:', userId, payload.new)
                
                // Calculate total activity
                const totalRespectActivity = (payload.new.total_respect_sent || 0) + (payload.new.total_respect_received || 0)
                
                const updatedStats = {
                  ...payload.new,
                  total_respect_activity: totalRespectActivity
                }
                
                // Update local state
                setStatsMap(prev => ({
                  ...prev,
                  [userId]: updatedStats
                }))
                
                // Update React Query cache
                queryClient.setQueryData(queryKey, (oldData) => {
                  if (!oldData?.data) return oldData
                  
                  const updatedData = oldData.data.map(user => 
                    user.id === userId ? updatedStats : user
                  )
                  
                  return { data: updatedData, error: null }
                })
              }
            )
            .subscribe((status) => {
              console.log(`🔔 Subscription status for user ${userId}:`, status)
            })
        })

      } catch (error) {
        console.error('❌ Error setting up real-time subscriptions:', error)
        setError(error)
      }
    }

    subscribeToUpdates()

    // Cleanup subscriptions on unmount
    return () => {
      Object.keys(subscriptionRefs.current).forEach(userId => {
        console.log('🔔 Cleaning up real-time subscription for user:', userId)
        subscriptionRefs.current[userId].unsubscribe()
      })
      subscriptionRefs.current = {}
    }
  }, [userIds, initialData, queryError, queryClient, queryKey])

  return {
    statsMap,
    isLoading,
    error,
    // Get stats for a specific user
    getUserStats: (userId) => statsMap[userId] || null,
    // Get all stats as array
    getAllStats: () => Object.values(statsMap)
  }
} 