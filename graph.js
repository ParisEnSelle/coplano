let graphCountTotal = 0;
if (typeof LOG_LEVEL === 'undefined') {
    LOG_LEVEL = 1;
}

//
// Graph building functions
//

// Build list of points
class Point {
    constructor(lat, long, id) {
        this.lat = lat;
        this.long = long;
        this.id = parseInt(id); // for retro-compatibility, should remove it
        this.neighbors = {};
    }
}


const Direction = {
    BASE: 'base',
    REVERSE: 'reverse',
    DOUBLE: 'double',
    NONE: 'none'
};


let startEnds;
let nb_nodes = 0;
let nb_segments = 0;

// Verify there is no duplicate  a->b b->a neighbor relationship
function checkNoSelfReferencingNeighbors(points) {
    let logs = "";
    for (let id in points) {
        let neighbors = points[id].neighbors;
        for (let n in neighbors) {
            if (points[n] && points[n].neighbors && points[n].neighbors[id] && id < n) { // Only display message once
                output = `Error: points ${id} and ${n} are self-referencing each other`
                console.log(output);
                logs += output + "\n";
            }
        }
    }
    return logs;
}

function checkIdValid(points) {
    let logs = "";
    for (let p in points) {
        let id = points[p].id;
        if (!Number.isInteger(id) || id < 0) { // 0 is special value authorized
            let output = `Error: a point has an invalid id ${id}`
            console.log(output);
            logs += output + "\n";
        }
    }
    return logs;
}

function checkPointErrors(points) {
    let logs = checkNoSelfReferencingNeighbors(points);
    logs += checkIdValid(points);
    if (logs) {
        alert("Error(s) on importing geojson, see details below. Please cleanup the geojson and reload the file.\n\n" + logs);
        throw("Geojson point configuration error");
    }
}

function describePoints(points) {
    let nodes = 0;
    let segments = 0;
    for (let id in points) {
        nodes += 1;
        for (let n in points[id].neighbors) {
            segments += 1;
        }
    }
    nb_nodes = nodes;
    nb_segments = segments;
    if (LOG_LEVEL >= 1) {
        console.log(`Initialization: loaded ${nodes} nodes with ${segments} segments.`)
    }
}


function parsePoints(points) {
    //console.log("parsing points:", points.length)
    let pointsDictionary = {};
    for (let point of points) {
        let newPoint = new Point(point.geometry.coordinates[1], point.geometry.coordinates[0], point.properties.id);
        function parseNeighbors(list, direction) {
            if (list) {
                neighborsList = Array.from(list.split(","), Number);
                neighborsList.forEach((n, i, a) => newPoint.neighbors[n] = direction);
            }
        }
        parseNeighbors(point.properties.local_street , Direction.BASE);
        parseNeighbors(point.properties.local_street_double_way , Direction.DOUBLE);
        parseNeighbors(point.properties.local_street_modal_filter , Direction.NONE);
        newPoint.transit = point.properties.transit_node && point.properties.transit_node == "1";
        if (point.properties.transit_street) {
            newPoint.neighbors_transit = Array.from(point.properties.transit_street.split(","), Number);
        }
        // Keep retro-compatibility with transit exceptions
        // 'transit exceptions' have been replaced with 'transit blacklist'
        if (point.properties.transit_exceptions) {
            newPoint.transit_blacklist = Array.from(point.properties.transit_exceptions.split(","), Number);
        }
        if (point.properties.transit_blacklist) {
            newPoint.transit_blacklist = Array.from(point.properties.transit_blacklist.split(","), Number);
        }
        if (point.properties.transit_whitelist) {
            newPoint.transit_whitelist = Array.from(point.properties.transit_whitelist.split(","), Number);
        }
        pointsDictionary[point.properties.id] = newPoint;
    }
    return pointsDictionary;
}


function buildGraphfromPoints(points) {
    let pairs = [];
    for (let start in points) {
        start = parseInt(start);
        let p = points[start];
        for (let end in p.neighbors) {
            end = parseInt(end);
            let direction = p.neighbors[end];
            if (direction === Direction.BASE) {
                pairs.push([start, end]);
            } else if (direction === Direction.REVERSE) {
                pairs.push([end, start]);
            } else if (direction === Direction.DOUBLE) {
                pairs.push([start, end]);
                pairs.push([end, start]);
            }
        }
    }
    return buildGraphfromPairs(pairs);
}


function getTransitSets(transitGraph) {
    let assignedTransit = {};
    let transitStreets = {};
    let transitCounter = 0;

    for (let key in transitGraph) {
        // account for cases where no transit neighbors was defined for a transit node
        if (transitGraph[key] === undefined) {
            transitGraph[key] = [Number(key)];
        }
        for (let n of transitGraph[key]) {
            let transitId;
            if (!assignedTransit[key] && !assignedTransit[n]) {
                transitCounter += 1;
                transitId = transitCounter;
                transitStreets[transitId] = [];
            } else if (assignedTransit[key] && assignedTransit[n]) {
                transitId = assignedTransit[key];
                let transitIdOther = assignedTransit[n];
                if (transitId != transitIdOther) {  // merge two transit sets
                    let transitStreetOther = transitStreets[transitIdOther];
                    let transitStreetOtherNodes = getUniqueElements(transitStreetOther);
                    for (let i of transitStreetOtherNodes) {
                      assignedTransit[i] = transitId;
                    }
                    transitStreets[transitId] = transitStreets[transitId].concat(transitStreetOther);
                    delete transitStreets[transitIdOther]; //remove item from dico
                }
            } else if (assignedTransit[n]) {
                transitId = assignedTransit[n];
            } else if (assignedTransit[key]) {
                transitId = assignedTransit[key];
            }
            assignedTransit[key] = transitId;
            assignedTransit[n] = transitId;
            transitStreets[transitId].push([Number(key), n]);
        }
    }


    for (let key in transitStreets) {
        transitStreets[key] =  getUniqueElements(transitStreets[key]);
    }
    // TODO: verify all nodes marked as transit are part of a transit street
    return Object.values(transitStreets);
}

function buildTransitStreets(points) {
    let transitGraph = {};
    for (let p in points) {
        if (points[p].transit) {
            transitGraph[p] = points[p].neighbors_transit;
            if (LOG_LEVEL >= 2) {
                console.log(`Transit node ${p}: ${points[p].neighbors_transit}`)
            }
        }
    }

    return getTransitSets(transitGraph);
}

function buildTransitBlacklists(points) {
    let transitBlacklists = {};
    for (let p in points) {
        if (points[p].transit_blacklist) {
            transitBlacklists[p] = points[p].transit_blacklist;
            if (LOG_LEVEL >= 2) {
                console.log(`Transit blacklist from ${p}: ${points[p].transit_blacklist}`)
            }
        }
    }

    return transitBlacklists;
}

function buildTransitWhitelists(points) {
    let transitWhitelists = {};
    for (let p in points) {
        if (points[p].transit_whitelist) {
            transitWhitelists[p] = points[p].transit_whitelist;
            if (LOG_LEVEL >= 2) {
                console.log(`Transit whitelist from ${p}: ${points[p].transit_whitelist}`)
            }
        }
    }

    return transitWhitelists;
}


// Initialization function to determine the 'local' or 'interior' nodes from
// the graph. These nodes will then be checked for dead-ends.
function getLocalNodes(graph) {
    let nodesWithEntry = new Set();
    let nodesWithExit = new Set();
    let nodesNeighbors = {};
    for (let start in graph) {
        start = parseInt(start);
        for (let end of graph[start]) {
            nodesWithEntry.add(end);
            nodesWithExit.add(start);
            if (!(start in nodesNeighbors)) {
                nodesNeighbors[start] = new Set();
            }
            if (!(end in nodesNeighbors)) {
                nodesNeighbors[end] = new Set();
            }
            nodesNeighbors[start].add(end);
            nodesNeighbors[end].add(start);
        }
    }

    let localNodes = new Set();
    for (let node in graph) {
        node = parseInt(node);
        if (nodesWithEntry.has(node) && nodesWithExit.has(node) && nodesNeighbors[node].size > 1) {
            localNodes.add(node);
        }
    }
    if (LOG_LEVEL >= 2) { console.log(`local nodes: ${[...localNodes]}`); }
    return localNodes;
}

function checkRatRunSettings(points) {
    let processRatRuns = true;
    for (let point of points) {
        if (point.properties.ignore_rat_runs) {
            console.log("Skipping rat runs");
            processRatRuns = false;
        }
    }
    return processRatRuns;
}


function getPlanObjects(geojson) {
    let dict = parsePoints(geojson.features);
    checkPointErrors(dict);
    describePoints(dict);
    let transitSets = buildTransitStreets(dict);
    let transitBlacklists = buildTransitBlacklists(dict);
    let transitWhitelists = buildTransitWhitelists(dict);
    startEnds = getStartEnds(transitSets, transitBlacklists, transitWhitelists);
    let graph = buildGraphfromPoints(dict);
    let localNodes = getLocalNodes(graph);
    let processRatRuns = checkRatRunSettings(geojson.features);
    return { points: dict, graph, startEnds, localNodes, processRatRuns };
}

//
// Graph computation functions
//

// Utility functions
function displayText(sentence) {
    let p = document.createElement("p");
    p.innerHTML = sentence;
    let div = document.getElementById("rat-run-output");
    div.appendChild(p);
}

function printOutput(text) {
    displayText(text);
    console.log(text);
}

function getUniqueElements(pairs) {
    let uniqueElements = new Set();
    for (let pair of pairs) {
        uniqueElements.add(pair[0]);
        uniqueElements.add(pair[1]);
    }
    return uniqueElements;
}

function buildGraphfromPairs(pairs) {
    let graph = {};
    let nodes = getUniqueElements(pairs);
    for (let node of nodes) {
        graph[node] = new Set();
    }
    for (let pair of pairs) {
        let n0 = pair[0];
        let n1 = pair[1];
        graph[n0].add(n1);
    }
    return graph;
}

function getRatRunSegments(graph, start, ends) {
    let segments = new Set();
    let paths = depthFirstSearch(graph, start, ends);
    // build pairs from path fragments
    for (let p of paths) {
        for (var i = 0; i < p.length - 1; i++) {
            segments.add(JSON.stringify([p[i], p[i+1]]));
        }
    }

    let result = [];
    for (let s of segments) {
        result.push(JSON.parse(s));
    }
    return result;
}

function depthFirstSearch(graph, start, labels, path = [], visited = new Set()) {
    graphCountTotal += 1;
    if (graphCountTotal % (1000 * 1000) === 0) {
        console.log(`${graphCountTotal} nodes`);
    }
    visited.add(start);
    path = path.concat(start);
    if (labels.has(start)) {
        // all edges from the path should be marked as rat runs
        // also stop any other recursive call from processing this node again
        // (assume all child paths will be called by a prior DFS call)
        for (let node of path) {
            labels.add(node);
        }
        return [path];
    }
    let paths = [];
    if (graph[start]) {
        for (let node of graph[start]) {
            if (!visited.has(node)) {
                let newPaths = depthFirstSearch(graph, node, labels, path, new Set(visited));
                paths = paths.concat(newPaths);
            }
        }
    }
    return paths;
}

function groupKeysBySet(dictionary) {
    const grouped = {};

    // Iterate over the dictionary
    for (const key in dictionary) {
        if (dictionary.hasOwnProperty(key)) {
            const set = Array.from(dictionary[key]);
            // Convert sorted keys to string for using as object key
            const sortedKeys = set.sort();
            const setKey = JSON.stringify(sortedKeys);

            if (!(setKey in grouped)) {
                grouped[setKey] = { keys: [], set };
            }

            grouped[setKey].keys.push(parseInt(key));
        }
    }

    // Convert grouped object to array of pairs
    const result = [];
    for (const key in grouped) {
        if (grouped.hasOwnProperty(key)) {
            result.push([grouped[key].keys, grouped[key].set]);
        }
    }

    return result;
}

function getStartEnds(transitSets, transitBlacklists, transitWhitelists) {
    transitNodesAll = new Set();
    for (let s of transitSets) {
        for (let n of s) {
            transitNodesAll.add(n);
        }
    }

    let startEnds = {};

    // all transit nodes should belong to a transit set (by definition)
    for (let transit of transitSets) {
        for (let startNode of transit) {
            let destinationNodes = new Set([...transitNodesAll].filter(x => !transit.has(x)));

            // supersede transit set logic
            if (transitBlacklists && transitBlacklists[startNode]) {
                destinationNodes = new Set([...destinationNodes].filter(x => !transitBlacklists[startNode].includes(x)));
            }

            // supersede transit set and transit blacklist logics
            if (transitWhitelists && transitWhitelists[startNode]) {
                destinationNodes = new Set(transitWhitelists[startNode]);
                destinationNodes.delete(0); // id '0' is a special case that must be dismissed
            }

            if (destinationNodes.size > 0) {
                startEnds[startNode] = destinationNodes;
            }
        }
    }

    // merge them and return the result
    let res = groupKeysBySet(startEnds);
    return res;
}

function getRatRuns(graph, startEnds) {
    let ratRuns = [];
    let time_start = performance.now();
    for (let pair of startEnds) {
        let startNodes = pair[0];
        let destinationNodes = new Set(pair[1]);
        // TODO: run the algo on all start nodes simultaneously
        for (let startNode of startNodes) {
            let newRatRuns = getRatRunSegments(graph, startNode, destinationNodes);
            ratRuns = ratRuns.concat(newRatRuns);
        }
    }
    let time_end = performance.now();
    if (LOG_LEVEL >= 1) { console.log(`${graphCountTotal} nodes in total in ${Math.round(time_end - time_start)} ms`); }

    graphCountTotal = 0;
    return ratRuns;
}

module.exports = {
    depthFirstSearch,
    getLocalNodes,
    getRatRuns,
    getRatRunSegments,
    getUniqueElements,
    groupKeysBySet,
    getStartEnds,
};
