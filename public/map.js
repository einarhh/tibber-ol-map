const container = document.getElementById("popup");
const content = document.getElementById("popup-content");
const closer = document.getElementById("popup-closer");

// Create overlay for popups
const overlay = new ol.Overlay({
  element: container,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

// Popup close handling
closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

// Prepare vector source for markers
let vectorSource = new ol.source.Vector({});

// Setup map
let map = new ol.Map({
  target: "map",
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
    }),
    new ol.layer.Vector({
      source: vectorSource,
      style: new ol.style.Style({
        image: new ol.style.Icon({
          anchor: [0.5, 46],
          anchorXUnits: "fraction",
          anchorYUnits: "pixels",
          src: "/images/location.png",
        }),
      }),
    }),
  ],
  overlays: [overlay],
  view: new ol.View({
    center: ol.proj.fromLonLat([-2, 53]),
    zoom: 6,
  }),
});

function addMarker(lat, lon, name, data) {
  // Add a marker feature to the vector source
  let feature = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])),
    name,
  });
  feature.data = data;
  vectorSource.addFeature(feature);
}

// Fetch consumption from our API
const consumption = fetch("/consumption")
  .then((response) => response.json())
  .then((data) => {
    data.forEach((home) => {
      addMarker(
        home.address.latitude,
        home.address.longitude,
        home.address.address1,
        home
      );
    });
    // Zoom to fit
    let view = map.getView();
    view.fit(vectorSource.getExtent());
    view.setZoom(view.getZoom() - 1);
  });

// Add click listener to map for popup
map.on("click", function (evt) {
  const coordinate = evt.coordinate;
  var feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
    return feature;
  });
  if (feature) {
    content.innerHTML = `
    <h3>${feature.data.address.address1}</h3>
    <p> Last 24H: ${feature.data.consumption.toFixed(2)} kWh (${feature.data.cost.toFixed(2)} kr)</p>
    <p> Yesterday: ${feature.data.yesterday.consumption.toFixed(2)} kWh (${feature.data.yesterday.cost.toFixed(2)} kr)</p>
    `;
    overlay.setPosition(coordinate);
  }
});