async function loadMalFeed() {
    const containerAnime = document.getElementById('mal-anime-list');
    const containerManga = document.getElementById('mal-manga-list');

    try {
        // Petición local ultra rápida
        const response = await fetch('./assets/data/mal_data.json');
        const data = await response.json();

        const render = (items, target) => {
            target.innerHTML = items.map(item => `
                <div class="mal-item">
                    <div class="mal-item-thumb"><img src="${item.image}" loading="lazy"></div>
                    <div class="mal-item-content">
                        <a class="mal-item-title" href="${item.link}" target="_blank">${item.title}</a>
                        <div class="mal-item-state">${item.desc}</div>
                    </div>
                </div>
            `).join('');
        };

        render(data.anime, containerAnime);
        render(data.manga, containerManga);
    } catch (e) {
        console.error("Error cargando datos locales", e);
    }
}

document.addEventListener('DOMContentLoaded', loadMalFeed);