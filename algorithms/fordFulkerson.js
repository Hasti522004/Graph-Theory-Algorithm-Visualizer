/* 
This file contains the Ford-Fulkerson Max Flow algorithm.
This file runs in a separate thread from the main thread.
*/
self.onmessage = (e) => {
    // -- Initalize Variables -- //
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
    let line_li = e.data[3];
    const adjacency_matrix = e.data[4];
    for (let row=0;row<adjacency_matrix.length;row++) {
        for (let col=0;col<adjacency_matrix[row].length;col++) {
            if (adjacency_matrix[row][col] != Infinity) {
                adjacency_matrix[row][col] = Number(adjacency_matrix[row][col]);    // This is done because the non-infinity values of the adjacency matrix are strings so they need to be converted back to numbers
                continue;
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

    let visited = new Array(node_li.length).fill(false);    // Tracks whether each node is visited or not
    let neighbors = []; // Tracks the neighbors
    let augmentNodes = [];   // Stores the nodes in augmenting path
    let bottleneckValue;    // Tracks the bottleneck value
    let augmentPathFound;   // Stores whether the end node was found in depth first search
    let neighborIndex = []; // Tracks the neighbor index history with each recursion

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
            if ((from == startIndex) && (to == endIndex)) { // Looks for a forward edge
                updateLine(lineIndex, color);
            };
            if ((from == endIndex) && (to == startIndex)) { // Looks for a backward edge
                updateLine(lineIndex, color);
            };
        };
    };

    function updateFlowAndCapacity(index, flow) {
        self.postMessage([null, null, index, null, flow, null]);
    };

    function computeBottleNeckValue(startNodeId, endNodeId) {
        for (let lineIndex=0;lineIndex<line_li.length;lineIndex++) {
            var s = line_li[lineIndex].startNodeId;
            var e = line_li[lineIndex].endNodeId;
            if ((s == startNodeId) && (e == endNodeId)) {   // Checks for a forward edge
                return line_li[lineIndex].capacity - line_li[lineIndex].flow;   // Return bottleneck value
                // The bottleneck value for a forward edge is capacity - flow
            };
            if ((s == endNodeId) && (e == startNodeId)) {   // Checsk for a backward edge
                return line_li[lineIndex].flow; // Return the bottleneck value
                // The bottleneck value for a backward edge is just the flow
            };
        };
    };

    function findStartEndPairs(arr) {  // This function takes the augmenting nodes array and generates all start-end node pairs
        let left = 0;   // Leftmost index
        let right = 1;  // Rightmost index
        let pairs = []; // Stores the pairs
        while (right < arr.length) {
            pairs.push([arr[left], arr[right]]);    // Add the pair
            left++;
            right++;
        };
        return pairs;   // Returns the pairrs
    };

    function getFlowandCapacity(s, e) {  // Gets the flow of the edge
        for (let line of line_li) {
            if ((line.startNodeId == s) && (line.endNodeId == e)) {
                return [line.flow, line.capacity];
            };
        };
    };

    function checkInPairsandOrientation(s, e, pairs) {
        // s => index position of start node
        // e => index position of end node
        // Forward edges //
        for (let pair of pairs) {
            if ((pair[0] == s) && (pair[1] == e)) return [true, true];  // Checks for a forward edge
        };
        // Backward edges
        for (let pair of pairs) {
            if ((pair[0] == e) && (pair[1] == s)) return [true, false];    // Checks for a backward edge
        };
        return [false, null];   // No edge was found matching description
        /*
            [true, true] indicates a forward edge was found
            [true, false] indicates a backward edge was found
        */
    };

    function fordFulkerson() {
        // -- Functions -- //
        function findAugmentingPath(currentNodeIndex) {
            if (node_li[currentNodeIndex].id == endId) {    // If end node is reached
                if (display) {
                    updateNode(currentNodeIndex, "#FFA849");
                    sleep(sleep_time);
                };
                augmentNodes.unshift(currentNodeIndex);  // Add the end node index to the augmenting path
                if (display) {
                    updateNode(currentNodeIndex, "#397EC9");
                };
                return true;    // Returns true if sink node is found upon backtracking
            };
            if (display) {
                updateNode(currentNodeIndex, "#FFA849");
                sleep(sleep_time);
            };
            visited[currentNodeIndex] = true;
            neighbors.push([]); // Pushes an empty array    
            for (let id=0;id<adjacency_matrix[indexToId(currentNodeIndex)].length;id++) {   // Searches through the adjacency matrix
                if (!visited[idToIndex(id)]) {  // If node is not visited
                    if (adjacency_matrix[indexToId(currentNodeIndex)][id] != Infinity) {  // Finds any forward edges
                        let temp = getFlowandCapacity(indexToId(currentNodeIndex), id);
                        lineFlow = temp[0];
                        lineCapacity = temp[1];
                        if (lineFlow < lineCapacity) { // Checks if there is available capacity left
                            neighbors[neighbors.length - 1].push(idToIndex(id));    // Adds the forward edge
                            continue;
                        };
                    };
                    if (adjacency_matrix[id][indexToId(currentNodeIndex)] != Infinity) {    // Finds any backward edges
                        let temp = getFlowandCapacity(id, indexToId(currentNodeIndex));
                        lineFlow = temp[0];
                        lineCapacity = temp[1];
                        if (lineFlow > 0) { // Checks if there is flow
                            neighbors[neighbors.length - 1].push(idToIndex(id));    // Adds the backward edge
                            continue;
                        };
                    };
                };
            };
            for (i of neighbors[neighbors.length - 1]) {    // For each of the current nodes neighbors
                neighborIndex.push(i);
                if (display) {
                    updateLineByStartEnd(currentNodeIndex, neighborIndex[neighborIndex.length - 1], "#FFA849");
                };
                augmentPathFound = findAugmentingPath(i);   // Recursively do a Depth First Search
                if (display) {
                    updateLineByStartEnd(currentNodeIndex, neighborIndex[neighborIndex.length - 1], "white");
                    sleep(sleep_time);
                };
                neighborIndex.pop();    // Removes most recent neighbor visited
                if (augmentPathFound) {    // Recursively do a Depth First Search
                    augmentNodes.unshift(currentNodeIndex);  // Add current node to augmenting path
                    let currentBottleneckValue = computeBottleNeckValue(indexToId(augmentNodes[0]), indexToId(augmentNodes[1]));    // Stores the current bottleneck value
                    bottleneckValue = (currentBottleneckValue < bottleneckValue) ? currentBottleneckValue : bottleneckValue;    // Update bottleneck value if applicable
                    break;  // Terminate searching for neighbors
                };
            };
            neighbors.pop();    // Remove last instance of neighbors
            if (display) {
                updateNode(currentNodeIndex, "#397EC9");
            };
            return augmentPathFound;    // Returns the bool specifying if an augmenting path was found
        };

        // -- Code Starts Here -- //
        let run = true;
        while (run) {
            // -- Find an augmenting path -- //
            augmentNodes = [];   // Resets the augmenting path array
            bottleneckValue = Infinity;    // Resets the bottleneck value
            augmentPathFound = false;   // Set this to false by default
            visited = new Array(node_li.length).fill(false);    // Resets the visited arrays
            run = findAugmentingPath(idToIndex(startId)); // Finds an augmenting path.
            // Also checks if an augmenting path is found
            // -- Compute the bottleneck capacity -- //
            if (!run) break;    // If no augmenting path is found

            // -- Augment each edge and the total flow -- //
            const pairs = findStartEndPairs(augmentNodes);
            for (let lineIndex=0;lineIndex<line_li.length;lineIndex++) {
                const start = idToIndex(line_li[lineIndex].startNodeId);
                const end = idToIndex(line_li[lineIndex].endNodeId);
                const temp = checkInPairsandOrientation(start, end, pairs); // Gets the output
                const edgeExists = temp[0]; // Gets whether the edge exists
                const orientation = temp[1];    // Gets the orientation of the edge
                if (edgeExists) {   // If edge exists
                    if (orientation) {  // If forward edge
                        line_li[lineIndex].flow += bottleneckValue; // Update the flow
                        updateLine(lineIndex, "#FFA849");
                        updateFlowAndCapacity(lineIndex, bottleneckValue);
                        sleep(sleep_time);
                        updateLine(lineIndex, "white");
                        sleep(sleep_time);
                    } else {    // If backward edge
                        line_li[lineIndex].flow -= bottleneckValue; // Update the flow
                        updateLine(lineIndex, "#FFA849");
                        updateFlowAndCapacity(lineIndex, bottleneckValue * -1);
                        sleep(sleep_time);
                        updateLine(lineIndex, "white");
                        sleep(sleep_time);
                    };
                } else {
                    continue;
                };
            };
        };
    };

    // -- Code Starts Here -- //
    fordFulkerson();
    self.postMessage("terminate");  // Tells main thread to terminate web worker
};