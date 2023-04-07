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

function depthFirstSearch(graph, start, labels, path = [], visited = new Set()) {
    visited.add(start);
    path = path.concat(start);
    if (labels.has(start)) {
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

function getRatRuns(graph, transitStreet, transitExceptions) {
    transitNodesAll = new Set();
    for (let s of transitStreet) {
        for (let n of getUniqueElements(s)) {
            transitNodesAll.add(n);
        }
    }

    let ratRuns = [];
    for (let transit of transitStreet) {
        let startNodes = getUniqueElements(transit);
        for (let start of startNodes) {
            let destinationNodes = new Set([...transitNodesAll].filter(x => !startNodes.has(x)));
            if (transitExceptions && transitExceptions[start]) {
                destinationNodes = new Set([...destinationNodes].filter(x => !transitExceptions[start].includes(x)));
            }
            ratRuns = ratRuns.concat(depthFirstSearch(graph, start, destinationNodes));
        }
    }
    return ratRuns;
}

module.exports = getUniqueElements;
