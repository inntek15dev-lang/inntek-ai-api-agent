// Multi-environment robust detection
const getApiUrl = () => {
    // 1. Priority: Runtime injection (Docker/Render env-config.js)
    const runtimeUrl = window?.ENV?.VITE_API_URL;
    if (runtimeUrl && !runtimeUrl.includes('localhost')) return runtimeUrl;

    // 2. Build-time environment variable
    const buildTimeUrl = import.meta.env.VITE_API_URL;
    const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // If we have a build-time URL and it's NOT localhost, or if we ARE on localhost, use it.
    if (buildTimeUrl && (!buildTimeUrl.includes('localhost') || isLocalHost)) {
        return buildTimeUrl;
    }

    // 3. Auto-detection based on current hostname (Fallback if baked-in URL is invalid or missing)
    const hostname = window.location.hostname;
    
    if (hostname.includes('ia-agents-manager.inntek.cl')) {
        return 'https://ia-agents-manager-api.inntek.cl/api';
    }
    
    if (hostname.includes('preprod-ia-agents-manager.inntek.cl')) {
        return 'https://preprod-ia-agents-manager-api.inntek.cl/api';
    }
    
    if (hostname.includes('onrender.com')) {
        return 'https://inntek-ai-api-agent-api.onrender.com/api';
    }

    // 4. Local Default (Only if really on localhost)
    return 'http://localhost:4048/api';
};

const API_URL = getApiUrl();
console.log(`[PARKO] API URL synchronized to: ${API_URL}`);

export default API_URL;
