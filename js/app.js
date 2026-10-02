// ============================================================
// CONFIG
// ============================================================
mapboxgl.accessToken = 'pk.eyJ1Ijoic3BpZXJyZTE0IiwiYSI6ImNtdHg1MXFyNjAxanUyd3B0Zmppd3pldjMifQ.N_SDvISpQJo1gDuuOetnmQ';

// Categorical score buckets used by every individual-service choropleth,
// low -> high, matching the Jenks/hardcoded-bucket convention from the
// CARTO maps. "Zero" is always broken out and labeled "No Value" rather
// than folded into the bottom of the ramp.
const SCORE_ORDER = ['Zero', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];

// ColorBrewer "Blues" derived ramp for individual service layers; Zero/No
// Value gets a neutral gray instead of the lightest blue so "no access" is
// visually distinct from "low access".
const SCORE_COLORS = {
  'Zero':      '#d9d9d9',
  'Very Low':  '#eff3ff',
  'Low':       '#bdd7e7',
  'Medium':    '#6baed6',
  'High':      '#3182bd',
  'Very High': '#08519c'
};

// Continuous plasma ramp for the combined/composite access score (matches
// the CARTO reference map -- low access = yellow, high access = purple).
const COMBINED_RAMP = [
  '#f0f921', '#fccd25', '#fca338', '#f07f4f', '#dd5e66',
  '#b6308b', '#9511a1', '#6e00a8', '#43039e', '#0d0887'
];
const COMBINED_MIN = 0;
const COMBINED_MAX = 0.93; // observed max ~0.929

const SERVICES = {
  atm: {
    label: 'ATM',
    file: 'data/atm.min.geojson',
    amenityValue: 'atm',
    pointColor: '#e41a1c'
  },
  daycare: {
    label: 'Daycare',
    file: 'data/daycare.min.geojson',
    amenityValue: 'daycare',
    pointColor: '#ff7f00'
  },
  grocery: {
    label: 'Grocery / Supermarket',
    file: 'data/grocery.min.geojson',
    amenityValue: 'supermarkets', // amenities7.geojson uses "supermarkets", choropleth field is "grocery"
    pointColor: '#4daf4a'
  },
  laundry: {
    label: 'Laundry',
    file: 'data/laundry.min.geojson',
    amenityValue: 'laundry',
    pointColor: '#984ea3'
  },
  library: {
    label: 'Library',
    file: 'data/library.min.geojson',
    amenityValue: 'library',
    pointColor: '#a65628'
  },
  park: {
    label: 'Park',
    file: 'data/park.min.geojson',
    isPark: true, // no point data -- shows the park polygon layer instead
    polygonColor: '#2d6a4f'
  },
  pharmacy: {
    label: 'Pharmacy',
    file: 'data/pharmacy.min.geojson',
    amenityValue: 'pharmacy',
    pointColor: '#f781bf'
  },
  postoffice: {
    label: 'Post Office',
    file: 'data/postoffice.min.geojson',
    amenityValue: 'postoffice',
    pointColor: '#1b1b1b'
  }
};

const COMBINED_FILE = 'data/combined.min.geojson';
const AMENITIES_FILE = 'data/amenities.min.geojson';
const PARKS_FILE = 'data/parks.min.geojson';

// Zoom-scaled point radius: starts small, gets *larger* (clearer) as you
// zoom in -- never smaller.
const POINT_RADIUS = ['interpolate', ['linear'], ['zoom'], 10, 2.5, 13, 4, 16, 6, 19, 9];

function buildScoreFillExpression() {
  const matchPairs = [];
  SCORE_ORDER.forEach((cat) => { matchPairs.push(cat, SCORE_COLORS[cat]); });
  return ['match', ['get', 'score'], ...matchPairs, '#cccccc'];
}

function buildCombinedFillExpression() {
  const stops = [];
  const n = COMBINED_RAMP.length;
  COMBINED_RAMP.forEach((color, i) => {
    const v = COMBINED_MIN + (COMBINED_MAX - COMBINED_MIN) * (i / (n - 1));
    stops.push(v, color);
  });
  return ['interpolate', ['linear'], ['get', 'service_access_score'], ...stops];
}

function renderCombinedLegend() {
  const legendEl = document.getElementById('legend');
  legendEl.innerHTML = `
    <div class="legend-title">Combined Access Score</div>
    <div class="ramp-horizontal" style="background: linear-gradient(to right, ${COMBINED_RAMP.join(', ')});"></div>
    <div class="ramp-horizontal-labels">
      <span>Lower Access</span>
      <span>Higher Access</span>
    </div>
    <div class="legend-sub">Select a service above to see its individual choropleth and locations.</div>
  `;
}

function renderServiceLegend(key) {
  const svc = SERVICES[key];
  const legendEl = document.getElementById('legend');
  let rows = SCORE_ORDER.map((cat) => `
    <div class="legend-row">
      <div class="legend-swatch" style="background:${SCORE_COLORS[cat]};"></div>
      <div class="legend-label">${cat === 'Zero' ? 'No Value' : cat}</div>
    </div>
  `).join('');

  let pointRow = '';
  if (svc.isPark) {
    pointRow = `
      <div class="legend-sub">Park locations</div>
      <div class="legend-row">
        <div class="legend-swatch" style="background:${svc.polygonColor}; opacity:0.6;"></div>
        <div class="legend-label">Park polygon</div>
      </div>
    `;
  } else {
    pointRow = `
      <div class="legend-sub">${svc.label} locations</div>
      <div class="legend-row">
        <div class="legend-swatch dot" style="background:${svc.pointColor};"></div>
        <div class="legend-label">${svc.label}</div>
      </div>
    `;
  }

  legendEl.innerHTML = `
    <div class="legend-title">${svc.label} Access</div>
    ${rows}
    ${pointRow}
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

function setChoropleth(geojson, fillExpression, popupFields) {
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

function hidePointsAndParks() {
  if (map.getLayer('amenities-point')) map.setLayoutProperty('amenities-point', 'visibility', 'none');
  if (map.getLayer('parks-fill')) map.setLayoutProperty('parks-fill', 'visibility', 'none');
  if (map.getLayer('parks-outline')) map.setLayoutProperty('parks-outline', 'visibility', 'none');
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

async function showCombined() {
  try {
    loadingEl.classList.add('visible');
    const geojson = await loadData(COMBINED_FILE);
    setChoropleth(geojson, buildCombinedFillExpression());
    hidePointsAndParks();
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
    setChoropleth(choroData, buildScoreFillExpression());

    if (svc.isPark) {
      const parksData = await loadData(PARKS_FILE);
      ensureParksLayer(parksData);
      if (map.getLayer('amenities-point')) map.setLayoutProperty('amenities-point', 'visibility', 'none');
      map.setLayoutProperty('parks-fill', 'visibility', 'visible');
      map.setLayoutProperty('parks-outline', 'visibility', 'visible');
    } else {
      const rawAmenities = await loadData(AMENITIES_FILE);
      const amenitiesData = colorizeAmenities(rawAmenities);
      ensurePointsLayer(amenitiesData);
      if (map.getLayer('parks-fill')) map.setLayoutProperty('parks-fill', 'visibility', 'none');
      if (map.getLayer('parks-outline')) map.setLayoutProperty('parks-outline', 'visibility', 'none');
      map.setFilter('amenities-point', ['==', ['get', 'amenity'], svc.amenityValue]);
      map.setLayoutProperty('amenities-point', 'visibility', 'visible');
    }

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
});

// ============================================================
// Service picker
// ============================================================
document.getElementById('serviceSelect').addEventListener('change', (e) => {
  showSelection(e.target.value);
});
