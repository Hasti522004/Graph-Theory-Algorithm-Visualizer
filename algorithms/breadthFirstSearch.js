/* 
This file contains the Breadth First Search algorithm. 
This algorithm finds the shortest path between two points on an unweighted graph.
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

    let q = []; // This is a queue data structure. Stores the index position of nodes.
    q.push(idToIndex(startId));
    let visited = new Array(node_li.length).fill(false);   // Array tracks which nodes have been visited. The index of element corresponds to index in node_li.

    let prev = new Array(node_li.length).fill(null);  // Stores the index position of previous node

    visited[idToIndex(startId)] = true; // Sets starting node as visited

    let neighbors = []; // Stores the neighbors

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

    function updateNode(index, color) {    // Sends data for main thread to update
        self.postMessage([index, color, null, null, null, null]);
        sleep(sleep_time);
    };

    function updateLine(index, color) {
        self.postMessage([null, null, index, color, null, null]);
    };

    function breadthFirstSearch() {
        // -- Breadth First Search the graph -- //
        while (q.length > 0) {  // While the queue is not empty
            nodeToCheck = q[0]; // Gets the index position of node to check
            q.shift();  // Removes first index

            if (display) updateNode(nodeToCheck, "#397EC9"); // Draws root node as visited

            neighbors = [];
            // Get Neighbors //
            for (let id = 0; id < adjacency_matrix[indexToId(nodeToCheck)].length; id++) {  // Searches through the adjacency matrix
                if (adjacency_matrix[indexToId(nodeToCheck)][id] != Infinity) { // If value is not infinity
                    neighbors.push(idToIndex(id));    // Gets the index position of neighbors
                };
            };

            // Visit Neighbors //
            for (next of neighbors) {   // For each of the neighbors
                if (!visited[next]) {   // If the neighbor has not been visited
                    q.push(next);   // Adds node index to queue
                    visited[next] = true;   // Marks node index as visited
                    prev[next] = nodeToCheck;   // Sets previous node of current node
                    if (display) updateNode(next, "#FFA849");    // Draws node as currently visiting
                };
            };
        };

        // Display shortest path between end node and start node //
        currentNode = idToIndex(endId); // Get the index of the current node
        previousNode = prev[currentNode];   // Get the index of the previous node
        while (previousNode != null) {   // While a previous node exists
            for (let line_index = 0;line_index < line_li.length;line_index++) { // Finds the line(s)
                if ((idToIndex(line_li[line_index].endNodeId) == currentNode) && 
                (idToIndex(line_li[line_index].startNodeId) == previousNode) && dir_bool) {    // If an edge connects the current node and the previous node
                    updateLine(line_index, "#2F7B1F");   // Updates the line
                    sleep(sleep_time);
                };
                if (((idToIndex(line_li[line_index].startNodeId) == currentNode) && 
                (idToIndex(line_li[line_index].endNodeId) == previousNode)) || 
                ((idToIndex(line_li[line_index].endNodeId) == currentNode) && 
                (idToIndex(line_li[line_index].startNodeId) == previousNode)) && undir_bool) {    // If an edge connects the current node and the previous node
                    updateLine(line_index, "#2F7B1F");   // Updates the line
                };
            };
            sleep(sleep_time);  // Sleep
            currentNode = previousNode; // Sets current node to its previous node
            previousNode = prev[previousNode];  // Sets previous node to its corresponding previous node
        };
    };

    // -- Code Starts Here -- //
    breadthFirstSearch();
    self.postMessage("terminate");
};