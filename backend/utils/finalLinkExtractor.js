/**
 * Extract final download link from video-seed page using Puppeteer (OPTIMIZED)
 * The intermediate link redirects to video-seed.dev/?url=FINAL_URL
 * @param {Object} browser - Puppeteer browser instance
 * @param {string} url - video-leech.pro intermediate URL
 * @returns {Promise<string|null>} - Final download URL or null
 */
async function extractFinalLink(browser, url) {
  let page = null;
  let pageAlive = true;
  
  try {
    page = await browser.newPage();
    
    // Block unnecessary resources for speed and memory efficiency
    await page.setRequestInterception(true);
    
    // Store the handler reference so we can remove it later
    const requestHandler = (req) => {
      // Guard against race condition when page is being closed
      if (!pageAlive) return;
      
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media', 'websocket'].includes(resourceType)) {
        req.abort().catch(() => {});
      } else {
        req.continue().catch(() => {});
      }
    };
    
    page.on('request', requestHandler);
    
    // Minimal viewport - reduces memory
    await page.setViewport({ width: 800, height: 600 });
    
    // Fast navigation - just wait for DOM to load
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    // Get the final URL after all redirects
    const finalUrl = page.url();
    
    // Check if the URL contains the download link in query parameter (video-seed.dev/?url=...)
    if (finalUrl.includes('?url=')) {
      try {
        const urlObj = new URL(finalUrl);
        const downloadUrl = urlObj.searchParams.get('url');
        if (downloadUrl && downloadUrl.includes('googleusercontent.com')) {
          return downloadUrl;
        }
      } catch (e) {
        // URL parsing failed, continue to fallback
      }
    }
    
    // Fast extraction: Look for download button/link on the page
    const selectors = [
      'a.btn-download',
      'a[href*="googleusercontent.com"]',
      '.download-btn a',
      'a[download]',
      'a#download',
      'button[onclick*="download"]'
    ];
    
    let finalLink = null;
    
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        finalLink = await page.$eval(selector, el => el.href || el.getAttribute('href'));
        if (finalLink && finalLink.includes('googleusercontent.com')) {
          return finalLink;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Fast scan: just get all links quickly
    finalLink = await page.evaluate(() => {
      const allLinks = document.querySelectorAll('a[href*="googleusercontent.com"]');
      for (const link of allLinks) {
        if (link.href) return link.href;
      }
      return null;
    });
    
    return finalLink;
  } catch (error) {
    console.error(`[EXTRACTOR] Error extracting final link from ${url}:`, error.message);
    return null;
  } finally {
    // ALWAYS close page - CRITICAL for preventing memory leaks
    if (page) {
      try {
        // Mark page as not alive to stop request handlers
        pageAlive = false;
        
        // Wait a bit for pending requests to complete before closing
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Remove all listeners first to prevent interception errors
        page.removeAllListeners('request');
        
        // Now close the page
        await page.close();
        page = null; // Clear reference
      } catch (closeError) {
        // Force close if normal close fails
        try {
          if (page) {
            await page.close();
            page = null;
          }
        } catch (e) {
          // Silent fail - page might be already closed
        }
      }
    }
  }
}

module.exports = {
  extractFinalLink
};
