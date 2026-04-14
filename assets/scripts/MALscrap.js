/* === CONFIGURACIÓN DE PROXIES CON BLACKLIST === */
const PROXY_CONFIG = [
    { url: 'https://corsproxy.io/?', active: true },
    { url: 'https://api.allorigins.win/raw?url=', active: true },
    { url: 'https://api.codetabs.com/v1/proxy?quest=', active: true },
    { url: 'https://thingproxy.freeboard.io/fetch/', active: true }
];

const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchWithRetry(url) {
    const antiCacheUrl = `${url}${url.includes('?') ? '&' : '?'}_nc=${Date.now()}`;
    
    // Filtramos solo los proxies que no han fallado aún
    const availableProxies = PROXY_CONFIG.filter(p => p.active);

    if (availableProxies.length === 0) {
        throw new Error("SISTEMA // Todos los proxies están en lista negra.");
    }

    for (const proxyObj of availableProxies) {
        try {
            console.log(`SISTEMA // Intento vía: ${proxyObj.url}`);
            const response = await fetch(proxyObj.url + encodeURIComponent(antiCacheUrl));
            
            if (!response.ok) throw new Error(`Status ${response.status}`);

            const data = await response.text();
            
            // Verificación de contenido real
            if (data && (data.includes('<rss') || data.includes('<html'))) {
                return data;
            } else {
                throw new Error("Contenido inválido");
            }

        } catch (error) {
            // BLOQUEO CRÍTICO: Marcamos el proxy como inactivo para esta sesión
            proxyObj.active = false; 
            console.warn(`SISTEMA // Proxy ${proxyObj.url} enviado a lista negra. Motivo: ${error.message}`);
            await delay(200); 
        }
    }
    
    throw new Error("SISTEMA // Fallo total tras agotar proxies activos.");
}

        // Extrae la portada de un item de MyAnimeList usando og:image.
        // Se usa proxy para evitar que el navegador bloquee la petición por CORS.
        async function fetchCoverImage(itemUrl) {
            const proxies = [
                'https://thingproxy.freeboard.io/fetch/',
                'https://api.codetabs.com/v1/proxy?quest=',
                'https://api.allorigins.win/raw?url=',
                'https://corsproxy.io/?',
            ];

            for (const proxy of proxies) {
                try {
                    const response = await fetch(proxy + encodeURIComponent(itemUrl));
                    if (!response.ok) continue;
                    const html = await response.text();
                    const match = html.match(/<meta\s+(?:property|itemprop)=['"](?:og:image|image)['"]\s+content=['"]([^'"]+)['"]/i)
                        || html.match(/<meta\s+content=['"]([^'"]+)['"]\s+(?:property|itemprop)=['"](?:og:image|image)['"]/i);
                    if (match) {
                        return match[1];
                    }
                } catch (error) {
                    console.warn('Error al cargar portada', proxy, error);
                }
            }

            return null;
        }

        const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hora de caché

        function getCacheKey(elementId) {
            return `mal-cache-${elementId}`;
        }

        function loadCache(elementId, allowStale = false) {
            try {
                const raw = localStorage.getItem(getCacheKey(elementId));
                if (!raw) return null;
                const data = JSON.parse(raw);
                if (!data.timestamp || !data.items) return null;
                if (Date.now() - data.timestamp > CACHE_TTL_MS) {
                    if (allowStale) {
                        return data.items;
                    }
                    localStorage.removeItem(getCacheKey(elementId));
                    return null;
                }
                return data.items;
            } catch (error) {
                console.warn('Error leyendo cache', error);
                return null;
            }
        }

        function saveCache(elementId, items) {
            try {
                const data = {
                    timestamp: Date.now(),
                    items,
                };
                localStorage.setItem(getCacheKey(elementId), JSON.stringify(data));
            } catch (error) {
                console.warn('Error guardando cache', error);
            }
        }

        function formatDescription(description) {
            const [stateText, progressText] = description.split(' - ').map(part => part?.trim() || '');
            return { stateText, progressText };
        }

        function renderMalItems(container, items) {
            if (!items || items.length === 0) {
                container.innerHTML = '<p>No se encontraron entradas.</p>';
                return;
            }

            const list = document.createElement('div');
            list.className = 'mal-items';

            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'mal-item';
                card.innerHTML = `
                    ${item.imageUrl ? `<div class="mal-item-thumb"><img src="${item.imageUrl}" alt="${item.title}" loading="lazy"></div>` : ''}
                    <div class="mal-item-content">
                        <a class="mal-item-title" href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
                        ${item.stateText ? `<div class="mal-item-state">${item.stateText}</div>` : ''}
                        ${item.progressText ? `<div class="mal-item-progress">${item.progressText}</div>` : ''}
                        <div class="mal-item-date">${item.dateLabel}</div>
                    </div>
                `;
                list.appendChild(card);
            });

            container.innerHTML = '';
            container.appendChild(list);
        }

        function parseRssItems(xmlText) {
            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlText, 'text/xml');
            const items = Array.from(xml.querySelectorAll('item')).slice(0, 3);
            return items.map(item => {
                const title = item.querySelector('title')?.textContent || 'Sin título';
                const link = item.querySelector('link')?.textContent || '#';
                const description = item.querySelector('description')?.textContent || '';
                const pubDate = item.querySelector('pubDate')?.textContent || '';
                const dateLabel = pubDate ? new Date(pubDate).toLocaleDateString('es-ES', {
                    day: '2-digit', month: 'short', year: 'numeric'
                }) : '';
                const { stateText, progressText } = formatDescription(description);
                return { title, link, description, stateText, progressText, dateLabel, imageUrl: null };
            });
        }

        async function enrichImages(items, previousImageMap = {}) {
            return Promise.all(items.map(async item => {
                if (item.imageUrl) {
                    return item;
                }
                const fetchedImage = await fetchCoverImage(item.link);
                item.imageUrl = fetchedImage || previousImageMap[item.link] || null;
                return item;
            }));
        }

        // Crea el widget con los últimos 3 elementos del RSS.
        // Muestra la portada a la izquierda y el estado/capítulo a la derecha.
        async function loadMalFeed(rssUrl, elementId) {
            const container = document.getElementById(elementId);
            const cachedItems = loadCache(elementId);
            const staleItems = cachedItems ? null : loadCache(elementId, true);

            if (cachedItems) {
                renderMalItems(container, cachedItems);
            } else if (staleItems) {
                renderMalItems(container, staleItems);
            } else {
                container.innerHTML = '<p>Cargando...</p>';
            }

            try {
                const text = await fetchRssViaProxy(rssUrl);
                let items = parseRssItems(text);
                const previousImageMap = (cachedItems || staleItems || []).reduce((acc, item) => {
                    if (item.link && item.imageUrl) acc[item.link] = item.imageUrl;
                    return acc;
                }, {});
                items = await enrichImages(items, previousImageMap);
                renderMalItems(container, items);
                saveCache(elementId, items);
            } catch (error) {
                if (!cachedItems && !staleItems) {
                    container.innerHTML = '<p>Error cargando RSS.</p>';
                }
                console.error(error);
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            loadMalFeed('https://myanimelist.net/rss.php?type=rw&u=Luisfenix117', 'mal-anime-list');
            loadMalFeed('https://myanimelist.net/rss.php?type=rm&u=Luisfenix117', 'mal-manga-list');
        });
