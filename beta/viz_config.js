var VizConfig = {};

VizConfig.dsiAreas = [
  { title: 'Funding acceleration<br/> and incubation', color: '#FDE302', icon: 'assets/triangle-funding-acceleration-and-incubation.png' },
  { title: 'Collaborative economy', color: '#A6CE39', icon: 'assets/triangle-collaborative-economy.png' },
  { title: 'Open democracy', color: '#F173AC', icon: 'assets/triangle-open-democracy.png' },
  { title: 'Awarness networks', color: '#ED1A3B', icon: 'assets/triangle-awarness-networks.png' },
  { title: 'New ways of making', color: '#F58220', icon: 'assets/triangle-new-ways-of-making.png' },
  { title: 'Open access', color: '#7BAFDE', icon: 'assets/triangle-open-access.png' }
];

VizConfig.dsiAreasById = {
  'funding-acceleration-and-incubation': VizConfig.dsiAreas[0],
  'collaborative-economy': VizConfig.dsiAreas[1],
  'open-democracy': VizConfig.dsiAreas[2],
  'awarness-networks': VizConfig.dsiAreas[3],
  'new-ways-of-making': VizConfig.dsiAreas[4],
  'open-access': VizConfig.dsiAreas[5]
};

VizConfig.technologyFocuses = [
  { title: 'Open Hardware', icon: 'assets/tech-open-hardware.png' },
  { title: 'Open Networks', icon: 'assets/tech-open-networks.png' },
  { title: 'Open Knowledge', icon: 'assets/tech-open-knowledge.png' },
  { title: 'Open Data', icon: 'assets/tech-open-data.png' }
];

VizConfig.technologyFocusesById = {
  'open-hardware': VizConfig.technologyFocuses[0],
  'open-networks': VizConfig.technologyFocuses[1],
  'open-knowledge': VizConfig.technologyFocuses[2],
  'open-data': VizConfig.technologyFocuses[3]
};
