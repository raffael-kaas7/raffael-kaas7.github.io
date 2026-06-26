import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";

const SITE_URL = "https://rkaas.de";
const BLOG_SOURCE_DIR = "assets/blog";
const BLOG_OUTPUT_DIR = "blog";
const SITE_CONFIG_PATH = "site.config.json";
const AUTHOR_NAME = "Raffael Kaas";
const PROFILE_IMAGE = "/assets/img/me-tshirt.png";
const NOW_FILE_PATH = "now.txt";
const HOME_POST_LIMIT = 6;
const BOOKS_LASTMOD = "2026-06-15";
const TRAVEL_LASTMOD = "2026-06-15";
const DEFAULT_NOW_UPDATED = "updated: 2026-06-25";
const DEFAULT_NOW_LINES = [
  "working on this website redesign",
  "preparing article slots for the next months",
  "collecting notes that are worth keeping",
  "trying to make this place feel more like mine",
];
const NAV_ITEMS = [
  { href: "/", label: "Home", page: "home" },
  { href: "/blog/", label: "Blog", page: "blog" },
  { href: "/books/", label: "Books", page: "books" },
  { href: "/travel/", label: "Travel", page: "travel" },
];
const STATIC_NAV_PAGES = [
  { path: "index.html", page: "home" },
  { path: "blog.html", page: "blog" },
  { path: "books/index.html", page: "books" },
  { path: "books/bookshelf/index.html", page: "books" },
  { path: "travel/index.html", page: "travel" },
  { path: "travel/map/index.html", page: "travel" },
];
const AREAS = [
  {
    key: "work",
    label: "Work",
    href: "/work/",
    marker: "Software, Experience, Projects",
    description:
      "Thoughts on current trends in software engineering, private projects, and personal experiences.",
    roomIntro: [
      {
        type: "p",
        text: "During my studies and in my professional career so far, I have mainly worked on embedded systems in the automotive sector.",
      },
      {
        type: "p",
        text: "I enjoy working on Linux-based systems, using C/C++ for embedded software development and Python to make life easier or to quickly prototype ideas.",
      },
      {
        type: "p",
        text: "Since the age of agentic coding, I have also tried building applications that include a frontend. Here is my personal [dividend tracker tool](https://github.com/raffael-kaas7/depot_tracker) based on the comdirect developer API.",
      },
      {
        type: "p",
        text: "I am currently working on my own [Gym Logging Tool](https://liftlytics.de/) with minimized screen time in the gym. It's a Progressive Web App, fully implemented through spec-driven development.",
      },
    ],
  },
  {
    key: "health",
    label: "Health",
    href: "/health/",
    marker: "Workout, Running, Nutrition",
    description:
      "All about workout, nutrition, recovery, and how I try staying healthy alongside normal work and life.",
    roomIntro: [
      {
        type: "p",
        text: "I am not (yet) a die-hard member of the longevity community, but I am definitely inspired by Peter Attia and his book 'Outlive'. I focus on muscle mass, VO2 max, sleep, and mental health.",
      },
      {
        type: "p",
        text: "I used to actively play soccer, but due to many injuries I decided to quit. Now I keep myself fit with running and gym training / calisthenics.",
      },
      {
        type: "p",
        text: "I am currently working on my own [Gym Logging Tool](https://liftlytics.de/) with minimized screen time in the gym. It's a Progressive Web App, fully implemented through spec-driven development.",
      },
    ],
  },
  {
    key: "money",
    label: "Money",
    href: "/money/",
    marker: "Investing, Spending, Analysis",
    description:
      "My personal thoughts on money: Financial habits, investments, spending, and my passion for the stock market.",
    roomIntro: [
      {
        type: "p",
        text: "I have been passionate about the stock market for years, closely following companies and market news while being a buy-and-hold investor. So far, the performance of my stock picks compared to my ETFs has, of course, been very disappointing :-)",
      },
      {
        type: "p",
        text: "I have a separate portfolio for my dividend-paying stocks and funds. Thanks to Comdirect and their official developer API, I can use my own [dividend tracking dashboard](https://github.com/raffael-kaas7/depot_tracker) with a simple pushTAN update mechanism.",
      },
    ],
  },
  {
    key: "travel",
    label: "Travel",
    href: "/travel/",
    marker: "Maps, Routes, Memories",
    description:
      "Travel notes, maps, routes, photos, places, and memories I want to keep instead of losing them in the cloud.",
    roomIntro: [
      {
        type: "p",
        text: "In my 20s, I had the privilege of traveling to many countries, also a few outside of Europe, which motivated me to get one of these 'scratch-off-where-you-have-been' world maps. I have a [digital one](/travel/map/).",
      },
      {
        type: "p",
        text: "Unfortunately, I didn't document everything as thoroughly as I did my [trip through Australia](../blog/roadtrip-from-perth-to-sydney/). Setting up this space is meant to motivate me to do the same documentation work in the future, and hopefully it will also serve as inspiration for some of you.",
      },
    ],
  },
  {
    key: "life",
    label: "Life",
    href: "/life/",
    marker: "Notes, Reflections, Goals",
    description:
      "Personal notes on life in general. New interests, achievements, changing goals, failures, reflections.",
    roomIntro: [
      {
        type: "p",
        text: "I'm not a life coach, and I don't intend to offer advice here. I would describe myself as open-minded and reflective. This space serves as a container for all reflections, ideas, and experiences that don't fit into any of the other topics.",
      },
    ],
  },
  {
    key: "books",
    label: "Books",
    href: "/books/",
    marker: "Books, Quotes, Ideas",
    description:
      "Books that shaped my thinking, ideas I want to remember, and a collection of notes I keep returning to.",
    roomIntro: [
      {
        type: "p",
        text: "For a couple of years, reading around 20 minutes before sleeping has become a habit. It calms me down and helps me get to sleep. I am not sure if this is best for remembering what I've read, but I enjoy it.",
      },
      {
        type: "p",
        text: "So far, I've mainly read nonfiction, much of it in the areas of personal development and finance. I imagine that will change in the future because I feel like I am currently saturated by these topics.",
      },
      {
        type: "p",
        text: "Check out my [digital bookshelf](/books/bookshelf/). You might find your next read.",
      },
    ],
  },
];
const AREA_BY_KEY = new Map(AREAS.map((area) => [area.key, area]));
const GENERATED_AREA_KEYS = new Set(AREAS.map((area) => area.key));
const AREA_SPECIAL_LINKS = {};
const SPECIAL_COLLECTION_PAGES = [
  { loc: `${SITE_URL}/books/bookshelf/`, lastmod: BOOKS_LASTMOD },
  { loc: `${SITE_URL}/travel/map/`, lastmod: TRAVEL_LASTMOD },
];

const siteConfig = loadSiteConfig();
const postBlacklist = new Set(siteConfig.blog.postBlacklist);

function normalizePostIdentifier(value) {
  let identifier = String(value || "").trim();
  if (!identifier) return "";

  if (/^https?:\/\//i.test(identifier)) {
    try {
      identifier = new URL(identifier).pathname;
    } catch {
      return identifier;
    }
  }

  return identifier
    .replace(/^\/+/, "")
    .replace(/^blog\//, "")
    .replace(/^assets\/blog\//, "")
    .replace(/\/+$/, "")
    .replace(/\.md$/i, "");
}

function normalizePostList(values) {
  return Array.isArray(values)
    ? values.map(normalizePostIdentifier).filter(Boolean)
    : [];
}

function loadSiteConfig() {
  const defaultTabs = Object.fromEntries(
    NAV_ITEMS.map((item) => [item.page, true]),
  );
  const defaultBlog = { postBlacklist: [] };

  if (!existsSync(SITE_CONFIG_PATH)) {
    return { tabs: defaultTabs, blog: defaultBlog };
  }

  try {
    const parsed = JSON.parse(readFileSync(SITE_CONFIG_PATH, "utf8"));
    const blog = parsed.blog || {};
    return {
      tabs: {
        ...defaultTabs,
        ...(parsed.tabs || {}),
      },
      blog: {
        ...defaultBlog,
        postBlacklist: normalizePostList(blog.postBlacklist),
      },
    };
  } catch (error) {
    throw new Error(`Could not read ${SITE_CONFIG_PATH}: ${error.message}`);
  }
}

function isTabEnabled(page) {
  return siteConfig.tabs[page] !== false;
}

function parseFrontMatterValue(value) {
  let val = value.trim();

  if (val.startsWith("[") && val.endsWith("]")) {
    try {
      return JSON.parse(val);
    } catch {
      return val
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ""));
    }
  }

  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }

  if (val === "true" || val === "false") return val === "true";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  if (!Number.isNaN(Number(val)) && val !== "") return Number(val);
  return val;
}

function parseFrontMatter(text) {
  const fmRegex = /^---\n([\s\S]*?)\n---\n?/;
  const match = text.match(fmRegex);
  if (!match) return { fm: {}, body: text };

  const fm = {};
  match[1].split(/\r?\n/).forEach((line) => {
    if (!line.trim() || line.trim().startsWith("#")) return;
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    fm[key] = parseFrontMatterValue(line.slice(idx + 1));
  });

  return { fm, body: text.replace(fmRegex, "") };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function escapeXml(value) {
  return escapeHtml(value).replace(/'/g, "&apos;");
}

function readNowSnapshot() {
  const fallback = {
    updated: DEFAULT_NOW_UPDATED,
    lines: DEFAULT_NOW_LINES,
  };

  if (!existsSync(NOW_FILE_PATH)) return fallback;

  const raw = readFileSync(NOW_FILE_PATH, "utf8")
    .replace(/\r\n/g, "\n")
    .trimEnd();

  if (!raw.trim()) return fallback;

  const fileLines = raw.split("\n").map((line) => line.trimEnd());
  const updatedIndex = fileLines.findIndex((line) =>
    /^updated:/i.test(line.trim()),
  );
  const updated =
    updatedIndex >= 0 ? fileLines[updatedIndex].trim() : DEFAULT_NOW_UPDATED;
  const lines = fileLines
    .filter((_, index) => index !== updatedIndex)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    updated,
    lines: lines.length ? lines : DEFAULT_NOW_LINES,
  };
}

function renderTerminalLine(html, className, index) {
  return `<span class="about-terminal-line ${className}" style="--terminal-delay: ${index * 150}ms">${html}</span>`;
}

function renderTerminalCommand(command, index, path = "~") {
  return renderTerminalLine(
    `<span class="about-terminal-user">raffael@rkaas</span><span class="about-terminal-path">:${escapeHtml(path)}</span><span class="about-terminal-symbol">$</span> ${escapeHtml(command)}`,
    "is-command",
    index,
  );
}

function renderNowTerminal() {
  const snapshot = readNowSnapshot();
  const terminalLines = [];
  let lineIndex = 0;

  terminalLines.push(renderTerminalCommand("cd ~/my_blog/", lineIndex));
  lineIndex += 1;
  terminalLines.push(renderTerminalCommand("cat notes.txt", lineIndex, "~/my_blog"));
  lineIndex += 1;
  terminalLines.push(
    renderTerminalLine(
      escapeHtml(snapshot.updated),
      "is-output is-date",
      lineIndex,
    ),
  );
  lineIndex += 1;
  snapshot.lines.forEach((line) => {
    terminalLines.push(
      renderTerminalLine(escapeHtml(line), "is-output", lineIndex),
    );
    lineIndex += 1;
  });

  return `<div class="about-terminal" aria-label="Ubuntu terminal showing current notes">
          <div class="about-terminal-bar" aria-hidden="true">
            <span class="about-terminal-tab">raffael@rkaas: ~</span>
            <span class="about-terminal-actions">
              <span class="about-terminal-action is-search"></span>
              <span class="about-terminal-action is-menu"></span>
              <span class="about-terminal-window is-minimize"></span>
              <span class="about-terminal-window is-maximize"></span>
              <span class="about-terminal-window is-close"></span>
            </span>
          </div>
          <div class="about-terminal-screen">
            ${terminalLines.join("\n            ")}
          </div>
        </div>`;
}

function slugFromFile(file) {
  return basename(file, ".md");
}

function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function blogUrl(slug) {
  return `/blog/${slug}/`;
}

function canonicalUrl(slug) {
  return `${SITE_URL}${blogUrl(slug)}`;
}

function areaUrl(areaKey) {
  const area = AREA_BY_KEY.get(areaKey);
  return area ? area.href : "/blog/";
}

function areaCanonicalUrl(areaKey) {
  return `${SITE_URL}${areaUrl(areaKey)}`;
}

function normalizeAreaKey(value) {
  const key = String(value || "").trim().toLowerCase();
  return AREA_BY_KEY.has(key) ? key : "";
}

function normalizeTag(value) {
  return String(value || "").trim().toLowerCase();
}

function inferArea(fm) {
  const explicit = normalizeAreaKey(fm.area);
  if (explicit) return explicit;

  const tags = Array.isArray(fm.tags) ? fm.tags.map(normalizeTag) : [];
  const tagSet = new Set(tags);
  const title = normalizeTag(fm.title);
  const keywords = Array.isArray(fm.keywords)
    ? fm.keywords.map(normalizeTag)
    : [];
  const haystack = [...tags, ...keywords, title].join(" ");

  if (
    tagSet.has("software-engineering") ||
    tagSet.has("git workflow") ||
    tagSet.has("git cli") ||
    tagSet.has("ai") ||
    tagSet.has("process") ||
    tagSet.has("teams") ||
    tagSet.has("architecture") ||
    haystack.includes("software") ||
    haystack.includes("git") ||
    haystack.includes("regex") ||
    haystack.includes("log file") ||
    /\bai\b/.test(haystack) ||
    haystack.includes("architecture")
  ) {
    return "work";
  }

  if (
    haystack.includes("running") ||
    haystack.includes("fitness") ||
    haystack.includes("workout") ||
    haystack.includes("gym") ||
    haystack.includes("endurance")
  ) {
    return "health";
  }

  if (
    haystack.includes("investing") ||
    haystack.includes("finance") ||
    haystack.includes("portfolio") ||
    haystack.includes("stock") ||
    haystack.includes("money")
  ) {
    return "money";
  }

  if (
    haystack.includes("roadtrip") ||
    haystack.includes("travel") ||
    haystack.includes("australia") ||
    haystack.includes("perth") ||
    haystack.includes("sydney")
  ) {
    return "travel";
  }

  if (
    haystack.includes("book") ||
    haystack.includes("reading")
  ) {
    return "books";
  }

  return "life";
}

function areaForPost(post) {
  return AREA_BY_KEY.get(post.area || inferArea(post.fm)) || AREA_BY_KEY.get("life");
}

function postsForArea(posts, areaKey) {
  return posts.filter((post) => areaForPost(post).key === areaKey);
}

function rewriteUrl(url) {
  if (!url) return url;

  const blogMatch = url.match(
    /^(?:https:\/\/rkaas\.de\/|\/)?blog\.html\?post=([a-z0-9-]+)$/i,
  );
  if (blogMatch) return blogUrl(blogMatch[1]);

  if (/^assets\//.test(url)) return `/${url}`;
  return url;
}

function rewriteHtmlUrls(html) {
  return html.replace(/\b(src|href)="([^"]+)"/g, (match, attr, url) => {
    return `${attr}="${escapeAttribute(rewriteUrl(url))}"`;
  });
}

function renderInline(text) {
  const codeTokens = [];
  let rendered = text.replace(/`([^`]+)`/g, (_, code) => {
    const token = `@@CODE_TOKEN_${codeTokens.length}@@`;
    codeTokens.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });

  rendered = rendered.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g,
    (_, alt, src, title) => {
      const attrs = [
        `src="${escapeAttribute(rewriteUrl(src))}"`,
        `alt="${escapeAttribute(alt)}"`,
      ];
      if (title) attrs.push(`title="${escapeAttribute(title)}"`);
      return `<img ${attrs.join(" ")}>`;
    },
  );

  rendered = rendered.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g,
    (_, label, href, title) => {
      const attrs = [`href="${escapeAttribute(rewriteUrl(href))}"`];
      if (title) attrs.push(`title="${escapeAttribute(title)}"`);
      return `<a ${attrs.join(" ")}>${renderInline(label)}</a>`;
    },
  );

  rendered = rendered.replace(/\*\*([\s\S]+?)\*\*(?!\*)/g, "<strong>$1</strong>");
  rendered = rendered.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  codeTokens.forEach((html, index) => {
    rendered = rendered.replace(`@@CODE_TOKEN_${index}@@`, html);
  });

  return rendered;
}

function isHtmlBlockStart(line) {
  const trimmed = line.trim();
  return /^<\/?(div|center|figure|figcaption|img|table|thead|tbody|tr|td|th|iframe|script|style|p|ul|ol|li|blockquote|h[1-6]|pre|hr|br)(\s|>|\/)/i.test(
    trimmed,
  );
}

function countMatches(text, regex) {
  return (text.match(regex) || []).length;
}

function collectHtmlBlock(lines, startIndex) {
  const first = lines[startIndex].trim();
  const tagMatch = first.match(/^<([a-z0-9-]+)/i);
  if (!tagMatch) {
    return { html: lines[startIndex], nextIndex: startIndex + 1 };
  }

  const tag = tagMatch[1].toLowerCase();
  if (["img", "hr", "br"].includes(tag)) {
    return { html: lines[startIndex], nextIndex: startIndex + 1 };
  }

  const openRegex = new RegExp(`<${tag}(?=\\s|>|/)`, "gi");
  const closeRegex = new RegExp(`</${tag}>`, "gi");
  const selfCloseRegex = new RegExp(`<${tag}[^>]*?/>`, "gi");
  const block = [];
  let depth = 0;

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    block.push(line);
    depth += countMatches(line, openRegex);
    depth -= countMatches(line, selfCloseRegex);
    depth -= countMatches(line, closeRegex);

    if (depth <= 0) {
      return { html: block.join("\n"), nextIndex: index + 1 };
    }
  }

  return { html: block.join("\n"), nextIndex: lines.length };
}

function renderParagraph(lines) {
  const html = lines
    .map((line) => {
      if (/ {2,}$/.test(line)) {
        return `${renderInline(line.trimEnd())}<br>`;
      }
      return renderInline(line.trim());
    })
    .join(" ");
  return `<p>${html}</p>`;
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let list = null;

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(renderParagraph(paragraph));
    paragraph = [];
  }

  function flushList() {
    if (!list) return;
    const startAttr =
      list.type === "ol" && list.start !== 1 ? ` start="${list.start}"` : "";
    html.push(
      `<${list.type}${startAttr}>\n${list.items
        .map((item) => `  <li>${item}</li>`)
        .join("\n")}\n</${list.type}>`,
    );
    list = null;
  }

  function flushTextBlocks() {
    flushParagraph();
    flushList();
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.startsWith("<!--")) {
      flushTextBlocks();
      while (index < lines.length && !lines[index].includes("-->")) {
        index += 1;
      }
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushTextBlocks();
      const language = trimmed.slice(3).trim();
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      const classAttr = language
        ? ` class="language-${escapeAttribute(language)}"`
        : "";
      html.push(`<pre><code${classAttr}>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    if (trimmed === "") {
      flushTextBlocks();
      continue;
    }

    if (isHtmlBlockStart(line)) {
      flushTextBlocks();
      const block = collectHtmlBlock(lines, index);
      html.push(rewriteHtmlUrls(block.html));
      index = block.nextIndex - 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushTextBlocks();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      flushTextBlocks();
      html.push("<hr>");
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushTextBlocks();
      const quoteLines = [trimmed.slice(2)];
      while (
        index + 1 < lines.length &&
        lines[index + 1].trim().startsWith("> ")
      ) {
        index += 1;
        quoteLines.push(lines[index].trim().slice(2));
      }
      html.push(`<blockquote>${renderParagraph(quoteLines)}</blockquote>`);
      continue;
    }

    const unorderedMatch = line.match(/^\s*[-*]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", start: 1, items: [] };
      }
      list.items.push(renderInline(unorderedMatch[1].trim()));
      continue;
    }

    const orderedMatch = line.match(/^\s*(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      const start = Number(orderedMatch[1]);
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", start, items: [] };
      }
      list.items.push(renderInline(orderedMatch[2].trim()));
      continue;
    }

    if (list) flushList();
    paragraph.push(line);
  }

  flushTextBlocks();
  return html.join("\n");
}

function formatDate(dateValue) {
  if (!dateValue) return "";
  try {
    const date = new Date(dateValue);
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date);
  } catch {
    return dateValue;
  }
}

function titleImageHtml(fm) {
  const image = fm.titleImage || fm.ogImage;

  if (!image) {
    return '<div class="blog-title-image-placeholder" aria-hidden="true"></div>';
  }

  const hiddenAttr = fm.titleImageAlt ? "" : ' aria-hidden="true"';
  return `<img class="blog-title-image" src="${escapeAttribute(
    rewriteUrl(image),
  )}" alt="${escapeAttribute(
    fm.titleImageAlt || "",
  )}" decoding="async" fetchpriority="high"${hiddenAttr}>`;
}

function articleMetaHtml(fm) {
  const parts = [];
  if (fm.date) parts.push(formatDate(fm.date));
  if (fm.readingTime) parts.push(`${fm.readingTime} min read`);
  if (!parts.length) return "";
  return `<p class="post-meta">${parts.join(" &bull; ")}</p>`;
}

function postSummary(post) {
  return post.fm.summary || post.fm.description || "";
}

function thumbnailForPost(post, className = "writing-card-thumb") {
  const image = post.fm.thumbnail || post.fm.titleImage || post.fm.ogImage;
  const area = areaForPost(post);

  if (!image) {
    return `<span class="${className} ${className}-placeholder is-${area.key}" aria-hidden="true"></span>`;
  }

  return `<img class="${className}" src="${escapeAttribute(
    rewriteUrl(image),
  )}" alt="" aria-hidden="true" loading="lazy">`;
}

function postMetaLine(post, includeArea = true) {
  const parts = [];
  if (includeArea) parts.push(areaForPost(post).label);
  if (post.fm.date) parts.push(formatDate(post.fm.date));
  if (post.fm.readingTime) parts.push(`${post.fm.readingTime} min read`);
  return parts.join(" - ");
}

function postCardDetails(post) {
  const parts = [];
  if (post.fm.date) parts.push(formatDate(post.fm.date));
  if (post.fm.readingTime) parts.push(`${post.fm.readingTime} min read`);
  return parts.join(" · ");
}

function renderWritingCard(post, { compact = false } = {}) {
  const area = areaForPost(post);
  const details = postCardDetails(post);
  const summary = postSummary(post);
  const compactClass = compact ? " is-compact" : "";

  return `<article class="writing-card is-${area.key}${compactClass}">
        <a href="${blogUrl(post.slug)}">
          ${thumbnailForPost(post)}
          <span class="writing-card-copy">
            <span class="writing-card-title">${escapeHtml(post.fm.title || post.slug)}</span>
            <span class="writing-card-meta">
              <span class="writing-card-area">${escapeHtml(area.label)}</span>
              ${details ? `<span class="writing-card-details">${escapeHtml(details)}</span>` : ""}
            </span>
            ${summary ? `<span class="writing-card-summary">${escapeHtml(summary)}</span>` : ""}
          </span>
        </a>
      </article>`;
}

function renderAreaCard(area, posts) {
  const publishedCount = postsForArea(posts, area.key).length;
  const countLabel = publishedCount
    ? `${publishedCount} ${publishedCount === 1 ? "note" : "notes"}`
    : "";

  return `<a class="garden-area-card is-${area.key}" href="${escapeAttribute(area.href)}">
        <span class="garden-area-marker">${escapeHtml(area.marker)}</span>
        <span class="garden-area-title">${escapeHtml(area.label)}</span>
        <span class="garden-area-description">${escapeHtml(area.description)}</span>
        <span class="garden-area-footer">
          ${countLabel ? `<span class="garden-area-count">${escapeHtml(countLabel)}</span>` : ""}
          <span class="garden-area-action">visit room</span>
        </span>
      </a>`;
}

function renderSiteNav(currentPage = "blog") {
  const links = NAV_ITEMS.filter((link) => isTabEnabled(link.page));

  return `<nav class="site-nav" aria-label="Primary">
      ${links
        .map((link) => {
          const currentAttr =
            link.page === currentPage ? ' aria-current="page"' : "";
          return `<a class="site-nav-link" href="${link.href}"${currentAttr}>${link.label}</a>`;
        })
        .join("\n      ")}
    </nav>`;
}

function pageShell({
  bodyClass = "blog-page",
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogType = "website",
  ogImage,
  twitterCard = "summary_large_image",
  currentPage = "blog",
  jsonLd,
  mainHtml,
}) {
  const image = absoluteUrl(ogImage || PROFILE_IMAGE);
  const jsonLdHtml = jsonLd
    ? `\n  <script type="application/ld+json">\n${JSON.stringify(
        jsonLd,
        null,
        2,
      )}\n  </script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>${escapeHtml(title)}</title>

  <meta name="description" content="${escapeAttribute(description)}">
  <meta name="author" content="${AUTHOR_NAME}">
  <link rel="canonical" href="${escapeAttribute(canonical)}">
  <link rel="icon" type="image/png" href="/favicon.png">

  <meta property="og:title" content="${escapeAttribute(ogTitle || title)}">
  <meta property="og:description" content="${escapeAttribute(
    ogDescription || description,
  )}">
  <meta property="og:type" content="${escapeAttribute(ogType)}">
  <meta property="og:url" content="${escapeAttribute(canonical)}">
  <meta property="og:image" content="${escapeAttribute(image)}">

  <meta name="twitter:card" content="${escapeAttribute(twitterCard)}">
  <meta name="twitter:title" content="${escapeAttribute(ogTitle || title)}">
  <meta name="twitter:description" content="${escapeAttribute(
    ogDescription || description,
  )}">
  <meta name="twitter:image" content="${escapeAttribute(image)}">

  <script>
    (function () {
      try {
        var theme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();
  </script>

  <link rel="stylesheet" type="text/css" href="/css/style.css">${jsonLdHtml}
</head>
<body class="${escapeAttribute(bodyClass)}">
  <h1 class="sr-only">${escapeHtml(ogTitle || title)}</h1>

  <header class="site-header" id="top">
    <a class="site-brand" href="/" aria-label="Raffael Kaas homepage">
      <img src="${PROFILE_IMAGE}" alt="" class="site-brand-avatar">
      <span class="site-brand-copy">
        <span class="site-brand-name">Raffael Kaas</span>
      </span>
    </a>

    ${renderSiteNav(currentPage)}

    <button class="pb-theme-toggle" type="button" aria-label="Toggle dark mode" aria-pressed="false">
      <span class="sr-only">Toggle dark mode</span>
    </button>
  </header>

  ${mainHtml}

  <footer class="site-footer">
    <div class="pb-container site-footer-inner">
      <div class="footer-links" aria-label="Contact links">
        <a class="footer-link" href="mailto:mail@rkaas.de?subject=Hello%20from%20your%20website">text me: mail@rkaas.de</a>
      </div>
      <p class="footer-copyright">&copy; 2026 Raffael Kaas. All rights reserved.</p>
    </div>
  </footer>

  <script>
    (function () {
      const themeToggle = document.querySelector('.pb-theme-toggle');

      function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        try {
          localStorage.setItem('theme', theme);
        } catch (e) {}
        if (themeToggle) {
          themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
        }
      }

      setTheme(document.documentElement.getAttribute('data-theme') || 'dark');

      if (themeToggle) {
        themeToggle.addEventListener('click', () => {
          const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
          setTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });
      }
    })();
  </script>
</body>
</html>
`;
}

function renderArticlePage(post) {
  const { fm, bodyHtml, slug } = post;
  const canonical = canonicalUrl(slug);
  const title = fm.title ? `${fm.title} - ${AUTHOR_NAME}` : `${AUTHOR_NAME} - Blog`;
  const image = absoluteUrl(fm.ogImage || fm.titleImage || PROFILE_IMAGE);
  const keywords = Array.isArray(fm.keywords)
    ? fm.keywords.join(", ")
    : fm.keywords || undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: fm.title || "",
    datePublished: fm.date || undefined,
    dateModified: fm.lastmod || fm.date || undefined,
    author: {
      "@type": "Person",
      name: fm.author || AUTHOR_NAME,
    },
    image,
    mainEntityOfPage: canonical,
    keywords,
  };

  const mainHtml = `<main class="blog-page-main">
    <div class="pb-container blog-article-shell">
      <article class="blog-post">
        ${titleImageHtml(fm)}
        <h1>${escapeHtml(fm.title || "Blog post")}</h1>
        ${articleMetaHtml(fm)}
        ${bodyHtml}
      </article>
    </div>
  </main>`;

  return pageShell({
    title,
    description: fm.description || "Personal writing by Raffael Kaas",
    canonical,
    ogTitle: fm.title || title,
    ogDescription: fm.description || "Personal writing by Raffael Kaas",
    ogType: "article",
    ogImage: fm.ogImage || fm.titleImage || PROFILE_IMAGE,
    currentPage: "blog",
    jsonLd,
    mainHtml,
  });
}

function renderBlogIndex(posts) {
  const allPosts = posts.map((post) => renderWritingCard(post, { compact: true })).join("\n");

  const mainHtml = `<main class="blog-index-main">
    <div class="pb-container blog-index-shell">
      <section class="blog-index-hero">
        <p class="section-kicker">Blog</p>
        <h1>All writing, newest first.</h1>
        <p>A chronological archive of notes from all rooms: software, training, money, travel, life, and books.</p>
      </section>

      <section class="featured-writing-section" aria-labelledby="featured-writing-title">
        <div class="section-heading-row">
          <div>
            <h2 id="featured-writing-title">All articles</h2>
          </div>
        </div>
        <div class="writing-grid is-list">
          ${allPosts}
        </div>
      </section>
    </div>
  </main>`;

  return pageShell({
    title: `${AUTHOR_NAME} - Blog`,
    description: "Personal writing about software, training, books, money, travel, and notes worth keeping.",
    canonical: `${SITE_URL}/blog/`,
    ogTitle: `${AUTHOR_NAME} - Blog`,
    ogDescription: "Personal writing about software, training, books, money, travel, and notes worth keeping.",
    ogType: "website",
    ogImage: PROFILE_IMAGE,
    twitterCard: "summary",
    currentPage: "blog",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: `${AUTHOR_NAME} - Blog`,
      url: `${SITE_URL}/blog/`,
      author: {
        "@type": "Person",
        name: AUTHOR_NAME,
      },
    },
    mainHtml,
  });
}

function formatHomeDate(dateValue) {
  const match = String(dateValue || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return formatDate(dateValue);
}

function renderHomePostItems(posts) {
  return posts
    .slice(0, HOME_POST_LIMIT)
    .map((post) => {
      const { fm, slug } = post;
      const cover = fm.titleImage
        ? `<img class="post-mark post-cover" src="${escapeAttribute(
            rewriteUrl(fm.titleImage),
          )}" alt="" aria-hidden="true" loading="lazy">`
        : '<span class="post-mark post-cover-placeholder" aria-hidden="true"></span>';

      return `          <li class="post-item">
            <a href="${blogUrl(slug)}">
              ${cover}
              <span class="post-card-copy">
                <span class="post-date">${escapeHtml(formatHomeDate(fm.date))}</span>
                <span class="post-title">${escapeHtml(fm.title || slug)}</span>
              </span>
            </a>
          </li>`;
    })
    .join("\n");
}

function renderHomepage(posts) {
  const latestCards = posts.slice(0, HOME_POST_LIMIT)
    .map((post) => renderWritingCard(post, { compact: true }))
    .join("\n");
  const areaCards = AREAS.map((area) => renderAreaCard(area, posts)).join("\n");

  const mainHtml = `<main class="garden-main">
    <section class="garden-hero">
      <div class="pb-container garden-hero-inner">
        <div class="garden-hero-copy">
          <h1>Raffael Kaas</h1>
          <p>Welcome to my digital garden! I am writing about my thoughts and experiences of various topics that I want to share and remember. </p>
        </div>
        <img src="${PROFILE_IMAGE}" alt="Portrait of Raffael Kaas" class="garden-profile-photo">
      </div>
    </section>

    <section class="garden-section" id="areas" aria-labelledby="areas-title">
      <div class="pb-container garden-section-inner">
        <div class="section-heading-row">
          <div>
            <h2 id="areas-title">Main Topics</h2>
          </div>
          <p class="section-heading-copy">The main topics on my website. Each room shows the articles, notes, and collections around that area.</p>
        </div>
        <div class="garden-area-grid">
          ${areaCards}
        </div>
      </div>
    </section>

    <section class="garden-section is-writing" aria-labelledby="latest-title">
      <div class="pb-container garden-section-inner">
        <div class="section-heading-row">
          <div>
            <h2 id="latest-title">Latest writing</h2>
          </div>
        </div>
        <div class="writing-grid">
          ${latestCards}
        </div>
      </div>
    </section>

    <section class="garden-section is-about" id="about" aria-labelledby="about-title">
      <div class="pb-container garden-section-inner about-grid">
        <h2 id="about-title" class="about-heading">About me</h2>
        <div class="about-copy">
          <p>I am a software engineer living at Lake Constance and working in the automotive industry. I have a Master of Engineering with a focus on autonomous systems. Over the past few years, I've worked on a wide range of complex software projects: building my own quadrocopter during university, launching autonomous shuttles in Rotterdam, and now developing series production software for power converters in e-mobility.</p>
          <p>I enjoy working on Linux-based systems, using C/C++ for embedded software development and Python to make life easier or to quickly prototype ideas. I've worked on many projects using ROS on high-performance computers, but I also have a lot of hands-on experience with microcontrollers and low-level debugging.</p>
          <p>Outside of engineering, I'm usually in motion: running, playing soccer, or lifting heavy weights. Besides sports, I have a strong interest in finance and investing, and enjoy diving into new ideas through books, travel, or good conversations.</p>
          </div>
        ${renderNowTerminal()}
      </div>
    </section>
  </main>`;

  return pageShell({
    bodyClass: "personal-blog-home",
    title: `${AUTHOR_NAME} - Personal Website`,
    description: "Personal website and notes by Raffael Kaas about software, training, books, money, travel, and life outside the screen.",
    canonical: `${SITE_URL}/`,
    ogTitle: AUTHOR_NAME,
    ogDescription: "Software engineering, writing, books, travel, and personal notes by Raffael Kaas.",
    ogType: "website",
    ogImage: PROFILE_IMAGE,
    twitterCard: "summary",
    currentPage: "home",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Person",
      name: AUTHOR_NAME,
      jobTitle: "Software Engineer",
      url: `${SITE_URL}/`,
      image: `${SITE_URL}${PROFILE_IMAGE}`,
      knowsAbout: ["Embedded Systems", "Linux", "C++", "Python", "Software Engineering", "ADAS", "Automotive"],
    },
    mainHtml,
  });
}

function updateHomepage(posts) {
  writeFileSync("index.html", renderHomepage(posts), "utf8");
}

function renderAreaSpecialLinks(area) {
  const links = AREA_SPECIAL_LINKS[area.key] || [];
  if (!links.length) return "";

  return `<section class="area-page-section is-special-links" aria-labelledby="${escapeAttribute(area.key)}-special-title">
        <div class="section-heading-row">
          <div>
            <h2 id="${escapeAttribute(area.key)}-special-title">In this room</h2>
          </div>
        </div>
        <div class="collection-grid">
          ${links.map((link) => `<a class="collection-card is-${escapeAttribute(area.key)}" href="${escapeAttribute(link.href)}">
            <span class="collection-card-media" aria-hidden="true"></span>
            <span class="collection-card-copy">
              <span class="collection-card-kicker">${escapeHtml(link.label)}</span>
              <span class="collection-card-title">${escapeHtml(link.title)}</span>
              <span class="collection-card-text">${escapeHtml(link.text)}</span>
            </span>
          </a>`).join("\n          ")}
        </div>
      </section>`;
}

function renderRoomIntroLink(link) {
  return renderRoomIntroAnchor(link.label || link.href || "Link", link.href || "#");
}

function renderRoomIntroAnchor(label, hrefValue, title) {
  const href = rewriteUrl(hrefValue || "#");
  const attrs = [`href="${escapeAttribute(href)}"`];
  if (/^https?:\/\//i.test(href) && !href.startsWith(SITE_URL)) {
    attrs.push('target="_blank"', 'rel="noopener noreferrer"');
  }
  if (title) attrs.push(`title="${escapeAttribute(title)}"`);

  return `<a ${attrs.join(" ")}>${escapeHtml(label)}</a>`;
}

function renderRoomIntroInline(text) {
  const linkPattern = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g;
  let html = "";
  let lastIndex = 0;
  let match;

  while ((match = linkPattern.exec(text)) !== null) {
    html += escapeHtml(text.slice(lastIndex, match.index));
    html += renderRoomIntroAnchor(match[1], match[2], match[3]);
    lastIndex = linkPattern.lastIndex;
  }

  html += escapeHtml(text.slice(lastIndex));
  return html;
}

function renderRoomIntroItem(item) {
  if (!item) return "";
  if (typeof item === "string") return `<p>${renderRoomIntroInline(item)}</p>`;

  if (item.type === "links" && Array.isArray(item.links) && item.links.length) {
    return `<div class="area-page-intro-links">
          ${item.links.map((link) => renderRoomIntroLink(link)).join("\n          ")}
        </div>`;
  }

  if (item.text) return `<p>${renderRoomIntroInline(item.text)}</p>`;
  return "";
}

function renderRoomIntro(area) {
  if (!area.roomIntro) return "";
  const items = Array.isArray(area.roomIntro) ? area.roomIntro : [area.roomIntro];
  const html = items.map((item) => renderRoomIntroItem(item)).filter(Boolean).join("\n        ");
  if (!html) return "";

  return `<div class="area-page-intro">
        ${html}
      </div>`;
}

function renderAreaPage(area, posts) {
  const areaPosts = postsForArea(posts, area.key);
  const roomIntro = renderRoomIntro(area);
  const publishedHtml = areaPosts.length
    ? `<div class="writing-grid is-list">
        ${areaPosts.map((post) => renderWritingCard(post)).join("\n        ")}
      </div>`
    : '<p class="empty-area-note">I have not published a finished article here yet.</p>';

  const mainHtml = `<main class="area-page-main">
    <div class="pb-container area-page-shell">
      <section class="area-page-hero">
        <h1>${escapeHtml(area.label)}</h1>
        <p class="area-page-summary">${escapeHtml(area.description)}</p>
        ${roomIntro}
      </section>

      ${renderAreaSpecialLinks(area)}

      <section class="area-page-section" aria-labelledby="${escapeAttribute(area.key)}-published-title">
        <div class="section-heading-row">
          <div>
            <h2 id="${escapeAttribute(area.key)}-published-title">Articles</h2>
          </div>
        </div>
        ${publishedHtml}
      </section>
    </div>
  </main>`;

  return pageShell({
    bodyClass: `blog-page area-page area-${area.key}`,
    title: `${area.label} - ${AUTHOR_NAME}`,
    description: area.description,
    canonical: areaCanonicalUrl(area.key),
    ogTitle: `${area.label} - ${AUTHOR_NAME}`,
    ogDescription: area.description,
    ogType: "website",
    ogImage: PROFILE_IMAGE,
    twitterCard: "summary",
    currentPage: "blog",
    mainHtml,
  });
}

function writeAreaPages(posts) {
  AREAS.filter((area) => GENERATED_AREA_KEYS.has(area.key)).forEach((area) => {
    const outputDir = area.key;
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(join(outputDir, "index.html"), renderAreaPage(area, posts), "utf8");
  });
}

function updateStaticPageNavs() {
  STATIC_NAV_PAGES.forEach(({ path, page }) => {
    if (!existsSync(path)) return;

    const html = readFileSync(path, "utf8");
    const navRegex = /<nav class="site-nav" aria-label="Primary">\n[\s\S]*?\n\s*<\/nav>/;

    if (!navRegex.test(html)) {
      throw new Error(`Could not find site nav in ${path}`);
    }

    writeFileSync(
      path,
      html.replace(navRegex, renderSiteNav(page)),
      "utf8",
    );
  });
}

function renderSitemap(posts) {
  const staticEntries = [
    { page: "home", loc: `${SITE_URL}/`, lastmod: latestPostDate(posts) },
    { page: "blog", loc: `${SITE_URL}/blog/`, lastmod: latestPostDate(posts) },
  ].filter((entry) => isTabEnabled(entry.page));
  const areaEntries = AREAS
    .filter((area) => GENERATED_AREA_KEYS.has(area.key))
    .map((area) => ({
      loc: areaCanonicalUrl(area.key),
      lastmod: latestPostDate(postsForArea(posts, area.key)) || latestPostDate(posts),
    }));

  const postEntries = isTabEnabled("blog")
    ? posts.map((post) => ({
      loc: canonicalUrl(post.slug),
      lastmod: post.fm.lastmod || post.fm.date,
    }))
    : [];

  const entries = [...staticEntries, ...areaEntries, ...SPECIAL_COLLECTION_PAGES, ...postEntries];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `
    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : ""}
  </url>`,
  )
  .join("\n")}
</urlset>
`;
}

function latestPostDate(posts) {
  return posts
    .map((post) => post.fm.lastmod || post.fm.date)
    .filter(Boolean)
    .sort()
    .at(-1);
}

function isPostBlacklisted(post) {
  const identifiers = [
    post.slug,
    post.sourceFile,
    slugFromFile(post.sourceFile),
    blogUrl(post.slug),
    canonicalUrl(post.slug),
  ].map(normalizePostIdentifier);

  return identifiers.some((identifier) => postBlacklist.has(identifier));
}

function loadPosts() {
  return readdirSync(BLOG_SOURCE_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const source = readFileSync(join(BLOG_SOURCE_DIR, file), "utf8");
      const { fm, body } = parseFrontMatter(source);
      const slug = fm.slug || slugFromFile(file);
      return {
        sourceFile: file,
        slug,
        fm,
        body,
        bodyHtml: renderMarkdown(body),
      };
    })
    .filter((post) => post.fm.draft !== true && post.fm.title && post.fm.slug && post.fm.date)
    .sort((a, b) => String(b.fm.date || "").localeCompare(String(a.fm.date || "")));
}

function writePost(post) {
  const outputDir = join(BLOG_OUTPUT_DIR, post.slug);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "index.html"), renderArticlePage(post), "utf8");
}

function removeStalePostPages(posts) {
  if (!existsSync(BLOG_OUTPUT_DIR)) return;

  const slugs = new Set(posts.map((post) => post.slug));
  readdirSync(BLOG_OUTPUT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .forEach((entry) => {
      if (!slugs.has(entry.name)) {
        rmSync(join(BLOG_OUTPUT_DIR, entry.name), { recursive: true, force: true });
      }
    });
}

function main() {
  const posts = loadPosts();
  const listedPosts = posts.filter((post) => !isPostBlacklisted(post));
  mkdirSync(BLOG_OUTPUT_DIR, { recursive: true });
  removeStalePostPages(listedPosts);
  listedPosts.forEach(writePost);
  writeFileSync(join(BLOG_OUTPUT_DIR, "index.html"), renderBlogIndex(listedPosts), "utf8");
  updateHomepage(listedPosts);
  writeAreaPages(listedPosts);
  updateStaticPageNavs();
  writeFileSync("sitemap.xml", renderSitemap(listedPosts), "utf8");

  console.log(
    `Generated ${listedPosts.length} blog pages from ${posts.length} source posts, and sitemap.xml`,
  );
}

main();
