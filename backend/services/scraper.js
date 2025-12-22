const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape metadata from a URL
 * @param {string} url - The URL to scrape
 * @returns {Object} - { url, title, description, favicon, warning? }
 */
async function scrapeMetadata(url) {
    let response;

    try {
        response = await axios.get(url, {
            timeout: 5000, // 5 second timeout
            maxContentLength: 5 * 1024 * 1024, // 5MB max
            maxRedirects: 3,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; LinkShelf/1.0; +https://linkshelf.app)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            validateStatus: (status) => status < 400
        });

        const $ = cheerio.load(response.data);

        // Extract title (prioritize og:title)
        const title =
            $('meta[property="og:title"]').attr('content') ||
            $('meta[name="twitter:title"]').attr('content') ||
            $('title').text().trim() ||
            url;

        // Extract description
        const description =
            $('meta[property="og:description"]').attr('content') ||
            $('meta[name="twitter:description"]').attr('content') ||
            $('meta[name="description"]').attr('content') ||
            '';

        // Extract favicon
        let favicon =
            $('link[rel="icon"]').attr('href') ||
            $('link[rel="shortcut icon"]').attr('href') ||
            $('link[rel="apple-touch-icon"]').attr('href') ||
            '';

        // Normalize favicon URL (convert relative to absolute)
        if (favicon && !favicon.startsWith('http')) {
            try {
                const parsedUrl = new URL(url);
                if (favicon.startsWith('//')) {
                    favicon = parsedUrl.protocol + favicon;
                } else if (favicon.startsWith('/')) {
                    favicon = parsedUrl.origin + favicon;
                } else {
                    favicon = new URL(favicon, url).href;
                }
            } catch {
                favicon = '';
            }
        }

        // Use Google favicon service as fallback
        if (!favicon) {
            try {
                const hostname = new URL(url).hostname;
                favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
            } catch {
                favicon = '';
            }
        }

        // Clear response data to free memory
        response.data = null;

        return {
            url,
            title: title.substring(0, 500), // Limit title length
            description: description.substring(0, 1000), // Limit description length
            favicon
        };

    } catch (error) {
        // Timeout, network error, or non-HTML content
        console.error(`Scrape failed for ${url}:`, error.message);

        // Return URL as fallback title
        let fallbackTitle = url;
        try {
            const hostname = new URL(url).hostname;
            fallbackTitle = hostname.replace('www.', '');
        } catch { }

        return {
            url,
            title: fallbackTitle,
            description: '',
            favicon: '',
            warning: 'Could not fetch metadata'
        };
    }
}

module.exports = { scrapeMetadata };
