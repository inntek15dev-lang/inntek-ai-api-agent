const axios = require('axios');
const AdmZip = require('adm-zip');

// Standard headers to avoid 403/401 blocks from most servers
const COMMON_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Extract the base origin from a URL to use as a Referer
const getRefererFromUrl = (targetUrl) => {
    try {
        const urlObj = new URL(targetUrl);
        return `${urlObj.protocol}//${urlObj.hostname}/`;
    } catch (e) {
        return 'https://www.google.com/';
    }
};

// Strict URL cleaning to protect special symbols like '+' from being interpreted as spaces by axios/target server
const cleanTargetUrl = (url) => {
    // 1. Decode EVERYTHING to get a clean raw URL string
    let dUrl = decodeURIComponent(url);
    // 2. Some URLs come with '+' already which should be treated as literal plus, but axios/express might space it
    // 3. We manually encode the symbols that cause issues in query strings
    // Note: We only replace '+' in the query part (after ?) but replace universally if it's a known issue
    return dUrl.replace(/\+/g, '%2B');
};

/**
 * Proxy single download to avoid CORS and set custom filename
 */
exports.proxyDownload = async (req, res) => {
    try {
        let { url, filename } = req.query;

        if (!url) {
            return res.status(400).json({ success: false, message: 'URL is required' });
        }

        // Strict cleaning
        const targetUrl = cleanTargetUrl(url);
        const dynamicHeaders = { ...COMMON_HEADERS, 'Referer': getRefererFromUrl(targetUrl) };

        console.log(`[DOWNLOADER] Proxying (Advanced): ${targetUrl} as ${filename}`);

        const response = await axios({
            url: targetUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 60000, 
            headers: dynamicHeaders,
            maxRedirects: 5
        });

        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'downloaded_file'}"`);
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');

        response.data.pipe(res);
    } catch (error) {
        console.error('[DOWNLOADER] Proxy error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: `Failed to proxy download (Possible 403/Forbidden OR Special symbols error): ${error.message}` 
        });
    }
};

/**
 * Create a ZIP archive from multiple URLs
 */
exports.createZip = async (req, res) => {
    try {
        const { files } = req.body; 

        if (!files || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ success: false, message: 'Files array is required' });
        }

        console.log(`[DOWNLOADER] Creating ZIP for ${files.length} files (Advanced Spoofing Mode)`);

        const zip = new AdmZip();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                // Ensure the individual file URL is also strictly cleaned
                const targetUrl = cleanTargetUrl(file.url);
                const dynamicHeaders = { ...COMMON_HEADERS, 'Referer': getRefererFromUrl(targetUrl) };

                process.stdout.write(`[DOWNLOADER] (${i+1}/${files.length}) Fetching: ${targetUrl} \r`);
                
                const response = await axios({
                    url: targetUrl,
                    method: 'GET',
                    responseType: 'arraybuffer',
                    timeout: 20000,
                    headers: dynamicHeaders,
                    maxRedirects: 5
                });

                zip.addFile(file.filename || `file_${Date.now()}`, Buffer.from(response.data));
                
                if (i < files.length - 1) {
                    await sleep(1000); // 1s delay for institution-level spoofing
                }
            } catch (err) {
                console.warn(`\n[DOWNLOADER] Failed to download ${file.url}: ${err.message}`);
                zip.addFile(`${file.filename}_ERROR.txt`, Buffer.from(`Error downloading this file: ${err.message}\nFinal Handled URL: ${file.url}`));
            }
        }

        console.log('\n[DOWNLOADER] Finalizing archive...');
        const zipBuffer = zip.toBuffer();
        const zipName = `bundle_${Date.now()}.zip`;

        res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Length', zipBuffer.length);

        res.send(zipBuffer);
    } catch (error) {
        console.error('[DOWNLOADER] Zip error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: `Failed to create ZIP: ${error.message}` 
        });
    }
};
