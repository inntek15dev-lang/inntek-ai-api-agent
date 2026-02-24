/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#3b82f6", // Blue 500
                secondary: "#64748b", // Slate 500
                accent: "#8b5cf6", // Violet 500
                background: "#f8fafc",
                surface: "#ffffff",
            },
        },
    },
    plugins: [],
}
