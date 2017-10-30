var width = 960,
    height = 960;

var color = d3.scale.category20();

var force;
var node, link;

var forceDamper = 0.2; // dampening slows down the velocity every single time step so that it eventually slows down completely


var linksEnabled = false; // in the absence of links it will display nodes not connected
var focusPull = false;

var root;

var foci = []; // empty array that will contain x and y position of each focus point
	
createVis(); 
createButtons();
linksUpdate();

function linksUpdate() {
	if (linksEnabled) {
		force.links(graph.links).start();
		d3.selectAll(".link").style("visibility", "visible");
	} else {
		force.links([]).start();
		d3.selectAll(".link").style("visibility", "hidden");
	}
}

function createVis() {
	_.each(graph.nodes, function(d) {
		d.radius = 10;
	});

	root = d3.select("#graphics")
		.attr("width", width)
		.attr("height", height);

	force = d3.layout.force()
		.charge(-120) 
		.linkDistance(80)
		.gravity(0.1) 
		.friction(0.5
		)
		.size([width, height]);
		
	force
		.nodes(graph.nodes)
		.links(graph.links)
		.start();

	var link = root.selectAll(".link")
		.data(graph.links)
		.enter().append("line")
		.attr("class", "link")
		.style("stroke-width", function(d) { return Math.sqrt(d.value); });

	var node = root.selectAll(".node")
		.data(graph.nodes)
		.enter().append("circle")
		.call(force.drag)
		.attr("class", "node")
		.attr("r", 5)
		.style("fill", function(d) { return color(d.group); });

	node.append("title")
		.text(function(d) { return d.name; });
		
//* focus
// graph.nobdes is an array, it will return the group to max 
// initilize foci array
	var maxGroups = d3.max(graph.nodes, function(d) { return d.group; });
	for (var i = 0; i <= maxGroups; i++) {
		foci.push({
			x: 0.5 * Math.cos(2 * Math.PI * i / maxGroups) + 0.5, // determining x, y position of all of these points
			y: 0.5 * Math.sin(2 * Math.PI * i / maxGroups) + 0.5
		});
	}
//*/

	force.on("tick", function(e) {
	//* focus pulling
		if (focusPull) {
			// create a quadtree from the post view objects
			var q = d3.geom.quadtree(graph.nodes);

			_.each(graph.nodes, function(d) {
			// visit each node and determine how far each node is from the equilibrium point
				d.x = d.x + (foci[d.group].x * width - d.x) * forceDamper * e.alpha;
				d.y = d.y + (foci[d.group].y * height - d.y) * forceDamper * e.alpha;

				q.visit(collide(d), 1.1);
			});

			_.each(graph.nodes, function(d) {
			});
		}
	//*/
	
		link.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });
	});

	d3.timer(function() { force.start(); return false; }); // keeps the force layout running without any decay
}

function createButtons() {
	var buttons = d3.select("#buttons");
	
	buttons.append("span")
		.attr("class", "button")
		.on("click", function() {
			linksEnabled = !linksEnabled;
			
			linksUpdate();
		})
		.html("Turn on/off Links");

	buttons.append("span")
		.attr("class", "button")
		.on("click", function() {
			focusPull = !focusPull;
		})
		.html("Pull to Focus");
}

// collision detection function that is used by the forcelayout.tick event
function collide(node, radiusBuffer) {
	radiusBuffer = (typeof radiusBuffer === 'undefined') ? 1.0 : radiusBuffer;
	var r = node.radius * radiusBuffer,
		nx1 = node.x - r,
		nx2 = node.x + r,
		ny1 = node.y - r,
		ny2 = node.y + r;
	return function(quad, x1, y1, x2, y2) {
		if (node.charge && quad.point && quad.point.charge && (quad.point !== node)) {
			var x = node.x - quad.point.x,
				y = node.y - quad.point.y,
				l = Math.sqrt(x * x + y * y),
				r = node.radius + quad.point.radius;
			if (l < r) {
				l = (l - r) / l * .5;
				node.x -= x *= l;
				node.y -= y *= l;
				quad.point.x += x;
				quad.point.y += y;
			}
		}
		return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
	};
}






