/*
This file contains Hierholzer's algorithm.
This algorithm finds Eulerian paths and/or Eulerian circuits.
This file runs in a separate thread from the main thread.
*/

self.onmessage = (e) => {
    // -- Initialize variables -- //
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
        sleep_time = 500;    
        display = false;  // Specifies whether algorithm process is displayed
    } else {
        sleep_time = e.data[5];
        display = true;   // Specifies whether algorithm process is displayed
    };
    const dir_bool = e.data[6];
    const undir_bool = e.data[7];

    let inDegree = [];
    let outDegree = [];
    let N = node_li.length; // Stores the number of nodes in the graph
    let path = [];  // Stores the path
    let pathToReconstruct;  // Stores the path to reconstruct

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
            if ((from == startIndex) && (to == endIndex)) {
                updateLine(lineIndex, color);
                return lineIndex;
            };
        };
    };

    function countInOutDegrees() {
        for (let i=0;i<N;i++) {
            inDegree[i] = 0;
            outDegree[i] = 0;
        }
        for (let startIndex=0;startIndex<N;startIndex++) {  // For each starting node
            for (let endIndex=0;endIndex<N;endIndex++) {    // For each end node
                if (adjacency_matrix[indexToId(startIndex)][indexToId(endIndex)] != Infinity) { // If an edge exists
                    inDegree[endIndex]++;   // Increment 1 for end node
                    outDegree[startIndex]++;    // Increment 1 for start node
                };
            };
        };
    };

    function graphHasEulerianPath() {
        let startNodeCount = 0; // Tracks the number of potential start nodes
        let endNodeCount = 0;   // Tracks the number of potential end nodes
        for (let i=0;i<N;i++) {
            if (Math.abs(outDegree[i] - inDegree[i]) > 1) return false; 
            /*
            If the difference between the out degree and the in degree is more than 1 no eulerian path exists
            */
            if (outDegree[i] - inDegree[i] == 1) {  // If condition satisfies start node criteria
                startNodeCount++;   // Tracks the number of potential start nodes
            } else if (inDegree[i] - outDegree[i] == 1) {   // If condition satisfied end node criteria
                endNodeCount++; // Track the number of potential end nodes
            };
        };
        return ((endNodeCount == 0) && (startNodeCount == 0)) || ((endNodeCount == 1) && (startNodeCount == 1));
    };

    function findStartNode() {
        let start = 0;
        for (let i=0;i<N;i++) {
            if (outDegree[i] - inDegree[i] == 1) return i;  // Find the ideal starting node
            if (outDegree[i] > 1) start = i;    // If no ideal start node is found start at any node with an outgoing edge
        };
        return start;
    };

    function dfs(at) {  // at represents the node index of the current node
        while (outDegree[at] != 0) {  // While the current node still has outgoing edges
            // Select the next unvisited outgoing edge 
            let counter = 0;    // Tracks the number of nodes connected
            let nextNode = -1;    // Tracks the next edge to go to
            while (counter < outDegree[at]) { // Loops until the counter matches the ith end node
                nextNode++; // Increment node id
                if (adjacency_matrix[indexToId(at)][nextNode] != Infinity) counter++;  // Add to counter is edge exists
            };
            outDegree[at]--;
            nextNode = idToIndex(nextNode); // Convert node id to node index
            if (display) {
                updateLineByStartEnd(at, nextNode, "#FFA849");
                sleep(sleep_time);    
            };
            dfs(nextNode);  // Recursively perform a depth first search
            if (display) {
                updateLineByStartEnd(at, nextNode, "white");
                sleep(sleep_time);    
            }; 
        };
        path.unshift(at);   // Add node to path solution
        return;
    };

    function findEulerianPath() {
        countInOutDegrees();
        if (!graphHasEulerianPath()) {  // If graph does not contain an Eulerian Path
            // Draw all nodes and lines as red //
            for (let nodeIndex=0;nodeIndex<node_li.length;nodeIndex++) {
                updateNode(nodeIndex, "red");
            };
            for (let lineIndex=0;lineIndex<line_li.length;lineIndex++) {
                updateLine(lineIndex, "red");
            };
        } else {
            dfs(findStartNode());
            if (path.length == line_li.length + 1) return path;
            return null;
        };        
    };

    function reconstructPath(arg0) {
        if (arg0 == null) { // If no path is found
            for (let lineIndex=0;lineIndex<line_li.length;lineIndex++) {    // Loop through each line
                updateLine(lineIndex, "red");   // Set line to red
            };
        } else {    // If a path is found
            for (let i=1;i<arg0.length;i++) {   // Loop through each next node
                updateLineByStartEnd(arg0[i - 1], arg0[i], "#2F7B1F");
                sleep(sleep_time);
            };
        };
    };

    // -- Code Starts Here -- //
    pathToReconstruct = findEulerianPath();
    reconstructPath(pathToReconstruct);
    self.postMessage("terminate");  // Tells main thread to terminate web worker
};