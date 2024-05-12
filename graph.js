let graphCountTotal = 0;

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

function getRatRuns(graph, transitSets, transitBlacklists, transitWhitelists) {
    transitNodesAll = new Set();
    for (let s of transitSets) {
        for (let n of s) {
            transitNodesAll.add(n);
        }
    }

    let ratRuns = [];
    let time_start = performance.now();
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
                let newRatRuns = getRatRunSegments(graph, startNode, destinationNodes);
                ratRuns = ratRuns.concat(newRatRuns);
            }
        }
    }
    let time_end = performance.now();
    if (LOG_LEVEL >= 1) { console.log(`${graphCountTotal} nodes in total in ${Math.round(time_end - time_start)} ms`); }

    graphCountTotal = 0;
    return ratRuns;
}

module.exports = {
    depthFirstSearch,
    getRatRuns,
    getRatRunSegments,
    getUniqueElements
};
