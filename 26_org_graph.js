VizConfig = {};

VizConfig.dsiAreas = [
  { title: 'Funding acceleration<br/> and incubation', id: 'funding-acceleration-and-incubation', color: '#FDE302', icon: VizConfig.assetsPath + '/triangle-funding-acceleration-and-incubation.png', label: 'Funding Acceleration and Incubation' },
  { title: 'Collaborative economy', id: 'collaborative-economy', color: '#A6CE39', icon: VizConfig.assetsPath + '/triangle-collaborative-economy.png', label: 'Collaborative Economy' },
  { title: 'Open democracy', id: 'open-democracy', color: '#F173AC', icon: VizConfig.assetsPath + '/triangle-open-democracy.png', label: 'Open Democracy' },
  { title: 'Awareness networks', id: 'awareness-networks', color: '#ED1A3B', icon: VizConfig.assetsPath + '/triangle-awareness-networks.png', label: 'Awareness Networks' },
  { title: 'New ways of making', id: 'new-ways-of-making', color: '#F58220', icon: VizConfig.assetsPath + '/triangle-new-ways-of-making.png', label: 'New Ways of Making' },
  { title: 'Open access', id: 'open-access', color: '#7BAFDE', icon: VizConfig.assetsPath + '/triangle-open-access.png', label: 'Open Access' }
];

VizConfig.orgStyle = "hex";
VizConfig.projectStyle = "triangle";


function OrgGraph(container, org) {
  this.DOM = {
    container: d3.select(container)
  }
  this.org = org;
  this.loadProjects(org);
}


//PREFIX o: <http://www.w3.org/ns/org#>
//PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
//PREFIX ds: <http://data.digitalsocial.eu/def/ontology/>
//SELECT DISTINCT ?activity_label ?org_collab ?org_collab_label (group_concat(distinct ?adsi ; separator = ",") AS ?adsi_values)
//WHERE {
// ?org a o:Organization.
// FILTER (str(?org)="http://data.digitalsocial.eu/id/organization/eb70a18d-2f2b-62fd-76ca-5a33f71b9f50")  .
// ?am a ds:ActivityMembership.
// ?am ds:organization ?org.
// ?am ds:activity ?activity.
// ?activity rdfs:label ?activity_label.
// ?activity ds:areaOfDigitalSocialInnovation ?adsi.
// ?am_collab ds:activity ?activity.
// ?am_collab ds:organization ?org_collab.
// ?org_collab rdfs:label ?org_collab_label.
// FILTER(?org_collab != ?org)
//}
//GROUP BY ?activity_label ?org_collab ?org_collab_label

OrgGraph.prototype.loadProjects = function(org) {
  var url = "http://data.digitalsocial.eu/sparql.json?utf8=✓&query=";
  var ds = new SPARQLDataSource(url);
  ds.query()
    .prefix("o:", "<http://www.w3.org/ns/org#>")
    .prefix("rdfs:", "<http://www.w3.org/2000/01/rdf-schema#>")
    .prefix("ds:", "<http://data.digitalsocial.eu/def/ontology/>")
    .select("DISTINCT ?activity_label ?org_collab ?org_collab_label (group_concat(distinct ?adsi ; separator = ',') AS ?adsi_values)")
    .where("?org", "a", "o:Organization")
    .where('FILTER (str(?org)="'+org+'")', '','')
    .where("?am", "a", "ds:ActivityMembership")
    .where("?am", "ds:organization", "?org")
    .where("?am", "ds:activity", "?activity")
    .where("?activity", "rdfs:label", "?activity_label")
    .where("?activity", "ds:areaOfDigitalSocialInnovation", "?adsi")
    .where("?am_collab", "ds:activity", "?activity")
    .where("?am_collab", "ds:organization", "?org_collab")
    .where("?org_collab", "rdfs:label", "?org_collab_label")
    .where("FILTER(?org_collab != ?org)", "" ,"")
    .groupBy("?activity_label ?org_collab ?org_collab_label")
    .execute()
    .then(function(results) {
      var projectsByLabel = {};
      var projects = [];
      var collaboratorsByLabel = {};
      var collaborators = [];
      results.forEach(function(row) {
        var projectLabel = row.activity_label.value;
        var collabId = row.org_collab.value;
        var collabLabel = row.org_collab_label.value;
        var adsi = row.adsi_values.value.split(',').map(function(s) { return s.substr(s.lastIndexOf('/')+1);});
        var project = projectsByLabel[projectLabel];
        if (!project) {
          project = projectsByLabel[projectLabel] = {
            label: projectLabel,
            areaOfDigitalSocialInnovation: adsi,
            collaborators: []
          };
          projects.push(project);
        }
        var collab = collaboratorsByLabel[collabLabel];
        if (!collab) {
          collab = collaboratorsByLabel[collabLabel] = {
            id: collabId,
            label: collabLabel,
            projects: []
          };
          collaborators.push(collab);
        }
        project.collaborators.push(collab);
        collab.projects.push(project);
      });
      console.log(projects, collaborators);
      this.projectsByLabel = projectsByLabel;
      this.projects = projects;
      this.collaboratorsByLabel = collaboratorsByLabel;
      this.collaborators = collaborators;
      setTimeout(function() {
        this.draw();
      }.bind(this), 1);
    }.bind(this))
}

OrgGraph.prototype.draw = function() {
  var w = 994;
  var h = 350;
  var svg = this.DOM.container.append("svg")
    .attr("width", w)
    .attr("height", h)
    .style('margin', '0 auto')
    .style('display', 'block')

  svg.append('rect').attr('x', 0).attr('y', 0).attr('width', w).attr('height', h).style('fill', '#FFF');

  var rootGroup = svg.append('g');
  var linkGroup = rootGroup.append('g');
  var nodeGroup = rootGroup.append('g');

  //TOOLTIP

  var tooltip = svg.append('g');
  tooltip.style('display', 'none');

  tooltipBg = tooltip.append('rect')
    .attr('width', '240px')
    .attr('height', '1.3em')
    .style('fill', '#000')
    .attr('rx', '5px')
    .attr('ry', '5px')

  tooltipText = tooltip.append('text')
    .text('BLA BLA')
    .attr('dx', '0.5em')
    .attr('dy', '1.2em')
    .style('fill', '#FFF')
    .style('font-size', '12px')

  svg.on('mousemove', function(e) {
    tooltip.attr('transform', function(d) { return 'translate(' + (d3.event.x + 10 - svg[0][0].offsetLeft) + ',' + (d3.event.y-20) + ')'; });
  }.bind(this))

  //UTILS

  var r = 20;
  var r2 = r * 2;

  function hexBite(x, y, r, i) {
    var a = i/6 * Math.PI * 2 + Math.PI/6;
    var na = ((i+1)%6)/6 * Math.PI * 2 + Math.PI/6;
    return [
      [x, y],
      [x + r * Math.cos(a), y + r * Math.sin(a)],
      [x + r * Math.cos(na), y + r * Math.sin(na)]
    ];
  }

  function hexBorder(x, y, r, i) {
    var a = i/6 * Math.PI * 2 + Math.PI/6;
    var na = ((i+1)%6)/6 * Math.PI * 2 + Math.PI/6;
    return [
      [x + r * Math.cos(a), y + r * Math.sin(a)],
      [x + r * Math.cos(a), y + r * Math.sin(a)],
      [x + r * Math.cos(na), y + r * Math.sin(na)]
    ];
  }

  function hexEdge(x, y, r, i) {
    var a = i/6 * Math.PI * 2 + Math.PI/6;
    var na = ((i+1)%6)/6 * Math.PI * 2 + Math.PI/6;
    var r2 = r ? r - 5 : 0;
    return [
      [x + r2 * Math.cos(na), y + r2 * Math.sin(na)],
      [x + r2 * Math.cos(a), y + r2 * Math.sin(a)],
      [x + r * Math.cos(a), y + r * Math.sin(a)],
      [x + r * Math.cos(na), y + r * Math.sin(na)]
    ];
  }

  function triangleBite(x, y, r, tr, i) {
    var a = Math.PI / 3;
    var trMod = tr;
    var yMod = y;
    var yMod2 = Math.sin(a) * r;
    x += tr * ((i % 2) - 1.5);

    if (i % 2 === 0) {
      trMod *= i / 2;
      trMod += tr / 2;
      yMod += Math.sin(a) * tr;
      yMod2 = -yMod2;
    }
    else {
      trMod *= Math.floor(i / 2);
    }

    return [
      [x + trMod, yMod],
      [x - r / 2 + trMod, yMod + yMod2],
      [x + r / 2 + trMod, yMod + yMod2],
    ]
  }

  function triangleBorder(x, y, r, i) {
    var ret = triangleBite(x, y, r, r, i);

    if (i === 0 || i === 5) {
      if (i === 5) {
        ret = [ ret[1], ret[2], ret[0], ret[2] ];
      }
      else {
        ret = [ ret[0], ret[1], ret[2], ret[1] ];
      }
      return ret;
    }

    return [ ret[2], ret[1] ]
  }

  function triangleEdge(x, y, r, tr, i) {
    var a = Math.PI / 3;
    var trMod = tr;
    var yMod = y;
    var yMod2 = Math.sin(a) * r;
    var r2 = r ? r - 5 : 0;
    var yMod3 = Math.sin(a) * r2;
    x += tr * ((i % 2) - 1.5);

    if (i % 2 === 0) {
      trMod *= i / 2;
      trMod += tr / 2;
      yMod += Math.sin(a) * tr;
      yMod2 = -yMod2;
      yMod3 = -yMod3;
    }
    else {
      trMod *= Math.floor(i / 2);
    }

    return [
      [x - r2 / 2 + trMod, yMod + yMod3],
      [x + r2 / 2 + trMod, yMod + yMod3],
      [x + r / 2 + trMod, yMod + yMod2],
      [x - r / 2 + trMod, yMod + yMod2],
    ]
  }

  //ORG

  var org = { label: 'Nesta', projects: this.projects, collaborators: this.collaborators };
  org.areaOfDigitalSocialInnovation = fn.unique(fn.flatten(org.projects.map(function(p) { return p.areaOfDigitalSocialInnovation; })));
  org.areaOfDigitalSocialInnovationCounted = fn.countValues(fn.flatten(org.projects.map(function(p) { return p.areaOfDigitalSocialInnovation; })));
  org.collaborators.forEach(function(collab) {
    collab.areaOfDigitalSocialInnovation = fn.unique(fn.flatten(collab.projects.map(function(p) { return p.areaOfDigitalSocialInnovation; })));
    collab.areaOfDigitalSocialInnovationCounted = fn.countValues(fn.flatten(collab.projects.map(function(p) { return p.areaOfDigitalSocialInnovation; })));
  })

  org.x = w/2;
  org.y = h*0.85;

  var rootNode = nodeGroup.selectAll('.root').data([org])

  rootNode.enter()
    .append('g')
    .attr('class', 'root');

  var rootNodeLabel = rootNode.append('text')
    .attr('x', function(d) { return d.x; })
    .attr('y', function(d) { return d.y + 40; })
    .attr('text-anchor', 'middle')
    .style('fill', 'black')
    .style('font-size', '12px')
    .text('Nesta')
    .style('opacity', 1)

  //PROJECTS

  org.projects.forEach(function(project, projectIndex) {
    if (VizConfig.projectStyle === "hex") {
      project.x = w/2 + (projectIndex - Math.floor(org.projects.length/2) + 0.5) * 60;
    }
    else {
      project.x = w/2 + (projectIndex - Math.floor(org.projects.length/2) + 0.5) * 120;
    }

    project.y = h*0.52;
  });

  var projectNodes = nodeGroup.selectAll('.project').data(org.projects);
  projectNodes.enter().append('g').attr('class', 'project')

  projectNodes.on('mouseover', function(d) {
    if (d3.event.target.nodeName == 'rect') {
      tooltip.style('display', 'block')
      tooltipBg.style('fill', '#000000');
      console.log(d)
      tooltipText.text(d.label);
    }
  })

  projectNodes.on('mouseout', function() {
    tooltip.style('display', 'none');
  });

  function makeHexes(nodes, r) {
    fn.sequence(0,6).map(function(i) {
      var bite = nodes.append('path');
      bite.attr('d', function(item, itemIndex) {
        var x = item.x;
        var y = item.y;
        return "M" + hexBite(x, y, r + 2, i).join("L") + "Z";
      });
      bite.attr('stroke', function(d) { return d.projects ? '#EEE' : 'none'; });
      bite.attr('fill', '#FFF');
    }.bind(this));

    fn.sequence(0,6).map(function(i) {
      var bite = nodes.append('path');
      bite.attr('d', function(item, itemIndex) {
        var x = item.x;
        var y = item.y;
        return "M" + hexBorder(x, y, r + 2, i).join("L") + "Z";
      });
      bite.attr('stroke', function(d) { return d.projects ? '#999' : '#999'; });
      bite.attr('fill', 'none');
    }.bind(this));

    fn.sequence(0,6).map(function(i) {
      var bite = nodes.append('path');
      bite.attr('d', function(item, itemIndex) {
        var x = item.x;
        var y = item.y;

        var path;

        if (item.projects) {
          var areaR = 0;
          if (item.areaOfDigitalSocialInnovation && item.areaOfDigitalSocialInnovation.indexOf(VizConfig.dsiAreas[i].id) !== -1) {
            if (item.areaOfDigitalSocialInnovationCounted) {
              areaR = Math.min(r, 5 + 2 * item.areaOfDigitalSocialInnovationCounted[VizConfig.dsiAreas[i].id]);
            }
          }
          path = "M" + hexBite(x, y, areaR, i).join("L") + "Z";
        }
        else {
          var edgeR = 0;
          if (item.areaOfDigitalSocialInnovation.indexOf(VizConfig.dsiAreas[i].id) !== -1) {
            edgeR = r;
          }
          //edgeR = r;
          path = "M" + hexEdge(x, y, edgeR, i).join("L") + "Z";
        }

        return path;
      }.bind(this));
      bite.attr('fill', VizConfig.dsiAreas[i].color);
      bite.attr('stroke', function(d) {
        return (!d.project) ? "white" : "none";
      });
    });
  }

  function makeTriangles(nodes, r) {
    fn.sequence(0,6).map(function(i) {
      var bite = nodes.append('path');
      bite.attr('d', function(item, itemIndex) {
        var x = item.x;
        var y = item.y;
        return "M" + triangleBite(x, y, r + 2, r + 2, i).join("L") + "Z";
      });
      bite.attr('stroke', function(d) { return d.projects ? '#EEE' : 'none'; });
      bite.attr('fill', '#FFF');
    }.bind(this));

    fn.sequence(0,6).map(function(i) {
      var bite = nodes.append('path');
      bite.attr('d', function(item, itemIndex) {
        var x = item.x;
        var y = item.y;
        return "M" + triangleBorder(x, y, r + 2, i).join("L") + "Z";
      });
      bite.attr('stroke', function(d) { return d.projects ? '#999' : '#999'; });
      bite.attr('fill', 'none');
    }.bind(this));

    fn.sequence(0,6).map(function(i) {
      var bite = nodes.append('path');
      bite.attr('d', function(item, itemIndex) {
        var x = item.x;
        var y = item.y;

        var path;

        if (item.projects) {
          var areaR = 0;
          if (item.areaOfDigitalSocialInnovation && item.areaOfDigitalSocialInnovation.indexOf(VizConfig.dsiAreas[i].id) !== -1) {
            if (item.areaOfDigitalSocialInnovationCounted) {
              areaR = Math.min(r, 5 + 2 * item.areaOfDigitalSocialInnovationCounted[VizConfig.dsiAreas[i].id]);
            }
          }
          path = "M" + triangleBite(x, y, areaR, r + 2, i).join("L") + "Z";
        }
        else {
          var edgeR = 0;
          if (item.areaOfDigitalSocialInnovation.indexOf(VizConfig.dsiAreas[i].id) !== -1) {
            edgeR = r;
            edgeR += 2;
          }
          // path = "M" + triangleEdge(x, y, edgeR, r + 2, i).join("L") + "Z";
          path = "M" + triangleBite(x, y, edgeR, r + 2, i).join("L") + "Z";
        }

        return path;
      }.bind(this));
      bite.attr('fill', VizConfig.dsiAreas[i].color);
      bite.attr('stroke', function(d) {
        // return (!d.project && VizConfig.style === "hex") ? "white" : "none";
      });
    });
  }
  //COLLABORATORS

  org.collaborators.forEach(function(collaborator, collaboratorIndex) {
    if (VizConfig.orgStyle === "hex") {
      collaborator.x = w/2 + (collaboratorIndex - org.collaborators.length/2) * (w-30)/org.collaborators.length + 15;
      collaborator.y = h * 0.15;
    }
    else {
      if (collaboratorIndex % 2 === 0) {
        collaborator.y = h * 0.15;
      }
      else {
        collaborator.y = h * 0.30;
      }

      collaboratorIndex = Math.floor(collaboratorIndex / 2);
      collaborator.x = w/2 + (collaboratorIndex - org.collaborators.length/4) * (w + 700)/org.collaborators.length + 15;
    }
  });

  var collaboratorNodes = nodeGroup.selectAll('.collaborator').data(org.collaborators);
  var g = collaboratorNodes.enter().append('g')
    .attr('class', 'collaborator')
  g.append('circle').attr('class', 'collaboratorCircle')
  g.append('circle').attr('class', 'collaboratorCircleUni')

  collaboratorNodes.exit().remove()

  if (VizConfig.orgStyle === "hex") {
    var collaboratorCircle = collaboratorNodes.select('circle.collaboratorCircle');
    collaboratorCircle
      .attr('cx', function(d) { return d.x; })
      .attr('cy', function(d) { return d.y; })
      .attr('r', function(d) { return 5 + 2 * d.projects.length})
      .style('stroke', '#333')
      .style('fill', '#FFF')

    collaboratorCircle.on('mouseover', function(d) {
      if (d3.event.target.nodeName == 'circle') {
        tooltip.style('display', 'block')
        tooltipBg.style('fill', '#000000');
        console.log(d)
        tooltipText.text(d.label);
      }
    })

    collaboratorCircle.on('mouseout', function() {
      tooltip.style('display', 'none');
    })
  }

  if (VizConfig.projectStyle === "hex") {
    makeHexes(projectNodes, r);
  }
  else {
    makeTriangles(projectNodes, r);
  }

  if (VizConfig.orgStyle === "hex") {
    makeHexes(rootNode, r);
    makeHexes(collaboratorNodes, r * 0.8);
  }
  else {
    makeTriangles(rootNode, r);
    makeTriangles(collaboratorNodes, r * 0.8);
  }

  //LINKS

  var diagonal = d3.svg.diagonal().projection(function(d) { return [d.x, d.y]; });

  var links = [];
  org.projects.forEach(function(project) {
    links.push({ source:project, target:org, project: project});
    project.collaborators.forEach(function(collab) {
      if (collab != org) {
        links.push({source:project, target:collab, project: project});
      }
    })
  })

  var linkNodes = linkGroup.selectAll('.link').data(links);

  linkNodes.enter().append('path')
    .attr('class', 'link')
    .style('fill', 'none')
    .style('stroke', function(d) {
      return '#DDD';
    })
    .attr('d', diagonal)

  linkNodes.exit().remove();
}

new OrgGraph('#charts', 'http://data.digitalsocial.eu/id/organization/eb70a18d-2f2b-62fd-76ca-5a33f71b9f50')
