const API_URL = window?.ENV?.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:4048/api';

export default API_URL;
