/*
File handles all canvas functionality
*/

window.addEventListener("load", () => {
    // -- Local Variables -- // * Access only on canvas.js
    temp_line = null;  // Creates a temporary line object

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // -- Functions -- //
    function point2LineDist(px, py, x1, y1, x2, y2) {   // Calculates the shortest distance from a line segment to a point
        // Convert line and point to vectors
        const vector_p = [px - x1, py - y1];  // Vector from start point to mouse click point
        const vector_l = [x2 - x1, y2 - y1];  // Vector from start point to end point of line

        // Scale both vectors by length of line
        let unit_vector_p = []; 
        let unit_vector_l = [];
        const line_length = distance(x1, x2, y1, y2); // Calculates the magnitude of line
        for (let i=0;i<2;i++        ) {
            unit_vector_p[i] = vector_p[i] / line_length;
            unit_vector_l[i] = vector_l[i] / line_length;
        };

        // Calculate dot product
        dot_product = unit_vector_p[0]*unit_vector_l[0] + unit_vector_p[1]*unit_vector_l[1];

        // Calculate nearest location on line
        nearest_p = [x1 + vector_l[0] * dot_product, y1 + vector_l[1] * dot_product];

        // Calculate distance between point and nearest point
        return distance(px, nearest_p[0], py, nearest_p[1]);
    };

    // -- Event Listeners -- //
    canvas.addEventListener("click", (e) => {
        // -- Add node -- //
        if (add_node_bool) {
            // -- Add Node -- //
            if (e.offsetX < nodeRadius || e.offsetX > canvas.width - nodeRadius) return;  // Ensures node is not overflowing out of page
            if (e.offsetY < nodeRadius || e.offsetY > canvas.height - nodeRadius) return; // Ensures node is not overflowing out of page
            for (c of node_li) {
                if (distance(c.x, e.offsetX, c.y, e.offsetY) < 80) return;    // Prevents nodes from overlapping
            }
            node_li.push(new CustomNode(e.offsetX, e.offsetY, cumulative_nodes)); // Adds node to node list
            cumulative_nodes++; // Defined as nodes added + nodes removed


        // -- Remove node -- //
        } else if (rem_node_bool) {
            // -- Remove Node -- //
            node_id_of_removed_node = 0;    // Stores the node id of the node removed
            let click_detected = false; // Checks if user clicked on a node
            for (let i=0; i<node_li.length; i++) {// Finds the node user clicked on
                if (distance(node_li[i].x, e.offsetX, node_li[i].y, e.offsetY) <= nodeRadius) {// Checks if distance is valid
                    click_detected = true;  // User has successfully clicked on a node
                    node_id_of_removed_node = node_li[i].id;    // Stores the id of node being removed
                    node_li.splice(i, 1);   // Remove node from list
                    break;
                };
            };

            if (!click_detected) return;    // If user did not click on a node exit out of event

            let indices_to_remove = []; // Stores the indices in line list to remove
            for (let l=0;l<line_li.length;l++) {
                if (line_li[l].startNodeId == node_id_of_removed_node || line_li[l].endNodeId == node_id_of_removed_node) { // Finds the lines that are connected to the node that got removed
                    indices_to_remove.unshift(l);   // Adds index at beginning of array so that array is in decending order
                };
            };

            for (index of indices_to_remove) {
                line_li.splice(index, 1);   // Removes the line from the line list
            };

            // Update adjacency matrix //
            for (let col=0;col<adjacency_matrix[node_id_of_removed_node].length;col++) {
                adjacency_matrix[node_id_of_removed_node][col] = Infinity;        // Sets the row of removed node to infinity
            };

            for (let row=0;row<adjacency_matrix.length;row++) {
                adjacency_matrix[row][node_id_of_removed_node] = Infinity;  // Sets the column of removed node to infinity
            };

            // Update start-end node if applicable
            if (startId == node_id_of_removed_node) startId = null;
            if (endId == node_id_of_removed_node) endId = null;
        
        // -- Add edge -- //
        } else if (add_edge_bool) {
            if (!edge_draw_active) {    // If player has not selected a starting node
                for (c of node_li) {    // Checks each node
                    if (distance(c.x, e.offsetX, c.y, e.offsetY) <= nodeRadius) { // Checks if user clicked on a node
                        temp_line = new CustomLine(c.x, c.y, c.id); // Creates a new line object
                        temp_line.initialize(); // Initializes the line
                        edge_draw_active = true;    // Sets draw state to true
                        break;
                    };
                };
                return; // Breaks out of event. Player must click a second time to select an end nodes
            };
            if (edge_draw_active) { // If player has selected a starting node
                for (c of node_li) {
                    let weight_draw = true;
                    if ((distance(c.x, e.offsetX, c.y, e.offsetY) <= nodeRadius) && (c.id != temp_line.startNodeId)) {   // Checks if user clicked on a node and node is not starting node
                        let weight_active = true;   // Bool determines whether weight input needs to be provided

                        temp_line.endx = c.x;
                        temp_line.endy = c.y;
                        temp_line.draw(c.x, c.y);   // Draws the line
                        temp_line.endNodeId = c.id; // Sets the end node id

                        if ((adjacency_matrix[temp_line.startNodeId][temp_line.endNodeId] == Infinity)) {// Checks if line does not exist
                            line_li.push(temp_line);    // Adds line to line list if line does not exist
                            adjacency_matrix[temp_line.startNodeId][temp_line.endNodeId] = 99;   // Sets element in adjacency matrix to 99 if no input is provided
                            if (undir_bool) {   // If line is unweighted
                                temp_line_rev = new CustomLine(temp_line.endx, temp_line.endy, temp_line.endNodeId);    // Create another line going in reverse
                                temp_line_rev.endx = temp_line.startx;  // Sets end x property
                                temp_line_rev.endy = temp_line.starty;  // Sets end y property
                                temp_line_rev.endNodeId = temp_line.startNodeId;    // Sets end node
                                line_li.push(temp_line_rev);    // Add temporary line
                                adjacency_matrix[temp_line.endNodeId][temp_line.startNodeId] = 99; // Update the adjacency matrix
                            };
                        } else {
                            weight_draw = false;    // Prevent weight input from showing if line already exists
                        };

                        if (dir_bool) { // Check if edge is a directed edge
                            if (adjacency_matrix[temp_line.endNodeId][temp_line.startNodeId] != Infinity) { // Check if a line exists going the opposite direction
                                for (let li=0;li<line_li.length;li++) { // Loop through line list
                                    if ((line_li[li].startNodeId == temp_line.endNodeId) &&
                                        (line_li[li].endNodeId == temp_line.startNodeId)) {   // If line goes opposite of recently drawn line
                                            line_li[li].offsetLine(circleFrameRadius);   // Offset line
                                            line_li[li].offsetBool = true;  // Line is offsetted
                                            break;
                                    };
                                };
                                line_li[line_li.length - 1].offsetLine(circleFrameRadius);   // Offset last drawn line
                                line_li[line_li.length - 1].offsetBool = true;  // Line is offsetted
                            };
                        };
                        edge_draw_active = false;   // Drawing is complete. Revert back to non-active draw state

                        // Get weight if applicable //
                        if (weighted_bool && weight_draw) {
                            weight_form.style.display = "block";    // Show the weight input
                            const last_edge = line_li[line_li.length - 1];  // Get the most recently added edge
                            if (dir_bool) {
                                mid_p = midPoint(last_edge.endx + (last_edge.startx - last_edge.endx) * 3 / 4, last_edge.endx, last_edge.endy + (last_edge.starty - last_edge.endy) * 3 / 4, last_edge.endy); // Find the midpoint of the edge
                            } else if (undir_bool) {
                                mid_p = midPoint(last_edge.startx, last_edge.endx, last_edge.starty, last_edge.endy);
                            };
                            
                            weight_form.style.left = `${mid_p[0] - circleFrameRadius}px`;  // Position the input
                            weight_form.style.top = `${mid_p[1] - circleFrameRadius}px`;   // Position the input
                        };

                        break;
                    };
                };
            };
            
        // -- Remove edge -- //
        } else if (rem_edge_bool) {
            for (let l=0;l<line_li.length;l++) {
                if (point2LineDist(e.offsetX, e.offsetY, line_li[l].startx, line_li[l].starty, line_li[l].endx, line_li[l].endy) <= 5) {    // Find the shortest distance between mouse click and line
                    adjacency_matrix[line_li[l].startNodeId][line_li[l].endNodeId] = Infinity;  // Updates adjacency matrix
                    if (line_li[l].offsetBool) {    // Checks if the line has been offsetted
                        for (let l2=0;l2<line_li.length;l2++) { // Loop through each line
                            if (((line_li[l2].startNodeId == line_li[l].endNodeId) &&
                            (line_li[l2].endNodeId == line_li[l].startNodeId)) && dir_bool) {   // Find directed edge going the other way
                                line_li[l2].offsetLine(circleFrameRadius * -1);    // Un-offset line
                                line_li[l2].offsetBool = false; // Line is no longer offsetted
                            };
                        };
                    };
                    line_li.splice(l, 1);   // Remove line from list
                    return;
                };
            };

        // -- Set Start Node -- //
        } else if (set_start_bool) { 
            for (n of node_li) {
                if (distance(n.x, e.offsetX, n.y, e.offsetY) <= nodeRadius) {   // Checks if user clicked on node
                    for (n2 of node_li) {   // Searches through the nodes
                        if (n2.id == startId) { // Find the previous starting node
                            n2.color = (n2.id == endId) ? "green" : "#397EC9"; // If the previous starting node is also an end node set the color to magenta otherwise reset to blue
                        };
                    };
                    startId = n.id; // Sets start node id
                    n.color = (n.id == endId) ? "yellow" : "red"; // If the node is also an end node set to yellow otherwise set to cyan
                    set_start_button.classList.remove("button-warning-background-color");
                    return; // Breaks out of canvas click event
                };
            };
        
        // -- Set End Node -- //
        } else if (set_end_bool) {
            for (n of node_li) {
                if (distance(n.x, e.offsetX, n.y, e.offsetY) <= nodeRadius) {   // Checks if user clicked on node
                    for (n2 of node_li) {   // Searches through the nodes
                        if (n2.id == endId) { // Find the previous ending node
                            n2.color = (n2.id == startId) ? "red" : "#397EC9"; // If the previous ending node is also a starting node set the color to cyan otherwise reset to blue
                        };
                    };
                    endId = n.id;   // Sets start node id
                    n.color = (n.id == startId) ? "yellow" : "green";   // If the node is also a start node set to yellow otherwise set to cyan
                    set_end_button.classList.remove("button-warning-background-color");
                    return;
                };
            };
        };
    });

    weight_form.addEventListener("submit", (e) => {
        e.preventDefault(); // Prevents the form's default submission action. Basically doesn't break the program.
        if (undir_bool) {   // If edge is undirected
            if (flowBool) {
                line_li[line_li.length - 1].capacity = weight_input.value;   // Sets the flow output
            } else {
                line_li[line_li.length - 1].weight = weight_input.value;    // Update the value of the edge    
            };
            line_li[line_li.length - 1].drawweight = true;  // Show the value

            // Note: Updates 2 lines since creating an unweighted edge creates two lines going both directions
            if (flowBool) {
                line_li[line_li.length - 2].capacity = weight_input.value;   // Sets the flow output
            } else {
                line_li[line_li.length - 2].weight = weight_input.value;    // Updates the value of the edge    
            };
            line_li[line_li.length - 2].drawweight = true;  // Show the value
        } else {    // If edge is not undirected
            if (flowBool) {
                line_li[line_li.length - 1].capacity = weight_input.value;   // Sets the flow output
            } else {
                line_li[line_li.length - 1].weight = weight_input.value;   // Sets the weight of the edge to user input
            };
            
            line_li[line_li.length - 1].drawweight = true;  // Specifies line to display the edge weight    
        };

        weight_input.value = "99";  // Resets the value
        weight_form.style.display = "none"; // Hides the input field

        adjacency_matrix[line_li[line_li.length - 1].startNodeId][line_li[line_li.length - 1].endNodeId] = line_li[line_li.length - 1].weight;  // Updates the adjacency matrix
        if (undir_bool) {   // If line is an undirected line
            adjacency_matrix[line_li[line_li.length - 1].endNodeId][line_li[line_li.length - 1].startNodeId] = line_li[line_li.length - 1].weight;  // Updates the adjacency matrix
        };
    });
});

window.addEventListener("resize", () => {
    const canvas = document.querySelector(".canvas");
    const ctx = canvas.getContext("2d"); 

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
