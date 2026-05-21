import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const SITE_URL = "https://rkaas.de";
const BLOG_SOURCE_DIR = "assets/blog";
const BLOG_OUTPUT_DIR = "blog";
const AUTHOR_NAME = "Raffael Kaas";

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
  if (!fm.titleImage) {
    return '<div class="blog-title-image-placeholder" aria-hidden="true"></div>';
  }

  const hiddenAttr = fm.titleImageAlt ? "" : ' aria-hidden="true"';
  return `<img class="blog-title-image" src="${escapeAttribute(
    rewriteUrl(fm.titleImage),
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
  jsonLd,
  mainHtml,
}) {
  const image = absoluteUrl(ogImage || "/assets/img/me.png");
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
        var theme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    })();
  </script>

  <link rel="stylesheet" type="text/css" href="/css/style.css">${jsonLdHtml}
</head>
<body class="${escapeAttribute(bodyClass)}">
  <h1 class="sr-only">${escapeHtml(ogTitle || title)}</h1>

  <header class="site-header" id="top">
    <a class="site-brand" href="/" aria-label="Raffael Kaas homepage">
      <img src="/assets/img/me.png" alt="" class="site-brand-avatar">
      <span class="site-brand-copy">
        <span class="site-brand-name">Raffael Kaas</span>
      </span>
    </a>

    <button class="pb-theme-toggle" type="button" aria-label="Toggle dark mode" aria-pressed="false">
      <span class="sr-only">Toggle dark mode</span>
    </button>
  </header>

  ${mainHtml}

  <footer class="site-footer">
    <div class="pb-container site-footer-inner">
      <div class="footer-links" aria-label="Contact links">
        <a class="footer-link" href="mailto:mail@rkaas.de">mail@rkaas.de</a>
        <a class="footer-link" href="https://www.linkedin.com/in/raffael-kaas-4b0869152" target="_blank" rel="me noopener">LinkedIn</a>
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

      setTheme(document.documentElement.getAttribute('data-theme') || 'light');

      if (themeToggle) {
        themeToggle.addEventListener('click', () => {
          const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
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
  const image = absoluteUrl(fm.ogImage || fm.titleImage || "/assets/img/me.png");
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
    ogImage: fm.ogImage || fm.titleImage || "/assets/img/me.png",
    jsonLd,
    mainHtml,
  });
}

function renderBlogIndex(posts) {
  const items = posts
    .map((post) => {
      const { fm, slug } = post;
      const meta = [fm.date ? formatDate(fm.date) : "", fm.readingTime ? `${fm.readingTime} min read` : ""]
        .filter(Boolean)
        .join(" &bull; ");
      return `<li>
          <a href="${blogUrl(slug)}">${escapeHtml(fm.title || slug)}</a>
          ${meta ? `<span class="post-meta">${meta}</span>` : ""}
        </li>`;
    })
    .join("\n");

  const mainHtml = `<main class="blog-page-main">
    <div class="pb-container blog-article-shell">
      <article class="blog-post">
        <h1>Blog</h1>
        <ul class="static-blog-list">
${items}
        </ul>
      </article>
    </div>
  </main>`;

  return pageShell({
    title: `${AUTHOR_NAME} - Blog`,
    description: "Personal writing by Raffael Kaas",
    canonical: `${SITE_URL}/blog/`,
    ogTitle: `${AUTHOR_NAME} - Blog`,
    ogDescription: "Personal writing by Raffael Kaas",
    ogType: "website",
    ogImage: "/assets/img/me.png",
    twitterCard: "summary",
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

function renderSitemap(posts) {
  const entries = [
    { loc: `${SITE_URL}/`, lastmod: latestPostDate(posts) },
    { loc: `${SITE_URL}/blog/`, lastmod: latestPostDate(posts) },
    ...posts.map((post) => ({
      loc: canonicalUrl(post.slug),
      lastmod: post.fm.lastmod || post.fm.date,
    })),
  ];

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
    .filter((post) => post.fm.draft !== true)
    .sort((a, b) => String(b.fm.date || "").localeCompare(String(a.fm.date || "")));
}

function writePost(post) {
  const outputDir = join(BLOG_OUTPUT_DIR, post.slug);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "index.html"), renderArticlePage(post), "utf8");
}

function main() {
  const posts = loadPosts();
  mkdirSync(BLOG_OUTPUT_DIR, { recursive: true });
  posts.forEach(writePost);
  writeFileSync(join(BLOG_OUTPUT_DIR, "index.html"), renderBlogIndex(posts), "utf8");
  writeFileSync("sitemap.xml", renderSitemap(posts), "utf8");

  console.log(`Generated ${posts.length} blog posts and sitemap.xml`);
}

main();
