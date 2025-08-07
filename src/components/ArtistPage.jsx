import React from 'react'
import { useParams } from 'react-router-dom'
import Header from './Header'
import ArtistProfile from './ArtistProfile'
import TopSupporters from './TopSupporters'
import RecentSupporters from './RecentSupporters'
import RealTimeChat from './RealTimeChat'
import SongsList from './SongsList'
import BackButton from './common/BackButton'

const ArtistPage = () => {
  const { id } = useParams()
  
  console.log('🎨 ArtistPage - Artist ID:', id)

  return (
    <div className="artist-page">
      <div className="page-header">
        <BackButton />
      </div>
      <Header />
      <div className="artist-content">
        <ArtistProfile artistId={id} />
        <TopSupporters artistId={id} />
        <RecentSupporters artistId={id} />
        <RealTimeChat roomId={id} roomType="artist" />
        <SongsList artistId={id} />
      </div>
    </div>
  )
}

export default ArtistPage 