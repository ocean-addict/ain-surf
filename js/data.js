window.AIN = window.AIN || {};

AIN.spots = [
  {id:'pepsi',name:'Anfa Place Beach',area:'Anfa Place / Lalla Meryem · 33.601°N, 7.666°W',lat:33.6008,lng:-7.6662,score:0,wave:'--',period:0,wind:'--',tide:'--',window:'--',label:'Updating',tone:'okay',level:'Beginner–intermediate',direction:'--',crowd:'Busy',danger:'Moderate',type:'Beach break',note:'Spot maison autour d’Anfa Place. Plus accessible quand les vagues sont petites et propres. À mi-marée montante, le spot peut se transformer en heavy shorebreak et devenir beaucoup plus exigeant.',ideal:[0.5,1.4],swellTarget:300,windTarget:110,tideBias:'rising',power:.95,currentTolerance:.34,shorebreakRisk:.8,intermediateLabel:'Intermediate+'},
  {id:'ain-diab',name:'Aïn Diab',area:'Aïn Diab / Corniche · 33.586°N, 7.690°W',lat:33.586,lng:-7.690,score:0,wave:'--',period:0,wind:'--',tide:'--',window:'--',label:'Updating',tone:'okay',level:'Intermediate',direction:'--',crowd:'Busy',danger:'Moderate',type:'Beach break',note:'Beachbreak distinct de la Corniche avec plusieurs pics et les accès reconnus n°18 et n°23. Plus propre tôt le matin, avant que le vent ne devienne onshore.',ideal:[0.8,1.8],swellTarget:295,windTarget:105,tideBias:'rising',power:1,currentTolerance:.42,shorebreakRisk:.25},
  {id:'tahiti-plage',name:'Tahiti Plage',area:'Tahiti Plage · 33.558°N, 7.738°W',lat:33.558,lng:-7.738,score:0,wave:'--',period:0,wind:'--',tide:'--',window:'--',label:'Updating',tone:'okay',level:'Intermediate',direction:'--',crowd:'Moderate',danger:'Moderate',type:'Beach break',note:'Option proche au sud des spots centraux. Cherche un vent plus propre et une houle mieux organisée avant de partir à l’eau.',ideal:[0.7,1.8],swellTarget:295,windTarget:100,tideBias:'mid',power:1.02,currentTolerance:.38,shorebreakRisk:.35},
  {id:'jack-beach',name:'Jack Beach — Dar Bouazza',area:'Dar Bouazza · 33.526°N, 7.818°W',lat:33.526,lng:-7.818,score:0,wave:'--',period:0,wind:'--',tide:'--',window:'--',label:'Updating',tone:'okay',level:'Intermediate–advanced',direction:'--',crowd:'Light–moderate',danger:'Moderate',type:'Beach break exposé',note:'Option plus large à Dar Bouazza quand les spots du centre de Casablanca ne fonctionnent pas. Plus exposé, avec des courants plus forts et des conditions plus variables.',ideal:[0.9,2.2],swellTarget:290,windTarget:100,tideBias:'mid',power:1.08,currentTolerance:.32,shorebreakRisk:.45}
];

// Local information is kept separate from forecast/scoring data.
const anfaPlace=AIN.spots.find(spot=>spot.id==='pepsi');
if(anfaPlace)anfaPlace.localSchool={
  name:'Anfa Surf School',
  location:'3 Shari’ Al-Kourneesh, Casablanca',
  coordinates:'33.599125,-7.666945',
  mapsUrl:'https://www.google.com/maps/search/?api=1&query=33.599125,-7.666945',
  wazeUrl:'https://www.waze.com/ul?ll=33.599125%2C-7.666945&navigate=yes',
  description:'Cours de surf et coaching à Anfaplace pour enfants et adultes, avec possibilité de réserver ou de passer directement au club.',
  phone:'+212668289148',
  whatsapp:'212668289148',
  languages:'Français · English · العربية',
  courses:'Cours débutant, cours privé et coaching en groupe',
  rental:'Location board + wetsuit',
  prices:'Location : 100 DH · Cours avec coach : 150 DH',
  booking:'Réservation possible ou paiement sur place',
  flexible:'Cours disponibles pendant les heures d’ouverture',
  pack:'Carnet de 10 cours disponible'
};

AIN.state = { selectedSpotId:'pepsi', forecastDay:0, forecastSpotId:null, bestDay:0 };
