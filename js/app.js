// ============================================================
// CONFIG
// ============================================================
mapboxgl.accessToken = 'pk.eyJ1Ijoic3BpZXJyZTE0IiwiYSI6ImNtdHg1MXFyNjAxanUyd3B0Zmppd3pldjMifQ.N_SDvISpQJo1gDuuOetnmQ';

// No-value / zero color, used everywhere a block has no count for this
// service -- matches the CARTO convention: gray, labeled "No Value".
const NO_VALUE_COLOR = '#cccccc';

// Final 10-step ColorBrewer Blues ramp settled on in the CARTO work for
// the continuous (jenks-on-perct) layers: daycare, pharmacy, park, and the
// high-cardinality hardcoded layers (atm, grocery, laundry).
const BLUE_10 = ['#f7fbff', '#e2edf8', '#cde0f1', '#afd1e7', '#89bedc', '#60a6d2', '#3e8ec4', '#2272b5', '#0a549e', '#08306b'];

// Library (3 classes) and Post Office (4 classes) kept the earlier blue
// steps from that same project rather than being migrated to BLUE_10 --
// this matches the last confirmed CartoCSS for those two layers.
const BLUE_LIBRARY = ['#deebf7', '#4291c6', '#08306b'];
const BLUE_POSTOFFICE = ['#deebf7', '#7fb7d8', '#1b67aa', '#08306b'];

// Plasma ramp for the combined/composite score, exact hex stops from the
// CARTO CartoCSS (low = yellow, high = purple).
const PLASMA_10 = ['#f0f921', '#fccb26', '#fb9f3b', '#ed7953', '#d8576b', '#bd3785', '#9b169e', '#7301a8', '#45039f', '#0d0887'];

// Jenks natural-break edges (11 edges = 10 classes), recomputed directly
// from the uploaded data to match the CARTO methodology (jenks(10) on the
// non-zero `perct`/`service_access_score` values). Interior edges (index
// 1-9) become the step-expression breakpoints; edges[0] and edges[10] are
// the observed min/max and aren't needed as stops.
const JENKS = {
  combined: [0.000275, 0.117747, 0.200521, 0.280764, 0.361794, 0.445926, 0.528268, 0.610377, 0.696293, 0.788803, 0.929129],
  daycare:  [0.014921, 0.099676, 0.195505, 0.301128, 0.398718, 0.500587, 0.600324, 0.700525, 0.799954, 0.900865, 1.0],
  pharmacy: [0.025883, 0.07843, 0.183477, 0.280341, 0.390942, 0.493171, 0.597755, 0.695893, 0.793139, 0.895559, 0.999968],
  park:     [0.000031, 0.099863, 0.200397, 0.30032, 0.400275, 0.500229, 0.600183, 0.700137, 0.800092, 0.900046, 1.0]
};

// Services where raw-count Jenks boundaries landed exactly on a value
// shared by thousands of blocks (a "degenerate" bin) -- CARTO's fix was to
// drop jenks()/perct entirely and hardcode filters on the raw count field.
// stops: [[minRawValueForThisColor, color], ...] in ascending order.
const HARDCODED = {
  atm: {
    field: 'value',
    stops: [[1, BLUE_10[0]], [2, BLUE_10[1]], [3, BLUE_10[2]], [4, BLUE_10[3]], [5, BLUE_10[4]],
            [6, BLUE_10[5]], [7, BLUE_10[6]], [9, BLUE_10[7]], [12, BLUE_10[8]], [20, BLUE_10[9]]]
  },
  grocery: {
    field: 'value',
    stops: [[1, BLUE_10[0]], [2, BLUE_10[1]], [3, BLUE_10[2]], [4, BLUE_10[3]], [5, BLUE_10[4]],
            [6, BLUE_10[5]], [7, BLUE_10[6]], [8, BLUE_10[7]], [9, BLUE_10[8]], [11, BLUE_10[9]]]
  },
  laundry: {
    field: 'value',
    stops: [[1, BLUE_10[0]], [2, BLUE_10[1]], [3, BLUE_10[2]], [4, BLUE_10[3]], [6, BLUE_10[4]],
            [8, BLUE_10[5]], [11, BLUE_10[6]], [14, BLUE_10[7]], [18, BLUE_10[8]], [23, BLUE_10[9]]]
  },
  library: {
    field: 'value',
    stops: [[1, BLUE_LIBRARY[0]], [2, BLUE_LIBRARY[1]], [3, BLUE_LIBRARY[2]]]
  },
  postoffice: {
    field: 'value',
    stops: [[1, BLUE_POSTOFFICE[0]], [2, BLUE_POSTOFFICE[1]], [3, BLUE_POSTOFFICE[2]], [4, BLUE_POSTOFFICE[3]]]
  }
};

const SERVICES = {
  atm: {
    label: 'ATM',
    file: 'data/atm.min.geojson',
    classification: 'hardcoded',
    amenityValue: 'atm',
    pointColor: '#e41a1c',
    legendRows: ['1', '2', '3', '4', '5', '6', '7–8', '9–11', '12–19', '20+']
  },
  daycare: {
    label: 'Daycare',
    file: 'data/daycare.min.geojson',
    classification: 'jenks-perct',
    amenityValue: 'daycare',
    pointColor: '#ff7f00',
    legendRows: ['1%–10%', '10%–20%', '20%–30%', '30%–40%', '40%–50%', '50%–60%', '60%–70%', '70%–80%', '80%–90%', '90%–100%']
  },
  grocery: {
    label: 'Grocery / Supermarket',
    file: 'data/grocery.min.geojson',
    classification: 'hardcoded',
    amenityValue: 'supermarkets', // amenities7.geojson uses "supermarkets", choropleth field is "grocery"
    pointColor: '#4daf4a',
    legendRows: ['1', '2', '3', '4', '5', '6', '7', '8', '9–10', '11+']
  },
  laundry: {
    label: 'Laundry',
    file: 'data/laundry.min.geojson',
    classification: 'hardcoded',
    amenityValue: 'laundry',
    pointColor: '#984ea3',
    legendRows: ['1', '2', '3', '4–5', '6–7', '8–10', '11–13', '14–17', '18–22', '23+']
  },
  library: {
    label: 'Library',
    file: 'data/library.min.geojson',
    classification: 'hardcoded',
    amenityValue: 'library',
    pointColor: '#a65628',
    legendRows: ['1', '2', '3+']
  },
  park: {
    label: 'Park',
    file: 'data/park.min.geojson',
    classification: 'jenks-perct',
    isPark: true, // no point data -- shows the park polygon layer instead
    polygonColor: '#2d6a4f',
    legendRows: ['>0%–10%', '10%–20%', '20%–30%', '30%–40%', '40%–50%', '50%–60%', '60%–70%', '70%–80%', '80%–90%', '90%–100%']
  },
  pharmacy: {
    label: 'Pharmacy',
    file: 'data/pharmacy.min.geojson',
    classification: 'jenks-perct',
    amenityValue: 'pharmacy',
    pointColor: '#f781bf',
    legendRows: ['3%–8%', '8%–18%', '18%–28%', '28%–39%', '39%–49%', '49%–60%', '60%–70%', '70%–79%', '79%–90%', '90%–100%']
  },
  postoffice: {
    label: 'Post Office',
    file: 'data/postoffice.min.geojson',
    classification: 'hardcoded',
    amenityValue: 'postoffice',
    pointColor: '#1b1b1b',
    legendRows: ['1', '2', '3', '4+']
  }
};

const COMBINED_FILE = 'data/combined.min.geojson';
const AMENITIES_FILE = 'data/amenities.min.geojson';
const PARKS_FILE = 'data/parks.min.geojson';

// Zoom-scaled point radius: starts small, gets *larger* (clearer) as you
// zoom in -- never smaller. Kept deliberately small throughout.
const POINT_RADIUS = ['interpolate', ['linear'], ['zoom'], 10, 1.4, 13, 2, 16, 3, 19, 4.5];

function stepExpression(getField, zeroTest, colors, interiorStops) {
  // ['step', input, color0, stop1, color1, stop2, color2, ...]
  const parts = ['step', getField, colors[0]];
  for (let i = 0; i < interiorStops.length; i++) {
    parts.push(interiorStops[i], colors[i + 1]);
  }
  return ['case', zeroTest, NO_VALUE_COLOR, parts];
}

function buildFillExpression(key) {
  const svc = SERVICES[key];
  if (svc.classification === 'jenks-perct') {
    const edges = JENKS[key];
    const interior = edges.slice(1, -1); // drop observed min/max, keep 9 interior breaks
    return stepExpression(['get', 'perct'], ['==', ['get', 'perct'], 0], BLUE_10, interior);
  }
  // hardcoded raw-count classification
  const cfg = HARDCODED[key];
  const colors = cfg.stops.map((s) => s[1]);
  const interior = cfg.stops.slice(1).map((s) => s[0]); // every stop after the first becomes a breakpoint
  return stepExpression(['get', cfg.field], ['==', ['get', cfg.field], 0], colors, interior);
}

function buildCombinedFillExpression() {
  const edges = JENKS.combined;
  const interior = edges.slice(1, -1);
  return stepExpression(['get', 'service_access_score'], ['==', ['get', 'service_access_score'], 0], PLASMA_10, interior);
}

function renderCombinedLegend() {
  const legendEl = document.getElementById('legend');
  legendEl.innerHTML = `
    <div class="legend-title">Combined Access Score</div>
    <div class="legend-row">
      <div class="legend-swatch" style="background:${NO_VALUE_COLOR};"></div>
      <div class="legend-label">No Value</div>
    </div>
    <div class="ramp-horizontal" style="background: linear-gradient(to right, ${PLASMA_10.join(', ')});"></div>
    <div class="ramp-horizontal-labels">
      <span>Lower Access</span>
      <span>Higher Access</span>
    </div>
  `;
}

function renderServiceLegend(key) {
  const svc = SERVICES[key];
  const colors = svc.classification === 'jenks-perct' ? BLUE_10 : HARDCODED[key].stops.map((s) => s[1]);
  const lowLabel = svc.legendRows[0].split(/[–+]/)[0];
  const highLabel = svc.legendRows[svc.legendRows.length - 1];

  document.getElementById('legend').innerHTML = `
    <div class="legend-title">${svc.label} Access</div>
    <div class="legend-row">
      <div class="legend-swatch" style="background:${NO_VALUE_COLOR};"></div>
      <div class="legend-label">No Value</div>
    </div>
    <div class="ramp-horizontal" style="background: linear-gradient(to right, ${colors.join(', ')});"></div>
    <div class="ramp-horizontal-labels">
      <span>${lowLabel}</span>
      <span>${highLabel}</span>
    </div>
  `;
}

// ============================================================
// Map init
// ============================================================
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-73.95, 40.70],
  zoom: 10
});

map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

const loadingEl = document.getElementById('mapLoading');
const dataCache = {};
let currentPopup = null;

async function loadData(url) {
  if (dataCache[url]) return dataCache[url];
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  const geojson = await res.json();
  dataCache[url] = geojson;
  return geojson;
}

function setChoropleth(geojson, fillExpression) {
  const source = map.getSource('choropleth');
  if (source) {
    source.setData(geojson);
    map.setPaintProperty('choropleth-fill', 'fill-color', fillExpression);
    return;
  }

  map.addSource('choropleth', { type: 'geojson', data: geojson });
  map.addLayer({
    id: 'choropleth-fill',
    type: 'fill',
    source: 'choropleth',
    paint: { 'fill-color': fillExpression, 'fill-opacity': 0.8 }
  });
  map.addLayer({
    id: 'choropleth-outline',
    type: 'line',
    source: 'choropleth',
    paint: { 'line-color': '#ffffff', 'line-width': 0.1, 'line-opacity': 0.5 }
  });

  map.on('click', 'choropleth-fill', (e) => {
    const p = e.features[0].properties;
    const rows = Object.entries(p).map(([k, v]) => `<div class="popup-row">${k}: ${v}</div>`).join('');
    if (currentPopup) currentPopup.remove();
    currentPopup = new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`<div class="popup-title">Block ${p.blockid20 ?? ''}</div>${rows}`)
      .addTo(map);
  });
  map.on('mouseenter', 'choropleth-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'choropleth-fill', () => { map.getCanvas().style.cursor = ''; });
}

function ensurePointsLayer(geojson) {
  if (map.getSource('amenities')) return;
  map.addSource('amenities', { type: 'geojson', data: geojson });
  map.addLayer({
    id: 'amenities-point',
    type: 'circle',
    source: 'amenities',
    layout: { visibility: 'none' },
    filter: ['==', ['get', 'amenity'], '__none__'],
    paint: {
      'circle-radius': POINT_RADIUS,
      'circle-color': ['get', 'color'],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1
    }
  });

  map.on('click', 'amenities-point', (e) => {
    const p = e.features[0].properties;
    if (currentPopup) currentPopup.remove();
    currentPopup = new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`<div class="popup-title">${p.amenity}</div>`)
      .addTo(map);
  });
  map.on('mouseenter', 'amenities-point', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'amenities-point', () => { map.getCanvas().style.cursor = ''; });
}

function ensureParksLayer(geojson) {
  if (map.getSource('parks')) return;
  map.addSource('parks', { type: 'geojson', data: geojson });
  map.addLayer({
    id: 'parks-fill',
    type: 'fill',
    source: 'parks',
    layout: { visibility: 'none' },
    paint: { 'fill-color': SERVICES.park.polygonColor, 'fill-opacity': 0.6 }
  });
  map.addLayer({
    id: 'parks-outline',
    type: 'line',
    source: 'parks',
    layout: { visibility: 'none' },
    paint: { 'line-color': SERVICES.park.polygonColor, 'line-width': 1 }
  });

  map.on('click', 'parks-fill', (e) => {
    const p = e.features[0].properties;
    const name = p.park_name || 'Unnamed park';
    const acreage = p.acreage ? `${Number(p.acreage).toFixed(1)} acres` : '';
    if (currentPopup) currentPopup.remove();
    currentPopup = new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`<div class="popup-title">${name}</div>${acreage ? `<div class="popup-row">${acreage}</div>` : ''}`)
      .addTo(map);
  });
  map.on('mouseenter', 'parks-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'parks-fill', () => { map.getCanvas().style.cursor = ''; });
}

// Pre-tag each amenity point with its display color so the circle-color
// paint property can read it directly. Cached after the first call since
// the underlying data never changes between service selections.
let colorizedAmenitiesCache = null;
function colorizeAmenities(geojson) {
  if (colorizedAmenitiesCache) return colorizedAmenitiesCache;
  const colorByValue = {};
  Object.values(SERVICES).forEach((svc) => {
    if (svc.amenityValue) colorByValue[svc.amenityValue] = svc.pointColor;
  });
  geojson.features.forEach((f) => {
    f.properties.color = colorByValue[f.properties.amenity] || '#888888';
  });
  colorizedAmenitiesCache = geojson;
  return geojson;
}

// The dropdown ONLY controls which choropleth is shown (combined, or one
// service's score breakdown). Which point/park layers are drawn on top is
// controlled entirely separately by the toggle checkboxes below, so you
// can view e.g. the Grocery choropleth while overlaying ATM locations.
async function showCombined() {
  try {
    loadingEl.classList.add('visible');
    const geojson = await loadData(COMBINED_FILE);
    setChoropleth(geojson, buildCombinedFillExpression());
    renderCombinedLegend();
  } catch (err) {
    console.error(err);
    loadingEl.textContent = 'Could not load this layer — check the console for details.';
    loadingEl.classList.add('visible');
    return;
  } finally {
    loadingEl.classList.remove('visible');
  }
}

async function showService(key) {
  const svc = SERVICES[key];
  try {
    loadingEl.classList.add('visible');
    const choroData = await loadData(svc.file);
    setChoropleth(choroData, buildFillExpression(key));
    renderServiceLegend(key);
  } catch (err) {
    console.error(err);
    loadingEl.textContent = 'Could not load this layer — check the console for details.';
    loadingEl.classList.add('visible');
    return;
  } finally {
    loadingEl.classList.remove('visible');
  }
}

async function showSelection(key) {
  if (key === 'combined') {
    await showCombined();
  } else {
    await showService(key);
  }
}

map.on('load', () => {
  showSelection('combined');
  buildToggleList();
});

// ============================================================
// Service picker (choropleth only)
// ============================================================
document.getElementById('serviceSelect').addEventListener('change', (e) => {
  showSelection(e.target.value);
});

// ============================================================
// Location toggles -- independent of the dropdown, all off by default.
// Each service gets its own checkbox; Park toggles the polygon layer,
// every other service toggles into/out of a shared point layer filtered
// by amenity value (each point already carries its own service color).
// ============================================================
const activeAmenities = new Set();

function updateAmenitiesLayer() {
  if (!map.getLayer('amenities-point')) return;
  if (activeAmenities.size === 0) {
    map.setLayoutProperty('amenities-point', 'visibility', 'none');
    return;
  }
  map.setFilter('amenities-point', ['in', ['get', 'amenity'], ['literal', Array.from(activeAmenities)]]);
  map.setLayoutProperty('amenities-point', 'visibility', 'visible');
}

async function setParkToggle(on) {
  if (on) {
    const parksData = await loadData(PARKS_FILE);
    ensureParksLayer(parksData);
    map.setLayoutProperty('parks-fill', 'visibility', 'visible');
    map.setLayoutProperty('parks-outline', 'visibility', 'visible');
  } else if (map.getLayer('parks-fill')) {
    map.setLayoutProperty('parks-fill', 'visibility', 'none');
    map.setLayoutProperty('parks-outline', 'visibility', 'none');
  }
}

async function setAmenityToggle(key, on) {
  const svc = SERVICES[key];
  if (on) {
    const rawAmenities = await loadData(AMENITIES_FILE);
    ensurePointsLayer(colorizeAmenities(rawAmenities));
    activeAmenities.add(svc.amenityValue);
  } else {
    activeAmenities.delete(svc.amenityValue);
  }
  updateAmenitiesLayer();
}

function buildToggleList() {
  const listEl = document.getElementById('toggleList');
  listEl.innerHTML = Object.entries(SERVICES).map(([key, svc]) => {
    const color = svc.isPark ? svc.polygonColor : svc.pointColor;
    const shape = svc.isPark ? 'square' : '';
    return `
      <label class="toggle-row">
        <input type="checkbox" data-key="${key}">
        <span class="toggle-swatch ${shape}" style="background:${color};"></span>
        <span>${svc.label}</span>
      </label>
    `;
  }).join('');

  listEl.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.addEventListener('change', async (e) => {
      const key = e.target.getAttribute('data-key');
      const svc = SERVICES[key];
      loadingEl.classList.add('visible');
      try {
        if (svc.isPark) {
          await setParkToggle(e.target.checked);
        } else {
          await setAmenityToggle(key, e.target.checked);
        }
      } catch (err) {
        console.error(err);
        e.target.checked = false;
      } finally {
        loadingEl.classList.remove('visible');
      }
    });
  });
}
