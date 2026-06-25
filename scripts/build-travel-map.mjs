import { readFile, writeFile } from "node:fs/promises";
import https from "node:https";

const WIDTH = 2000;
const HEIGHT = 857;
const PADDING = 12;
const PRECISION = 1;

const ADMIN0_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson";
const ADMIN1_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson";
const OUTPUT_PATH = "assets/traveling/world-regions.svg";

const SPLIT_COUNTRIES = new Map([
  ["US", { admin: "United States of America", adm0A3: "USA" }],
  ["AU", { admin: "Australia", adm0A3: "AUS" }],
  ["BR", { admin: "Brazil", adm0A3: "BRA" }],
]);

function downloadText(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        const { statusCode, headers } = response;

        if (statusCode >= 300 && statusCode < 400 && headers.location) {
          response.resume();
          if (redirects > 5) {
            reject(new Error(`Too many redirects while downloading ${url}`));
            return;
          }

          resolve(downloadText(new URL(headers.location, url).toString(), redirects + 1));
          return;
        }

        if (statusCode !== 200) {
          response.resume();
          reject(new Error(`Download failed for ${url}: HTTP ${statusCode}`));
          return;
        }

        response.setEncoding("utf8");
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => resolve(body));
      })
      .on("error", reject);
  });
}

async function readJson(pathOrUrl) {
  const text = pathOrUrl.startsWith("http")
    ? await downloadText(pathOrUrl)
    : await readFile(pathOrUrl, "utf8");

  return JSON.parse(text);
}

function naturalEarthProjection([longitude, latitude]) {
  const lambda = (longitude * Math.PI) / 180;
  const phi = (latitude * Math.PI) / 180;
  const phi2 = phi * phi;
  const phi4 = phi2 * phi2;

  const x =
    lambda *
    (0.8707 +
      -0.131979 * phi2 +
      -0.013791 * phi4 +
      phi4 * phi2 * (0.003971 + -0.001529 * phi2));
  const y =
    phi *
    (1.007226 +
      0.015085 * phi2 +
      -0.044475 * phi4 +
      phi4 * phi2 * (0.028874 + -0.005916 * phi2));

  return [x, -y];
}

function* positionsForGeometry(geometry) {
  if (!geometry) return;

  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates) {
      for (const position of ring) yield position;
    }
  }

  if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) {
        for (const position of ring) yield position;
      }
    }
  }
}

function calculateProjectedBounds(features) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const feature of features) {
    for (const position of positionsForGeometry(feature.geometry)) {
      const [x, y] = naturalEarthProjection(position);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return { minX, minY, maxX, maxY };
}

function createProjector(features) {
  const bounds = calculateProjectedBounds(features);
  const projectedWidth = bounds.maxX - bounds.minX;
  const projectedHeight = bounds.maxY - bounds.minY;
  const scale = Math.min(
    (WIDTH - PADDING * 2) / projectedWidth,
    (HEIGHT - PADDING * 2) / projectedHeight,
  );
  const offsetX = (WIDTH - projectedWidth * scale) / 2 - bounds.minX * scale;
  const offsetY = (HEIGHT - projectedHeight * scale) / 2 - bounds.minY * scale;

  return (position) => {
    const [x, y] = naturalEarthProjection(position);
    return [x * scale + offsetX, y * scale + offsetY];
  };
}

function formatNumber(value) {
  return Number(value.toFixed(PRECISION)).toString();
}

function projectRing(ring, project) {
  const points = [];

  for (const position of ring) {
    const [x, y] = project(position);
    const point = [formatNumber(x), formatNumber(y)];
    const previous = points[points.length - 1];

    if (!previous || previous[0] !== point[0] || previous[1] !== point[1]) {
      points.push(point);
    }
  }

  return points;
}

function polygonToPath(polygon, project) {
  return polygon
    .map((ring) => projectRing(ring, project))
    .filter((ring) => ring.length > 2)
    .map((ring) => {
      const [first, ...rest] = ring;
      const line = rest.map(([x, y]) => `L${x} ${y}`).join("");
      return `M${first[0]} ${first[1]}${line}Z`;
    })
    .join("");
}

function geometryToPath(geometry, project) {
  if (!geometry) return "";

  if (geometry.type === "Polygon") {
    return polygonToPath(geometry.coordinates, project);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map((polygon) => polygonToPath(polygon, project)).join("");
  }

  return "";
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function countryId(feature) {
  const isoA2 = [feature.properties.ISO_A2, feature.properties.ISO_A2_EH, feature.properties.WB_A2].find(
    (value) => value && value !== "-99" && value.length === 2,
  );
  if (isoA2) return isoA2;

  return feature.properties.ADM0_A3 || feature.properties.NAME || "unknown";
}

function countryName(feature) {
  return feature.properties.NAME_EN || feature.properties.ADMIN || feature.properties.NAME;
}

function regionId(feature) {
  return feature.properties.iso_3166_2 || `${feature.properties.adm0_a3}-${feature.properties.postal}`;
}

function regionName(feature) {
  return feature.properties.name_en || feature.properties.name;
}

function shouldDrawCountry(feature) {
  const id = countryId(feature);
  return feature.properties.NAME !== "Antarctica" && !SPLIT_COUNTRIES.has(id);
}

function regionBelongsToSplitCountry(feature) {
  return Array.from(SPLIT_COUNTRIES.values()).some(
    ({ adm0A3 }) => feature.properties.adm0_a3 === adm0A3,
  );
}

function createPathElement({ id, name, country, d }) {
  const attributes = [
    `id="${escapeAttribute(id)}"`,
    `name="${escapeAttribute(name)}"`,
    `d="${d}"`,
    'fill-rule="evenodd"',
  ];

  if (country) {
    attributes.splice(2, 0, `data-country="${escapeAttribute(country)}"`);
  }

  return `  <path ${attributes.join(" ")} />`;
}

async function main() {
  const admin0Path = process.env.TRAVEL_MAP_ADMIN0 || ADMIN0_URL;
  const admin1Path = process.env.TRAVEL_MAP_ADMIN1 || ADMIN1_URL;
  const [admin0, admin1] = await Promise.all([readJson(admin0Path), readJson(admin1Path)]);

  const countryFeatures = admin0.features.filter(shouldDrawCountry);
  const regionFeatures = admin1.features.filter(regionBelongsToSplitCountry);
  const drawableFeatures = [...countryFeatures, ...regionFeatures];
  const project = createProjector(drawableFeatures);

  const countryPaths = countryFeatures
    .map((feature) =>
      createPathElement({
        id: countryId(feature),
        name: countryName(feature),
        d: geometryToPath(feature.geometry, project),
      }),
    )
    .filter(Boolean);

  const regionPaths = regionFeatures
    .map((feature) => {
      const id = regionId(feature);

      return createPathElement({
        id,
        name: regionName(feature),
        country: id.split("-")[0],
        d: geometryToPath(feature.geometry, project),
      });
    })
    .filter(Boolean);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!--
Generated by scripts/build-travel-map.mjs from Natural Earth public domain data.
Admin 0 countries and Admin 1 states/provinces: https://www.naturalearthdata.com/
-->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img">
${[...countryPaths, ...regionPaths].join("\n")}
</svg>
`;

  await writeFile(OUTPUT_PATH, svg, "utf8");
  console.log(`Generated ${OUTPUT_PATH}`);
  console.log(`Countries: ${countryPaths.length}`);
  console.log(`Split-country regions: ${regionPaths.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
