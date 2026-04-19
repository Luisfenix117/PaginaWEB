const axios = require('axios');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'assets', 'data', 'xbox_data.json');
const TOKEN = process.env.XBOX_API_KEY;

async function updateXboxTitles() {
    if (!TOKEN) {
        console.error(">>> ERROR: No se encontró XBOX_API_KEY.");
        process.exit(1);
    }

    try {
        const { data } = await axios.get('https://api.xbl.io/v2/titles', {
            headers: { 'X-Authorization': TOKEN }
        });

        // 1. Verificamos que existan los títulos en la respuesta
        if (data && data.content && Array.from(data.content.titles).length > 0) {
            
            // 2. Limitamos a los 3 más recientes utilizando .slice()
            const limitedTitles = data.content.titles.slice(0, 3);
            
            // 3. Reconstruimos el objeto con la misma estructura pero ligera
            const finalData = {
                content: {
                    xuid: data.content.xuid,
                    titles: limitedTitles
                },
                code: 200
            };

            const newDataString = JSON.stringify(finalData, null, 2);

            // 4. Lógica de comparación para evitar commits innecesarios
            if (fs.existsSync(DATA_PATH)) {
                const currentData = fs.readFileSync(DATA_PATH, 'utf8');
                if (currentData === newDataString) {
                    console.log(">>> Los 3 títulos son idénticos. Omitiendo guardado.");
                    process.exit(0);
                }
            }

            fs.writeFileSync(DATA_PATH, newDataString);
            console.log(`>>> ÉXITO: Guardados los 3 títulos más recientes.`);
        }
    } catch (error) {
        console.error(">>> ERROR:", error.message);
    }
}

updateXboxTitles();