// French UI layer: surf vocabulary intentionally remains in English.
(function(){
  const reveal=()=>document.body.classList.add('fonts-ready');
  if(document.fonts?.ready)document.fonts.ready.then(reveal).catch(reveal);else reveal();
  const replacements={
    "Today's best pick for YOU":'Meilleur choix pour TOI aujourd’hui',
    "Today's best conditions":'Meilleures conditions aujourd’hui',
    'Best pick for YOU':'Meilleur choix pour TOI',
    'Best conditions':'Meilleures conditions',
    'BEST PICK':'MEILLEUR CHOIX',
    'Why this spot':'Pourquoi ce spot',
    'Local note':'Note locale',
    'Model estimate':'Estimation du modèle',
    'Best modelled combination of wave size, swell, wind and tide.':'Meilleure combinaison modélisée de wave size, swell, wind et tide.',
    'Wave size fits your profile with':'La taille des waves correspond à ton profil avec',
    'clean wind':'wind propre',
    'lighter wind window':'créneau avec wind plus léger',
    'rising tide':'tide montante',
    'falling tide':'tide descendante',
    'near turn tide':'tide à l’étale',
    'LIVE · LOCAL TIDES':'LIVE · TIDES LOCALES',
    'LIVE · TIDE FALLBACK':'LIVE · ESTIMATION TIDE',
    "Today's":'Aujourd’hui',
    'Best surf today:':'Meilleures conditions surf :',
    'Best window':'Créneau idéal',
    'Click to see score details':'Clique pour voir le détail du score',
    'Forecast temporarily unavailable. Please try again shortly.':'Prévisions temporairement indisponibles. Réessaie dans quelques instants.',
    'Forecast temporarily unavailable for this date.':'Prévisions temporairement indisponibles pour cette date.',
    'Forecast temporarily unavailable.':'Prévisions temporairement indisponibles.',
    'Gusts':'Rafales',
    'Modelled tide':'Tide modélisée',
    'Modelled wave height':'Hauteur de wave modélisée',
    'Best-window outlook':'Évolution sur le meilleur créneau',
    "Today's suitability":'Niveau du jour',
    'Usual crowd':'Fréquentation habituelle',
    'Danger baseline':'Risque habituel',
    'Local note':'Note locale',
    'Waiting for live data…':'En attente des données live…',
    'Current unavailable':'Current indisponible',
    'Current checking':'Current en cours d’analyse',
    'Your account':'Ton compte',
    'Sign in / create account':'Se connecter / créer un compte',
    'Sign in to save your profile across devices.':'Connecte-toi pour sauvegarder ton profil sur tous tes appareils.',
    'Create account':'Créer un compte',
    'Sign in':'Se connecter',
    'Sign out':'Se déconnecter',
    'Save your setup across devices':'Sauvegarder ton setup sur tous tes appareils',
    'Save my surf profile':'Sauvegarder mon profil surf',
    'Today':'Aujourd’hui',
    'For you':'Pour toi',
    'Close account dialog':'Fermer la fenêtre du compte',
    'Password':'Mot de passe',
    'SELECTED SPOT':'SPOT SÉLECTIONNÉ',
    'Time':'Heure',
    'Quality':'Qualité',
    'Estimated waves':'Waves estimées',
    'Offshore swell':'Swell offshore',
    'Weather':'Météo',
    'MEAN + GUSTS':'MOYEN + RAFALES',
    'LOW TIDE':'LOW TIDE',
    'HIGH TIDE':'HIGH TIDE',
    'SOURCE':'SOURCE'
    ,'UPDATING':'MISE À JOUR'
    ,'Beginner–intermediate':'Débutant–intermédiaire'
    ,'Intermediate–advanced':'Intermédiaire–avancé'
    ,'Intermediate+':'Intermédiaire+'
    ,'Intermediate':'Intermédiaire'
    ,'Beginner+':'Débutant+'
    ,'Beginner':'Débutant'
    ,'Advanced':'Avancé'
    ,'Busy':'Fréquenté'
    ,'Moderate':'Modérée'
    ,'Light–moderate':'Légère à modérée'
    ,'Beach break with shorebreak':'Beach break avec shorebreak'
    ,'Exposed beach break':'Beach break exposé'
    ,'LIVE':'EN DIRECT'
    ,'Forecast estimate':'Estimation des prévisions'
    ,'Forecast data unavailable for this spot':'Données de prévisions indisponibles pour ce spot'
    ,'Checking waves':'Vagues en cours de vérification'
    ,'Checking wind':'Vent en cours de vérification'
    ,'Favourable':'Favorable'
    ,'Tide checking':'Marée en cours de vérification'
    ,'Match score':'Score de compatibilité'
    ,'AIN condition score':'Score des conditions AIN'
    ,'Tap the score to see why':'Appuie sur le score pour voir pourquoi'
    ,'GOOD MATCH':'BONNE COMPATIBILITÉ'
    ,'BEST AVAILABLE · CHECK FIT':'MEILLEUR CHOIX · VÉRIFIE LA COMPATIBILITÉ'
    ,'Open-Meteo ocean-current model':'Modèle de courant océanique Open-Meteo'
    ,'tide/wave estimate':'Estimation marée/vagues'
    ,'Beginner-friendly':'Adapté aux débutants'
    ,'Intermediate+':'Intermédiaire+'
    ,'Advanced only':'Réservé aux avancés'
    ,'Fits your':'Compatible avec ta'
    ,'Board mismatch:':'Board non adapté :'
    ,'Wave mismatch:':'Wave non adaptée :'
    ,'waves match your preference':'waves correspondant à ta préférence'
    ,'Your ':'Ton '
    ,'profile is better suited to smaller, calmer sessions':'profil correspond mieux à des sessions plus petites et plus calmes'
    ,'Conditions are ':'Les conditions sont '
    ,'for your ':'pour ton '
    ,'level today':'niveau aujourd’hui'
    ,'within your ':'dans ta limite '
    ,'above your ':'au-dessus de ta limite '
  };
  const translate=root=>{
    const walker=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT);
    const nodes=[]; while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{let value=node.nodeValue;Object.entries(replacements).forEach(([from,to])=>{value=value.split(from).join(to)});if(value!==node.nodeValue)node.nodeValue=value});
  };
  document.addEventListener('DOMContentLoaded',()=>{translate();new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===Node.TEXT_NODE)translate(node.parentElement);else if(node.nodeType===Node.ELEMENT_NODE)translate(node)}))).observe(document.body,{childList:true,subtree:true})});
})();
