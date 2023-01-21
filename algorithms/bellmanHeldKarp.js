/*
This file contains the Bellman-Held-Karp algorithm.
This algorithm is a dynamic programming solution to the travelling salesman problem.
Bellman-Held-Karp runs with a time complexity of O(n^2*2^n) which is significantly better than 
    brute force with has a time complexity of O(n!).
I did not write the code for this algorithm. 
I referenced William Fiset's graph theory course.
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

    let state;  // Gets the binary representation of the nodes excluding the "next" node
    let state2; // Gets the state excluding the start node
    let minDist;    // Gets the minimum distance
    let newDistance;    // Finds the new distance from state with next node included
    let lastLineIndex;  // Tracks the index of the last line updated

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

    function updateNodesByState(state, color) {
        let binaryState = state.toString(2).split('').reverse().join('');   
        /*
        Takes the state parameter -> shallow copies it -> converts to binary string 
        -> converts to string array -> reverse array -> rejoins array to string
        */
        for (let index = 0;index < binaryState.length;index++) {
            if (binaryState[index] == "1") {
                updateNode(index, color);
            };
        };
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

    function notIn(i, subset) {
        return ((1 << i) & subset) == 0;
        /*
        This function checks whether a certain digit is 0 or 1.
        */
    };


    function tsp(m, S) {
        function setup(m, memo, S, N) { /*
            Finds the optimal value from node S (Starting node) to each node i 
            */
            for (let i=0;i<N;i++) { // i represents a node
                if (i == S) continue;   // If the node is the starting node skip
                memo[i][(1 << S) | (1 << i)] = m[S][indexToId(i)];
                /*
                1 << S represents the binary representation of the start node. 
                Ex: 1 means node index 0 is the starting node since the 1st digit (index 0) is 1.

                1 << i represents the binary representation of the node currently being visited.
                Ex: 10 means node index 1 is the starting node since the 2nd digit (index 1) is 1.

                (1 << S) | (1 << i) gets the binary representation of the visited nodes.
                Ex: 001 (Decimal => 1) | 010 (Decimal => 2) == 011 (Decimal => 3) means that 
                node index 0 (1st digit) and node index 1 (2nd digit) have been visited

                m[S][i] represents the edge weight from node S to node i
                */
                if (display) {
                    updateNode(i, "#FFA849");
                    sleep(sleep_time);
                    updateNode(i, "#397EC9");
                    sleep(sleep_time);    
                };
            };
        };
        function solve(m, memo, S, N) { // Solves the TSP
            const permutations = (r, n) => {
                /*
                r => number of nodes in a partial tour
                N => total number of nodes needed to explore

                This function generates all unique permutations
                of a binary number with "N" digits and "r" ones.
                Ex: permutations(3, 4) => [0111, 1011, 1101, 1110]
                */

                // Note: Don't forget to check for duplicates

                // -- Variables -- //
                let subsets = [];   // Stores all the unique permutations
                permutationsRecursive(0, 0, r, n, subsets);
                return subsets;

                // -- Functions -- //
                function permutationsRecursive(set, at, r, n, subsets) {    // Recursive function to find permutations
                    if (r == 0) {   // Base case
                        subsets.push(set);
                    } else {
                        for (let i=at;i<n;i++) {
                            set = set | (1 << i); // Flips the ith bit

                            permutationsRecursive(set, i + 1, r - 1, n, subsets);

                            set = set & ~(1 << i);  // Backtrack and set ith bit to 0
                        };
                    };
                };
            };
            for (let r=3;r<=N;r++) {    // "r" represents the number of nodes in the partial tour
                for (subset of permutations(r, N)) {    // For each possible subset of visited nodes
                    if (notIn(S, subset)) continue; // Checks whether start node is included in subset
                    for (let next=0;next<N;next++) {    // next represents the index of the next node
                        if ((next == S) || notIn(next, subset)) continue;
                        /*
                        Skips next if next is the start node or if next is not part of the subset
                        */
                        state = subset ^ (1 << next);   // Gets the nodes without the next node
                        state2 = state ^ (1 << S);  // Removes the start node from state
                        minDist = Infinity; // Set the minimum distance to positive infinity
                        if (display) {
                            updateNodesByState(state2, "#858891");   // Draws nodes in state as already visited
                            updateNode(next, "#FFA849");    // Set next node as a temporary end node
                            sleep(sleep_time);    
                        };
                        for (let e=0;e<N;e++) { // e represents the end node index
                            if ((e == S) || (e == next) || (notIn(e, subset))) continue;
                            /*
                            Skip if e is the start or end node or if e is not part of subset
                            */
                            newDistance = memo[e][state] + m[indexToId(e)][indexToId(next)];  
                            /*
                            memo[e][state] => shortest distance from start node to end node passing through 
                            a given set of nodes

                            m[e][next] = distance from end node to next
                            */
                            if (newDistance < minDist) {
                                minDist = newDistance
                            };
                        };
                        if (display) {
                            updateNodesByState(state2, "#397EC9");   // Draws nodes in state as active
                            updateNode(next, "#397EC9");    // Reset next node color    
                        };
                        memo[next][subset] = minDist;
                    };
                };
            };
        };
        function findOptimalTour(m, memo, S, N) {
            let lastIndex = S;  // Stores the previous index algorithm was at
            state = (1 << N) - 1;   // End state. Bit mask with N nodes set to 1.
            let tour = [];  // Stores the optimal tour
            updateNode(S, "cyan");  // Sets starting node to cyan
            sleep(sleep_time);
            tour[0] = S;    // Start node is S
            tour[N] = S;    // End node is S
            for (let i=N-1;i>=1;i--) {    // Loop backwards through each index
                let index = -1; // Tracks the index of the best node to go to
                for (let j=0;j<N;j++) { // j represents all possible candidates for the next node
                    if ((j == S) || (notIn(j, state))) continue;    
                    /*
                    Skips if candidate node (j) is the start node or if j has already been visited.
                    Visited nodes are removed from state.
                    */
                    updateNode(j, "#FFA849");   // Set j as temporary end node
                    sleep(sleep_time);
                    if (index == -1) index = j; // Once a valid candidate node is found store candidate node index
                    let prevDist = memo[index][state] + m[indexToId(index)][indexToId(lastIndex)];    // Gets the distance of last candidate node
                    let newDist = memo[j][state] + m[indexToId(j)][indexToId(lastIndex)]; // Finds the distance of new candidate node
                    if (newDist < prevDist) index = j;  // If new candidate node improves distance store j
                    updateNode(j, "#397EC9");   // Resets node color
                    sleep(sleep_time);
                };
                tour[i] = index;    // Store the best node in tour
                state = state ^ (1 << index);   // Set candidate node in state to 0. Marks node as visited
                lastIndex = index;  // Set last index as the candidate node j
                updateLineByStartEnd(tour[i], tour[i + 1], "#2F7B1F");
                sleep(sleep_time);
            };
            updateLineByStartEnd(tour[0], tour[1], "#2F7B1F");
            sleep(sleep_time);
        };
        const N = node_li.length; // Represents the number of nodes
        let memo = [];  // This is a 2D table of size N by 2^N
        // Initialize the memo table //
        for (let row=0;row<N;row++) {
            memo[row] = [];
            for (let col=0;col<Math.pow(2, N);col++) {
                memo[row][col] = Infinity;
            };
        };
        setup(m, memo, S, N);
        solve(m, memo, S, N);
        findOptimalTour(m, memo, S, N);
    };

    // -- Code Starts Here -- //
    tsp(adjacency_matrix, idToIndex(startId));
    self.postMessage("terminate");  // Tells main thread to terminate web worker
};