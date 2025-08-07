import { useState, useEffect, useCallback } from 'react'

export const useApi = (apiFunction, dependencies = [], immediate = true) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiFunction(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFunction])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, dependencies)

  const reset = () => {
    setData(null)
    setError(null)
    setLoading(false)
  }

  return {
    data,
    loading,
    error,
    execute,
    reset
  }
}

// Hook for pagination
export const usePaginatedApi = (apiFunction, initialPage = 1, limit = 20) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(initialPage)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const loadData = useCallback(async (pageNumber = page, reset = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await apiFunction(pageNumber, limit)
      
      if (reset) {
        setData(result.data || result)
      } else {
        setData(prevData => [...prevData, ...(result.data || result)])
      }
      
      setTotalCount(result.total || result.length)
      setHasMore(result.hasMore !== undefined ? result.hasMore : (result.data?.length || result.length) === limit)
      setPage(pageNumber)
      
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFunction, page, limit])

  const loadMore = () => {
    if (!loading && hasMore) {
      loadData(page + 1)
    }
  }

  const refresh = () => {
    setData([])
    setPage(initialPage)
    setHasMore(true)
    loadData(initialPage, true)
  }

  useEffect(() => {
    loadData(initialPage, true)
  }, [])

  return {
    data,
    loading,
    error,
    page,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    loadData
  }
}

// Hook for mutations (POST, PUT, DELETE)
export const useMutation = (mutationFunction) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const mutate = useCallback(async (...args) => {
    try {
      setLoading(true)
      setError(null)
      const result = await mutationFunction(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [mutationFunction])

  const reset = () => {
    setData(null)
    setError(null)
    setLoading(false)
  }

  return {
    mutate,
    data,
    loading,
    error,
    reset
  }
} 