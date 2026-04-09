const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../../info/capacitaciones/info/dashboard_capacitaciones_2026.html');

if (!fs.existsSync(htmlPath)) {
    console.error('HTML file not found at:', htmlPath);
    process.exit(1);
}

const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Use regex to find the DATA constant in the script tag
const dataRegex = /const DATA = (\{[\s\S]*?\});/;
const match = htmlContent.match(dataRegex);

if (match && match[1]) {
    try {
        const data = JSON.parse(match[1]);
        const outputPath = path.join(__dirname, '../scripts/capacitaciones_data.json');
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log('Successfully extracted capacitaciones data to:', outputPath);
    } catch (e) {
        console.error('Error parsing JSON from HTML:', e.message);
    }
} else {
    console.error('Could not find DATA constant in HTML');
}
