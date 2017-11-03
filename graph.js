// http://bl.ocks.org/weiglemc/6185069 Scatter plot
var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 250 - margin.top - margin.bottom;

createScatterPlot();
createBubbleChart();

function createScatterPlot() {
	// create formatting for axes
    var dollarFormat = function(d) { return '$' + d3.format(',f')(d) };
    var  date_format = d3.time.format("%b %Y");
    // setup x
    var xValue = function(d) { return d.Date;}, // data -> value
        xScale = d3.time.scale().range([0, width]);
        xMap = function(d) { return xScale(xValue(d));}, // data -> display
        xAxis = d3.svg.axis().scale(xScale).orient("bottom")
        			.tickFormat(date_format);

    // setup y
    var yValue = function(d) { return d.Cost;}, // data -> value
        yScale = d3.scale.linear().range([height, 0]), // value -> display
        yMap = function(d) { return yScale(yValue(d));}, // data -> display
        yAxis =	d3.svg.axis().scale(yScale).orient("left")
                .tickFormat(dollarFormat);

    // setup fill color
    var cValue = function(d) { return d.Category;},
        color = d3.scale.ordinal().range(['#ED6A5A']);

    // parse date and time
    var parseDate = d3.time.format("%m/%d/%Y").parse;

    // add the graph canvas to the body of the webpage
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // add the tooltip area to the webpage
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // load data
    d3.csv("Spending2.csv", function(error, data) {

        // change string (from CSV) into number format
        data.forEach(function(d) {
            d.Date = parseDate(d.Date);
            d["Budgeted Amount"] = +d["Budgeted Amount"];
            d.Cost = +d.Cost;
            console.log(d.Date);
            console.log(d);
        });


        function removePopovers () {
            $('.popover').each(function() {
              $(this).remove();
            }); 
          }

          function showPopover (d) {
            $(this).popover({
              placement: 'auto top',
              container: 'body',
              trigger: 'manual',
              html : true,
              content: function() { 
                  return "<b> " + d.Description + "</b><br/>Budgeted Amount: $" + +d["Budgeted Amount"] + "<br/>Amount Spent: $" + +d.Cost +
                  "<br/>Category: " + d.Category; 
              }
            });
            $(this).popover('show')
          }
          

        // don't want dots overlapping axis, so add in buffer to data domain
        // xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
        xScale.domain(d3.extent(data, function(d) { return d.Date; }));
        yScale.domain([d3.min(data, yValue)-1, d3.max(data, yValue)+1]);


        // x-axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // y-axis
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        // draw dots
        svg.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("r", 3.5)
            .attr("cx", xMap)
            .attr("cy", yMap)
            .style("fill", function(d) { return color(cValue(d));})
            	.on("mouseover", function (d) { showPopover.call(this, d); })
            	.on("mouseout", function (d) { removePopovers(); })
    });
}



 /* BUBBLE CHART JAVASCRIPT CODE */   
function createBubbleChart(){
    d3.csv('spending2.csv', function (error, data) {
    		var width = 960 - margin.left - margin.right, height = 500;
        var fill = d3.scale.ordinal().range(['#054A91','#5D737E','#85BDA6','#FFF07C','#1B9AAA','#ff8360','#713e5a','#EDC79B','#99888','#38369A','#315659', '#ED6A5A','#006e90']);
        var svg = d3.select("#chart2").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        for (var j = 0; j < data.length; j++) {
	        	if(+data[j].Cost > 100 && +data[j].Cost <= 4750) {
	    	        data[j].radius = +data[j].Cost / 150; // medium nodes
	    		} else if (+data[j].Cost > 4750) { // large nodes
	   			data[j].radius = +data[j].Cost / 400;
	    		} else {
	    			data[j].radius = +data[j].Cost / 10;
	    		}
    		
          data[j].x = Math.random() * width;
          data[j].y = Math.random() * height;
        }

        var padding = 2;
        var maxRadius = d3.max(_.pluck(data, 'radius'));

        var getCenters = function (vname, size) {
          var centers, map;
          centers = _.uniq(_.pluck(data, vname)).map(function (d) {
            return {name: d, value: 1};
          });

          map = d3.layout.treemap().size(size).ratio(1/1);
          map.nodes({children: centers});

          return centers;
        };

        var nodes = svg.selectAll("circle")
          .data(data);

        nodes.enter().append("circle")
          .attr("class", "node")
          .attr("cx", function (d) { return d.x; })
          .attr("cy", function (d) { return d.y; })
          .attr("r", function (d) { return d.radius; })
          .style("fill", function (d) { return fill(d.Category); })
          .on("mouseover", function (d) { showPopover.call(this, d); })
          .on("mouseout", function (d) { removePopovers(); })

        var force = d3.layout.force();

        draw('View All');

        $( ".btn" ).click(function() {
          draw(this.id);
        });

        function draw (varname) {
          var centers = getCenters(varname, [width, height-200]);
          force.on("tick", tick(centers, varname));
          labels(centers);
          force.start();
        }

        function tick (centers, varname) {
          var foci = {};
          for (var i = 0; i < centers.length; i++) {
            foci[centers[i].name] = centers[i];
          }
          return function (e) {
            for (var i = 0; i < data.length; i++) {
              var o = data[i];
              var f = foci[o[varname]];
              o.y += ((f.y + (f.dy / 2)) - o.y) * e.alpha;
              o.x += ((f.x + (f.dx / 2)) - o.x) * e.alpha;
            }
            nodes.each(collide(.11))
              .attr("cx", function (d) { return d.x; })
              .attr("cy", function (d) { return d.y; });
          }
        }

        function labels (centers) {
          svg.selectAll(".label").remove();

          svg.selectAll(".label")
          .data(centers).enter().append("text")
          .attr("class", "label")
          .text(function (d) { return d.name })
          .attr("transform", function (d) {
            return "translate(" + (d.x + (d.dx / 2)) + ", " + (d.y + 20) + ")";
          });
        }

        function removePopovers () {
          $('.popover').each(function() {
            $(this).remove();
          }); 
        }

        function showPopover (d) {
          $(this).popover({
            placement: 'auto top',
            container: 'body',
            trigger: 'manual',
            html : true,
            content: function() { 
              return "<b> " + d.Description + "</b><br/>Budgeted Amount: $" + +d["Budgeted Amount"] + "<br/>Amount Spent: $" + +d.Cost +
                     "<br/>Category: " + d.Category; 
            }
          });
          $(this).popover('show')
        }

        function collide(alpha) {
          var quadtree = d3.geom.quadtree(data);
          return function (d) {
            var r = d.radius + maxRadius + padding,
                nx1 = d.x - r,
                nx2 = d.x + r,
                ny1 = d.y - r,
                ny2 = d.y + r;
            quadtree.visit(function(quad, x1, y1, x2, y2) {
              if (quad.point && (quad.point !== d)) {
                var x = d.x - quad.point.x,
                    y = d.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y),
                    r = d.radius + quad.point.radius + padding;
                if (l < r) {
                  l = (l - r) / l * alpha;
                  d.x -= x *= l;
                  d.y -= y *= l;
                  quad.point.x += x;
                  quad.point.y += y;
                }
              }
              return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });
          };
        }
      });
	}
