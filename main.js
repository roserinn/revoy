import StaticMode from '@mapbox/mapbox-gl-draw-static-mode';

mapboxgl.accessToken = "pk.eyJ1Ijoicm9zZXJpbm4iLCJhIjoiY2x2bTY4NGNjMDJkazJsczA2Y2M2b3Z6ZCJ9.Ak0kz3VhRg_IbLAC-qgGUg";


localStorage.removeItem('drawnLines');

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [31.1656, 48.3794],
  zoom: 6
});

const modes = MapboxDraw.modes;
modes.static = StaticMode;

const draw = new MapboxDraw({
  displayControlsDefault: false,
  modes: modes,
  controls: {
    trash: true
  },
});

map.addControl(draw);

map.on('draw.create', () => {
  const lines = draw.getAll().features;
  lines.forEach(line => {
    const roundedLine = roundLineCoordinates(line);
    addLineToLayer(roundedLine, line.id);
  });
});

map.on('draw.selectionchange', () => {
  const selectedFeatures = draw.getSelected();
  if (selectedFeatures.features.length === 0) {
    draw.changeMode('draw_line_string');
  }
});

map.on('draw.update', (e) => {
  const line = e.features[0];
  const roundedLine = roundLineCoordinates(line);
  addLineToLayer(roundedLine, line.id, 'update');
});

function roundLineCoordinates(line) {
  const roundedLine = turf.lineString(line.geometry.coordinates);
  const rounded = turf.bezierSpline(roundedLine);

  line.geometry.coordinates = rounded.geometry.coordinates;
  return line;
}

let isChecked = false;
function handleCustomControlClick(draw) {
  if (isChecked) {
    isChecked = false;
    draw.changeMode('static');
    saveDrawnLines();
    draw.deleteAll();
  } else {
    isChecked = true;
    const getLines = JSON.parse(localStorage.getItem('drawnLines'));
    if(getLines?.features?.length > 0) {
      draw.set(getLines);
    }
    draw.changeMode('draw_line_string');
  }
}

document.getElementById('custom-control').addEventListener('click', () => {
  handleCustomControlClick(draw);
});

function addLineToLayer(line, id, event = 'create') {
  if(map.getSource(`rounded-lines${id}`) && event === 'create') return;

  if(map.getSource(`rounded-lines${id}`) && event === 'update') {
    map.removeLayer(`rounded-lines${id}`);
    map.removeSource(`rounded-lines${id}`);
  }

  map.addLayer({
    id: `rounded-lines${id}`,
    type: 'line',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    },
    paint: {
      'line-color': 'red',
      'line-width': 2
    }
  });

  map.getSource(`rounded-lines${id}`).setData({
    type: 'FeatureCollection',
    features: [line]
  });
}

function saveDrawnLines() {
  const data = draw.getAll();
  localStorage.setItem('drawnLines', JSON.stringify(data));
}