const fs = require('fs');

async function updateSpotify() {
  // 1. Configuración de credenciales desde GitHub Secrets
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh_token = process.env.SPOTIFY_API_KEY;
  
  // Tu ID actualizado
  const playlist_id = '37i9dQZF1EpgSOvrG4FdpB'; 

  console.log("--- System Sync: Extrayendo Playlist de Spotify ---");

  try {
    // 2. Obtener Access Token temporal
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
    if (!tokenData.access_token) throw new Error("No se pudo obtener el token. Revisa tus Secrets.");
    
    const access_token = tokenData.access_token;

    // 3. Pedir los tracks (limitado a los campos que necesitamos)
    const url = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?fields=items(track(name,artists(name),album(name,images)))`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const data = await response.json();

    // 4. Formatear datos para el laboratorio
    const tracks = data.items.map(item => ({
      title: item.track.name,
      artist: item.track.artists.map(a => a.name).join(', '),
      album: item.track.album.name,
      image: item.track.album.images[0]?.url || ''
    }));

    // 5. Guardar en la carpeta assets/data/
    const finalData = {
      last_updated: new Date().toISOString(),
      playlist_id: playlist_id,
      total: tracks.length,
      tracks: tracks
    };

    const outputPath = './assets/data/spotify_data.json';
    
    // Aseguramos que el directorio existe (solo por seguridad)
    if (!fs.existsSync('./assets/data')) {
        fs.mkdirSync('./assets/data', { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
    console.log(`✅ Éxito: Generado ${outputPath} con ${tracks.length} canciones.`);

  } catch (error) {
    console.error("❌ Error Crítico:", error.message);
    process.exit(1); 
  }
}

updateSpotify();