VizConfig = {};

VizConfig.dsiAreas = [
  { title: 'Funding acceleration<br/> and incubation', id: 'funding-acceleration-and-incubation', color: '#FDE302', icon: VizConfig.assetsPath + '/triangle-funding-acceleration-and-incubation.png', label: 'Funding Acceleration and Incubation' },
  { title: 'Collaborative economy', id: 'collaborative-economy', color: '#A6CE39', icon: VizConfig.assetsPath + '/triangle-collaborative-economy.png', label: 'Collaborative Economy' },
  { title: 'Open democracy', id: 'open-democracy', color: '#F173AC', icon: VizConfig.assetsPath + '/triangle-open-democracy.png', label: 'Open Democracy' },
  { title: 'Awareness networks', id: 'awareness-networks', color: '#ED1A3B', icon: VizConfig.assetsPath + '/triangle-awareness-networks.png', label: 'Awareness Networks' },
  { title: 'New ways of making', id: 'new-ways-of-making', color: '#F58220', icon: VizConfig.assetsPath + '/triangle-new-ways-of-making.png', label: 'New Ways of Making' },
  { title: 'Open access', id: 'open-access', color: '#7BAFDE', icon: VizConfig.assetsPath + '/triangle-open-access.png', label: 'Open Access' }
];


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
      this.draw();
    }.bind(this)).fail(function(e) {
      console.log(e, e.stack)
    });
}

OrgGraph.prototype.draw = function() {
  var w = 994;
  var h = 400;
  var svg = this.DOM.container.append("svg")
    .attr("width", w)
    .attr("height", h)
    .style('margin', '0 auto')
    .style('display', 'block')

  svg.append('rect').attr('x', 0).attr('y', 0).attr('width', w).attr('height', h).style('fill', '#EEE');

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

  //ORG

  var org = { label: 'Nesta', projects: this.projects, collaborators: this.collaborators }

  org.x = w/2;
  org.y = h*0.9;

  var rootNode = nodeGroup.selectAll('.root').data([org])

  rootNode.enter()
    .append('g')
    .attr('class', 'root');

  var rootNodeCircle = rootNode.append('circle')
    .attr('cx', function(d) { return d.x; })
    .attr('cy', function(d) { return d.y; })
    .attr('r', 15)
    .style('fill', 'white')
    .style('stroke', '#333')

  var rootNodeLabel = rootNode.append('text')
    .attr('x', function(d) { return d.x; })
    .attr('y', function(d) { return d.y + 30; })
    .attr('text-anchor', 'middle')
    .style('fill', 'black')
    .style('font-size', '12px')
    .text('Nesta')
    .style('opacity', 1)

  //PROJECTS

  org.projects.forEach(function(project, projectIndex) {
    project.x = w/2 + (projectIndex - Math.floor(org.projects.length/2) + 0.5) * 40;
    project.y = h*0.6;
  });

  var projectNodes = nodeGroup.selectAll('.project').data(org.projects);
  projectNodes.enter().append('rect')
    .attr('class', 'project')
    .attr('x', function(d) { return d.x - 10; })
    .attr('y', function(d) { return d.y; })
    .attr('width', function(d) { return 20; })
    .attr('height', function(d) { return 10; })
    .style('fill', function(d) { return 'red' })
    .style('stroke', 'none');

  projectNodes.exit().transition().duration(1000).style('opacity', 0).remove()

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
  })

  //COLLABORATORS

  org.collaborators.forEach(function(collaborator, collaboratorIndex) {
    collaborator.x = w/2 + (collaboratorIndex - org.collaborators.length/2) * 30;
    collaborator.y = h * 0.25;
  });

  var collaboratorNodes = nodeGroup.selectAll('.collaborator').data(org.collaborators);
  var g = collaboratorNodes.enter().append('g')
    .attr('class', 'collaborator')
    .attr('transform', function(d) { return 'translate(' + (d.x) + ',' + (d.y) + ')'; })
  g.append('circle').attr('class', 'collaboratorCircle')
  g.append('circle').attr('class', 'collaboratorCircleUni')

  collaboratorNodes.exit().remove()

  collaboratorNodes
    .attr('transform', function(d) { return 'translate(' + (d.x) + ',' + (d.y) + ')'; });

  var collaboratorCircle = collaboratorNodes.select('circle.collaboratorCircle');
  collaboratorCircle
    .attr('cx', 0)
    .attr('cy', 0)
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
      return 'red';
    })
    .style('opacity', 0)

  linkNodes
    .transition().duration(1000)
    .style('stroke', function(d) {
      return 'red';
    })
    .attr('d', diagonal)
    .style('opacity', 1);

  linkNodes.exit().remove();
}

new OrgGraph('#charts', 'http://data.digitalsocial.eu/id/organization/eb70a18d-2f2b-62fd-76ca-5a33f71b9f50')
