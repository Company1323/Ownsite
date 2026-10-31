
(() => {
    const API_URL = "/api/news";

    const homeNews = document.getElementById("homeNews");
    const newsContent = document.getElementById("newsContent");
    const newsCount = document.getElementById("newsCount");
    const refreshButton = document.getElementById("refreshNews");
    const lastNewsUpdate = document.getElementById("lastNewsUpdate");
    const newsStatus = document.getElementById("newsStatus");

    const filters = document.querySelectorAll(".news-filters button");

    let currentCategory = "all";
    let requestNumber = 0;

    async function loadNews(category = "all", refresh = false) {
        const containers = [homeNews, newsContent].filter(Boolean);

        if (!containers.length) return;

        const thisRequest = ++requestNumber;

        if (!refresh) {
            containers.forEach(container => {
                if (!container.innerHTML.trim()) {
                    container.innerHTML = `
                        <p class="news-message">در حال دریافت اخبار...</p>
                    `;
                }
            });
        }

        if (refreshButton && refresh) {
            refreshButton.disabled = true;
            refreshButton.dataset.originalText =
                refreshButton.textContent;

            refreshButton.textContent = "در حال به‌روزرسانی...";
            refreshButton.classList.add("refreshing");
        }

        if (newsStatus) {
            newsStatus.textContent = refresh
                ? "در حال بررسی منابع خبری..."
                : "";
        }

        try {
            const url =
                `${API_URL}?category=${encodeURIComponent(category)}` +
                (refresh ? "&refresh=true" : "");

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("دریافت اخبار ناموفق بود");
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || "خطای API");
            }

            if (thisRequest !== requestNumber) return;

            const allItems = data.news || [];

            if (homeNews) {
                renderNews(allItems.slice(0, 8), homeNews);
            }

            if (newsContent) {
                renderNews(allItems, newsContent);
            }

            if (newsCount) {
                newsCount.textContent = `${allItems.length} خبر`;
            }

            if (refresh && lastNewsUpdate) {
                lastNewsUpdate.textContent =
                    `آخرین به‌روزرسانی: ${new Date().toLocaleTimeString("fa-IR")}`;
            }

            if (newsStatus) {
                newsStatus.textContent = refresh
                    ? "اخبار با موفقیت بررسی شدند."
                    : "";
            }

        } catch (error) {
            console.error("News Error:", error);

            if (thisRequest !== requestNumber) return;

            const hasOldNews = containers.some(container =>
                container.querySelector(".news-card")
            );

            if (!hasOldNews) {
                containers.forEach(container => {
                    container.innerHTML = `
                        <p class="news-message">
                            دریافت اخبار با مشکل مواجه شد.
                            لطفاً اتصال سرور را بررسی کنید.
                        </p>
                    `;
                });
            }

            if (newsStatus) {
                newsStatus.textContent =
                    "به‌روزرسانی ناموفق بود؛ اخبار قبلی حفظ شدند.";
            }

        } finally {
            if (thisRequest === requestNumber && refreshButton && refresh) {
                refreshButton.disabled = false;

                refreshButton.textContent =
                    refreshButton.dataset.originalText || "به‌روزرسانی";

                refreshButton.classList.remove("refreshing");
            }
        }
    }

    function renderNews(news, container) {
        if (!news.length) {
            container.innerHTML = `
                <p class="news-message">خبری برای نمایش وجود ندارد.</p>
            `;
            return;
        }

        container.innerHTML = news.map(item => {
            const title = escapeHTML(item.title || "");
            const description = escapeHTML(item.description || "");
            const source = escapeHTML(item.source || "منبع نامشخص");

            const date = item.pubDate &&
                !isNaN(new Date(item.pubDate).getTime())
                ? new Date(item.pubDate).toLocaleDateString("fa-IR")
                : "";

            const image = isValidImage(item.image)
                ? `
                    <img
                        src="${escapeHTML(item.image)}"
                        alt="${title}"
                        loading="lazy"
                        onerror="this.style.display='none'"
                    >
                `
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

                        <a
                            href="${safeURL(item.link)}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
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
                /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(url.pathname)
            );

        } catch {
            return false;
        }
    }

    filters.forEach(button => {
        button.addEventListener("click", () => {
            filters.forEach(item =>
                item.classList.remove("active")
            );

            button.classList.add("active");

            currentCategory = button.dataset.category || "all";

            loadNews(currentCategory);
        });
    });

    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            loadNews(currentCategory, true);
        });
    }

    loadNews();
})();
