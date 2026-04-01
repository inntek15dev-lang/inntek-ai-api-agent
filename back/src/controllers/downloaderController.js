const axios = require('axios');
const AdmZip = require('adm-zip');

// Standard headers to avoid 403/401 blocks from most servers
const COMMON_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Referer': 'https://www.google.com/'
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Proxy single download to avoid CORS and set custom filename
 */
exports.proxyDownload = async (req, res) => {
    try {
        let { url, filename } = req.query;

        if (!url) {
            return res.status(400).json({ success: false, message: 'URL is required' });
        }

        // Ensure URL is correctly decoded if it was passed double-encoded or with special chars
        const targetUrl = decodeURIComponent(url);

        console.log(`[DOWNLOADER] Proxying download: ${targetUrl} as ${filename}`);

        const response = await axios({
            url: targetUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 60000, // 60 seconds
            headers: COMMON_HEADERS
        });

        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'downloaded_file'}"`);
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');

        response.data.pipe(res);
    } catch (error) {
        console.error('[DOWNLOADER] Proxy error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: `Failed to proxy download (403/Forbidden likely): ${error.message}` 
        });
    }
};

/**
 * Create a ZIP archive from multiple URLs
 */
exports.createZip = async (req, res) => {
    try {
        const { files } = req.body; // Array of { url, filename }

        if (!files || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ success: false, message: 'Files array is required' });
        }

        console.log(`[DOWNLOADER] Creating ZIP for ${files.length} files (Strict Sequential Mode)`);

        const zip = new AdmZip();

        // Download all files (sequentially to avoid flooding and 403 flags)
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                process.stdout.write(`[DOWNLOADER] (${i+1}/${files.length}) Downloading: ${file.url} \r`);
                
                const response = await axios({
                    url: file.url,
                    method: 'GET',
                    responseType: 'arraybuffer',
                    timeout: 20000, // 20 seconds per file
                    headers: COMMON_HEADERS
                });

                zip.addFile(file.filename || `file_${Date.now()}`, Buffer.from(response.data));
                
                // Absolute sequentiality: wait between downloads
                if (i < files.length - 1) {
                    await sleep(800); // 800ms delay between files
                }
            } catch (err) {
                console.warn(`\n[DOWNLOADER] Failed to download ${file.url}: ${err.message}`);
                zip.addFile(`${file.filename}_ERROR.txt`, Buffer.from(`Error downloading this file: ${err.message}\nURL: ${file.url}`));
            }
        }

        console.log('\n[DOWNLOADER] Zip compression starting...');
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
