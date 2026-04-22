const fs = require('fs');

async function updateSpotify() {
  // 1. Configuración de credenciales (Desde GitHub Secrets)
  // Asegúrate de que tu Refresh Token fue generado con el scope: user-top-read
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh_token = process.env.SPOTIFY_API_KEY; 

  console.log("--- System Sync: Extrayendo Top Tracks (Febrero 2026 Compliance) ---");

  try {
    // 2. Obtener Access Token temporal mediante el Refresh Token
    const authHeader = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error("Error al renovar token. Verifica si el Refresh Token sigue siendo válido.");
    }
    
    const access_token = tokenData.access_token;

    // 3. Pedir tus canciones más escuchadas (Top Tracks)
    // Usamos limit=20 y time_range=medium_term (últimos 6 meses aprox)
    const url = `https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=20`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const data = await response.json();

    // VALIDACIÓN: En Top Tracks, la data contiene directamente el array 'items'
    if (!data.items || data.items.length === 0) {
      console.error("No se encontraron canciones o la respuesta no es válida.");
      console.log("Respuesta de API:", JSON.stringify(data, null, 2));
      process.exit(1);
    }

    // 4. Mapeo de datos según la estructura de Top Tracks (Estructura plana, no usa .track)
    const tracks = data.items.map(track => ({
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: track.album.name,
      image: track.album.images[0]?.url || '',
      spotify_url: track.external_urls.spotify
    }));

    // 5. Preparar el JSON final
    const finalData = {
      last_updated: new Date().toISOString(),
      metadata: {
        engine: "System Sync 2026",
        source: "Spotify Web API",
        range: "medium_term"
      },
      total: tracks.length,
      tracks: tracks
    };

    // 6. Persistencia en el sistema de archivos
    const dir = './assets/data';
    const outputPath = `${dir}/spotify_data.json`;
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
    
    console.log(`✅ Éxito: Se han guardado ${tracks.length} canciones en ${outputPath}.`);

  } catch (error) {
    console.error("❌ Error de Ejecución:", error.message);
    process.exit(1); 
  }
}

updateSpotify();