import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

// Keep the deployment artifact limited to public site content.
const publicPaths = [
  "assets", "blog", "books", "css", "engineering", "health", "life", "money", "travel", "work",
  "index.html", "blog.html", "favicon.png", "robots.txt", "sitemap.xml", "CNAME", ".nojekyll", "about_me.md", "now.txt",
];
const output = "_site";
rmSync(output, { recursive: true, force: true });
mkdirSync(output);
for (const path of publicPaths) {
  if (existsSync(path)) cpSync(path, join(output, path), { recursive: true });
}
console.log("Packaged the public website in _site/.");
