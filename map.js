const Constant = {
    MODAL_FILTER_DASH: '10,10',
    DEAD_END_DISPLAY_DELAY: 3000,
}

const arrowSettings = {
    size: '15px',
    //frequency: '100px',
    fill: true,
    yawn: 30
};

let LOG_LEVEL = 0;

let streets = L.featureGroup();
let streets_rr = L.featureGroup();
let processRatRuns = true;
let timerDeadEnds;
let localNodes;

// Create the map
var map = L.map('map', { doubleClickZoom: false }).setView([48.89, 2.345], 15); // disable double-click zoom to avoid confusion when clicking arrows

// Add a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
}).addTo(map);


function addDoubleArrow(polyline, arrowColor) {
    var polyline2 = L.polyline(polyline.getLatLngs(), {color: arrowColor, interactive: false }).arrowheads(arrowSettings);
    polyline2.setLatLngs(polyline2.getLatLngs().reverse());
    polyline2.addTo(map);
    polyline._polyline2 = polyline2;
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
        addDoubleArrow(polyline, arrowColor);

    } else if (polyline._direction === Direction.DOUBLE) {
        // From DOUBLE to NONE
        polyline._direction = Direction.NONE;
        arrowColor = (polyline._base === Direction.NONE) ? "blue" : "green";
        polyline.getArrowheads().remove();
        polyline.setStyle({color : arrowColor, dashArray: Constant.MODAL_FILTER_DASH });
        polyline._polyline2.remove();

    } else {
        // From NONE to BASE
        polyline._direction = Direction.BASE;
        arrowColor = (polyline._base === Direction.BASE) ? "blue" : "green";
        polyline.getArrowheads().addTo(map);
        polyline.setStyle({color : arrowColor, dashArray: ''});
        polyline.setLatLngs(polyline.getLatLngs());
    }

    refreshDeadEnds(true);
    refreshDeadEndsDelayed(false);

    refreshRatRuns();
    displayRatRuns();
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
        if (rr[1] < rr[0]) {
            ratRunPairs.add(JSON.stringify([rr[1], rr[0]]));
        } else {
            ratRunPairs.add(JSON.stringify([rr[0], rr[1]]));
        }
    }
    if (ratRunPairs.size > 0) {
        if (LOG_LEVEL >= 1) {
            console.log(`Found ${ratRunPairs.size}/${nb_segments} rat runs segments`);
        }
        if (LOG_LEVEL >= 4) {
            ratRuns.forEach(r => console.log('- ', r));
        }
    }

    streets.eachLayer(function(polyline) {
        let start = polyline['_point_start'];
        let end = polyline['_point_end'];
        polyline._rat_run = ratRunPairs.has(JSON.stringify([start,end])) || ratRunPairs.has(JSON.stringify([end,start]));
    });
}

// Ensure can enter and exit into each local street node
// Flag items where we can't
function flagDeadEnds(graph, localNodes) {
    let nodesWithEntry = new Set();
    let nodesWithExit = new Set();
    for (let start in graph) {
        for (let end of graph[start]) {
            nodesWithEntry.add(end);
            nodesWithExit.add(parseInt(start));
        }
    }

    let deadNodes = new Set();
    for (let node of localNodes) {
        if (!nodesWithEntry.has(node) || !nodesWithExit.has(node)) {
            deadNodes.add(node);
        }
    }

    return deadNodes;
}

// A dead-end warning is displayed in case the user has swapped arrows in a way
// that doesn't leave any entry or exit on a local, interior node.
// A bit of extra logic is added so that, when the user fixes this error,
// the warning is removed immediately, but when the user creates such an error,
// a delay of a few seconds is added (and reset upon each click), before
// checking again and finally inserting the warning, if there is a dead-end.
function refreshDeadEnds(removeOnly){
    let graph = buildGraph(streets);
    let deadNodes = flagDeadEnds(graph, localNodes);

    let textDeadNodes = '';
    if (deadNodes.size == 1) {
        textDeadNodes = `Attention: le noeud ${[...deadNodes]} n'a plus d'entrée/sortie`
    } else if (deadNodes.size > 1) {
        textDeadNodes = `Attention: les noeuds ${[...deadNodes]} n'ont plus d'entrée/sortie`
    }

    if (textDeadNodes.length == 0 || !removeOnly) {
        const deadText = document.getElementById('dead-ends');
        deadText.textContent = textDeadNodes;
    }
}

function refreshDeadEndsDelayed(removeOnly) {
    clearInterval(timerDeadEnds);
    timerDeadEnds = setInterval(() => {
        clearInterval(timerDeadEnds);
        refreshDeadEnds(removeOnly);
    }, Constant.DEAD_END_DISPLAY_DELAY);
};

function refreshRatRuns(){
    if (!processRatRuns) {
        return;
    }
    let graph = buildGraph(streets);
    //TODO: let graph = buildGraphFromPoints(buildPointGraph(streets));
    let ratRuns = getRatRuns(graph, startEnds);
    markRatRuns(streets, ratRuns);
}

function displayRatRuns() {
    if (!processRatRuns) {
        return;
    }
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
    if (LOG_LEVEL >= 2) {
        console.log("drawing streets...");
        console.log("found dict with nb points:", Object.keys(pointDictionary).length);
    }
    for (let key in pointDictionary) {
        p = pointDictionary[key];
        way_start = L.latLng(p.lat, p.long);
        if (Object.keys(p.neighbors).length > 0) {
            for (let n in p.neighbors) {
                if (n>0) {
                    p_end = pointDictionary[n];
                    way_end = L.latLng(p_end.lat, p_end.long);
                    direction = p.neighbors[n];
                    dashStyle = (direction === Direction.NONE) ? Constant.MODAL_FILTER_DASH : "";

                    var polyline = L.polyline([way_start, way_end], {color: 'blue', dashArray: dashStyle});
                    polyline['_rat_run'] = p.neighbors_rr && p.neighbors_rr.length > 0 && p.neighbors_rr.includes(n);
                    polyline['_direction'] = direction;
                    polyline['_base'] = direction;
                    polyline['_point_start'] = Number(key);
                    polyline['_point_end'] = Number(n);
                    polyline.on('click', reverseArrow);
                    streets.addLayer(polyline);

                    if (direction == Direction.BASE) {
                        polyline.arrowheads(arrowSettings);
                    } else if (direction == Direction.DOUBLE) {
                        polyline.arrowheads(arrowSettings);
                        addDoubleArrow(polyline, "blue");
                    }
                }
            }
        }
    }
    streets.addTo(map);
}

function processGeojson(geojson) {
    const geoJSON = JSON.parse(geojson);

    // Remove previous lines
    streets.clearLayers();
    streets_rr.clearLayers();
    bounds = L.geoJSON(geoJSON).getBounds();
    map.fitBounds(bounds);

    let plan = getPlanObjects(geoJSON);
    startEnds = plan.startEnds;
    drawStreets(plan.points);
    processRatRuns = plan.processRatRuns;
    checkbox.checked = processRatRuns;
    localNodes = plan.localNodes;

    refreshRatRuns();
    displayRatRuns();
}

function loadHostedGeojson(geojsonFilename) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                processGeojson(xhr.responseText);
            } else {
                alert("impossible de charger le fichier " + geojsonFilename + ". Ca peut être dû notamment à une erreur dans le chemin du fichier, à une mauvaise connection, ou à une configuration CORS invalide du serveur distant");
            }
        }
    };
    xhr.open("GET", geojsonFilename);
    xhr.send();
}

const remoteGeojsonParamKey = "geojson_url";
const localGeojsonParamKey = "geojson";
const localGeojsonPath = "../../geojson/";

function updateLocationWithRemoteGeojsonPath(geojsonPath) {
    var url = new URL(window.location.href);
    url.searchParams.set(remoteGeojsonParamKey, encodeURI(geojsonPath));
    url.searchParams.delete(localGeojsonParamKey);
    window.history.pushState(null, null, url);
}

function getGeojsonPathFromUrl() {
    const params = new URL(window.location.href).searchParams;
    if (params.has(remoteGeojsonParamKey)) {
        return decodeURI(params.get(remoteGeojsonParamKey));
    } else if (params.has(localGeojsonParamKey)) {
        return localGeojsonPath + decodeURI(params.get(localGeojsonParamKey));
    } else {
        return null;
    }
}


// Load points in geojson file and markers
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', function() {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.addEventListener('load', function() {
        processGeojson(reader.result);
    });

    reader.readAsText(file);
});

// Load geojson from url
const loadUrlInput = document.getElementById('loadFileFromUrl');
const loadUrlField = document.getElementById('urlToLoadFrom');
loadUrlInput.addEventListener('click', function() {
    const geojsonUrl = loadUrlField.value;
    updateLocationWithRemoteGeojsonPath(geojsonUrl);
    loadHostedGeojson(geojsonUrl);
});

geojsonPathFromUrl = getGeojsonPathFromUrl();
if (geojsonPathFromUrl) {
    console.log("going to load geojson from " + geojsonPathFromUrl);
    if (geojsonPathFromUrl.startsWith("http")) {
        loadUrlField.value = geojsonPathFromUrl;
    }
    loadHostedGeojson(geojsonPathFromUrl);
} else {
    console.log("no geojson url found");
}

const checkbox = document.getElementById('show-rat-runs');
checkbox.checked = false;
checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
        processRatRuns = true;
        refreshRatRuns();
        displayRatRuns();
    } else {
        processRatRuns = false;
        streets_rr.clearLayers();
    }
});
