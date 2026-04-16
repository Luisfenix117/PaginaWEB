const fs = require('fs');
const axios = require('axios'); // Necesitarás instalarlo o usar fetch (Node 18+)
const { JSDOM } = require('jsdom');

async function fetchCover(url) {
    try {
        const { data } = await axios.get(url);
        const match = data.match(/<meta property="og:image" content="([^"]+)"/i);
        return match ? match[1] : null;
    } catch (e) { return null; }
}

async function getFeed(url) {
    const { data } = await axios.get(url);
    const dom = new JSDOM(data, { contentType: "text/xml" });
    const items = Array.from(dom.window.document.querySelectorAll('item')).slice(0, 3);
    
    return Promise.all(items.map(async (item) => {
        const link = item.querySelector('link').textContent;
        return {
            title: item.querySelector('title').textContent,
            link: link,
            desc: item.querySelector('description').textContent,
            pubDate: item.querySelector('pubDate').textContent,
            image: await fetchCover(link)
        };
    }));
}

async function main() {
    const anime = await getFeed('https://myanimelist.net/rss.php?type=rw&u=Luisfenix117');
    const manga = await getFeed('https://myanimelist.net/rss.php?type=rm&u=Luisfenix117');
    
    fs.writeFileSync('./assets/data/mal_data.json', JSON.stringify({ anime, manga }));
}

main();