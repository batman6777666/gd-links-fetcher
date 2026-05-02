const fetch = require('node-fetch');
const puppeteer = require('puppeteer');

/**
 * DriveSeed Direct Download Link Extractor
 * Implements the complete PRD specification with priority and fallback logic
 */

class DriveSeedExtractor {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.timeout = 15000; // 15 seconds timeout
  }

  /**
   * Main entry point - extracts final download link from DriveSeed URL
   * @param {string} driveseedUrl - DriveSeed file page URL
   * @returns {Promise<string>} - Final direct download URL
   */
  async extractDownloadLink(driveseedUrl) {
    console.log(`[EXTRACTOR] Processing: ${driveseedUrl}`);
    
    try {
      // Step 1: Fetch DriveSeed file page
      const html = await this.fetchWithTimeout(driveseedUrl);
      
      // Step 2: Extract both button links
      const { instantLink, instantV2Link } = this.extractButtonLinks(html);
      
      if (!instantLink && !instantV2Link) {
        throw new Error('No download buttons found on page');
      }
      
      console.log(`[EXTRACTOR] Found links - Instant: ${instantLink ? 'YES' : 'NO'}, V2: ${instantV2Link ? 'YES' : 'NO'}`);
      
      // Step 3: Priority - Try Instant Download first
      if (instantLink) {
        try {
          const finalLink = await this.extractFromIntermediatePage(instantLink, 'Instant Download');
          if (finalLink) {
            console.log(`[EXTRACTOR] Success from Instant Download: ${finalLink}`);
            return finalLink;
          }
        } catch (error) {
          console.log(`[EXTRACTOR] Instant Download failed: ${error.message}`);
          // Continue to fallback
        }
      }
      
      // Step 4: Fallback - Try Instant Download V2
      if (instantV2Link) {
        try {
          const finalLink = await this.extractFromIntermediatePage(instantV2Link, 'Instant Download V2');
          if (finalLink) {
            console.log(`[EXTRACTOR] Success from Instant Download V2: ${finalLink}`);
            return finalLink;
          }
        } catch (error) {
          console.log(`[EXTRACTOR] Instant Download V2 failed: ${error.message}`);
        }
      }
      
      throw new Error('Could not extract download link from either source');
      
    } catch (error) {
      console.error(`[EXTRACTOR] Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch URL with timeout and proper headers
   */
  async fetchWithTimeout(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.text();
      
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Extract button links from DriveSeed HTML
   */
  extractButtonLinks(html) {
    // Look for Instant Download button (cdn.video-*)
    const instantMatch = html.match(/href="(https?:\/\/cdn\.video-[^/"]+\/[^"]+)"/i);
    
    // Look for Instant Download V2 button (instant.video-*)
    const instantV2Match = html.match(/href="(https?:\/\/instant\.video-[^/"]+\/[^"]+)"/i);
    
    // Alternative patterns for different button formats
    const alternativeInstantMatch = html.match(/Instant Download[^<]*<a[^>]+href="([^"]+)"/i);
    const alternativeV2Match = html.match(/Instant Download V2[^<]*<a[^>]+href="([^"]+)"/i);
    
    return {
      instantLink: instantMatch ? instantMatch[1] : (alternativeInstantMatch ? alternativeInstantMatch[1] : null),
      instantV2Link: instantV2Match ? instantV2Match[1] : (alternativeV2Match ? alternativeV2Match[1] : null)
    };
  }

  /**
   * Extract final download link from intermediate page
   */
  async extractFromIntermediatePage(intermediateUrl, sourceType) {
    console.log(`[EXTRACTOR] Trying ${sourceType}: ${intermediateUrl}`);
    
    const html = await this.fetchWithTimeout(intermediateUrl);
    
    // Debug: Save HTML for analysis if needed
    if (process.env.DEBUG_EXTRACTOR) {
      const fs = require('fs');
      fs.writeFileSync(`debug_${sourceType.replace(/\s+/g, '_')}.html`, html);
      console.log(`[DEBUG] Saved HTML to debug_${sourceType.replace(/\s+/g, '_')}.html`);
    }
    
    // Method 1: Extract from URL query parameter (common pattern)
    const queryParamLink = this.extractFromQueryParameter(intermediateUrl, html);
    if (queryParamLink && this.isValidDownloadLink(queryParamLink)) {
      console.log(`[EXTRACTOR] Found query param link: ${queryParamLink.substring(0, 100)}...`);
      return queryParamLink;
    }
    
    // Method 2: Look for direct Googleusercontent links
    const directLink = this.extractDirectDownloadLink(html);
    if (directLink && this.isValidDownloadLink(directLink)) {
      console.log(`[EXTRACTOR] Found direct link: ${directLink.substring(0, 100)}...`);
      return directLink;
    }
    
    // Method 3: Look for red button with download text
    const redButtonLink = this.extractRedButtonLink(html);
    if (redButtonLink && this.isValidDownloadLink(redButtonLink)) {
      console.log(`[EXTRACTOR] Found red button link: ${redButtonLink.substring(0, 100)}...`);
      return redButtonLink;
    }
    
    // Method 4: Look for any download button with common patterns
    const downloadButtonLink = this.extractDownloadButtonLink(html);
    if (downloadButtonLink && this.isValidDownloadLink(downloadButtonLink)) {
      console.log(`[EXTRACTOR] Found download button link: ${downloadButtonLink.substring(0, 100)}...`);
      return downloadButtonLink;
    }
    
    // Method 5: Look for JavaScript redirects
    const jsRedirectLink = this.extractJsRedirectLink(html);
    if (jsRedirectLink && this.isValidDownloadLink(jsRedirectLink)) {
      console.log(`[EXTRACTOR] Found JS redirect link: ${jsRedirectLink.substring(0, 100)}...`);
      return jsRedirectLink;
    }
    
    // Method 6: Look for meta refresh redirects
    const metaRefreshLink = this.extractMetaRefreshLink(html);
    if (metaRefreshLink && this.isValidDownloadLink(metaRefreshLink)) {
      console.log(`[EXTRACTOR] Found meta refresh link: ${metaRefreshLink.substring(0, 100)}...`);
      return metaRefreshLink;
    }
    
    console.log(`[EXTRACTOR] No valid download link found in ${sourceType} page, trying Puppeteer fallback...`);
    
    // Fallback to Puppeteer for JavaScript-heavy pages
    const puppeteerLink = await this.extractWithPuppeteer(intermediateUrl);
    if (puppeteerLink && this.isValidDownloadLink(puppeteerLink)) {
      console.log(`[EXTRACTOR] Found link via Puppeteer: ${puppeteerLink.substring(0, 100)}...`);
      return puppeteerLink;
    }
    
    return null;
  }

  /**
   * Extract direct download link from HTML
   */
  extractDirectDownloadLink(html) {
    // Look for Googleusercontent download links
    const googleusercontentMatch = html.match(/href="(https?:\/\/video-downloads\.googleusercontent\.com[^"]+)"/i);
    if (googleusercontentMatch) {
      return googleusercontentMatch[1];
    }
    
    // Look for other CDN domains that might host the file
    const cdnMatches = html.match(/href="(https?:\/\/(?:[^/]+\.)?(?:googleusercontent|cdn|download)[^"]+)"/gi);
    if (cdnMatches) {
      for (const match of cdnMatches) {
        const link = match.replace(/href="/, '').replace(/"/, '');
        if (link.includes('.com/') && !link.includes('driveseed') && !link.includes('video-gen')) {
          return link;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract red button link (common pattern on intermediate pages)
   */
  extractRedButtonLink(html) {
    // Look for red buttons with download text
    const redButtonPatterns = [
      /<a[^>]*style=[^>]*background[^:]*:[^>]*red[^>]*href="([^"]+)"[^>]*>\s*Instant Download\s*<\/a>/i,
      /<a[^>]*class=[^>]*(?:btn-danger|btn-red|btn-download)[^>]*href="([^"]+)"[^>]*>\s*(?:Instant Download|Download)\s*<\/a>/i,
      /<button[^>]*onclick=[^>]*window\.location\.href='([^']+)'[^>]*>\s*Instant Download\s*<\/button>/i
    ];
    
    for (const pattern of redButtonPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * Extract download button using various common patterns
   */
  extractDownloadButtonLink(html) {
    const downloadPatterns = [
      /href="([^"]+)"[^>]*>\s*<span[^>]*>\s*Instant Download\s*<\/span>/i,
      /<a[^>]*download[^>]*href="([^"]+)"/i,
      /window\.location\.href\s*=\s*['"]([^'"]+)['"]/i,
      /<meta[^>]*http-equiv=[^>]*refresh[^>]*content=[^>]*url=([^>]+)>/i
    ];
    
    for (const pattern of downloadPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const link = match[1].replace(/&amp;/g, '&');
        if (this.isValidDownloadLink(link)) {
          return link;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract download link from URL query parameters and JavaScript patterns
   */
  extractFromQueryParameter(intermediateUrl, html) {
    try {
      // Check if the URL itself contains a query parameter with the download link
      const urlObj = new URL(intermediateUrl);
      const downloadUrl = urlObj.searchParams.get('url');
      
      if (downloadUrl && this.isValidDownloadLink(downloadUrl)) {
        return downloadUrl;
      }
      
      // Also check for common query parameter names
      const commonParamNames = ['file', 'download', 'link', 'url', 'src'];
      for (const param of commonParamNames) {
        const value = urlObj.searchParams.get(param);
        if (value && this.isValidDownloadLink(value)) {
          return value;
        }
      }
      
      // Look for JavaScript that contains the actual download URL
      // This is a common pattern where the URL is embedded in JS code
      const jsUrlPatterns = [
        /(https?:\/\/video-downloads\.googleusercontent\.com[^\"'\s<>]+)/gi,
        /(https?:\/\/[^\"'\s<>]*\.googleusercontent\.com[^\"'\s<>]+)/gi,
        /downloadUrl\s*=\s*['"](https?:\/\/[^'"]+)['"]/,
        /href\s*=\s*['"](https?:\/\/[^'"]+\.googleusercontent\.com[^'"]*)['"]/,
        /window\.location\.href\s*=\s*['"](https?:\/\/[^'"]+)['"]/,
        /url\s*:\s*['"](https?:\/\/[^'"]+)['"]/,
        /redirect\s*:\s*['"](https?:\/\/[^'"]+)['"]/
      ];
      
      for (const pattern of jsUrlPatterns) {
        const matches = html.match(pattern);
        if (matches && matches[1]) {
          const foundUrl = matches[1].replace(/&amp;/g, '&');
          if (this.isValidDownloadLink(foundUrl)) {
            return foundUrl;
          }
        }
      }
      
      // Look for base64 encoded URLs (sometimes used)
      const base64Patterns = [
        /['"]([a-zA-Z0-9+/=]{20,})['"]/g
      ];
      
      for (const pattern of base64Patterns) {
        const matches = html.match(pattern);
        if (matches) {
          for (const match of matches) {
            try {
              const decoded = Buffer.from(match.replace(/['"]/g, ''), 'base64').toString('utf8');
              if (decoded.startsWith('http') && this.isValidDownloadLink(decoded)) {
                return decoded;
              }
            } catch (e) {
              // Not valid base64, continue
            }
          }
        }
      }
      
    } catch (error) {
      // URL parsing failed
    }
    
    return null;
  }

  /**
   * Extract JavaScript redirect links
   */
  extractJsRedirectLink(html) {
    const jsPatterns = [
      /window\.location\.href\s*=\s*['"]([^'"]+)['"]/i,
      /window\.open\(['"]([^'"]+)['"]/i,
      /document\.location\.href\s*=\s*['"]([^'"]+)['"]/i,
      /location\.replace\(['"]([^'"]+)['"]/i,
      /location\.href\s*=\s*['"]([^'"]+)['"]/i,
      /<a[^>]+onclick=\"[^\"]*window\.location\.href='([^']+)'[^>]*>/i
    ];
    
    for (const pattern of jsPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const link = match[1].replace(/&amp;/g, '&');
        if (link.startsWith('http')) {
          return link;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract meta refresh redirect links
   */
  extractMetaRefreshLink(html) {
    const metaPatterns = [
      /<meta[^>]+http-equiv=[^>]*refresh[^>]+content=[^>]*url=([^>\s]+)/i,
      /<meta[^>]+content=[^>]*url=([^>\s]+)[^>]+http-equiv=[^>]*refresh/i,
      /<meta[^>]+content=[^>]*\d+;\s*url='([^']+)'/i,
      /<meta[^>]+content=[^>]*\d+;\s*url="([^"]+)"/i
    ];
    
    for (const pattern of metaPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const link = match[1].replace(/&amp;/g, '&');
        if (link.startsWith('http')) {
          return link;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract download link using Puppeteer (headless browser)
   * For JavaScript-heavy pages that require browser execution
   */
  async extractWithPuppeteer(url) {
    let browser = null;
    let page = null;
    
    try {
      // Launch headless browser with minimal resources
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      
      page = await browser.newPage();
      
      // Block unnecessary resources for faster loading
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      // Set minimal viewport
      await page.setViewport({ width: 800, height: 600 });
      
      // Navigate to the page and wait for potential JavaScript execution
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      
      // Wait a bit for JavaScript to execute (especially for delayed button appearance)
      await page.waitForTimeout(2000);
      
      // Try to find the download button/link
      const selectors = [
        'a#downloadBtn',
        'a.btn-danger',
        'a.btn-download',
        'a[href*="googleusercontent.com"]',
        'a[download]',
        '.download a',
        'a[href^="http"][href*="download"]'
      ];
      
      let finalUrl = null;
      
      for (const selector of selectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          finalUrl = await page.$eval(selector, el => el.href);
          if (finalUrl && this.isValidDownloadLink(finalUrl)) {
            break;
          }
        } catch (e) {
          // Selector not found, continue to next
        }
      }
      
      // If no selector found, try to extract from page URL (after redirects)
      if (!finalUrl) {
        finalUrl = page.url();
      }
      
      return finalUrl;
      
    } catch (error) {
      console.error(`[PUPPETEER] Error: ${error.message}`);
      return null;
    } finally {
      // Clean up
      if (page) {
        try {
          await page.close();
        } catch (e) {
          // Ignore close errors
        }
      }
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          // Ignore close errors
        }
      }
    }
  }

  /**
   * Validate if a link looks like a legitimate download link
   */
  isValidDownloadLink(link) {
    if (!link || link === '#' || link === 'javascript:void(0)') {
      return false;
    }
    
    return link.startsWith('http') && 
           !link.includes('driveseed.org') &&
           !link.includes('video-gen.xyz') &&
           !link.includes('video-leech.pro') &&
           (link.includes('googleusercontent.com') || 
            link.includes('/download/') || 
            link.match(/\.[a-z0-9]{2,4}$/i)); // Has file extension
  }
}

module.exports = DriveSeedExtractor;