const axios = require('axios');
const AdmZip = require('adm-zip');

/**
 * Proxy single download to avoid CORS and set custom filename
 */
exports.proxyDownload = async (req, res) => {
    try {
        const { url, filename } = req.query;

        if (!url) {
            return res.status(400).json({ success: false, message: 'URL is required' });
        }

        console.log(`[DOWNLOADER] Proxying download: ${url} as ${filename}`);

        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 30000 // 30 seconds
        });

        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'downloaded_file'}"`);
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');

        response.data.pipe(res);
    } catch (error) {
        console.error('[DOWNLOADER] Proxy error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: `Failed to proxy download: ${error.message}` 
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

        console.log(`[DOWNLOADER] Creating ZIP for ${files.length} files`);

        const zip = new AdmZip();

        // Download all files (sequentially to avoid flooding)
        for (const file of files) {
            try {
                const response = await axios({
                    url: file.url,
                    method: 'GET',
                    responseType: 'arraybuffer',
                    timeout: 10000 // 10 seconds per file
                });

                zip.addFile(file.filename || `file_${Date.now()}`, Buffer.from(response.data));
            } catch (err) {
                console.warn(`[DOWNLOADER] Failed to download ${file.url}: ${err.message}`);
                // Add a text file indicating the error instead of failing the whole ZIP
                zip.addFile(`${file.filename}_ERROR.txt`, Buffer.from(`Error downloading this file: ${err.message}`));
            }
        }

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
