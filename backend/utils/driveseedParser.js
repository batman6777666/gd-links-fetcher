const fetch = require('node-fetch');

/**
 * Parse driveseed.org page and extract instant download links (OPTIMIZED)
 * Priority: V2 (instant.video-leech.pro) > Regular (cdn.video-leech.pro)
 * @param {string} url - driveseed.org URL
 * @returns {Promise<{v2Link: string|null, regularLink: string|null}>}
 */
async function parseDriveseedPage(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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

    const html = await response.text();
    
    // Fast regex extraction instead of full Cheerio parsing
    const v2Match = html.match(/href="(https?:\/\/instant\.video-leech\.pro\/[^"]+)"/);
    const regularMatch = html.match(/href="(https?:\/\/cdn\.video-leech\.pro\/[^"]+)"/);
    
    const v2Link = v2Match ? v2Match[1] : null;
    const regularLink = regularMatch ? regularMatch[1] : null;

    return { v2Link, regularLink };
  } catch (error) {
    return { v2Link: null, regularLink: null };
  }
}

/**
 * Determine which link to use based on priority
 * V2 > Regular > null
 * @param {Object} links - Object with v2Link and regularLink
 * @returns {string|null} - The selected link or null if none found
 */
function selectLink({ v2Link, regularLink }) {
  // Priority: V2 first, then regular
  if (v2Link) return v2Link;
  if (regularLink) return regularLink;
  return null;
}

module.exports = {
  parseDriveseedPage,
  selectLink
};
