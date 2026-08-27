const DATA_URL = "/content/site.json";

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getValue = (source, path) =>
  path.split(".").reduce((value, key) => value?.[key], source);

const renderParagraphs = (value = "") =>
  String(value)
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
    .join("");

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
};

function applyContent(data) {
  document.querySelectorAll("[data-content]").forEach((element) => {
    const value = getValue(data, element.dataset.content);
    if (value !== undefined && value !== null) element.textContent = value;
  });

  if (data.brand?.facebook_url) {
    document.querySelectorAll("[data-facebook-link]").forEach((link) => {
      link.href = data.brand.facebook_url;
    });
  }

  const portrait = document.querySelector("[data-profile-image]");
  if (portrait && data.brand?.profile_image) {
    portrait.src = data.brand.profile_image;
    portrait.alt = data.brand.profile_alt || "Portrait of Paul Rabas";
  }

  const colors = data.theme || {};
  const root = document.documentElement;
  if (colors.ink) root.style.setProperty("--ink", colors.ink);
  if (colors.paper) root.style.setProperty("--paper", colors.paper);
  if (colors.surface) root.style.setProperty("--white", colors.surface);
  if (colors.accent) root.style.setProperty("--yellow", colors.accent);
  if (colors.accent_dark) root.style.setProperty("--yellow-deep", colors.accent_dark);

  renderTopics(data.topics || []);
  renderPortfolio(data.portfolio || []);
  renderStories(data.stories || [], data.brand?.facebook_url);
}

function renderTopics(topics) {
  const ticker = document.querySelector("#ticker-items");
  if (!ticker || !topics.length) return;
  ticker.innerHTML = topics
    .map((topic) => `<span>${escapeHtml(topic)}</span><b aria-hidden="true">✦</b>`)
    .join("");
}

function renderPortfolio(items) {
  const list = document.querySelector("#portfolio-list");
  if (!list || !items.length) return;
  list.innerHTML = items
    .map(
      (item, index) => `
        <article>
          <span>${String(index + 1).padStart(2, "0")}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </article>`,
    )
    .join("");
}

function renderStories(items, fallbackUrl) {
  const grid = document.querySelector("#stories-grid");
  if (!grid) return;
  const published = items.filter((item) => item.published !== false);
  if (!published.length) return;

  grid.innerHTML = published
    .map((item) => {
      const videoUrl = item.video_url || fallbackUrl || "#";
      const image = item.thumbnail
        ? `<img class="story-thumbnail" src="${escapeHtml(item.thumbnail)}" alt="${escapeHtml(item.thumbnail_alt || item.title)}">`
        : `<div class="story-thumbnail story-thumbnail-placeholder" aria-hidden="true"><span>PT</span></div>`;
      const story = item.story
        ? `<details><summary>Read the story</summary><div class="story-body">${renderParagraphs(item.story)}</div></details>`
        : "";

      return `
        <article class="story-card">
          ${image}
          <div class="story-card-content">
            <div class="story-meta">
              <span>${escapeHtml(item.category || "Paul Today")}</span>
              <time datetime="${escapeHtml(item.date || "")}">${escapeHtml(formatDate(item.date))}</time>
            </div>
            <h3>${escapeHtml(item.title)}</h3>
            ${item.excerpt ? `<p class="story-excerpt">${escapeHtml(item.excerpt)}</p>` : ""}
            ${story}
            <a class="story-watch" href="${escapeHtml(videoUrl)}" target="_blank" rel="noreferrer">Watch on Facebook <span aria-hidden="true">↗</span></a>
          </div>
        </article>`;
    })
    .join("");
}

fetch(DATA_URL, { cache: "no-store" })
  .then((response) => {
    if (!response.ok) throw new Error("Content could not be loaded");
    return response.json();
  })
  .then(applyContent)
  .catch(() => {
    document.documentElement.classList.add("content-fallback");
  });
