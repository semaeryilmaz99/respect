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
      
      {/* Desktop Header - Hidden on Mobile */}
      <div className="desktop-header">
        <Header />
      </div>
      
      <div className="artist-content">
        <ArtistProfile artistId={id} />
        
        {/* Desktop Unified Sections Layout */}
        <div className="desktop-unified-sections">
          <div className="unified-sections-container">
            <div className="unified-section top-supporters-fixed">
                <TopSupporters artistId={id} />
            </div>
            
            <div className="unified-section recent-supporters-wide">
                <RecentSupporters artistId={id} />
            </div>
            
            <div className="unified-section songs-list-wide">
                <SongsList artistId={id} />
            </div>
          </div>
        </div>
        
        {/* Mobile Layout - Original Structure */}
        <div className="mobile-sections">
          <TopSupporters artistId={id} />
          <RecentSupporters artistId={id} />
          <SongsList artistId={id} />
        </div>
        
        {/* Desktop RealTimeChat - Hidden on Mobile */}
        <div className="desktop-realtime-chat">
          <RealTimeChat roomId={id} roomType="artist" />
        </div>
      </div>
    </div>
  )
}

export default ArtistPage 