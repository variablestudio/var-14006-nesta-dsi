/*global fn, $, d3, SPARQLDataSource, VizConfig */

var OrganisationsList = (function() {
  var indexOfProp = function(data, prop, val) {
    return data.map(function(o) { return o[prop]; }).indexOf(val);
  };

  function OrganisationsList(div) {
    div = $(div);

    this.DOM = {
      projects: div.find(".proj.result"),
      orgs: div.find(".org.result")
    };
  }

  OrganisationsList.prototype.init = function() {
    this.processOrgs();
  };

  OrganisationsList.prototype.processOrgs = function() {
    this.DOM.orgs.each(function(i, el) {
      var $el = $(el);

      var url = $el.find("a").attr("href");
      var orgId = url.split("/")[2];

      this.getOrgData(orgId, function(data) {
        $el.find("a").prepend("<svg>");

        var svg = d3.select($el.find("svg")[0])
          .style("vertical-align", "middle")
          .attr("width", 43)
          .attr("height", 44);
        $el.find("img").remove();

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
        var data = results.reduce(function(memo, item) {
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

        callback(data);
      }.bind(this));
  };

  OrganisationsList.prototype.makeHex = function(nodes) {
    var r = 19;
    var x = 19;
    var y = 21;

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

  return OrganisationsList;
}());

