// Build list of points
class Point {
  constructor(lat, long, id) {
    this.lat = lat;
    this.long = long;
    this.id = id;
    this.neighbors = [];
  }
}

const Direction = {
    BASE: 'base',
    REVERSE: 'reverse',
    DOUBLE: 'double',
    NONE: 'none'
};

const arrowSettings = {
  size: '15px',
  //frequency: '100px',
  fill: true,
  yawn: 30
};

let dict = {};
let streets = L.featureGroup();
let streets_rr = L.featureGroup();

// Create the map
var map = L.map('map', { doubleClickZoom: false }).setView([48.89, 2.345], 15); // disable double-click zoom to avoid confusion when clicking arrows

// Add a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
}).addTo(map);

function addMarker(feature) {
    // Check that the feature is a point
    if (feature.geometry.type === 'Point') {
        L.marker([feature.geometry.coordinates[1],feature.geometry.coordinates[0]]).addTo(map);
        console.log();
    }
}

function parsePoints(points) {
    //console.log("parsing points:", points.length)
    let pointsDictionary = {};
    for (let point of points) {
        let newPoint = new Point(point.geometry.coordinates[1], point.geometry.coordinates[0], point.properties.id);
        newPoint.neighbors = Array.from(point.properties.local_street.split(","), Number);
        pointsDictionary[point.properties.id] = newPoint;
    }
    return pointsDictionary;
}

function reverseArrow(ev) {
    var polyline = ev.target;

    // Change the color of the polyline
    // BASE > REVERSE > DOUBLE > NONE > BASE > ...
    var arrowColor;
    if (polyline._direction === Direction.BASE) {
        // From BASE to REVERSE
        polyline._direction = Direction.REVERSE;
        arrowColor = "green";
        polyline.setStyle({color : arrowColor});
        polyline.setLatLngs(polyline.getLatLngs().reverse()); // also applies the style changes to the arrowhead

    } else if (polyline._direction === Direction.REVERSE) {
        // From REVERSE to DOUBLE
        polyline._direction = Direction.DOUBLE;
        arrowColor = (polyline._base === Direction.DOUBLE) ? "blue" : "green";
        polyline.setStyle({color : arrowColor});
        polyline.setLatLngs(polyline.getLatLngs().reverse()); // reset

        // Set double-arrow
        var polyline2 = L.polyline(polyline.getLatLngs(), {color: arrowColor, interactive: false }).arrowheads(arrowSettings);
        polyline2.setLatLngs(polyline2.getLatLngs().reverse());
        polyline2.addTo(map);
        polyline._polyline2 = polyline2;

    } else if (polyline._direction === Direction.DOUBLE) {
        // From DOUBLE to NONE
        polyline._direction = Direction.NONE;
        arrowColor = (polyline._base === Direction.NONE) ? "blue" : "green";
        polyline.getArrowheads().remove();
        polyline.setStyle({color : arrowColor, dashArray: '10, 10'});
        polyline._polyline2.remove();

    } else {
        // From NONE to BASE
        polyline._direction = Direction.BASE;
        arrowColor = (polyline._base === Direction.BASE) ? "blue" : "green";
        polyline.getArrowheads().addTo(map);
        polyline.setStyle({color : arrowColor, dashArray: ''});
        polyline.setLatLngs(polyline.getLatLngs());
    }
}

function buildGraph(polylineLayerGroup) {
    let pairs = [];
    polylineLayerGroup.eachLayer(function(polyline){

        let direction = polyline['_direction'];
        let start = polyline['_point_start'];
        let end = polyline['_point_end'];

        if (direction === Direction.BASE) {
            pairs.push([start, end]);
        } else if (direction === Direction.REVERSE) {
            pairs.push([end, start]);
        } else if (direction === Direction.DOUBLE) {
            pairs.push([start, end]);
            pairs.push([end, start]);
        }
    });
    return buildGraphfromPairs(pairs);
}

function markRatRuns(streets, ratRuns) {
    let ratRunPairs = new Set();
    for (let rr of ratRuns) {
        for (var i = 0; i < rr.length - 1; i++) {
            ratRunPairs.add(JSON.stringify([rr[i], rr[i+1]]));
        }
    }
    streets.eachLayer(function(polyline) {
        let start = polyline['_point_start'];
        let end = polyline['_point_end'];
        polyline._rat_run = ratRunPairs.has(JSON.stringify([start,end])) || ratRunPairs.has(JSON.stringify([end,start]));
    });
}

function refreshRatRuns(){
    graph = buildGraph(streets);
    ratRuns = getRatRuns(graph, transitStreet);
    console.log(`Found ${ratRuns.length} rat runs!!!`);
    ratRuns.forEach(r => console.log('- ', r));
    markRatRuns(streets, ratRuns);
}

function displayRatRuns() {
    streets_rr.clearLayers();
    streets.eachLayer(function(layer) {
        if (layer['_rat_run']) {
            streets_rr.addLayer(L.polyline(layer.getLatLngs(), {color: 'red', weight: 10, interactive: false }));
        }
    });
    streets_rr.addTo(map);
    streets_rr.bringToBack();
}

function drawStreets(pointDictionary) {
    // add segments for all local streets
    console.log("drawing streets...");
    console.log("found dict with nb points:", Object.keys(pointDictionary).length);
    for (let key in pointDictionary) {
        p = pointDictionary[key];
        way_start = L.latLng(p.lat, p.long);
        if (p.neighbors.length > 0) {
            for (let n of p.neighbors) {
                if (n>0) {
                    p_end = pointDictionary[n];
                    way_end = L.latLng(p_end.lat, p_end.long);
                    var polyline = L.polyline([way_start, way_end], {color: 'blue'}).arrowheads(arrowSettings).on('click', reverseArrow);
                    polyline['_rat_run'] = p.neighbors_rr && p.neighbors_rr.length > 0 && p.neighbors_rr.includes(n);
                    polyline['_direction'] = Direction.BASE;
                    polyline['_base'] = Direction.BASE;
                    polyline['_point_start'] = Number(key);
                    polyline['_point_end'] = Number(n);
                    streets.addLayer(polyline);
                }
            }
        }
    }
    streets.addTo(map);

    refreshRatRuns();
    displayRatRuns();
}

// Load points in geojson file and markers
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', function() {
  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.addEventListener('load', function() {
    const geoJSON = JSON.parse(reader.result);
    dict = parsePoints(geoJSON.features);
    drawStreets(dict);
    bounds = L.geoJSON(geoJSON).getBounds();
    map.fitBounds(bounds);
  });

  reader.readAsText(file);
});

const clearButton = document.getElementById("clear-rat-runs");
clearButton.addEventListener("click", function() {
    streets_rr.clearLayers();
});

const displayButton = document.getElementById("display-rat-runs");
displayButton.addEventListener("click", function() {
    refreshRatRuns();
    displayRatRuns();
});

// Mock dict
let point1 = new Point(40.748817, -73.985428, 1);
point1.neighbors.push(2);
let point2 = new Point(41.748817, -74.985428, 2);
point2.neighbors.push(1);
let a = { 1: point1, 2: point2};
//console.log(a);
//drawStreets(a);


layers = {};