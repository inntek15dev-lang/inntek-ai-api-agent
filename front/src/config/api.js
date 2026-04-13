// Multi-environment robust detection
const getApiUrl = () => {
    // 1. Priority: Runtime injection (Docker/Render env-config.js)
    if (window?.ENV?.VITE_API_URL) return window.ENV.VITE_API_URL;

    // 2. Build-time environment variable
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    // 3. Auto-detection based on current hostname (Fallback)
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

    // 4. Local Default
    return 'http://localhost:4048/api';
};

const API_URL = getApiUrl();
console.log(`[PARKO] API URL synchronized to: ${API_URL}`);

export default API_URL;
