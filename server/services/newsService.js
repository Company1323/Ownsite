const Parser = require("rss-parser");

const parser = new Parser({
    timeout: 8000,
    headers: {
        "User-Agent": "Mozilla/5.0 MyWebsite-News/1.0"
    },
    customFields: {
        item: [
            ["media:content", "mediaContent"],
            ["media:thumbnail", "mediaThumbnail"],
            ["content:encoded", "encoded"]
        ]
    }
});

const feeds = [
    {
        name: "Google News - Iran War Persian",
        url: "https://news.google.com/rss/search?q=%D8%A7%DB%8C%D8%B1%D8%A7%D9%86+%D8%AC%D9%86%DA%AF+OR+%D8%AD%D9%85%D9%84%D9%87+OR+%D8%A7%D8%B3%D8%B1%D8%A7%D8%A6%DB%8C%D9%84&hl=fa&gl=IR&ceid=IR:fa",
        language: "fa",
        category: "war"
    },
    {
        name: "Google News - Iran War English",
        url: "https://news.google.com/rss/search?q=Iran+war+OR+Iran+Israel+OR+Iran+attack&hl=en-US&gl=US&ceid=US:en",
        language: "en",
        category: "war"
    },
    {
        name: "BBC Persian",
        url: "https://feeds.bbci.co.uk/persian/rss.xml",
        language: "fa",
        category: "war"
    },
    {
        name: "DW Persian",
        url: "https://rss.dw.com/syndication/feeds/dwworld.per.xml",
        language: "fa",
        category: "war"
    },
    {
        name: "Tasnim",
        url: "https://www.tasnimnews.com/fa/rss/feed/0/8/0/%D9%85%D9%87%D9%85%D8%AA%D8%B1%DB%8C%D9%86-%D8%A7%D8%AE%D8%A8%D8%A7%D8%B1-%D8%AA%D8%B3%D9%86%DB%8C%D9%85",
        language: "fa",
        category: "war"
    },
    {
        name: "Iran International",
        url: "https://www.iranintl.com/feed",
        language: "fa",
        category: "war"
    },
    {
        name: "TechCrunch",
        url: "https://techcrunch.com/feed/",
        language: "en",
        category: "technology"
    },
    {
        name: "Digiato",
        url: "https://digiato.com/feed/",
        language: "fa",
        category: "technology"
    },
    {
        name: "BBC Technology",
        url: "https://feeds.bbci.co.uk/news/technology/rss.xml",
        language: "en",
        category: "technology"
    },
    {
        name: "Vigiato",
        url: "https://vigiato.net/feed/",
        language: "fa",
        category: "gaming",
        optional: true
    },
    {
        name: "Gamefa",
        url: "https://gamefa.com/feed/",
        language: "fa",
        category: "gaming"
    },
    {
        name: "Digiato Gaming",
        url: "https://digiato.com/feed/",
        language: "fa",
        category: "gaming",
        filterKeywords: true
    },
    {
        name: "Polygon",
        url: "https://www.polygon.com/rss/index.xml",
        language: "en",
        category: "gaming"
    },
    {
        name: "Varzesh3",
        url: "https://www.varzesh3.com/rss/all",
        language: "fa",
        category: "football"
    }
];

const keywords = {
    gaming: [
        "بازی", "گیم", "گیمر", "گیمینگ",
        "پلی استیشن", "ایکس باکس", "نینتندو",
        "استیم", "کنسول", "بازی موبایل",
        "بازی ویدیویی", "game", "gaming",
        "gamer", "playstation", "xbox",
        "nintendo", "steam", "video game",
        "gameplay", "dlc", "game studio"
    ]
};

let cache = [];
let lastUpdate = 0;
let refreshPromise = null;

const CACHE_TIME = 5 * 60 * 1000;

function cleanText(value = "") {
    return String(value)
        .replace(/<!\[CDATA\[|\]\]>/g, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();
}

function getImage(item) {
    const media = Array.isArray(item.mediaContent)
        ? item.mediaContent[0]
        : item.mediaContent;

    const thumbnail = Array.isArray(item.mediaThumbnail)
        ? item.mediaThumbnail[0]
        : item.mediaThumbnail;

    const content = item.encoded || item.content || "";

    const contentImage = content.match(
        /<img[^>]+src=["']([^"']+)["']/i
    );

    return (
        item.enclosure?.url ||
        media?.$?.url ||
        thumbnail?.$?.url ||
        contentImage?.[1] ||
        null
    );
}

function containsKeyword(text, category) {
    const list = keywords[category] || [];

    const normalizedText = text
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/‌/g, " ")
        .toLowerCase();

    return list.some(keyword =>
        normalizedText.includes(
            keyword.replace(/‌/g, " ").toLowerCase()
        )
    );
}

function isValidNews(news, feed) {
    const text = `${news.title} ${news.description}`;

    if (feed.category === "war") {
        return true;
    }

    if (feed.filterKeywords) {
        return containsKeyword(text, "gaming");
    }

    return true;
}

async function readFeed(feed) {
    try {
        const result = await parser.parseURL(feed.url);

        const news = result.items.map(item => {
            const article = {
                id: item.guid || item.link,
                title: cleanText(item.title),
                description: cleanText(
                    item.contentSnippet ||
                    item.encoded ||
                    item.content ||
                    item.summary ||
                    ""
                ),
                link: item.link || "",
                image: getImage(item),
                pubDate: item.isoDate || item.pubDate || null,
                source: feed.name,
                language: feed.language,
                category: feed.category
            };

            if (!article.title || !article.link) {
                return null;
            }

            if (!isValidNews(article, feed)) {
                return null;
            }

            return article;
        }).filter(Boolean);

        console.log(
            `SUCCESS: ${feed.name} | ${news.length} news`
        );

        return {
            source: feed.name,
            success: true,
            news
        };

    } catch (error) {
        console.error(
            `RSS ERROR [${feed.name}]: ${error.message}`
        );

        return {
            source: feed.name,
            success: false,
            news: []
        };
    }
}

function filterNews(news, category) {
    if (category === "all") {
        return news;
    }

    return news.filter(item =>
        item.category === category
    );
}

function sortNews(news) {
    return news.sort((a, b) => {
        const dateA = new Date(a.pubDate || 0).getTime();
        const dateB = new Date(b.pubDate || 0).getTime();

        return (
            (Number.isFinite(dateB) ? dateB : 0) -
            (Number.isFinite(dateA) ? dateA : 0)
        );
    });
}

async function updateNewsCache() {
    console.log("\n========== NEWS UPDATE ==========");

    const results = await Promise.all(
        feeds.map(feed => readFeed(feed))
    );

    const successfulSources = new Set(
        results
            .filter(result => result.success)
            .map(result => result.source)
    );

    const freshNews = results.flatMap(result =>
        result.news
    );

    const oldNews = cache.filter(item =>
        !successfulSources.has(item.source)
    );

    const combinedNews = [
        ...freshNews,
        ...oldNews
    ];

    const uniqueNews = new Map();

    for (const item of combinedNews) {
        const key = `${item.link}|${item.category}`;

        if (!uniqueNews.has(key)) {
            uniqueNews.set(key, item);
        }
    }

    cache = sortNews(
        Array.from(uniqueNews.values())
    );

    lastUpdate = Date.now();

    console.log("Total news:", cache.length);
    console.log("Successful sources:", successfulSources.size);
    console.log("Failed sources:", feeds.length - successfulSources.size);
    console.log("=================================\n");

    return cache;
}

async function getNews(category = "all", force = false) {
    const now = Date.now();

    const cacheIsFresh =
        cache.length > 0 &&
        now - lastUpdate < CACHE_TIME;

    if (!force && cacheIsFresh) {
        console.log("Using cached news");
        return filterNews(cache, category);
    }

    if (!refreshPromise) {
        refreshPromise = updateNewsCache()
            .finally(() => {
                refreshPromise = null;
            });
    } else {
        console.log("Waiting for current news update...");
    }

    await refreshPromise;

    return filterNews(cache, category);
}

module.exports = {
    getNews
};