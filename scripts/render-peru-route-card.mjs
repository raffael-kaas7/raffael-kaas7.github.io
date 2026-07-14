import { readFile, writeFile } from "node:fs/promises";
import { extname } from "node:path";

const WIDTH = 1586;
const HEIGHT = 992;
const ROUTE_PATH = process.env.PERU_ROUTE_GEOJSON || "assets/blog/data/peru-2023-route.geojson";
const ADMIN0_PATH = process.env.PERU_ROUTE_ADMIN0 || "";
const BACKGROUND_PATH = process.env.PERU_ROUTE_BACKGROUND || "";
const OUTPUT_PATH = process.env.PERU_ROUTE_OUTPUT || "/tmp/peru-route-card.svg";

const BOUNDS = {
  minLon: -78.5,
  maxLon: -68.4,
  minLat: -17.6,
  maxLat: -10.8,
};

const FRAME = {
  left: 110,
  right: 100,
  top: 125,
  bottom: 95,
};

const MODE_STYLES = {
  bus: {
    color: "#b77b2a",
    width: 5,
    dash: "1 20",
    cap: "round",
  },
  flight: {
    color: "#3d86ad",
    width: 3.5,
    dash: "13 13",
    cap: "round",
  },
};

const LABELS = [
  { id: "lima", text: "Lima", x: 205, y: 248 },
  { id: "paracas", text: "Paracas", x: 270, y: 490 },
  { id: "arequipa", text: "Arequipa", x: 1085, y: 830 },
  { id: "colca-canyon", text: "Colca Canyon", x: 800, y: 650 },
  { id: "puno", text: "Puno / Uros", x: 1332, y: 732 },
  { id: "cusco", text: "Cusco", x: 1142, y: 384 },
  { id: "puerto-maldonado", text: "Puerto Maldonado", x: 1225, y: 267 },
];

const TEXT_ATTRS =
  'font-family="Inter, Avenir, Helvetica Neue, Arial, sans-serif" fill="#343735" font-style="normal" font-weight="500"';

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function project([lon, lat]) {
  const mapWidth = WIDTH - FRAME.left - FRAME.right;
  const mapHeight = HEIGHT - FRAME.top - FRAME.bottom;
  const x = FRAME.left + ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * mapWidth;
  const y = FRAME.top + ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * mapHeight;
  return [x, y];
}

function pointMap(features) {
  return new Map(
    features
      .filter((feature) => ["stop", "waypoint"].includes(feature.properties?.kind))
      .map((feature) => [feature.properties.id, project(feature.geometry.coordinates)]),
  );
}

function linePath(coordinates) {
  return coordinates
    .map((coordinate, index) => {
      const [x, y] = project(coordinate);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join("");
}

function flightPath(coordinates) {
  const [start, end] = coordinates.map(project);
  const [x1, y1] = start;
  const [x2, y2] = end;
  const distance = Math.hypot(x2 - x1, y2 - y1);
  const bend = Math.min(170, Math.max(85, distance * 0.2));
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2 - bend;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

function routePath(feature) {
  const mode = feature.properties.mode;

  if (mode === "flight") return flightPath(feature.geometry.coordinates);

  return linePath(feature.geometry.coordinates);
}

function polygonPath(polygon) {
  return polygon
    .map((ring) =>
      ring
        .map((coordinate, index) => {
          const [x, y] = project(coordinate);
          return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join("") + "Z",
    )
    .join("");
}

function geometryPath(geometry) {
  if (!geometry) return "";

  if (geometry.type === "Polygon") return polygonPath(geometry.coordinates);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.map(polygonPath).join("");

  return "";
}

function backgroundDataUri(path) {
  if (!path) return "";

  const ext = extname(path).toLowerCase();
  const mime =
    ext === ".webp"
      ? "image/webp"
      : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : "image/png";

  return readFile(path).then((buffer) => `data:${mime};base64,${buffer.toString("base64")}`);
}

async function peruCountryPath() {
  if (!ADMIN0_PATH) return "";

  const admin0 = JSON.parse(await readFile(ADMIN0_PATH, "utf8"));
  const peru = admin0.features.find((feature) => {
    const properties = feature.properties || {};
    return properties.ISO_A2 === "PE" || properties.ADM0_A3 === "PER" || properties.NAME === "Peru";
  });

  return geometryPath(peru?.geometry);
}

function routeLayer(routeFeatures) {
  const visibleModes = new Set(["bus", "flight"]);
  const modePriority = {
    bus: 1,
    flight: 2,
  };
  const sortedRouteFeatures = [...routeFeatures]
    .filter((feature) => visibleModes.has(feature.properties.mode) && !feature.properties.inferred)
    .sort((a, b) => (modePriority[a.properties.mode] || 0) - (modePriority[b.properties.mode] || 0));
  const shadowPaths = [];
  const colorPaths = [];

  for (const feature of sortedRouteFeatures) {
    const mode = feature.properties.mode;
    const style = MODE_STYLES[mode] || MODE_STYLES.bus;
    const d = routePath(feature);
    const opacity = mode === "flight" ? 0.58 : 0.52;

    shadowPaths.push(
      `<path d="${d}" fill="none" stroke="#fffaf0" stroke-width="${style.width + 4}" stroke-linecap="${style.cap}" stroke-linejoin="round" opacity="${opacity * 0.45}" />`,
    );
    colorPaths.push(
      `<path d="${d}" fill="none" stroke="${style.color}" stroke-width="${style.width}" stroke-linecap="${style.cap}" stroke-linejoin="round" stroke-dasharray="${style.dash}" opacity="${opacity}" />`,
    );
  }

  return [...shadowPaths, ...colorPaths].join("\n");
}

function marker([x, y], { small = false } = {}) {
  const outer = small ? 11 : 15;
  const mid = small ? 6 : 8;
  const inner = small ? 2 : 3;

  return `
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${outer}" fill="#fffaf2" stroke="#b77b2a" stroke-width="3" opacity="0.82" />
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${mid}" fill="#d99a3a" opacity="0.72" />
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${inner}" fill="#fffaf2" opacity="0.95" />`;
}

function label({ text, x, y, target }) {
  const lines = text.split(" / ");
  const displayLines = lines.length > 1 ? lines.map((line, index) => (index === 0 ? `${line} /` : line)) : lines;
  const maxLength = Math.max(...displayLines.map((line) => line.length));
  const width = Math.max(112, maxLength * 15 + 44);
  const height = displayLines.length * 32 + 18;
  const rectX = x - width / 2;
  const rectY = y - height / 2;
  const leader = target
    ? `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${target[0].toFixed(1)}" y2="${target[1].toFixed(1)}" stroke="#9a743f" stroke-width="2.5" opacity="0.72" />`
    : "";
  const textLines = displayLines
    .map((line, index) => {
      const offset = (index - (displayLines.length - 1) / 2) * 30;
      return `<text x="${x.toFixed(1)}" y="${(y + offset + 9).toFixed(1)}" text-anchor="middle" font-size="27" ${TEXT_ATTRS}>${escapeHtml(line)}</text>`;
    })
    .join("\n");

  return `
    ${leader}
    <rect x="${rectX.toFixed(1)}" y="${rectY.toFixed(1)}" width="${width.toFixed(1)}" height="${height.toFixed(1)}" rx="8" fill="#fffaf2" stroke="#b77b2a" stroke-width="2.5" opacity="0.96" />
    ${textLines}`;
}

function labelsLayer(points) {
  return LABELS.map((placement) =>
    label({
      ...placement,
      target: points.get(placement.id),
    }),
  ).join("\n");
}

function markersLayer(points) {
  const ids = [
    "lima",
    "paracas",
    "arequipa",
    "colca-canyon",
    "puno",
    "cusco",
    "puerto-maldonado",
  ];

  return ids
    .map((id) => {
      const point = points.get(id);
      if (!point) return "";
      return marker(point);
    })
    .join("\n");
}

function textures() {
  return `
    <defs>
      <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#efe9d7" />
        <stop offset="48%" stop-color="#f7efd9" />
        <stop offset="100%" stop-color="#e7d7b8" />
      </linearGradient>
      <radialGradient id="coastWash" cx="18%" cy="44%" r="42%">
        <stop offset="0%" stop-color="#a9ced4" stop-opacity="0.55" />
        <stop offset="100%" stop-color="#a9ced4" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="amazonWash" cx="82%" cy="32%" r="37%">
        <stop offset="0%" stop-color="#8fae78" stop-opacity="0.42" />
        <stop offset="100%" stop-color="#8fae78" stop-opacity="0" />
      </radialGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#5b4728" flood-opacity="0.18" />
      </filter>
    </defs>`;
}

async function main() {
  const [route, countryPath, backgroundUri] = await Promise.all([
    readFile(ROUTE_PATH, "utf8").then(JSON.parse),
    peruCountryPath(),
    backgroundDataUri(BACKGROUND_PATH),
  ]);

  const routeFeatures = route.features.filter((feature) => feature.properties?.kind === "route");
  const points = pointMap(route.features);
  const background = backgroundUri
    ? `<image href="${backgroundUri}" x="0" y="0" width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="xMidYMid slice" />`
    : `<rect width="${WIDTH}" height="${HEIGHT}" fill="#f2ead6" />
       <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#paper)" opacity="0.96" />
       <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#coastWash)" />
       <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#amazonWash)" />`;

  const country = countryPath
    ? `<path d="${countryPath}" fill="#eadbbd" stroke="#9d8c69" stroke-width="2" fill-opacity="${backgroundUri ? "0.12" : "0.42"}" stroke-opacity="${backgroundUri ? "0.28" : "0.65"}" />`
    : "";

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="Illustrated Peru round trip map with labeled stops and subtle bus and flight routes">
  ${textures()}
  <style>
    text {
      font-family: Inter, Avenir, "Helvetica Neue", Arial, sans-serif;
      fill: #343735;
      font-size: 27px;
      font-weight: 500;
    }
    .route-overlay {
      filter: url(#softShadow);
    }
  </style>
  ${background}
  <g opacity="${backgroundUri ? "0.32" : "0.5"}">
    <path d="M0 835C205 728 249 592 387 502C540 402 586 255 719 160C839 74 1009 89 1122 185C1222 270 1294 244 1424 126L1586 0V992H0Z" fill="#8eb7bd" opacity="0.16" />
    <path d="M1055 230C1145 154 1272 151 1383 205C1453 239 1511 299 1564 377V992H1065C1011 812 986 660 1010 534C1036 393 1004 272 1055 230Z" fill="#7e9b65" opacity="0.18" />
  </g>
  <g class="map-outline">${country}</g>
  <g class="route-overlay">
    ${routeLayer(routeFeatures)}
    ${markersLayer(points)}
    ${labelsLayer(points)}
  </g>
</svg>
`;

  await writeFile(OUTPUT_PATH, svg, "utf8");
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
