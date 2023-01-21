/*
This file contains Tarjan's algorithm. 
This algorithm finds strongly connected components in a graph.
This file runs in a separate thread from the main loop.
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

    let unvisited = new Array(node_li.length).fill(true); // A bool array tracking if a node was unvisited or not
    let stack = []; // Represents a stack
    let disc = [];
    let low = [];   // Tracks the low-link values
    let cumul = 0;  // Tracks the discovery time of each new node
    let neighbors = []; // Tracks the neighbors
    let lowVal; // Stores the low-link value of neighbor
    let tempNodeList = [];   // Tracks the index of the nodes part of strongly connected component
    var randomColor = () => '#'+Math.floor(Math.random()*16777215).toString(16);
    let strongLine = [];    // Tracks the lines that are part of a strongly connected component
    let id_arr = [];    // Stores the neighbor id values

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

    function depthFirstSearch(currentIndex) {
        if (!unvisited[currentIndex]) { // Checks if current node was visited
            return low[currentIndex];   // Return the low-link value of the node
        };
        stack.push(currentIndex);   // Add node to stack
        disc[currentIndex] = cumul; // Set the discovery time
        low[currentIndex] = cumul;  // Set the low-link value
        cumul++;    // Tracks the cumulative number of nodes explored
        unvisited[currentIndex] = false;    // Sets node as visited
        updateNode(currentIndex, "#FFA849");  // Sets node color indicating exploring
        sleep(sleep_time);

        // Find neighbors //
        neighbors[disc[currentIndex]] = []; // Adds an empty array storing the neighbors of disc[currentIndex]
        for (let i=0;i<=node_li[node_li.length - 1].id;i++) {  // Loop through each of the current node's connections
            if (adjacency_matrix[indexToId(currentIndex)][i] != Infinity) {    // If a connection exists
                neighbors[disc[currentIndex]].push(i); // Adds a neighbor
            };
        };

        // Explore neighbors //
        for (id of neighbors[disc[currentIndex]]) {
            id_arr.push(id);
            lowVal = depthFirstSearch(idToIndex(id));   // Get the low-link value of the neighbor
            if ((lowVal < low[currentIndex]) && (stack.includes(idToIndex(id_arr[id_arr.length - 1])))) {   // If neighbor has a better low-link value and neighbor is in the stack
                low[currentIndex] = lowVal; // Update current nodes low-link value
            };
            id_arr.pop();
        };

        if (low[currentIndex] == disc[currentIndex]) {  // Checks if discovery time equals its low-link value. This indicates that the node is a root of a strongly connected component.
            rootIndex = stack.indexOf(currentIndex);   // Removes all connected components from the stack
            do {
                var color = randomColor();  // Generates a random color  
            } while (color.length != 7);    // Checks if color hex code is valid (ie. has length 7)

            // Find nodes part of strongly connected component //
            tempNodeList = [];  // Empties the temporary node list
            for (let i=stack.length - 1;i>=rootIndex;i--) { // Get nodes part of strongly connected component
                tempNodeList.push(stack[i]);
                updateNode(stack[i], color);
            };
            // Find lines part of strongly connected component //
            for (let i=0;i<line_li.length;i++) {    // Search through each line
                var startIndex = idToIndex(line_li[i].startNodeId); // Store node index of start node
                var endIndex = idToIndex(line_li[i].endNodeId); // Store node index of end node
                if (tempNodeList.includes(startIndex) && tempNodeList.includes(endIndex)) { // If line has matching start and end node
                    updateLine(i, color);   // Update line
                    strongLine.push(i);
                };
            };
            sleep(sleep_time);
            stack.length = rootIndex;   // Remove nodes in strongly connected component
        };
        if (stack.includes(currentIndex)) {
            updateNode(currentIndex, "#397EC9");  // Resets the node color  
            sleep(sleep_time);    
        };
        
        return low[currentIndex];
    };

    function tarjan() {
        for (let i=0;i<node_li.length;i++) {    // For each node
            if (unvisited[i]) { // If node is unvisited
                depthFirstSearch(i);    // Perform a depth first search
            };
        };
    };

    // -- Code Starts Here -- //
    tarjan();   // Start Tarjan's algorithm
    self.postMessage("terminate");  // Tells main thread to terminate web worker
};