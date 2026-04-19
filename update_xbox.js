const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuración de constantes
const XUID = "2533274897489393"; 
const DATA_PATH = path.join(__dirname, 'assets', 'data', 'xbox_data.json');
const TOKEN = process.env.XBOX_API_KEY;

async function updateXboxTitles() {
    if (!TOKEN) {
        console.error(">>> ERROR: No se encontró XBOX_API_KEY en los Secrets.");
        process.exit(1);
    }

    const options = {
        method: 'GET',
        url: 'https://api.xbl.io/v2/titles',
        headers: {
            'X-Authorization': TOKEN
        }
    };

    try {
        console.log(">>> Consultando títulos de Xbox...");
        const { data } = await axios.request(options);
        
        // Formateamos el JSON para guardarlo
        const newDataString = JSON.stringify(data, null, 2);

        // --- Lógica de Comparación ---
        if (fs.existsSync(DATA_PATH)) {
            const currentData = fs.readFileSync(DATA_PATH, 'utf8');
            if (currentData === newDataString) {
                console.log(">>> Sincronización finalizada: Los datos son idénticos.");
                return;
            }
        }

        // Asegurar que la carpeta existe antes de escribir
        const dir = path.dirname(DATA_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(DATA_PATH, newDataString);
        console.log(">>> ÉXITO: assets/data/xbox_data.json actualizado.");

    } catch (error) {
        console.error(">>> ERROR en la petición de Xbox:", error.response?.status || error.message);
        process.exit(1);
    }
}

// Ejecutar la función
updateXboxTitles();