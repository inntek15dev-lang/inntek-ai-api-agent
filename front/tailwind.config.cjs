/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                guardian: {
                    blue: "#2563eb",
                    dark: "#1a3db8",
                    light: "#3b82f6",
                    bg: "#f8fafc",
                    border: "#e2e8f0",
                    text: "#0f172a",
                    muted: "#64748b",
                },
                cyber: {
                    black: "#050505",
                    dark: "#0a0a0c",
                    gray: "#16161a",
                    blue: "#00f2ff",
                    purple: "#7000ff",
                    pink: "#ff007a",
                    border: "rgba(255, 255, 255, 0.1)",
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            boxShadow: {
                'guardian': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                'guardian-lg': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }
        },
    },
    plugins: [],
}
