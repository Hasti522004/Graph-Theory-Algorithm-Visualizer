/* 
This file contains Dijkstra's Shortest Path algorithm.
This algorithm finds the shortest path between two points on a weighted graph with no negative edge weights.
This file runs in a separate thread from the main thread.
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

    let unvisited = [];   // Tracks which nodes have been unvisited. Stores indexes relative to node_li.
    for (let index=0;index<node_li.length;index++) {
        unvisited[index] = true;   // Marks each node as unvisited
    };
    let shortestDistance = new Array(node_li.length).fill(Infinity);  // Stores the shortest distance from starting node
    let unvisitedDistance = [];  // Holds the distances of unvisited nodes
    let prev = new Array(node_li.length).fill(null);  // Tracks the index of the previous node
    let distance;   // Tracks the distance of neighbor
    let bestDistance;   // Stores the best distance among unvisited nodes
    let currentIndex = startIndex;  // Tracks the index of the current node
    if (display) {
        updateNode(currentIndex, "#FFA849");
        sleep(sleep_time);    
    };
    
    let neighbors = []; // Tracks the neighbors of the current node
    shortestDistance[currentIndex] = 0;   // Starting index is 0 units away from itself

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

    // -- Code Starts Here -- //d
    // Start Dijkstra //
    while (unvisited.filter((element) => element).length > 0) {   // Repeats while nodes are unvisited
        neighbors = [];
        // Find unvisited neighbors //
        for (let id=0;id<adjacency_matrix[indexToId(currentIndex)].length;id++) {  
            if (adjacency_matrix[indexToId(currentIndex)][id] != Infinity) {    
                neighbors.push(id);
            };
        };
        
        if (neighbors.length > 0) { // Checks if neighbors exist
            neighbors = neighbors.map((id) => idToIndex(id)).filter((index) => unvisited[index]);   // Convert id's to index's, then keep only the ones that are unvisited    
            // Find distance to neighbor from current node //
            for (n of neighbors) {
                distance = shortestDistance[currentIndex] + adjacency_matrix[indexToId(currentIndex)][indexToId(n)];    // Calculate distance to neighbor from starting node
                if (distance < shortestDistance[n]) {   // If distance is shorter than currently recorded distance
                    shortestDistance[n] = distance; // Update distance
                    prev[n] = currentIndex; // Update the previous node
                };
                if (display) {
                    updateNode(n, "#FFA849");   // Program is currently searching this node
                    let line_index = 0;
                    for (line_index = 0;line_index < line_li.length;line_index++) { // Finds the line(s)
                        if ((idToIndex(line_li[line_index].endNodeId) == n) && 
                        (idToIndex(line_li[line_index].startNodeId) == currentIndex) && dir_bool) {    // If an edge connects the current node and the previous node
                            updateLine(line_index, "#FFA849");   // Updates the line
                            sleep(sleep_time);
                        };
                        if (((idToIndex(line_li[line_index].startNodeId) == currentIndex) && 
                        (idToIndex(line_li[line_index].endNodeId) == n)) || 
                        ((idToIndex(line_li[line_index].endNodeId) == currentIndex) && 
                        (idToIndex(line_li[line_index].startNodeId) == n)) && undir_bool) {    // If an edge connects the current node and the previous node
                            updateLine(line_index, "#FFA849");   // Updates the line
                        };
                    };
                    sleep(sleep_time);
                    updateNode(n, "#397EC9");
                    for (line_index = 0;line_index < line_li.length;line_index++) { // Finds the line(s)
                        if ((idToIndex(line_li[line_index].endNodeId) == currentIndex) && 
                        (idToIndex(line_li[line_index].startNodeId) == n) && dir_bool) {    // If an edge connects the current node and the previous node
                            updateLine(line_index, "white");   // Resets the line
                            sleep(sleep_time);
                        };
                        if (((idToIndex(line_li[line_index].startNodeId) == currentIndex) && 
                        (idToIndex(line_li[line_index].endNodeId) == n)) || 
                        ((idToIndex(line_li[line_index].endNodeId) == currentIndex) && 
                        (idToIndex(line_li[line_index].startNodeId) == n)) && undir_bool) {    // If an edge connects the current node and the previous node
                            updateLine(line_index, "white");   // Resets the line
                        };
                    };
                    sleep(sleep_time);    
                };
            };
        };
        
        // Find next node to go to
        unvisited[currentIndex] = false;    // Sets current node to visited
        updateNode(currentIndex, "#397EC9");    // Resets node color
        if (unvisited.filter((element) => element).length == 0) break;  // Checks if there are any unvisited nodes left to explore
        unvisitedDistance = shortestDistance.filter((value, index) => unvisited[index]);   // Filters out the distance of already visited nodes
        bestDistance = Math.min.apply(Math, unvisitedDistance);  // Finds the best distance
        for (currentIndex = 0;currentIndex < shortestDistance.length;currentIndex++) {
            if ((shortestDistance[currentIndex] == bestDistance) && (unvisited[currentIndex])) {    // Find the index of the node containing the best distance while also being unvisited
                break;
            };
        };
        // currentIndex = shortestDistance.findIndex((element) => element == bestDistance);    // Sets current index
        if (display) {
            updateNode(currentIndex, "#FFA849");
            sleep(sleep_time);    
        };
    };
    
    // Reconstruct shortest path //
    currentNode = endIndex;
    previousNode = prev[currentNode];
    while (previousNode != null) {   // While a previous node exists
        for (let line_index = 0;line_index < line_li.length;line_index++) { // Finds the line(s)
            if ((idToIndex(line_li[line_index].endNodeId) == currentNode) && 
            (idToIndex(line_li[line_index].startNodeId) == previousNode) && dir_bool) {    // If an edge connects the current node and the previous node
                updateLine(line_index, "#2F7B1F");   // Updates the line
                sleep(sleep_time);
            };
            if ((((idToIndex(line_li[line_index].startNodeId) == currentNode) && 
            (idToIndex(line_li[line_index].endNodeId) == previousNode)) || 
            ((idToIndex(line_li[line_index].endNodeId) == currentNode) && 
            (idToIndex(line_li[line_index].startNodeId) == previousNode))) && undir_bool) {    // If an edge connects the current node and the previous node
                updateLine(line_index, "#2F7B1F");   // Updates the line
            };
        };
        sleep(sleep_time);  // Sleep
        currentNode = previousNode; // Sets current node to its previous node
        previousNode = prev[previousNode];  // Sets previous node to its corresponding previous node
    };
    self.postMessage("terminate");  // Tells main thread to terminate web worker
};