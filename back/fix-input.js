const { Input } = require('./src/models');

async function updateInput() {
    try {
        const input = await Input.findOne({ where: { slug: 'json-input' } });
        if (input) {
            input.config_schema = JSON.stringify({
                value: { type: 'textarea', label: 'Contenido JSON/Texto', placeholder: 'Pega aquí el JSON o texto de entrada...' }
            });
            await input.save();
            console.log('Input updated successfully.');
        } else {
            console.log('Input NOT found.');
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

updateInput();
