/*global window, fn, $, d3, SPARQLDataSource, VizConfig */

var OrganisationsList = (function() {
  var indexOfProp = function(data, prop, val) {
    return data.map(function(o) { return o[prop]; }).indexOf(val);
  };

  var countAdsi = function(data) {
    return data.reduce(function(memo, item) {
      var adsi = item.adsi_label.value;
      var index = indexOfProp(memo, "name", adsi);

      if (index < 0) {
        memo.push({ name: adsi, count: 1 });
      }
      else {
        memo[index].count++;
      }

      return memo;
    }, []);
  };

  function OrganisationsList(type, div) {
    div = $(div);

    this.type = type || "list"; // list - /organisations-and-projects/, org - /organisations/

    if (type === "list") {
      this.DOM = {
        projects: div.find(".proj.result"),
        orgs: div.find(".org.result")
      };
    }
    else if (type === "org") {
      this.DOM = {
        projects: div.find(".left-column li"),
        orgs: div.find(".right-column li")
      };
    }
  }

  OrganisationsList.prototype.init = function() {
    this.processOrgs();
    this.processProjects();

    if (this.type === "org") { this.updateOrgIcon(); }
  };

  OrganisationsList.prototype.processOrgs = function() {
    this.DOM.orgs.each(function(i, el) {
      var $el = $(el);
      var a = $el.find("a").first();

      var url = a.attr("href");
      var orgId = url.split("/")[2];

      this.getOrgData(orgId, function(data) {
        a.prepend("<svg>");

        var svg = d3.select($el.find("svg")[0])
          .style("vertical-align", "middle")
          .attr("width", 43)
          .attr("height", 44);
        $el.find("img").first().remove();

        var node = svg.selectAll(".org")
          .data([ data ])
          .enter()
          .append("g")
          .attr("class", "org");

        this.makeHex(node);
      }.bind(this));
    }.bind(this));
  };

  OrganisationsList.prototype.getOrgData = function(orgId, callback) {
    var url = "http://data.digitalsocial.eu/sparql.json?utf8=✓&query=";
    var ds = new SPARQLDataSource(url);

    ds.query()
      .prefix("o:", "<http://www.w3.org/ns/org#>")
      .prefix("rdfs:", "<http://www.w3.org/2000/01/rdf-schema#>")
      .prefix("geo:", "<http://www.w3.org/2003/01/geo/wgs84_pos#>")
      .prefix("vcard:", "<http://www.w3.org/2006/vcard/ns#>")
      .prefix("ds:", "<http://data.digitalsocial.eu/def/ontology/>")
      .select("?org_label ?activity_label ?adsi_label ?activity")
      .where("?org", "a", "o:Organization")
      .where("FILTER regex(str(?org), \"" + orgId + "\")", "", "")
      .where("?am", "a", "ds:ActivityMembership")
      .where("?am", "ds:organization", "?org")
      .where("?am", "ds:activity", "?activity")
      .where("?activity", "rdfs:label", "?activity_label")
      .where("?activity", "ds:areaOfDigitalSocialInnovation", "?adsi")
      .where("?activity", "ds:technologyFocus", "?tf")
      .where("?adsi", "rdfs:label", "?adsi_label")
      .where("?org", "rdfs:label", "?org_label")
      .execute()
      .then(function(results) {
        var data = countAdsi(results);
        callback(data);
      }.bind(this));
  };

  OrganisationsList.prototype.makeHex = function(nodes, x, y, r) {
    r = r || 19;
    x = x || 19;
    y = y || 21;

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

    fn.sequence(0,6).forEach(function(i) {
      nodes
        .append("path")
        .attr("d", function() {
          return "M" + hexBite(x, y, r + 2, i).join("L") + "Z";
        })
        .attr("stroke", "#EEE")
        .attr("fill", "#FFF");
    });

    fn.sequence(0,6).forEach(function(i) {
      nodes
        .append("path")
        .attr("d", function() {
          return "M" + hexBorder(x, y, r + 2, i).join("L") + "Z";
        })
        .attr("stroke", "#999")
        .attr("fill", "none");
    });

    fn.sequence(0,6).forEach(function(i) {
      nodes
        .append("path")
        .attr("d", function(item) {
          var path;
          var areaR = 0;

          var index = indexOfProp(item, "name", VizConfig.dsiAreas[i].label);

          if (index >= 0) {
            areaR = Math.min(r, 5 + 2 * item[index].count);
          }
          path = "M" + hexBite(x, y, areaR, i).join("L") + "Z";

          return path;
        })
        .attr("fill", VizConfig.dsiAreas[i].color)
        .attr("stroke", "none");
    });
  };

  OrganisationsList.prototype.processProjects = function() {
    this.DOM.projects.each(function(i, el) {
      var $el = $(el);

      var a = $el.find("a").first();

      var url = a.attr("href");
      var projId = url.split("/")[2];

      this.getProjectData(projId, function(data) {
        a.prepend("<svg>");

        var svg = d3.select($el.find("svg")[0])
          .style("vertical-align", "middle")
          .attr("width", 43)
          .attr("height", 44);
        $el.find("img").first().remove();

        var node = svg.selectAll(".org")
          .data([ data ])
          .enter()
          .append("g")
          .attr("class", "org");

        this.makeTriangles(node);
      }.bind(this));
    }.bind(this));
  };

  OrganisationsList.prototype.getProjectData = function(projectId, callback) {
    var url = "http://data.digitalsocial.eu/sparql.json?utf8=✓&query=";
    var ds = new SPARQLDataSource(url);

    ds.query()
      .prefix("o:", "<http://www.w3.org/ns/org#>")
      .prefix("rdfs:", "<http://www.w3.org/2000/01/rdf-schema#>")
      .prefix("geo:", "<http://www.w3.org/2003/01/geo/wgs84_pos#>")
      .prefix("vcard:", "<http://www.w3.org/2006/vcard/ns#>")
      .prefix("ds:", "<http://data.digitalsocial.eu/def/ontology/>")
      .select("DISTINCT ?activity ?activity_label ?adsi_label")
      .where("FILTER regex(str(?activity), \"" + projectId + "\")", "", "")
      .where("?am", "a", "ds:ActivityMembership")
      .where("?am", "ds:activity", "?activity")
      .where("?activity", "rdfs:label", "?activity_label")
      .where("?activity", "ds:areaOfDigitalSocialInnovation", "?adsi")
      .where("?adsi", "rdfs:label", "?adsi_label")
      .execute()
      .then(function(results) {
        var data = countAdsi(results);
        callback(data);
      });
  };

  OrganisationsList.prototype.makeTriangles = function(nodes) {
    var r = 8;
    var x = 16;
    var y = 18;

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
      ];
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

      return [ ret[2], ret[1] ];
    }

    fn.sequence(0,6).forEach(function(i) {
      nodes
        .append("path")
        .attr("d", function() {
          return "M" + triangleBite(x, y, r + 2, r + 2, i).join("L") + "Z";
        })
        .attr("stroke", "#EEE")
        .attr("fill", "#FFF");
    });

    fn.sequence(0,6).forEach(function(i) {
      nodes
        .append("path")
        .attr("d", function() {
          return "M" + triangleBorder(x, y, r + 2, i).join("L") + "Z";
        })
        .attr("stroke", "#999")
        .attr("fill", "none");
    });

    fn.sequence(0,6).forEach(function(i) {
      nodes
        .append("path")
        .attr("d", function(item) {
          var path;
          var edgeR = 0;

          var index = indexOfProp(item, "name", VizConfig.dsiAreas[i].label);
          if (index >= 0) { edgeR = r + 2; }

          path = "M" + triangleBite(x, y, edgeR, r + 2, i).join("L") + "Z";

          return path;
        })
        .attr("fill", VizConfig.dsiAreas[i].color);
    });
  };

  OrganisationsList.prototype.updateOrgIcon = function() {
    var divTitle = $(".container .title");
    var orgId = window.location.href.split("/").pop().replace(/\.html$/, "");

    this.getOrgData(orgId, function(data) {
      divTitle.prepend("<svg>");

      var svg = d3.select(divTitle.find("svg")[0])
        .attr("width", 76)
        .attr("height", 98);

      divTitle.find("img").remove();

      var node = svg.selectAll(".org")
        .data([ data ])
        .enter()
        .append("g")
        .attr("class", "org");

      var x = 38;
      var y = 44;
      var r = 41;

      this.makeHex(node, x, y, r);
    }.bind(this));
  };

  return OrganisationsList;
}());

