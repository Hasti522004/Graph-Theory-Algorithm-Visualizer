/* 
This file contains the Bellman-Ford algorithm.
This algorithm finds the shortest path between two points on a weighted graph. 
Unlike Dijkstra this algorithm can handle negative edge weights. 
This algorithm does not return a path if the path is stuck in a negative cycle.
This file runs in a separate thread from the main loop.
*/
self.onmessage = (e) => {
    // -- Initialize variables -- //
    const startId = e.data[0];
    if (startId == null) {  // If no start node is specified
        self.postMessage("missingStart");   // Tells main thread start node is missing
        return; // Ends web worker
    };
    const endId = e.data[1];
    if (endId == null) {  // If no start node is specified
        self.postMessage("missingEnd");   // Tells main thread start node is missing
        return; // Ends web worker
    };
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

    startIndex = idToIndex(startId);
    endIndex = idToIndex(endId);

    let shortestDistance = new Array(node_li.length).fill(Infinity);  // Stores the shortest distance from starting node
    let prev = new Array(node_li.length).fill(null);  // Tracks the index of the previous node

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
        self.postMessage([index, color, null, null, null]);
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
                return;
            };
        };
    };

    // -- Code Starts Here -- //
    shortestDistance[startIndex] = 0;   // Sets the shortest distance of the start index

    // First iteration //
    for (let iteration=0;iteration<node_li.length - 1;iteration++) {    // Iterate |V| - 1 times such that |V| is the number of vertices/nodes in the graph
        for (let currentIndex=0;currentIndex<node_li.length;currentIndex++) {    // Iterate for each node
            if (shortestDistance[currentIndex] == Infinity) {  // If the node has not been visited yet
                continue;   // Skip
            };
            if (display) {
                updateNode(currentIndex, "#FFA849");    // Node is currently being searched
                sleep(sleep_time);    
            };
            
            // Find neighbors //
            for (let id=0;id<adjacency_matrix[indexToId(currentIndex)].length;id++) {   // For each neighbor
                if (adjacency_matrix[indexToId(currentIndex)][id] != Infinity) {    // If node has been visited
                    if (shortestDistance[currentIndex] + adjacency_matrix[indexToId(currentIndex)][id] < shortestDistance[idToIndex(id)]) { // If edge can be relaxed
                        shortestDistance[idToIndex(id)] = shortestDistance[currentIndex] + adjacency_matrix[indexToId(currentIndex)][id];   // Relax edge
                        prev[idToIndex(id)] = currentIndex; // Set the previous node of neighbor
                    };
                    // Draw line and node being explored //
                    if (display) {
                        updateNode(idToIndex(id), "#FFA849");
                        updateLineByStartEnd(currentIndex, idToIndex(id), "#FFA849");
                        sleep(sleep_time);

                        // Reset line and node color //
                        updateNode(idToIndex(id), "#397EC9");
                        updateLineByStartEnd(currentIndex, idToIndex(id), "white");
                        sleep(sleep_time);    
                    };
                };
            };
            if (display) {
                updateNode(currentIndex, "#397EC9");    // Node is currently being searched
                sleep(sleep_time);    
            };
        };
    };

    // Second iteration //
    for (let iteration=0;iteration<node_li.length - 1;iteration++) {    // Iterate |V| - 1 times such that |V| is the number of vertices/nodes in the graph
        for (let currentIndex=0;currentIndex<node_li.length;currentIndex++) {    // Iterate for each node
            if (shortestDistance[currentIndex] == Infinity) {  // If the node has not been visited yet
                continue;   // Skip
            };
            if (display) {
                updateNode(currentIndex, "#FFA849");    // Node is currently being searched
                sleep(sleep_time);    
            };
            
            // Find neighbors //
            for (let id=0;id<adjacency_matrix[indexToId(currentIndex)].length;id++) {   // For each neighbor 
                if (adjacency_matrix[indexToId(currentIndex)][id] != Infinity) {        // Checks if node has been visited
                    if (shortestDistance[currentIndex] + adjacency_matrix[indexToId(currentIndex)][id] < shortestDistance[idToIndex(id)]) { // If node can be relaxed
                        shortestDistance[idToIndex(id)] = Number.NEGATIVE_INFINITY; // Set to negative infinity. Indicates node is part of a negative loop
                        prev[idToIndex(id)] = null; // Node has no shortest path
                    };
                    // Draw line and node being explored //
                    if (display) {
                        updateNode(idToIndex(id), "#FFA849");
                        updateLineByStartEnd(currentIndex, idToIndex(id), "#FFA849");
                        sleep(sleep_time);
                        // Reset line and node color //
                        updateNode(idToIndex(id), "#397EC9");
                        updateLineByStartEnd(currentIndex, idToIndex(id), "white");
                        sleep(sleep_time);
                    };
                };
            };
            if (display) {
                updateNode(currentIndex, "#397EC9");    // Node is currently being searched
                sleep(sleep_time);    
            };
        };
    };

    // Reconstruct shortest path //
    currentNode = endIndex; // Stores the index position of the end node
    previousNode = prev[currentNode];   // Stores the index position of the previous node
    while (previousNode != null) {   // While a previous node exists
        updateLineByStartEnd(previousNode, currentNode, "#2F7B1F");
        sleep(sleep_time);  // Sleep
        currentNode = previousNode; // Sets current node to its previous node
        previousNode = prev[previousNode];  // Sets previous node to its corresponding previous node
    };
    self.postMessage("terminate");  // Tells main thread to terminate web worker
};