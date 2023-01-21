/*
This file contains the algorithm to find bridges and articulation points.
This file runs in a separate thread from the main thread.

This algorithm does a depth first search of the graph and records the discovery time
and the low-link value of the current node as it goes. It the algorithm visits an
already visited node it checks its low-link value and propagates that low-link value 
along the parent nodes if the low-link value is better. Bridges occur when the current
node's discovery time is less than it's chid's low-link value. Articulation points are
trickier but the algorithm is done in the same depth first search as the bridges 
algorithm. The difference with the articulation points algorithm is that if it visits
an already visited node it returns the discovery time of that node, not the low-link value.
It will propagate that discovery time along the parents via backtracking assuming the
disc value is less than the current nodes disc value. One more thing. When the 
algorithm visits an already visited node it also looks at that nodes children (children
is defined as having a higher disc value than the previous node) and checks their lowest
disc value. If a child is found to have a lower lowest disc value it will return that 
child's lowest disc value.
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
        sleep_time = 50;    
        display = false;  // Specifies whether algorithm process is displayed
    } else {
        sleep_time = e.data[5];
        display = true;   // Specifies whether algorithm process is displayed
    };
    const dir_bool = e.data[6];
    const undir_bool = e.data[7];

    let visited = [];   // Tracks the nodes that have been visited
    let neighbors = []; // Tracks the neighbors of the currently explored node
    let disc = [];  // Tracks the order in which the node is explored
    let low = [];   // Tracks the low-link value of the node
    let lowDisc = [];   // Tracks the lowest disc value before backtracking
    let cumul = 0;  // Tracks the cumulative number of nodes explored
    let lowVal;    // Tracks the low-link values
    let lowDiscVal; // Tracks the lowest disc value
    let art = [];   // Stores the articulation points
    let out;    // Gets the output from the find function
    let id_arr = [];  // Gets the last value for the variable
    let rootChildCounter = 0;   // Counts the number of unvisited children at the root
    let visitedBool;    // Stores whether neighbor was visited or not
    let processing = [];    // Tracks the nodes currently being processed

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

    function find(nodeIndex, prevIndex) {    // NodeIndex and prevIndex are the index's relative to node_li
        if (visited.includes(nodeIndex)) {
            // Look for visited node's children according to DFS tree //
            // Note: Some connections may be parents! //
            for (let childId of neighbors[disc[nodeIndex]]) {   // Loop through children of visited node
                if (disc[idToIndex(childId)] > disc[nodeIndex]) {   // Child must have a higher disc value
                    if (lowDisc[idToIndex(childId)] < lowDisc[nodeIndex]) { // If node has a child with a lower lowDisc value
                        lowDisc[nodeIndex] = lowDisc[idToIndex(childId)];   // Update node's lowDisc value
                    };
                    if (lowDisc[idToIndex(childId)] < disc[nodeIndex]) {    // If child of visited node has a lower lowDisc value
                        return [low[nodeIndex], lowDisc[idToIndex(childId)], true];  // Return that child's lowDisc value
                    }; 
                };
            };
            return [low[nodeIndex], disc[nodeIndex], true]; // Returns is no children has a better lowDisc value
        };
        visited.push(nodeIndex);    // Tracks nodes that have been visited
        disc[nodeIndex] = cumul;    // Sets the disc => order node was explored
        low[nodeIndex] = cumul; // Sets the low link value to the disc value
        lowDisc[nodeIndex] = cumul; // Sets the low disc value to the disc value
        cumul++;
        updateNode(nodeIndex, "#FFA849");  // Sets node color indicating exploring
        sleep(sleep_time);
        
        neighbors[disc[nodeIndex]] = []; // Pushes an empty array
        for (let id=0;id<=node_li[node_li.length - 1].id;id++) {    // Searches through the adjacency matrix
            if ((adjacency_matrix[indexToId(nodeIndex)][id] != Infinity) && (idToIndex(id) != prevIndex)) {   // Finds any values that are not infinity and makes sure to disclude the node it just came from
                function includes2D(someArr, element) {   // Checks whether an element is included in a 2d array
                    for (let row=0;row<someArr.length;row++) {    // Searches through each array
                        if (someArr[row].includes(element)) { // Checks if element is included
                            return true;
                        };
                    };
                    return false;
                };
                if (includes2D(processing, id) || (visited.includes(idToIndex(id)))) {   // If value is in the process of being searched by a parent node or node was already visited
                    neighbors[disc[nodeIndex]].push(id);    // Adds the id at the end. Low priority    
                } else {    // No node is in the process of searching it
                    neighbors[disc[nodeIndex]].unshift(id);    // Adds the id at the beginning. High priority
                };
                
            };
        };
        processing.push(neighbors[disc[nodeIndex]]);   // Adds all current neighbors as being processed
        for (id of neighbors[disc[nodeIndex]]) {    // For each of the current nodes neighbors
            id_arr.push(id);
            out = find(idToIndex(id_arr[id_arr.length - 1]), nodeIndex);   // Recursively do a depth first search. Returns the low-link value of the neighboring node
            lowVal = out[0];
            lowDiscVal = out[1];
            visitedBool = out[2];
            if (lowVal < low[nodeIndex]) { // If search finds a new lowest-value node
                low[nodeIndex] = lowVal;   // Update lowest value node
            };

            if (lowDiscVal < lowDisc[nodeIndex]) {
                lowDisc[nodeIndex] = lowDiscVal;
            };

            // Find Articulation Points //
            let currentIndex = nodeIndex;    // Stores the index of the current node
            let recentChildIndex = idToIndex(id_arr[id_arr.length - 1]);   // Stores the index of the last child explored
            if ((lowDisc[recentChildIndex] >= disc[currentIndex]) && (currentIndex != 0)) {  // Definition of articulation point
                updateNode(currentIndex, "red");
                art.push(currentIndex);
            };

            // Check if root is articulation point //
            if (nodeIndex == 0) {   // Only for root node
                if (!visitedBool) {  // If neighbor was not visited
                    rootChildCounter++; // Add one to child counter
                };
                if (rootChildCounter >= 2) {    // If root has at least 2 unvisited children
                    updateNode(0, "red");
                    art.push(0);
                };
            };

            // Find bridges //
            if (disc[nodeIndex] < low[idToIndex(id_arr[id_arr.length - 1])]) {  // Checks if edge connecting the two nodes is a bridge
                for (let line_index=0;line_index<line_li.length;line_index++) { // Find the line(s) that match the above condition
                    let from = idToIndex(line_li[line_index].startNodeId);  // Stores the index position of the starting node
                    let to = idToIndex(line_li[line_index].endNodeId);  // stores the index position of the end node
                    if (((from == nodeIndex) && (to == idToIndex(id_arr[id_arr.length - 1]))) ||
                    ((from == idToIndex(id_arr[id_arr.length - 1])) && (to == nodeIndex))) {    // If a line connects the start and end node
                        updateLine(line_index, "red");  // Draw line red
                    };
                };
                sleep(sleep_time);
            };
            id_arr.pop();   // Remove neighbor to check from stack
        };
        if (art.includes(nodeIndex)) {
            updateNode(nodeIndex, "red");
        } else {
            updateNode(nodeIndex, "#397EC9");  // Resets the node color    
        };
        sleep(sleep_time);
        return [low[nodeIndex], lowDisc[nodeIndex], false];
    };

    // -- Code Starts Here -- //
    find(0, null);
    self.postMessage("terminate");  // Tells main thread to terminate web worker
};