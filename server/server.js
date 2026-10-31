
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const newsRoutes = require("./routes/news");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const frontendPath = path.join(__dirname, "..", "public");

app.use(express.static(frontendPath));

app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// API Routes
app.use("/api/news", newsRoutes);

// Homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 404 Handler
app.use((req, res) => {
    res.status(404).send("404 - Page Not Found");
});

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("--------------------------------");
    console.log("MyWebsite Server Started!");
    console.log(`Website: http://localhost:${PORT}`);
    console.log(`News API: http://localhost:${PORT}/api/news`);
    console.log("--------------------------------");
});

