// SEO utilities for better search engine optimization
export const seoUtils = {
  // Update page title
  setTitle: (title) => {
    document.title = title ? `${title} - Respect` : 'Respect - Müzik Sanatçılarını Destekle'
  },

  // Update meta description
  setDescription: (description) => {
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', description)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = description
      document.head.appendChild(meta)
    }
  },

  // Update Open Graph meta tags
  setOpenGraph: (data) => {
    const { title, description, image, url, type = 'website' } = data

    const updateOGTag = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('property', property)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    if (title) updateOGTag('og:title', title)
    if (description) updateOGTag('og:description', description)
    if (image) updateOGTag('og:image', image)
    if (url) updateOGTag('og:url', url)
    updateOGTag('og:type', type)
    updateOGTag('og:site_name', 'Respect')
  },

  // Update Twitter Card meta tags
  setTwitterCard: (data) => {
    const { title, description, image, card = 'summary_large_image' } = data

    const updateTwitterTag = (name, content) => {
      let tag = document.querySelector(`meta[name="${name}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    updateTwitterTag('twitter:card', card)
    if (title) updateTwitterTag('twitter:title', title)
    if (description) updateTwitterTag('twitter:description', description)
    if (image) updateTwitterTag('twitter:image', image)
  },

  // Set canonical URL
  setCanonical: (url) => {
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = url
  },

  // Add structured data (JSON-LD)
  setStructuredData: (data) => {
    const existingScript = document.querySelector('script[type="application/ld+json"]')
    if (existingScript) {
      existingScript.remove()
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
  },

  // Complete SEO setup for a page
  setupPage: (pageData) => {
    const {
      title,
      description,
      image,
      url,
      type,
      structuredData,
    } = pageData

    // Basic meta tags
    seoUtils.setTitle(title)
    seoUtils.setDescription(description)
    
    // Open Graph
    seoUtils.setOpenGraph({
      title,
      description,
      image,
      url,
      type,
    })
    
    // Twitter Card
    seoUtils.setTwitterCard({
      title,
      description,
      image,
    })
    
    // Canonical URL
    if (url) {
      seoUtils.setCanonical(url)
    }
    
    // Structured data
    if (structuredData) {
      seoUtils.setStructuredData(structuredData)
    }
  }
}

// SEO data templates
export const seoTemplates = {
  // Home page SEO
  home: () => ({
    title: 'Respect - Müzik Sanatçılarını Destekle',
    description: 'Sevdiğiniz müzik sanatçılarına respect gönderin ve müzik endüstrisini destekleyin. Spotify entegrasyonu ile kolay kullanım.',
    image: '/images/respect-home.jpg',
    url: window.location.origin,
    type: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Respect',
      description: 'Müzik sanatçılarını destekleme platformu',
      url: window.location.origin,
    }
  }),

  // Artist page SEO
  artist: (artist) => ({
    title: `${artist.name} - Sanatçı Profili`,
    description: `${artist.name} sanatçısına respect gönderin. ${artist.description || 'Müzik kariyerini destekleyin.'}`,
    image: artist.avatar || '/images/default-artist.jpg',
    url: `${window.location.origin}/artist/${artist.id}`,
    type: 'profile',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'MusicGroup',
      name: artist.name,
      description: artist.description,
      image: artist.avatar,
      url: `${window.location.origin}/artist/${artist.id}`,
    }
  }),

  // Song page SEO
  song: (song) => ({
    title: `${song.title} - ${song.artist}`,
    description: `${song.title} şarkısını dinleyin ve sanatçıya respect gönderin. ${song.artist} - ${song.title}`,
    image: song.cover || '/images/default-song.jpg',
    url: `${window.location.origin}/song/${song.id}`,
    type: 'music.song',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'MusicRecording',
      name: song.title,
      byArtist: {
        '@type': 'MusicGroup',
        name: song.artist,
      },
      image: song.cover,
      url: `${window.location.origin}/song/${song.id}`,
    }
  }),

  // User page SEO
  user: (user) => ({
    title: `${user.name} - Kullanıcı Profili`,
    description: `${user.name} kullanıcısının müzik zevki ve desteklediği sanatçıları keşfedin.`,
    image: user.avatar || '/images/default-user.jpg',
    url: `${window.location.origin}/user/${user.id}`,
    type: 'profile',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: user.name,
      image: user.avatar,
      url: `${window.location.origin}/user/${user.id}`,
    }
  }),
}

// Hook for SEO management
export const useSEO = () => {
  const updateSEO = (pageData) => {
    seoUtils.setupPage(pageData)
  }

  const resetSEO = () => {
    seoUtils.setupPage(seoTemplates.home())
  }

  return {
    updateSEO,
    resetSEO,
    templates: seoTemplates,
  }
}

export default seoUtils 