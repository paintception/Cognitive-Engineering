'use strict';

var hearts = ['💞','💖','💓','💜','💘'];
var randHeart = function() {
  return hearts[Math.floor(Math.random() * hearts.length)];
}

// var maxParam = .03;
var maxParam = .01;
var randParam = function() {
  return d3.scale.linear().range([-maxParam,maxParam])(Math.random());
}

var line = d3.svg.line();

var container = d3.select('.container');

var svg = container.append("svg"),
    width = container.node().offsetWidth,
    height = container.node().offsetHeight,
    minDim = Math.min(width,height);

var feelingScale = d3.scale.quantize()
  .domain([-minDim/4,-minDim/8,0,minDim/8,minDim/4])
  .range(['hates','dislikes','is ok with','likes','loves']);

var feelingScaleEmoji = d3.scale.quantize()
  .domain([-minDim/4,-minDim/8,0,minDim/8,minDim/4])
  .range(['😩','😔','😐','😊','😍']);

var canvas = container.append("canvas")
  .attr("width", width)
  .attr("height", height);
var ctx = canvas.node().getContext('2d');
ctx.translate(width/2,height/2);
ctx.fillStyle = '#eee';

var g = svg.append("g")
  .attr("transform", "translate(" + width/2 + "," + height/2 + ")");

var yAxis = g.append("line.y.axis")
  .attr('x1', 0)
  .attr('x2', 0)
  .attr('y1', -height/2)
  .attr('y2', height/2);

var xAxis = g.append("line.x.axis")
  .attr('x1', -width/2)
  .attr('x2', width/2)
  .attr('y1', 0)
  .attr('y2', 0);

var clickCapture = g.append('rect.click-capture')
  .attr('x', -width/2)
  .attr('y', -height/2)
  .attr('height', height)
  .attr('width', width);

var relationship = {
  'x': {
    'dim': 'x',
    'name': 'Romeo',
    'value': Math.random() * width - width/2,
    'coefficients': {
      'x': randParam(),
      'y': randParam()
    }
  },
  'y': {
    'dim': 'y',
    'name': 'Juliet',
    'value': Math.random() * height - height/2,
    'coefficients': {
      'x': randParam(),
      'y': randParam()
    }
  }
};

var lesserRelationships = d3.range(20).map(newPoint);

var point = g.append("g.relationship")
  .datum(relationship)

point.append("path.x");
point.append("path.y");
point.append("circle").attr("r", "4");
point.append("text.face.x").attr("dy", ".3em").attr("dx", "-.5em");
point.append("text.face.y").attr("dy", ".3em").attr("dx", "-.5em");
point.append("text.prose.x").attr("dy", ".3em").style('text-anchor', 'middle');
point.append("text.prose.y").attr("dy", ".3em").attr("dx", "-.5em")

g.on("click", function() {

  // remove instruction to do this
  d3.select('.instructions .main')
    .remove();

  var x = d3.mouse(this)[0]
  var y = -d3.mouse(this)[1]
  relationship.x.value = x;
  relationship.y.value = y;
})

d3.select('.symbolics')
  .datum(relationship)
  .call(renderSymbolics);

svg.selectAll('g.parameter-control')
  .data(Object.keys(relationship))
  .enter()
  .append('g.parameter-control')
  .attr("transform", function(d,i) {
    if(i==0) {
      return "translate(" + 25 + "," + (height-125) + ")"      
    } else {
      return "translate(" + (width-125) + "," + (height-125) + ")"
    }
  })
  .call(controlBox);

var lastHearted = 0;
var lastHeartedInterval = 100;
d3.timer(function(t) {

  point
    .each(function(d) {

      // if it goes too far offscreen, reset
      if(Math.abs(d.x.value) > width * 2 && Math.abs(d.y.value) > height * 2) {
        d.x.value = Math.random() * width - width/2;
        d.y.value = Math.random() * height - height/2;
      }

      // calculate one tick in the sim
      var dims = Object.keys(relationship);
      dims.forEach(function(dim) {
        dims.forEach(function(dim2) {
          d[dim].value += d[dim].coefficients[dim2] * d[dim2].value;
        });
      });

      // leave trail
      ctx.beginPath();
      ctx.arc(d.x.value,-d.y.value,4,0,2*Math.PI);
      ctx.fill();

      // spew hearts if you're in love <3 
      if(feelingScale(d.x.value)=='loves' && feelingScale(d.y.value)=='loves') {
        if(t-lastHearted > lastHeartedInterval) {
          container.append('div.heart')
            .html(randHeart())
            .style('left', (width/2 + d.x.value)+'px')
            .style('top', (height/2 -d.y.value)+'px')
            .style('opacity',1)
            .transition()
            .duration(750)
            .ease('linear')
            .style('left', (width/2 + d.x.value + (Math.random() * 100 - 50))+'px')
            .style('top', (height/2 -d.y.value + (Math.random() * 100 - 50))+'px')
            .style('opacity',0)
            .remove();
          lastHearted = t;
        }
      }

    })
    .attr("transform", function(d) { return "translate("+ d.x.value +","+ -d.y.value +")" });

  // labelings lines and text and emoji
  point.select('path.x').attr('d', function(d) { return line([[0,0],[-d.x.value,0]]); });
  point.select('path.y').attr('d', function(d) { return line([[0,0],[0,d.y.value]]); });
  point.select('text.face.x')
    .attr("x", 0)
    .attr("y", function(d) { return d.y.value; })
    .text(function(d) { return feelingScaleEmoji(d.x.value)});
  point.select('text.face.y')
    .attr("x", function(d) { return -d.x.value; })
    .attr("y", 0)
    .text(function(d) { return feelingScaleEmoji(d.y.value)});
  point.select('text.prose.x')
    .attr("x", 0)
    .attr("y", function(d) { return d.y.value; })
    .attr("dy", function(d) { return 0.3 + (d.y.value > 0 ? 1.2 : -1.2) +'em'; })
    .text(function(d) {
      return 'Romeo ' + feelingScale(d.x.value) + ' Juliet';
    });
  point.select('text.prose.y')
    .attr("x", function(d) { return -d.x.value; })
    .attr("y", 0)
    .style('text-anchor', function(d) { return d.x.value > 0 ? 'end' : 'start'; })
    .attr('dx', function(d) { return (d.x.value < 0 ? 1.2 : -1.2) + 'em'; })
    .text(function(d) {
      return 'Juliet ' + feelingScale(d.y.value) + ' Romeo';
    });

  // draw the faint phase space field lines in the background
  ctx.save();
  ctx.strokeStyle = '#eee';
  lesserRelationships.forEach(function(pt) {

    // if it's gone offscreen, or just 1 in 100 other times (to keep things fresh)
    if(Math.abs(pt.x) > width/2 || Math.abs(pt.y) > height/2 || Math.random() > .99) {
      var newPt = newPoint();
      pt.x = newPt.x;
      pt.y = newPt.y;
      return;
    }

    ctx.beginPath();
    ctx.moveTo(pt.x,-pt.y);

    pt.x += pt.x * relationship.x.coefficients.x + pt.y * relationship.x.coefficients.y;
    pt.y += pt.x * relationship.y.coefficients.x + pt.y * relationship.y.coefficients.y;

    ctx.lineTo(pt.x,-pt.y);
    ctx.stroke();
  });
  ctx.restore();

})

function newPoint() {
  return {
    'x': d3.scale.linear().range([-width/2,width/2])(Math.random()),
    'y': d3.scale.linear().range([-height/2,height/2])(Math.random())
  }
}

// (semi)reusable component for the parameter spaces
function controlBox(selection) {
  selection.each(function(data) {
    var sel = d3.select(this);
    data = relationship[data];

    var w = 100;
    var h = 100;

    // scale clicks to param values
    var mouseToParam = d3.scale.linear()
      .domain([0,w/2])
      .range([0,maxParam]);

    // INITIAL BUILD

    var g = sel.selectAll('g.inner')
      .data([data])
      .enter()
      .append('g.inner')
      .attr("transform", "translate(" + w/2 + "," + h/2 + ")");

    g.append('path.x.axis').attr('d', line([[-w/2,0],[w/2,0]]));
    g.append('path.y.axis').attr('d', line([[0,-h/2],[0,h/2]]));
    g.append('rect.frame')
      .attr('x', -w/2)
      .attr('y', -h/2)
      .attr('width', w)
      .attr('height', h);

    // label quadrants accd to J. C. Sprott
    // http://sprott.physics.wisc.edu/pubs/paper277.pdf
    g.append('text').attr('x', w/4).attr('y', -h/4).attr('dy', '.3em').text('EAGER')
    g.append('text').attr('x', w/4).attr('y', h/4).attr('dy', '.3em').text('NARCISSIST')
    g.append('text').attr('x', -w/4).attr('y', -h/4).attr('dy', '.3em').text('CAUTIOUS')
    g.append('text').attr('x', -w/4).attr('y', h/4).attr('dy', '.3em').text('HERMIT')

    g.append('text.title').attr('y',-(h/2 + 10)).text(data.name.toUpperCase());
    g.append('text.prose.one').attr('y', h/2 + 10);
    g.append('text.prose.two').attr('y', h/2 + 20);
    g.append('circle.current').attr('r', 2);

    var drag = d3.behavior.drag().on('drag', clickOrDrag);
    g.on('click', clickOrDrag).call(drag);

    update();

    function clickOrDrag(d) {

      // remove instruction to do this
      d3.select('.instructions .params').remove();

      // coefficient for own feeling
      var a = mouseToParam(d3.mouse(this)[0]);
      d.coefficients[d.dim] = a;

      // coefficient for other's feeling
      var b = mouseToParam(-d3.mouse(this)[1]);
      d.coefficients[(d.dim==='x' ? 'y' : 'x')] = b;

      update();
    }

    // UPDATE
    function update() {

      var a = data.coefficients[data.dim];
      var b = data.coefficients[(data.dim==='x' ? 'y' : 'x')];

      var hisHer = data.name == 'Romeo' ? 'his' : 'her';
      var heShe = data.name == 'Romeo' ? 'he' : 'she';
      var other = data.name == 'Romeo' ? 'Juliet' : 'Romeo';

      // this text also comes from
      // http://sprott.physics.wisc.edu/pubs/paper277.pdf
      var prose1, prose2;
      if(a > 0 && b > 0) {
        prose1 = 'is encouraged by '+hisHer+' own feelings';
        prose2 = 'as well as '+ other +'’s';
      } else if(a > 0 && b < 0) {
        prose1 = 'wants more of what '+heShe+' feels';
        prose2 = 'but retreats from '+ other +'’s feelings';
      } else if(a < 0 && b > 0) {
        prose1 = 'retreats from '+hisHer+' own feelings';
        prose2 = 'but is encouraged by '+other+'’s';
      } else if(a < 0 && b < 0) {
        prose1 = 'retreats from '+hisHer+' own feelings';
        prose2 = 'as well as '+other+'’s';
      }

      sel.select('circle.current')
        .attr('cx', mouseToParam.invert(a))
        .attr('cy', mouseToParam.invert(-b))

      sel.select('.prose.one').text(prose1);
      sel.select('.prose.two').text(prose2);

      // update symbolic equation
      d3.select('.symbolics').call(renderSymbolics);

      // clear phase space field trails
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = .8;
      ctx.fillRect(-width/2,-height/2,width,height);
      ctx.restore();
      // reset seeds for phase space trails
      lesserRelationships = d3.range(20).map(newPoint);

    }

  })
}

// SYMBOLIC REPRESENTATION
// per request by bret victor ;)
// https://twitter.com/worrydream/status/699068236214566915
function renderSymbolics(selection) {
  selection.each(function(data) {
    var sel = d3.select(this);

    var dR = sel.selectAll("div.eq.dR").data([data.x]);
    dR.enter().append("div.eq.dR");

    var dJ = sel.selectAll("div.eq.dJ").data([data.y]);
    dJ.enter().append("div.eq.dJ");

    var a = (data.x.coefficients.x * 1000).toPrecision(3);
    var b = (data.x.coefficients.y * 1000).toPrecision(3);
    katex.render("\\dfrac{dR}{dt} = "+a+"R + "+b+"J", dR.node());

    var c = (data.y.coefficients.x * 1000).toPrecision(3);
    var d = (data.y.coefficients.y * 1000).toPrecision(3);
    katex.render("\\dfrac{dJ}{dt} = "+c+"R + "+d+"J", dJ.node());
  })
}