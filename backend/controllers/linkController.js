const { parseDriveseedPage, selectLink } = require('../utils/driveseedParser');
const { extractFinalLink } = require('../utils/finalLinkExtractor');

const BATCH_SIZE = 3; // REDUCED: Lower memory usage, prevents crashes
const MAX_RETRIES = 0; // No retries - fail fast for speed
const TIMEOUT_MS = 15000; // 15 second timeout per link
const MAX_LINKS = 50; // Prevent overload - max 50 links per request

/**
 * Process a single driveseed link
 * @param {Object} browser - Puppeteer browser instance
 * @param {string} originalLink - driveseed.org URL
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} - Result object
 */
async function processLink(browser, originalLink) {
  const startTime = Date.now();
  
  try {
    // Step 1: Parse driveseed page (with timeout)
    const parsePromise = parseDriveseedPage(originalLink);
    const parseTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Parse timeout')), TIMEOUT_MS)
    );
    const { v2Link, regularLink } = await Promise.race([parsePromise, parseTimeout]);
    
    const intermediateLink = selectLink({ v2Link, regularLink });
    
    if (!intermediateLink) {
      return {
        originalLink,
        finalLink: null,
        status: 'failed',
        error: 'No download link found on driveseed page'
      };
    }
    
    // Step 2: Extract final link using Puppeteer (with timeout)
    const extractPromise = extractFinalLink(browser, intermediateLink);
    const extractTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Extract timeout')), TIMEOUT_MS)
    );
    const finalLink = await Promise.race([extractPromise, extractTimeout]);
    
    const duration = Date.now() - startTime;
    
    if (finalLink) {
      console.log(`[SUCCESS] ${duration}ms | ${originalLink.substring(0, 50)}...`);
      
      return {
        originalLink,
        finalLink,
        status: 'success',
        duration
      };
    }
    
    console.log(`[FAILED] ${duration}ms | ${originalLink.substring(0, 50)}...`);
    return {
      originalLink,
      finalLink: null,
      status: 'failed',
      error: 'Could not extract final download link',
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`[ERROR] ${duration}ms | ${originalLink.substring(0, 50)}... | ${error.message}`);
    
    return {
      originalLink,
      finalLink: null,
      status: 'failed',
      error: error.message,
      duration
    };
  }
}

/**
 * Process links in batches
 * @param {Object} browser - Puppeteer browser instance
 * @param {string[]} links - Array of driveseed URLs
 * @param {Function} onBatchComplete - Callback for each batch completion
 * @returns {Promise<Object[]>} - All results
 */
async function processBatches(browser, links, onBatchComplete) {
  const results = [];
  const totalLinks = links.length;
  let processedCount = 0;
  const startTime = Date.now();
  
  console.log(`[BATCH START] Processing ${totalLinks} links in batches of ${BATCH_SIZE}`);
  
  for (let i = 0; i < totalLinks; i += BATCH_SIZE) {
    const batch = links.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    // Process batch concurrently with timeout protection
    const batchPromises = batch.map(link => 
      processLink(browser, link).catch(err => ({
        originalLink: link,
        finalLink: null,
        status: 'failed',
        error: err.message
      }))
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    processedCount += batch.length;
    
    // Notify frontend of batch completion
    if (onBatchComplete) {
      onBatchComplete({
        batchResults,
        processedCount,
        totalLinks,
        currentBatch: batchNum,
        totalBatches: Math.ceil(totalLinks / BATCH_SIZE)
      });
    }
  }
  
  const totalDuration = Date.now() - startTime;
  const avgTime = Math.round(totalDuration / totalLinks);
  const successCount = results.filter(r => r.status === 'success').length;
  
  console.log(`[BATCH COMPLETE] ${totalDuration}ms total | ${avgTime}ms avg | ${successCount}/${totalLinks} successful`);
  
  return results;
}

/**
 * POST /api/fetch-links controller
 */
async function fetchLinks(req, res) {
  const { links } = req.body;
  const browser = req.browser;
  
  if (!links || !Array.isArray(links) || links.length === 0) {
    return res.status(400).json({
      error: 'Invalid request. Expected array of links.'
    });
  }
  
  if (!browser) {
    return res.status(500).json({
      error: 'Browser not initialized'
    });
  }
  
  // Clean links - remove empty lines
  const cleanLinks = links
    .map(link => link.trim())
    .filter(link => link.length > 0);
  
  if (cleanLinks.length === 0) {
    return res.status(400).json({
      error: 'No valid links provided'
    });
  }
  
  // Prevent overload - max 50 links per request
  if (cleanLinks.length > MAX_LINKS) {
    return res.status(400).json({
      error: `Too many links. Maximum is ${MAX_LINKS} per request. You sent ${cleanLinks.length}.`
    });
  }
  
  try {
    const results = await processBatches(browser, cleanLinks);
    
    res.json({
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length
      }
    });
  } catch (error) {
    console.error('Error in fetchLinks:', error);
    res.status(500).json({
      error: 'Failed to process links',
      message: error.message
    });
  }
}

module.exports = {
  fetchLinks
};
