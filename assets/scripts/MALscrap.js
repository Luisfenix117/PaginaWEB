// Carga un RSS usando proxies públicos para evitar bloqueos por CORS.
        async function fetchRssViaProxy(rssUrl) {
            const proxies = [
                'https://api.allorigins.win/raw?url=',
                'https://api.allorigins.win/get?url=',
                'https://corsproxy.io/?',
            ];

            for (const proxy of proxies) {
                try {
                    const response = await fetch(proxy + encodeURIComponent(rssUrl));
                    if (!response.ok) continue;

                    if (proxy.includes('allorigins.win/get')) {
                        const json = await response.json();
                        if (json && json.contents) {
                            return json.contents;
                        }
                        continue;
                    }

                    const text = await response.text();
                    if (text.trim().startsWith('<') && !text.includes('<html')) {
                        return text;
                    }
                } catch (error) {
                    console.warn('Proxy fallo:', proxy, error);
                }
            }

            throw new Error('No se pudo cargar el RSS desde ningún proxy');
        }

        // Extrae la portada de un item de MyAnimeList usando og:image.
        // Se usa proxy para evitar que el navegador bloquee la petición por CORS.
        async function fetchCoverImage(itemUrl) {
            const proxies = [
                'https://api.allorigins.win/raw?url=',
                'https://corsproxy.io/?',
            ];

            for (const proxy of proxies) {
                try {
                    const response = await fetch(proxy + encodeURIComponent(itemUrl));
                    if (!response.ok) continue;
                    const html = await response.text();
                    const match = html.match(/<meta property="og:image" content="([^"]+)"/i);
                    if (match) {
                        return match[1];
                    }
                } catch (error) {
                    console.warn('Error al cargar portada', proxy, error);
                }
            }

            return null;
        }

        // Crea el widget con los últimos 3 elementos del RSS.
        // Muestra la portada a la izquierda y el estado/capítulo a la derecha.
        async function loadMalFeed(rssUrl, elementId) {
            const container = document.getElementById(elementId);
            container.innerHTML = '<p>Cargando...</p>';

            try {
                const text = await fetchRssViaProxy(rssUrl);
                const parser = new DOMParser();
                const xml = parser.parseFromString(text, 'text/xml');
                const items = xml.querySelectorAll('item');

                if (items.length === 0) {
                    container.innerHTML = '<p>No se encontraron entradas.</p>';
                    return;
                }

                const list = document.createElement('div');
                list.className = 'mal-items';

                for (const item of Array.from(items).slice(0, 3)) {
                    const title = item.querySelector('title')?.textContent || 'Sin título';
                    const link = item.querySelector('link')?.textContent || '#';
                    const description = item.querySelector('description')?.textContent || '';
                    const pubDate = item.querySelector('pubDate')?.textContent || '';
                    const dateLabel = pubDate ? new Date(pubDate).toLocaleDateString('es-ES', {
                        day: '2-digit', month: 'short', year: 'numeric'
                    }) : '';

                    // Divide la descripción en estado y progreso del capítulo/episodio.
                    const [stateText, progressText] = description.split(' - ').map(part => part?.trim() || '');

                    const imageUrl = await fetchCoverImage(link);
                    const card = document.createElement('div');
                    card.className = 'mal-item';
                    card.innerHTML = `
                        ${imageUrl ? `<div class="mal-item-thumb"><img src="${imageUrl}" alt="${title}" loading="lazy"></div>` : ''}
                        <div class="mal-item-content">
                            <a class="mal-item-title" href="${link}" target="_blank" rel="noopener noreferrer">${title}</a>
                            ${stateText ? `<div class="mal-item-state">${stateText}</div>` : ''}
                            ${progressText ? `<div class="mal-item-progress">${progressText}</div>` : ''}
                            <div class="mal-item-date">${dateLabel}</div>
                        </div>
                    `;

                    list.appendChild(card);
                }

                container.innerHTML = '';
                container.appendChild(list);
            } catch (error) {
                container.innerHTML = '<p>Error cargando RSS.</p>';
                console.error(error);
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            loadMalFeed('https://myanimelist.net/rss.php?type=rw&u=Luisfenix117', 'mal-anime-list');
            loadMalFeed('https://myanimelist.net/rss.php?type=rm&u=Luisfenix117', 'mal-manga-list');
        });