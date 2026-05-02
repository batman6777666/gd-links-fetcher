const DriveSeedExtractor = require('./backend/utils/driveseedExtractor');

async function testExtractor() {
  console.log('🧪 Testing DriveSeed Extractor Implementation');
  console.log('='.repeat(60));
  
  const extractor = new DriveSeedExtractor();
  
  // Test with the provided example URL
  const testUrl = 'https://driveseed.org/file/YDvDRQtx05';
  
  console.log(`📋 Test URL: ${testUrl}`);
  console.log('⏳ Processing...');
  
  try {
    const startTime = Date.now();
    const finalLink = await extractor.extractDownloadLink(testUrl);
    const duration = Date.now() - startTime;
    
    console.log('✅ SUCCESS!');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`🔗 Final Download Link: ${finalLink}`);
    
    // Validate the link
    if (finalLink && finalLink.includes('googleusercontent.com')) {
      console.log('✓ Link validation: PASSED (contains googleusercontent.com)');
    } else if (finalLink) {
      console.log('⚠️  Link validation: UNKNOWN (but link was found)');
    } else {
      console.log('❌ Link validation: FAILED (no link found)');
    }
    
  } catch (error) {
    console.log('❌ FAILED!');
    console.log(`Error: ${error.message}`);
    
    // Detailed error analysis
    if (error.message.includes('No download buttons')) {
      console.log('🔍 Issue: No download buttons found on the page');
    } else if (error.message.includes('timeout')) {
      console.log('🔍 Issue: Request timed out');
    } else if (error.message.includes('HTTP')) {
      console.log('🔍 Issue: HTTP error occurred');
    } else if (error.message.includes('either source')) {
      console.log('🔍 Issue: Both Instant Download and V2 failed');
    }
  }
}

// Run the test
if (require.main === module) {
  testExtractor().catch(console.error);
}

module.exports = { testExtractor };