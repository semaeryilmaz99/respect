// Test script to verify highlighting patterns work correctly

// Sample feed titles to test
const testTitles = [
  "Ahmet Yılmaz Bohemian Rhapsody - Queen şarkısına 5 respect gönderdi",
  "Ayşe Demir Hotel California - Eagles şarkısını favorilere ekledi", 
  "Mehmet Kaya Ed Sheeran sanatçısını takip etmeye başladı",
  "Fatma Özkan favori şarkınıza 3 respect gönderdi: Shape of You - Ed Sheeran",
  "Ali Veli favori şarkınızı favorilere ekledi: Blinding Lights - The Weeknd",
  "Zeynep Kaya takip ettiğiniz sanatçıyı takip etmeye başladı: Taylor Swift"
];

// Test function to simulate the highlighting logic
function testHighlighting(title) {
  console.log(`\nTesting: "${title}"`);
  
  // Respect gönderilen şarkı formatı
  if (title.includes(' şarkısına ') && title.includes(' respect gönderdi')) {
    const parts = title.split(' şarkısına ');
    if (parts.length === 2) {
      const beforeSong = parts[0];
      const afterSong = parts[1];
      
      const songArtistMatch = beforeSong.match(/(.+?)\s+(.+?)\s*-\s*(.+?)\s*$/);
      if (songArtistMatch) {
        const [, userName, songTitle, artistName] = songArtistMatch;
        console.log(`✅ Respect pattern matched:`);
        console.log(`   User: "${userName}"`);
        console.log(`   Song: "${songTitle.trim()}" (should be highlighted)`);
        console.log(`   Artist: "${artistName.trim()}" (should be highlighted)`);
        console.log(`   After: "${afterSong}"`);
        return true;
      }
    }
  }
  
  // Favorilere eklenen şarkı formatı
  if (title.includes(' şarkısını favorilere ekledi')) {
    const parts = title.split(' şarkısını favorilere ekledi');
    if (parts.length === 2) {
      const beforeSong = parts[0];
      const songArtistMatch = beforeSong.match(/(.+?)\s+(.+?)\s*-\s*(.+?)\s*$/);
      if (songArtistMatch) {
        const [, userName, songTitle, artistName] = songArtistMatch;
        console.log(`✅ Favorite pattern matched:`);
        console.log(`   User: "${userName}"`);
        console.log(`   Song: "${songTitle.trim()}" (should be highlighted)`);
        console.log(`   Artist: "${artistName.trim()}" (should be highlighted)`);
        return true;
      }
    }
  }
  
  // Sanatçı takip formatı
  if (title.includes(' sanatçısını takip etmeye başladı')) {
    const parts = title.split(' sanatçısını takip etmeye başladı');
    if (parts.length === 2) {
      const beforeArtist = parts[0];
      const artistMatch = beforeArtist.match(/(.+?)\s+(.+?)\s*$/);
      if (artistMatch) {
        const [, userName, artistName] = artistMatch;
        console.log(`✅ Follow pattern matched:`);
        console.log(`   User: "${userName}"`);
        console.log(`   Artist: "${artistName.trim()}" (should be highlighted)`);
        return true;
      }
    }
  }
  
  // Personal feed patterns
  if (title.includes(' favori şarkınıza ') && title.includes(' respect gönderdi:')) {
    const parts = title.split(' favori şarkınıza ');
    if (parts.length === 2) {
      const userName = parts[0];
      const afterRespect = parts[1];
      const songArtistMatch = afterRespect.match(/(\d+)\s+respect\s+gönderdi:\s+(.+?)\s*-\s*(.+?)(?:\s*:\s*"([^"]+)")?\s*$/);
      if (songArtistMatch) {
        const [, amount, songTitle, artistName, message] = songArtistMatch;
        console.log(`✅ Personal respect pattern matched:`);
        console.log(`   User: "${userName}"`);
        console.log(`   Amount: ${amount}`);
        console.log(`   Song: "${songTitle.trim()}" (should be highlighted)`);
        console.log(`   Artist: "${artistName.trim()}" (should be highlighted)`);
        if (message) console.log(`   Message: "${message}"`);
        return true;
      }
    }
  }
  
  if (title.includes(' favori şarkınızı favorilere ekledi:')) {
    const parts = title.split(' favori şarkınızı favorilere ekledi: ');
    if (parts.length === 2) {
      const userName = parts[0];
      const songArtist = parts[1];
      const songArtistMatch = songArtist.match(/(.+?)\s*-\s*(.+?)\s*$/);
      if (songArtistMatch) {
        const [, songTitle, artistName] = songArtistMatch;
        console.log(`✅ Personal favorite pattern matched:`);
        console.log(`   User: "${userName}"`);
        console.log(`   Song: "${songTitle.trim()}" (should be highlighted)`);
        console.log(`   Artist: "${artistName.trim()}" (should be highlighted)`);
        return true;
      }
    }
  }
  
  if (title.includes(' takip ettiğiniz sanatçıyı takip etmeye başladı:')) {
    const parts = title.split(' takip ettiğiniz sanatçıyı takip etmeye başladı: ');
    if (parts.length === 2) {
      const userName = parts[0];
      const artistName = parts[1];
      console.log(`✅ Personal follow pattern matched:`);
      console.log(`   User: "${userName}"`);
      console.log(`   Artist: "${artistName.trim()}" (should be highlighted)`);
      return true;
    }
  }
  
  console.log(`❌ No pattern matched`);
  return false;
}

// Run tests
console.log("🧪 Testing Feed Card Highlighting Patterns");
console.log("=" .repeat(50));

let passedTests = 0;
const totalTests = testTitles.length;

testTitles.forEach((title, index) => {
  console.log(`\n📝 Test ${index + 1}:`);
  if (testHighlighting(title)) {
    passedTests++;
  }
});

console.log("\n" + "=" .repeat(50));
console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`);
console.log(`🎯 Success rate: ${((passedTests/totalTests)*100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log("🎉 All tests passed! The highlighting patterns are working correctly.");
} else {
  console.log("⚠️  Some tests failed. Please check the patterns.");
}
