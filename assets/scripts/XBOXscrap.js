async function debugXboxUI() {
    const container = document.getElementById('xbox-list'); 
    

    try {
        const response = await fetch('./assets/data/xbox_data.json');
        const data = await response.json();
        const titles = data.content.titles.slice(0, 3); 

        // Definimos estas constantes fuera del .map para no recrearlas en cada ciclo
        const fallbackGif = '../assets/img/fatal_error.gif';
        const localImageOverrides = {
         "Goddess of Victory: Nikke": "assets/img/Nikke.webp" 
        };

        container.innerHTML = titles.map(game => {
            const stats = game.achievement;
            const imagePath = localImageOverrides[game.name] || game.displayImage || '';
            
            return `
                <div class="xbox-item-card">
                    <div class="game-thumb">
                        <img src="${imagePath}" alt="${game.name}"
                             onerror="this.onerror=null; this.src='${fallbackGif}';">
                    </div>
                    <div class="game-details">
                        <span class="game-name">${game.name}</span>
                        <div class="game-stats-row">
                            <span class="stat-icon">🏆</span>
                            <span class="stat-count">${stats.currentAchievements}</span>
                            <span class="stat-divider">//</span>
                            <span class="stat-percent">${stats.progressPercentage}%</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error("Error cargando Mock Data:", e);
    }
} 

document.addEventListener('DOMContentLoaded', debugXboxUI);