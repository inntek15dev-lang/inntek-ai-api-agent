const fs = require('fs');
const path = require('path');

/**
 * Basic Security Audit Utility
 * Verifies critical environment settings and source control protections.
 */
const performAudit = () => {
    console.log('--- DEPLOYMENT SECURITY AUDIT ---');

    // 1. Check .env protection
    const rootGitignore = path.join(__dirname, '../../../.gitignore');
    if (fs.existsSync(rootGitignore)) {
        const content = fs.readFileSync(rootGitignore, 'utf8');
        if (content.includes('.env')) {
            console.log('[PASS] .env is listed in root .gitignore');
        } else {
            console.warn('[FAIL] .env is NOT protected in root .gitignore');
        }
    } else {
        console.error('[CRITICAL] Root .gitignore is missing');
    }

    // 2. Check Gemini API Key usage
    if (process.env.GEMINI_API_KEY) {
        if (process.env.GEMINI_API_KEY.startsWith('AIza')) {
            console.log('[PASS] Gemini API Key is loaded via environment');
        } else {
            console.warn('[WARN] Gemini API Key format looks non-standard');
        }
    } else {
        console.error('[CRITICAL] GEMINI_API_KEY is missing from environment');
    }

    // 3. Environment Check
    if (process.env.NODE_ENV === 'production') {
        console.log('[INFO] Running in PRODUCTION mode');
    } else {
        console.log('[INFO] Running in DEVELOPMENT mode');
    }

    console.log('--- AUDIT COMPLETE ---');
};

if (require.main === module) {
    performAudit();
}

module.exports = { performAudit };
