/* 
This file contains the Depth First Search algorithm. 
This algorithm is useless and only searches a graph.
This file runs in a separate thread from the main thread.
*/
self.onmessage = (e) => {
    // -- Initialize Variables -- //
    const startId = e.data[0];
    if (startId == null) {  // If no start node is specified
        self.postMessage("missingStart");   // Tells main thread start node is missing
        return; // Ends web worker
    };
    const endId = e.data[1];
    const node_li = e.data[2];
    const line_li = e.data[3];
    const adjacency_matrix = e.data[4];
    for (let row=0;row<adjacency_matrix.length;row++) {
        for (let col=0;col<adjacency_matrix[row].length;col++) {
            if (adjacency_matrix[row][col] != Infinity) {
                adjacency_matrix[row][col] = Number(adjacency_matrix[row][col]);    // This is done because the non-infinity values of the adjacency matrix are strings so they need to be converted back to numbers
            }
        }
    }
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

    let visited = [];    // Stack tracks which nodes have been visited
    let neighbors = [];  // Stores the id's of the neighbors

    function depthFirstSearch(nodeId) {
        // -- Functions -- //
        function sleep(milliseconds) {  // Pauses the program
            const date = Date.now();
            let currentDate = null;
            do {
                currentDate = Date.now();
            } while (currentDate - date < milliseconds);
        };

        function updateNode(color) {    // Sends data for main thread to update
            for (let n=0;n<node_li.length;n++) {
                if (node_li[n].id == nodeId) {
                    self.postMessage([n, color, null, null, null, null]);
                    break;
                };
            };
            sleep(sleep_time);
        };

        // -- Function Starts Here -- //
        if (visited.includes(nodeId)) return;   // Backtrack if node was already visited
        visited.push(nodeId);   // Tracks nodes that have been visited
        updateNode("#FFA849");  // Sets node color indicating exploring

        neighbors.push([]); // Pushes an empty array    
        for (let index=0;index<adjacency_matrix[nodeId].length;index++) {   // Searches through the adjacency matrix
            if (adjacency_matrix[nodeId][index] != Infinity) {  // Finds any values that are not infinity
                neighbors[neighbors.length - 1].push(index);    // Adds the index position if value is not infinity
            };
        };

        for (i of neighbors[neighbors.length - 1]) {    // For each of the current nodes neighbors
            depthFirstSearch(i);    // Recursively do a depth first search
        };
        neighbors.pop();    // Removes the neighbors once all of them have been searched
        updateNode("#858891");  // Sets node color indicating dead end
    };

    // -- Code Starts Here -- //
    depthFirstSearch(startId); // Invokes the function
    self.postMessage("terminate");  // Tells main thread to terminate web worker
};