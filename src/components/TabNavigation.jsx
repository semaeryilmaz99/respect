import React from 'react'

const TabNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <div className="tab-navigation">
      <button 
        className={`tab-button ${activeTab === 'topluluk' ? 'active' : ''}`}
        onClick={() => setActiveTab('topluluk')}
      >
        Topluluk
      </button>
      <button 
        className={`tab-button ${activeTab === 'sanaOzel' ? 'active' : ''}`}
        onClick={() => setActiveTab('sanaOzel')}
      >
        Sana Özel
      </button>
    </div>
  )
}

export default TabNavigation 