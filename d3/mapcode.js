var w = 1280,
    h = 800,
    r = 1000,
    zoomed = false,
    x = d3.scale.linear().range([0, r]),
    y = d3.scale.linear().range([0, r]),
    node,
    root;

var pack = d3.layout.pack()
    .size([r, r])
    .value(function(d) { return d.size; })

var legend = [5, 7, 10, 20 , 50];

var vis = d3.select("div.map").insert("svg:svg", "h2")
    .attr("width", w)
    .attr("height", h)
  .append("svg:g")
    .attr("transform", "translate(" + (w - r) / 2 + "," + (h - r) / 2 + ")");

var tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "20")
    .style("visibility", "hidden")
    .style("color", "white")
    .style("padding", "8px")
    .style("background-color", "rgba(0, 0, 0, 0.75)")
    .style("border-radius", "6px")
    .style("font", "12px sans-serif")
    .text("tooltip");

d3.json("D3/fintechs_flat.json", function(data) {

  for(var d in data){
    if(!!data[d]["NbEmployees"] & data[d]["NbEmployees"]!=null){
      data[d].size = parseInt(data[d]["NbEmployees"].split("-")[1])
    }
    else{
      data[d].size = 10
    }

  }

  var tree = _.groupBy(data, function(org){return org["FintechCategory"]? org["FintechCategory"].split(" - ")[0]:undefined;})
  var tree_complete = {"name": "", "children": []}
  for (var k in tree){
    if (tree.hasOwnProperty(k)) {
         tree_complete["children"].push({"name": k, "children": tree[k]});
    }
  }

  node = root = tree_complete;

  var nodes = pack.nodes(root);

  vis.selectAll("circle")
      .data(nodes)
    .enter().append("svg:circle")
      .attr("class", function(d) { return d.children ? "parent" : "child"; })
      .attr("id", function(d) { return "idCircle"+d.name.split(" ")[0].split(",")[0];})
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", function(d) { return d.r; })
      .attr("z-index", function(d){return d.children?0:10;})
      .on("click", function(d) { return zoom(node == d ? root : d); })
	    .on("mouseover", function(d) {
  	  	if(d3.select(this).attr("id")!="idCircle" & !!!d.children){
  	      tooltip.html(d.name+"<br/>"+d.size+" employees");
  	      tooltip.style("visibility", "visible");}
  	  })
  	  .on("mousemove", function() {
  	      return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
  	  })
  	  .on("mouseout", function(){return tooltip.style("visibility", "hidden");});

  vis.selectAll("text")
      .data(nodes)
    .enter().append("svg:text")
      .attr("fill", function(d){return d.children?"#000000":"#1f77b4";})
      .attr("class", function(d) { return d.children ? "parent" : "child"; })
      .attr("id", function(d) { return "idText"+d.name.split(" ")[0].split(",")[0];})
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .style("opacity", function(d) { return d.children? 1 : 0; })
      .style("font-size", "13px")
      .text(function(d) { return d.name; });

  d3.select(window).on("click", function() { zoom(root); });

  d3.selectAll("circle.child")
	.on("click", function(d) { if(zoomed & !!d.url){window.open(d.url, '_blank')}});

});
	

function zoom(d, i) {
  if(d.children && (zoomed ? d.name == '' : d.name != '')){
    var k = r / d.r / 2;
    x.domain([d.x - d.r, d.x + d.r]);
    y.domain([d.y - d.r, d.y + d.r]);

    zoomed = !zoomed;
    var selectedSub = d["name"];

    var coord = {"x": d.x, "y": d.y}
    var dim = d3.select("#idText"+d.name.split(" ")[0].split(",")[0]).node().getBBox()

    var t = vis.transition()
        .duration(d3.event.altKey ? 7500 : 750);

    t.selectAll("circle")
        .attr("cx", function(d) { return x(d.x); })
        .attr("cy", function(d) { return y(d.y); })
        .attr("r", function(d) { return k * d.r; })

    t.selectAll("text.parent")
        .attr("x", function(d) { return x(d.x); })
        .attr("y", function(d) { return y(d.y); })
        .attr("fill", "#000000")
        .style("font-size", "13px")
        .style("opacity", function(d) { return zoomed? 0 : 1; })

    	if(d["name"]!="")
      {
           maintext = d.name;

           t.selectAll("text.child")
               .attr("x", function(d) { return x(d.x); })
               .attr("y", function(d) { return y(d.y); })
               .style("opacity", function(d) {
                 if(d.parent.name == maintext){
                   return 1;
                 }
                 else{
                   return 0;
                 }
               });
  }
    else
    {
     t.selectAll("text.child")
         .attr("x", function(d) { return x(d.x); })
         .attr("y", function(d) { return y(d.y); })
         .style("opacity", function(d) {
             return 0;
         });
    }

    t.each("start", function(){
    		if(zoomed){
      		d3.select("#idText"+d.name.split(" ")[0].split(",")[0])
      		  .transition().duration(800)
        	  .attr("x", w - 280 - dim.width)
        	  .attr("y", h - dim.height +80)
        	  .style("font-size", "40px")
        	  .attr("fill", "#000000")
        	  .style("opacity", zoomed?1:0);
     		}
    	});

    node = d;
    d3.event.stopPropagation();
    
    }
}