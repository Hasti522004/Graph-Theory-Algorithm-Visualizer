/* This file stores all the variables, functions, and classes that require a global scope. All of these functions affect the canvas.js file and some affect the nav.js file */

// -- Variables -- //
let node_li = [];   // Stores nodes
let line_li = [];   // Stores lines
let edge_draw_active = false;   // Tracks when the user is drawing a line or not
let cumulative_nodes = 0;   // Tracks the number of nodes drawn, including the ones removed.
let adjacency_matrix = [];   // Represents node relationships
let startId = null; // Stores the starting node id. Node is colored "cyan"
let endId = null;   // Stores the ending node id. Node is colored "magenta"
const nodeRadius = 35;   // Global variable defines the radius of the nodes
const circleFrameRadius = 19;
// If node is both a start and end colored "yellow"
const weight_form = document.getElementById("weight-form"); // Gets the form containg the input field
const weight_input = document.getElementById("weight-input");   // Gets the input field
const canvas = document.querySelector(".canvas");
const ctx = canvas.getContext("2d"); 
let mid_p;  // Initialize the midpoint variable

// Initialize the adjacency matrix //
for (let row=0;row<133;row++) {   // For simplicity the program will only handle 133 nodes including those that have been removed. 133 is the max number of nodes that can fit in canvas assuming none have been removed.
    adjacency_matrix[row] = [];    // Creates an empty row in adjacency matrix
    for (let col=0;col<133;col++) {
        adjacency_matrix[row][col] = Infinity;  // Infinity means there is no edge linking the two nodes
    };
};

// -- Functions -- //
function distance(x1, x2, y1, y2) { // Calculates distance between mouse click and node center
    return Math.sqrt((x1 - x2)*(x1 - x2) + (y1 - y2)*(y1 - y2));    // Pythagoras Theorem
};

function midPoint(x1, x2, y1, y2) { // Calculates the midpoint 
    return [(x1 + x2) / 2, (y1 + y2) / 2];
};

function render() { // Draws the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);   // Clears the canvas

    for (l of line_li) {
        l.initialize(); // Initializes the line
        l.draw(); // Draws the line
    };

    for (c of node_li) {    // Redraws remaining nodes
        c.draw();
    };
};

// -- Classes -- //
class CustomNode {  // Builds nodes
    constructor(x, y, id) {
        this.x = x; // Stores the x-coordinate of node in pixels
        this.y = y; // Stores the y-coordinate of node in pixels
        this.id = id;   // Tracks the id of the node
        this.color = "#397EC9"; // Defines the color of the node
    };

    draw() {    // Draws the node
        ctx.beginPath();    // Starts a new starting point
        ctx.arc(this.x, this.y, nodeRadius, 0, 2 * Math.PI);    // Draws a circle
        ctx.fillStyle = this.color;
        ctx.fill();
    };
};

class CustomLine {  // Builds lines
    constructor(x1, y1, startNodeId) {
        this.startx = x1;   // Stores the starting x-position
        this.starty = y1;   // Stores the starting y-position
        this.endx = null;   // Stores the ending x-position
        this.endy = null;   // Stores the ending y-position
        this.startNodeId = startNodeId; // Stores the id of the starting node
        this.endNodeId = null;  // Stores the id of the ending node
        this.weight = 99;   // 99 is the default weight
        this.flow = 0;    // Sets the default flow input
        this.capacityt = 99;  // Sets the default flow output
        this.drawweight = false; // Boolean specifies if the weight should be drawn
        this.color = "white";
        this.offsetBool = false;    // Tracks whether the 
        this.circleFrameRadius = circleFrameRadius;    // Defines the radius of the circle enclosing the weight text
        this.fontSize = 13;
    };

    initialize() {
        ctx.beginPath();    // Initializes the line
        ctx.moveTo(this.startx, this.starty);   // Starts the line at the selected node
    };

    draw() {
        ctx.lineTo(this.endx, this.endy); // Draws line at end node
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5;
        ctx.stroke();   // Renders the line

        if (dir_bool) { // If the line is a directed line
            this.drawPointer();
        };

        if (this.drawweight) {
            if (dir_bool) {
                mid_p = midPoint(this.endx + (this.startx - this.endx) * 3 / 4, this.endx, this.endy + (this.starty - this.endy) * 3 / 4, this.endy);
            } else if (undir_bool) {
                mid_p = midPoint(this.startx, this.endx, this.starty, this.endy);
            };
            
            // Draw the circle //
            ctx.beginPath();    // Start the circle
            ctx.arc(mid_p[0], mid_p[1], this.circleFrameRadius, 0, 2 * Math.PI);
            ctx.fillStyle = this.color;
            ctx.fill();

            // Draw the number //
            ctx.font = `${this.fontSize}px Arial`;
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            if (flowBool) { // If graph is a flow graph
                ctx.fillText(`${this.flow}/${this.capacity}`, mid_p[0], mid_p[1]);
            } else {
                ctx.fillText(String(this.weight), mid_p[0], mid_p[1]);    
            };
        };
    };

    drawPointer() {
        let pointerWidth = 30;
        // Find vector with same slope as edge //
        const edge_vec = [this.startx - this.endx, this.starty - this.endy];    // This vector is oriented reverse of actual direction

        // Scale vector to desired width. This is to offset the start position //
        const edge_vec_length = distance(edge_vec[0], 0, edge_vec[1], 0);
        const edge_vec_scaled = [edge_vec[0] * nodeRadius / edge_vec_length, edge_vec[1] * nodeRadius / edge_vec_length];

        // Find start position of pointer //
        const pointerx = this.endx + edge_vec_scaled[0];
        const pointery = this.endy + edge_vec_scaled[1];
        
        // Rotate vector by pi/6 radians //
        const x = edge_vec[0];
        const y = edge_vec[1];
        const sin_30 = Math.sin(Math.PI / 6);
        const cos_30 = Math.cos(Math.PI / 6 );
        const vec_1 = [x*cos_30 + y*sin_30, -x*sin_30 + y*cos_30];

        // Scale vector to desired length //
        const vec_1_length = distance(vec_1[0], 0, vec_1[1], 0);
        const vec_1_scaled = [vec_1[0] * pointerWidth / vec_1_length, vec_1[1] * pointerWidth / vec_1_length];

        // Find point 1 //
        const p1 = [pointerx + vec_1_scaled[0], pointery + vec_1_scaled[1]];

        // Find vector perpendicular to edge //
        const sin_90 = Math.sin(Math.PI / 2);
        const cos_90 = Math.cos(Math.PI / 2);
        const vec_perp = [-x*cos_90 - y*sin_90, x*sin_90 - y*cos_90];

        // Scale vector to desired length //
        const vec_perp_length = distance(vec_perp[0], 0, vec_perp[1], 0);
        const vec_perp_scaled = [vec_perp[0] * pointerWidth / vec_perp_length, vec_perp[1] * pointerWidth / vec_perp_length];

        // Find point 2 //
        const p2 = [p1[0] + vec_perp_scaled[0], p1[1] + vec_perp_scaled[1]];

        // Draw the pointer //
        ctx.beginPath();
        ctx.moveTo(pointerx, pointery);
        ctx.lineTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
    };

    offsetLine(arg0) {  // Offsets the line
        const offsetDistance = arg0;
        const edge_vec = [this.endx - this.startx, this.endy - this.starty];
        const x = edge_vec[0];
        const y = edge_vec[1];
        const edge_vec_mag = distance(this.startx, this.endx, this.starty, this.endy);
        const sin_90 = Math.sin(Math.PI / 2);
        const cos_90 = Math.cos(Math.PI / 2);
        const edge_vec_perp = [-x*cos_90 - y*sin_90, x*sin_90 - y*cos_90];
        const edge_vec_perp_unit = [edge_vec_perp[0] / edge_vec_mag, edge_vec_perp[1] / edge_vec_mag];
        this.startx += offsetDistance * edge_vec_perp_unit[0];
        this.endx += offsetDistance * edge_vec_perp_unit[0];
        this.starty += offsetDistance * edge_vec_perp_unit[1];
        this.endy += offsetDistance * edge_vec_perp_unit[1];
    };
};

function animate() {    // Animated the canvas
    render();   // Renders the canvas
    requestAnimationFrame(animate);
};

animate();