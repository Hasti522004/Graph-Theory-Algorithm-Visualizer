/*
This file contains the Floyd-Warshall algorithm.
The Floyd-Warshall algorithm is an all-pairs shortest path algorithm.
For the sake of this program it will only display one solution selected by the user.
This file runs in a separate thread from the main loop.
*/

// TODO: Algorithm crashes if negative cycle is present
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

    let startIndex = idToIndex(startId);    // Tracks the index of the starting node
    let endIndex = idToIndex(endId);    // Tracks the index of the ending node
    let currentIndex;   // Tracks the index of the current node 
    let nextIndex;  // Tracks the index of the node proceeding the current index

    let dp = [];    // Tracks the best distance between any two pairs of nodes
    let next = [];  // Tracks the previous node
    // Allocate memory //
    for (let i=0;i<node_li.length;i++) {
        dp.push([]);
        next.push([]);
        for (let j=0;j<node_li.length;j++) {
            dp[i][j] = Infinity;
            next[i][j] = null;
        };
    };

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

    // -- Code Starts Here -- //
    // Setup //
    for (let i=0;i<node_li.length;i++) {    // Start node. i = index of node, not id
        for (let j=0;j<node_li.length;j++) {    // End node. j = index of node, not id
            if (dp[i][j] > adjacency_matrix[indexToId(i)][indexToId(j)]) {
                dp[i][j] = adjacency_matrix[indexToId(i)][indexToId(j)];    // Sets the distance through no intermediates
                next[i][j] = j; // Sets the previous node of end node j
            };
            if (i == j) {   // Node to itself
                dp[i][j] = 0;   // Set distance to 0
            };
        };
    };
    // Execute Floyd-Warshall //
    for (let iteration=0;iteration<2;iteration++) {
        for (let k=0;k<node_li.length;k++) {    // Intermediate node. k = index of node, not id
            if (display) updateNode(k, "#FFA849");   // Sets node as being processed
            for (let i=0;i<node_li.length;i++) {    // Start node. i = index of node, not id
                if (display) updateNode(i, "#FFA849");   // Sets node as being processed
                for (let j=0;j<node_li.length;j++) {    // End node. j = index of node, not id
                    if (dp[i][j] > dp[i][k] + dp[k][j]) {   // If route through intermediate is shorter
                        if (iteration == 0) {   // First Iteration
                            dp[i][j] = dp[i][k] + dp[k][j]; // Set new route
                            next[i][j] = next[i][k]; // Sets previous node to intermediate
                        };
                        if (iteration == 1) {   // Second Iteration
                            dp[i][j] = Number.NEGATIVE_INFINITY; // Set new route
                            next[i][j] = null; // Sets previous node to intermedite
                        };
                    };
                    // Draw //
                    if (display) {
                        updateNode(j, "#FFA849");   // Sets node as being processed
                        sleep(sleep_time);

                        // Reset colors //
                        if ((k != j) && (i != j)) updateNode(j, "#397EC9");   // Sets node as being processed
                        sleep(sleep_time);   
                    };  
                };
                if (display) {
                    if (k != i) updateNode(i, "#397EC9");
                    sleep(sleep_time);    
                };
            };
            if (display) {
                updateNode(k, "#397EC9");
                sleep(sleep_time);    
            };  
        };
    };

    // Reconstruct shortest path //
    currentIndex = startIndex;
    console.log(`next => ${next}`);
    nextIndex = next[currentIndex][endIndex];
    while ((currentIndex != nextIndex) && (nextIndex != null)) {   // While a previous node exists
        updateLineByStartEnd(currentIndex, nextIndex, "#2F7B1F");
        sleep(sleep_time);  // Sleep
        currentIndex = nextIndex; // Sets current node to its previous node
        nextIndex = next[currentIndex][endIndex];  // Sets previous node to its corresponding previous node
    };
    self.postMessage("terminate");  // Tells main thread to terminate web worker
};