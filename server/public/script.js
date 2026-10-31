
const API_URL = "http://localhost:3000/api/news";

const newsContent = document.getElementById("newsContent");
const filters = document.querySelectorAll(".news-filters button");
const refreshButton = document.getElementById("refreshNews");

let currentCategory = "all";

async function loadNews(category = "all", refresh = false) {
    newsContent.innerHTML = '<p class="news-empty">در حال دریافت اخبار...</p>';

    try {
        const url = `${API_URL}?category=${encodeURIComponent(category)}${refresh ? "&refresh=true" : ""}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("دریافت اخبار ناموفق بود");
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "خطای API");
        }

        renderNews(data.news);

    } catch (error) {
        console.error("News Error:", error);

        newsContent.innerHTML = `
            <p class="news-empty">
                دریافت اخبار با مشکل مواجه شد.
                اتصال سرور را بررسی کنید.
            </p>
        `;
    }
}

function renderNews(news) {
    if (!news || news.length === 0) {
        newsContent.innerHTML =
            '<p class="news-empty">خبری برای نمایش وجود ندارد.</p>';
        return;
    }

    newsContent.innerHTML = news.map(item => {
        const title = escapeHTML(item.title);
        const description = escapeHTML(item.description || "");
        const source = escapeHTML(item.source || "منبع نامشخص");

        const date = item.pubDate
            ? new Date(item.pubDate).toLocaleDateString("fa-IR")
            : "";

        const image = isValidImage(item.image)
            ? `<img src="${escapeHTML(item.image)}" alt="${title}" loading="lazy" onerror="this.style.display='none'">`
            : "";

        return `
            <article class="news-card">
                ${image}

                <div class="news-card-body">
                    <div class="news-meta">
                        <span>${source}</span>
                        <span>${date}</span>
                    </div>

                    <h3>${title}</h3>

                    <p>${description.slice(0, 180)}</p>

                    <a href="${safeURL(item.link)}"
                       target="_blank"
                       rel="noopener noreferrer">
                        ادامه خبر ←
                    </a>
                </div>
            </article>
        `;
    }).join("");
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function safeURL(value) {
    try {
        const url = new URL(value);

        if (!["http:", "https:"].includes(url.protocol)) {
            return "#";
        }

        return escapeHTML(url.href);
    } catch {
        return "#";
    }
}

function isValidImage(value) {
    if (!value) return false;

    try {
        const url = new URL(value);

        return (
            ["http:", "https:"].includes(url.protocol) &&
            /\.(jpg|jpeg|png|webp|gif)(?:$|[?#])/i.test(url.pathname)
        );
    } catch {
        return false;
    }
}

filters.forEach(button => {
    button.addEventListener("click", () => {
        filters.forEach(item => item.classList.remove("active"));

        button.classList.add("active");

        currentCategory = button.dataset.category;

        loadNews(currentCategory);
    });
});

refreshButton.addEventListener("click", () => {
    loadNews(currentCategory, true);
});

loadNews();
