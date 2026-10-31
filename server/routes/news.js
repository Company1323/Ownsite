
const express = require("express");
const router = express.Router();

const { getNews } = require("../services/newsService");

const categories = [
    "all",
    "war",
    "technology",
    "gaming",
    "football"
];

router.get("/", async (req, res) => {
    try {
        const category = req.query.category || "all";
        const refresh = req.query.refresh === "true";

        if (!categories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category"
            });
        }

        const news = await getNews(category, refresh);

        res.json({
            success: true,
            count: news.length,
            category,
            updatedAt: new Date().toISOString(),
            news
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Could not fetch news"
        });
    }
});

router.get("/search", async (req, res) => {
    try {
        const query = String(req.query.q || "")
            .trim()
            .toLowerCase();

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const news = await getNews("all");

        const results = news.filter(item =>
            `${item.title} ${item.description}`
                .toLowerCase()
                .includes(query)
        );

        res.json({
            success: true,
            count: results.length,
            news: results
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Search failed"
        });
    }
});

module.exports = router;
