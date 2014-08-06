var VizConfig = {};

if (window.location.href.match(/\/organisations\//) !== null || window.location.href.match(/digitalsocial/) !== null) {
  // VizConfig.assetsPath = "http://variable.io/p/nestadsi/beta/assets";
  VizConfig.assetsPath = "http://content.digitalsocial.eu/wp-content/themes/digitalsocial/assets";
}
else {
  VizConfig.assetsPath = 'assets';
}

VizConfig.text = {
  caseStudiesTitle: 'Case Studies'
};

VizConfig.dsiAreas = [
  { title: 'Open access', id: 'open-access', color: '#7BAFDE', icon: VizConfig.assetsPath + '/triangle-open-access.png', label: 'Open Access', labelMultiline: 'Open\nAccess' },
  { title: 'Awareness networks', id: 'awareness-networks', color: '#ED1A3B', icon: VizConfig.assetsPath + '/triangle-awareness-networks.png', label: 'Awareness Networks', labelMultiline: 'Awareness\nNetworks' },
  { title: 'Collaborative economy', id: 'collaborative-economy', color: '#A6CE39', icon: VizConfig.assetsPath + '/triangle-collaborative-economy.png', label: 'Collaborative Economy', labelMultiline: 'Collaborative\nEconomy' },
  { title: 'New ways of making', id: 'new-ways-of-making', color: '#F58220', icon: VizConfig.assetsPath + '/triangle-new-ways-of-making.png', label: 'New Ways of Making', labelMultiline: 'New Ways\nof Making' },
  { title: 'Open democracy', id: 'open-democracy', color: '#F173AC', icon: VizConfig.assetsPath + '/triangle-open-democracy.png', label: 'Open Democracy', labelMultiline: 'Open\nDemocracy' },
  { title: 'Funding acceleration<br/> and incubation', id: 'funding-acceleration-and-incubation', color: '#FDE302', icon: VizConfig.assetsPath + '/triangle-funding-acceleration-and-incubation.png', label: 'Funding Acceleration and Incubation', labelMultiline: 'Funding\nAcceleration\nand Incubation' }
];

VizConfig.dsiAreasById = {
  'funding-acceleration-and-incubation': VizConfig.dsiAreas[5],
  'collaborative-economy': VizConfig.dsiAreas[2],
  'open-democracy': VizConfig.dsiAreas[4],
  'awareness-networks': VizConfig.dsiAreas[1],
  'new-ways-of-making': VizConfig.dsiAreas[3],
  'open-access': VizConfig.dsiAreas[0]
};

VizConfig.dsiAreasById['funding-acceleration-and-incubation'].info = 'A range of incubators, accelerators, impact investment schemes have been set up by public and private funders to support digital social innovation projects. They do this through a combination of seed funding as well as non-financial support such access to co-working spaces and  business support and mentoring';
VizConfig.dsiAreasById['collaborative-economy'].info = 'Collaborative economy: New collaborative socio-economic models that present novel characteristics, and enable people to share skills, knowledge, food, clothes, housing and so on. It includes crypto digital currencies, new forms of crowdfunding and financing, new platforms for exchanges and sharing resources based on reputation and trust.';
VizConfig.dsiAreasById['open-democracy'].info = 'Open democracy is transforming the traditional models of representative democracy. Digital technology can enable collective participation at a scale that was impossible before enabling citizens to be engaged in decision-making processes, collective deliberation, and mass mobilisation. ';
VizConfig.dsiAreasById['awareness-networks'].info = 'Platforms for collaboration are able to aggregate data coming from people and the environment and are used to solve environmental issues and promote sustainable behavioral changes, or to mobilize collective action and respond to community emergencies. ';
VizConfig.dsiAreasById['new-ways-of-making'].info = 'An ecosystem of makers is revolutionising open design and manufacturing. 3D manufactur­ing tools, free CAD/CAM software and open source designs are now giving innovators better access to tools, products, skills and capabilities they need to enhance collaborative making.';
VizConfig.dsiAreasById['open-access'].info = 'The Open Access Ecosystem approach has the potential to empower citizens and increase participation, while preserving privacy-aware and decentralised infrastructures. It includes projects that facilitate the diffusion of knowledge systems in the Public Domain, open standards, open licensing, knowledge commons and digital rights.';

VizConfig.dsiAreasByLabel = {
  'Funding Acceleration and Incubation': VizConfig.dsiAreas[5],
  'Collaborative Economy': VizConfig.dsiAreas[2],
  'Open Democracy': VizConfig.dsiAreas[4],
  'Awareness Networks': VizConfig.dsiAreas[1],
  'New Ways of Making': VizConfig.dsiAreas[3],
  'Open Access': VizConfig.dsiAreas[0]
};

VizConfig.technologyFocuses = [
  { title: 'Open Hardware', id: 'open-hardware', icon: VizConfig.assetsPath + '/tech-open-hardware.png' },
  { title: 'Open Networks', id: 'open-networks', icon: VizConfig.assetsPath + '/tech-open-networks.png' },
  { title: 'Open Knowledge', id: 'open-knowledge', icon: VizConfig.assetsPath + '/tech-open-knowledge.png' },
  { title: 'Open Data', id: 'open-data', icon: VizConfig.assetsPath + '/tech-open-data.png' }
];

VizConfig.technologyFocusesById = {
  'open-hardware': VizConfig.technologyFocuses[0],
  'open-networks': VizConfig.technologyFocuses[1],
  'open-knowledge': VizConfig.technologyFocuses[2],
  'open-data': VizConfig.technologyFocuses[3]
};

VizConfig.areaOfSociety = [
  { title: "Education and Skills", id: "education-and-skills" },
  { title: "Participation and Democracy", id: "participation-and-democracy" },
  { title: "Culture and Arts", id: "culture-and-arts" },
  { title: "Health and Wellbeing", id: "health-and-wellbeing" },
  { title: "Work and Employment", id: "work-and-employment" },
  { title: "Neighbourhood Regeneration", id: "neighbourhood-regeneration" },
  { title: "Energy and Environment", id: "energy-and-environment" },
  { title: "Finance and Economy", id: "finance-and-economy" },
  { title: "Science", id: "science" }
];

VizConfig.areaOfSocietyById = {
  "education-and-skills": VizConfig.areaOfSociety[0],
  "participation-and-democracy": VizConfig.areaOfSociety[1],
  "culture-and-arts": VizConfig.areaOfSociety[2],
  "health-and-wellbeing": VizConfig.areaOfSociety[3],
  "work-and-employment": VizConfig.areaOfSociety[4],
  "neighbourhood-regeneration": VizConfig.areaOfSociety[4],
  "energy-and-environment": VizConfig.areaOfSociety[5],
  "finance-and-economy": VizConfig.areaOfSociety[6],
  "science": VizConfig.areaOfSociety[7]
};

VizConfig.organisationType = [
  { title: "Social Enterprise Charity Or Foundation", id: "social-enterprise-charity-or-foundation" },
  { title: "Business", id: "business" },
  { title: "Grass Roots Organization Or Community Network", id: "grass-roots-organization-or-community-network" },
  { title: "Academia and Research", id: "academia-and-research" },
  { title: "Government and Public Sector", id: "government-and-public-sector" }
];

VizConfig.organisationTypeById = {
  "social-enterprise-charity-or-foundation": VizConfig.organisationType[0],
  "business": VizConfig.organisationType[1],
  "grass-roots-organization-or-community-network": VizConfig.organisationType[2],
  "academia-and-research": VizConfig.organisationType[3],
  "government-and-public-sector": VizConfig.organisationType[4]
};

VizConfig.initialMapHeight = Math.max(500, Math.min(window.innerHeight - 360, 500));

VizConfig.technologyFocusesById['open-hardware'].info = 'New ways of making and using open hard­ware solutions and moving towards and Open Source Internet of Things';
VizConfig.technologyFocusesById['open-networks'].info = 'Innovative combinations of network solutions and infrastructures, e.g. sensor net­works, free interoperable network services, open Wifi, bottom-up-broadband, distribut­ed social networks, p2p infrastructures';
VizConfig.technologyFocusesById['open-knowledge'].info = 'Co-production of new knowledge and crowd mobilisation based on open content, open source and open access';
VizConfig.technologyFocusesById['open-data'].info = 'Innovative ways to capture, use, analyse, and interpret open data coming from people and from the environment';
