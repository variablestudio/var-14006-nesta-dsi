var VizConfig = {};

VizConfig.assetsPath = 'assets';

VizConfig.dsiAreas = [
  { title: 'Funding acceleration<br/> and incubation', color: '#FDE302', icon: VizConfig.assetsPath + '/triangle-funding-acceleration-and-incubation.png' },
  { title: 'Collaborative economy', color: '#A6CE39', icon: VizConfig.assetsPath + '/triangle-collaborative-economy.png' },
  { title: 'Open democracy', color: '#F173AC', icon: VizConfig.assetsPath + '/triangle-open-democracy.png' },
  { title: 'Awarness networks', color: '#ED1A3B', icon: VizConfig.assetsPath + '/triangle-awarness-networks.png' },
  { title: 'New ways of making', color: '#F58220', icon: VizConfig.assetsPath + '/triangle-new-ways-of-making.png' },
  { title: 'Open access', color: '#7BAFDE', icon: VizConfig.assetsPath + '/triangle-open-access.png' }
];

VizConfig.dsiAreasById = {
  'funding-acceleration-and-incubation': VizConfig.dsiAreas[0],
  'collaborative-economy': VizConfig.dsiAreas[1],
  'open-democracy': VizConfig.dsiAreas[2],
  'awarness-networks': VizConfig.dsiAreas[3],
  'new-ways-of-making': VizConfig.dsiAreas[4],
  'open-access': VizConfig.dsiAreas[5]
};

VizConfig.dsiAreasByLabel = {
  'Funding Acceleration and Incubation': VizConfig.dsiAreas[0],
  'Collaborative Economy': VizConfig.dsiAreas[1],
  'Open Democracy': VizConfig.dsiAreas[2],
  'Awareness Networks': VizConfig.dsiAreas[3],
  'New Ways of Making': VizConfig.dsiAreas[4],
  'Open Access': VizConfig.dsiAreas[5]
};

VizConfig.technologyFocuses = [
  { title: 'Open Hardware', icon: VizConfig.assetsPath + '/tech-open-hardware.png' },
  { title: 'Open Networks', icon: VizConfig.assetsPath + '/tech-open-networks.png' },
  { title: 'Open Knowledge', icon: VizConfig.assetsPath + '/tech-open-knowledge.png' },
  { title: 'Open Data', icon: VizConfig.assetsPath + '/tech-open-data.png' }
];

VizConfig.technologyFocusesById = {
  'open-hardware': VizConfig.technologyFocuses[0],
  'open-networks': VizConfig.technologyFocuses[1],
  'open-knowledge': VizConfig.technologyFocuses[2],
  'open-data': VizConfig.technologyFocuses[3]
};
