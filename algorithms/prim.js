/*
This file contains Prim's Minimum Spanning Tree algorithm.
This file runs in a separate thread from the main thread.
*/

self.onmessage = (e) => {
    // -- Initialize Variables -- //
    const startId = e.data[0];
    const endId = e.data[1];
    const node_li = e.data[2];
    const line_li = e.data[3];
    const adjacency_matrix = e.data[4];
    for (let row=0;row<adjacency_matrix.length;row++) {
        for (let col=0;col<adjacency_matrix[row].length;col++) {
            if (adjacency_matrix[row][col] != Infinity) {
                adjacency_matrix[row][col] = Number(adjacency_matrix[row][col]);    // This is done because the non-infinity values of the adjacency matrix are strings so they need to be converted back to numbers
            };
        };
    };
    let sleep_time;
    let display;
    if (e.data[5] == null) {
        sleep_time = 50;    
        display = false;  // Specifies whether algorithm process is displayed
    } else {
        sleep_time = e.data[5];
        display = true;   // Specifies whether algorithm process is displayed
    };
    const dir_bool = e.data[6];
    const undir_bool = e.data[7];

    const N = node_li.length;   // Store the number of nodes in the graph
    let visited = new Array(N).fill(false);   // Tracks whether nodes have been visited
    let ipqStart = [];   // Represents the start node in the index priority queue
    let ipqEnd = [];   // Represents the end node in the index priority queue
    let ipqWeight = [];   // Represents the edge weight in the index priority queue
    const M = N - 1;    // Number of edges expected in the MST
    let edgeCount = 0;  // Tracks the number of edges 

    // -- Functions -- //
    function sleep(milliseconds) {  // Pauses the program
        const date = Date.now();
        let currentDate = null;
        do {
            currentDate = Date.now();
        } while (currentDate - date < milliseconds);
    };

    function idToIndex(id) {  // Find the index position of node with specified id
        return node_li.findIndex((element) => element.id == id);
    };

    function indexToId(index) { // Finds the id of the node given index
        return node_li[index].id;
    };

    function updateNode(index, color) {
        self.postMessage([index, color, null, null, null, null]);
    };

    function updateLine(index, color) {
        self.postMessage([null, null, index, color, null, null]);
    };

    function updateLineByStartEnd(startIndex, endIndex, color) {    // Updates a line given a start and end index
        for (let lineIndex=0;lineIndex < line_li.length;lineIndex++) {
            let from = idToIndex(line_li[lineIndex].startNodeId);
            let to = idToIndex(line_li[lineIndex].endNodeId);
            if (((from == startIndex) && (to == endIndex))
            || ((from == endIndex)) && (to == startIndex)) {
                updateLine(lineIndex, color);
            };
        };
    };


    function eagerPrims(S) { // Main function
        let mstEdges = [];  // Stores the edges part of MST
        function relaxEdgesAtNode(currentNodeIndex) {
            if (display) {
                updateNode(currentNodeIndex, "#FFA849");
                sleep(sleep_time);    
            };
            visited[currentNodeIndex] = true;   // Marks the current node as visited
            let neighbors = [];
            for (let id=0;id<adjacency_matrix[indexToId(currentNodeIndex)].length;id++) {  // Loops through adjacency matrix at current node
                if (adjacency_matrix[indexToId(currentNodeIndex)][id] != Infinity) {   // If a connection exists
                    neighbors.push(id); // Add the node it's connected to
                };
                if (neighbors.length > N) break;    // Exits for loop if maximum possible nodes is added
            };
            for (neighborId of neighbors) { // For each neighbor
                neighborIndex = idToIndex(neighborId);  // Store index position of neighbor
                if (visited[neighborIndex]) continue;   // If neighbor was already visited continue
                if (!ipqEnd.includes(neighborIndex)) {  // If neighbor is not included
                    ipqStart.push(currentNodeIndex);
                    ipqEnd.push(neighborIndex);
                    ipqWeight.push(adjacency_matrix[indexToId(currentNodeIndex)][indexToId(neighborIndex)]);
                } else {    // If node was already visited
                    let indexOfEnd = ipqEnd.indexOf(neighborIndex);
                    if (adjacency_matrix[indexToId(currentNodeIndex)][neighborId] < ipqWeight[indexOfEnd]) {
                        ipqStart[indexOfEnd] = currentNodeIndex;
                        ipqWeight[indexOfEnd] = adjacency_matrix[indexToId(currentNodeIndex)][neighborId];
                    };
                };
                if (display) {
                    updateNode(neighborIndex, "#FFA849");
                    updateLineByStartEnd(currentNodeIndex, neighborIndex, "#FFA849");
                    sleep(sleep_time);
                    updateNode(neighborIndex, "#397EC9");
                    updateLineByStartEnd(currentNodeIndex, neighborIndex, "white");
                    sleep(sleep_time);    
                };
            };
            if (display) {
                updateNode(currentNodeIndex, "#397EC9");
                sleep(sleep_time);    
            };
        };

        relaxEdgesAtNode(S);

        while ((ipqEnd.length > 0) && (edgeCount < M)) {
            // Extract next best edge //
            let indexToPull = ipqWeight.indexOf(Math.min.apply(Math, ipqWeight));
            let startNodeIndex = ipqStart[indexToPull];
            let endNodeIndex = ipqEnd[indexToPull];
            ipqStart.splice(indexToPull, 1);
            ipqEnd.splice(indexToPull, 1);
            ipqWeight.splice(indexToPull, 1);
            edgeCount++;

            mstEdges.push([startNodeIndex, endNodeIndex]);

            relaxEdgesAtNode(endNodeIndex);
        };
        return mstEdges;
    };

    // -- Code Starts Here -- //
    let edgesInMst = eagerPrims(0);
    for (edge of edgesInMst) {
        updateLineByStartEnd(edge[0], edge[1], "#2F7B1F");
        sleep(sleep_time);
    }
    self.postMessage("terminate");  // Tells main thread to terminate web worker
};