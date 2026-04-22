async function loadSpotifyUI() {
    const container = document.getElementById('spotify-list'); 

    try {
        const response = await fetch('./assets/data/spotify_data.json');
        const data = await response.json();
        
        // 1. Mezclamos todas las canciones aleatoriamente primero
        const allTracks = [...data.tracks].sort(() => 0.5 - Math.random());

        const selectedTracks = [];
        const usedArtists = new Set();
        const usedAlbums = new Set();

        // 2. Filtramos para cumplir tus condiciones de no repetir Artista o Álbum
        for (const track of allTracks) {
            if (selectedTracks.length >= 3) break; // Solo queremos 3

            if (!usedArtists.has(track.artist) && !usedAlbums.has(track.album)) {
                selectedTracks.push(track);
                usedArtists.add(track.artist);
                usedAlbums.add(track.album);
            }
        }

        // 3. Renderizamos el HTML
        container.innerHTML = selectedTracks.map(track => {
            return `
                <a href="${track.spotify_url}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit;">
                    <div class="xbox-item-card"> 
                        <div class="game-thumb">
                            <img src="${track.image}" alt="${track.title}"
                                 onerror="this.onerror=null; this.src='../assets/img/fatal_error.gif';">
                        </div>
                        <div class="game-details">
                            <span class="game-name">${track.title}</span>
                            <div class="game-stats-row">
                                <span class="stat-icon">🎵</span>
                                <span class="stat-count">${track.artist}</span>
                                <span class="stat-divider">//</span>
                                <span class="stat-percent" style="font-size: 8px;">${track.album}</span>
                            </div>
                        </div>
                    </div>
                </a>
            `;
        }).join('');

    } catch (e) {
        console.error("Error en el motor de Spotify:", e);
        container.innerHTML = '<div class="loading-text">ERROR_EN_EL_SINCRO</div>';
    }
} 

document.addEventListener('DOMContentLoaded', loadSpotifyUI);