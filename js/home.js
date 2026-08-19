window.AIN = window.AIN || {};

AIN.bestSnapshot = (spot,index,score,personalized=false,windowOverride=null) => {
  const marine=spot.forecast, weather=spot.weather, c=AIN.conditionAt(spot,index,marine,weather), time=marine.time[index], hour=c.hour;
  const [label,tone]=AIN.labelFor(score), rolling=windowOverride||AIN.bestRollingWindow(AIN.hoursForDate(marine,time.slice(0,10)),itemIndex=>AIN.scoreHour(spot,itemIndex,marine,weather));
  return {
    ...spot,
    bestIndex:index,
    score:Math.round(score),
    label,
    tone,
    wave:`${(c.wave*.85).toFixed(1)} m – ${(c.wave*1.2).toFixed(1)} m`,
    period:Math.round(c.period),
    direction:AIN.compass(c.swellDirection),
    windSpeed:Math.round(c.windSpeed),
    windGust:Math.round(c.windGust),
    windDirection:AIN.compass(c.windDirection),
    wind:`${Math.round(c.windSpeed)} km/h ${AIN.compass(c.windDirection)}`,
    tideState:c.tideState,
    tideHeight:c.tideHeight,
    window:AIN.formatWindow(rolling),
    personalized,
    forecast:marine,
    weather
  };
};

AIN.bestForDate = date => {
  let hasSavedProfile=false;
  try{hasSavedProfile=Boolean(localStorage.getItem('ain-profile'))}catch(error){}
  const personalized=hasSavedProfile?AIN.recommendationForDate?.(date):null;
  if(personalized?.spot)return AIN.bestSnapshot(personalized.spot,personalized.index,personalized.score,true,personalized.window?{startHour:Number(personalized.window.slice(0,2)),endHour:Number(personalized.window.slice(6,8))}:null);
  const candidates=AIN.spots.flatMap(spot=>{
    if(!spot.forecast?.time||!spot.weather)return [];
    return spot.forecast.time.map((time,index)=>({spot,index,time,score:AIN.scoreHour(spot,index,spot.forecast,spot.weather)})).filter(item=>item.time.startsWith(date)&&Number(item.time.slice(11,13))>=6&&Number(item.time.slice(11,13))<=20);
  }).sort((a,b)=>b.score-a.score);
  const best=candidates[0];
  return best?AIN.bestSnapshot(best.spot,best.index,best.score,false):null;
};

AIN.renderBest = () => {
  const firstForecast=AIN.spots.find(spot=>spot.forecast?.time)?.forecast;
  if(!firstForecast){
    if(AIN.$('#best-note'))AIN.$('#best-note').innerHTML='<strong>Prévisions temporairement indisponibles.</strong> Aucune condition n’est affichée comme donnée en direct.';
    return;
  }
  const dates=[...new Set(firstForecast.time.map(time=>time.slice(0,10)))].slice(0,5);
  AIN.state.bestDay=AIN.clamp(AIN.state.bestDay||0,0,dates.length-1);
  let signedIn=false;
  try{signedIn=localStorage.getItem('ain-auth-state')==='signed-in'}catch(error){}
  const dayTabs=AIN.$('#best-day-tabs');
  const formatter=new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',timeZone:'Africa/Casablanca'}), dayLabelFor=value=>formatter.format(new Date(`${value}T12:00:00`));
  if(dayTabs)dayTabs.innerHTML=dates.map((item,index)=>`<button class="forecast-day-tab ${index===AIN.state.bestDay?'active':''}" data-forecast-day="${index}"><strong>${dayLabelFor(item)}</strong></button>`).join('');
  if(!signedIn){
    const title=AIN.$('#best-title'),card=AIN.$('.best-card'),note=AIN.$('#best-note'),link=AIN.$('#best-link');
    if(link)link.hidden=true;
    if(title)title.textContent='Personnalise ton forecast';
    if(card)card.innerHTML='<div class="guest-recommendation"><strong>Crée ton profil de SURFEUR</strong><p>Ajoute ton niveau, ta board et ta préférence de taille de vagues pour recevoir le spot recommandé pour toi.</p><a class="primary" href="profile.html#profile-form">Créer mon profil</a></div>';
    if(note)note.innerHTML='<strong>Recommandation personnalisée</strong> Connecte-toi pour voir le meilleur spot selon ton profil.';
    return;
  }
  const date=dates[AIN.state.bestDay], best=AIN.bestForDate(date);
  if(!best){if(AIN.$('#best-note'))AIN.$('#best-note').innerHTML='<strong>Forecast temporarily unavailable.</strong>';return}
  const i=best.bestIndex, weather=best.weather, marine=best.forecast, code=weather.weather_code?.[i]??0, temperature=weather.temperature_2m?.[i]??0, water=marine.sea_surface_temperature?.[i];
  if(AIN.$('#best-link'))AIN.$('#best-link').hidden=false;
  const dayLabel=dayLabelFor(date);
  AIN.$('#best-title').textContent=`${best.personalized?'Best pick for YOU':'Best conditions'} · ${best.name}`;
  AIN.$('#best-title').innerHTML=`${best.personalized?'Best pick for YOU':'Best conditions'} · <span class="best-title-spot">${best.name}</span>`;
  const displayQuality=AIN.labelFor(best.score); AIN.$('#best-score').textContent=best.score;
  const verdict=best.score>=82?'GO SURF':best.score>=68?'GOOD CONDITIONS':best.tideState==='Rising'?'WAIT FOR THE TIDE':best.windSpeed>22?'TOO WINDY':'CHECK CONDITIONS';
  if(AIN.$('#best-verdict'))AIN.$('#best-verdict').textContent=verdict;
  const scoreRing=AIN.$('.score-ring');
  if(scoreRing){scoreRing.style.setProperty('--score',best.score);scoreRing.style.setProperty('--ring-color',displayQuality[1]==='good'?'#27a47f':displayQuality[1]==='fun'?'#0b8a9a':displayQuality[1]==='poor'?'#c45d4d':'#c58b22')}
  AIN.$('#best-quality').textContent=displayQuality[0].toUpperCase(); AIN.$('#best-quality').className=`quality ${displayQuality[1]}`;
  AIN.$('#best-waves').textContent=best.wave; AIN.$('#best-swell').textContent=`Estimation houle · ${best.direction} · ${best.period}s`;
  const gust=Math.round(weather.wind_gusts_10m?.[i]??best.windSpeed);
  AIN.$('#best-wind').textContent=`${best.windSpeed} km/h`; AIN.$('#best-wind-detail').textContent=`${best.windDirection} · gusts ${gust} km/h · ${AIN.angleDiff(weather.wind_direction_10m?.[i]??0,best.windTarget)<70?'Offshore/cross-off':'Onshore/cross-on'}`;
  AIN.$('#best-tide').innerHTML=AIN.tideMarkup(best.tideState); AIN.$('#best-tide-height').textContent=Number.isFinite(best.tideHeight)?`${best.tideHeight.toFixed(2)} m`:'Model estimate';
  const windQuality=AIN.angleDiff(weather.wind_direction_10m?.[i]??0,best.windTarget)<70?'vent clean':'créneau avec vent plus léger';
  const reason=best.personalized
    ? `La taille des vagues correspond à ton profil, avec un ${windQuality} et une marée ${best.tideState.toLowerCase()}.`
    : `Meilleure combinaison modélisée de taille des vagues, houle, vent et marée.`;
  AIN.$('#best-window').textContent=best.window; AIN.$('#best-link').dataset.spot=best.id; AIN.$('#best-note').innerHTML=`<strong>${best.personalized?'Why this spot':'Why this spot'}</strong> ${reason} <details><summary>Local note</summary><span>${best.note}</span></details>`;
  const timeline=AIN.$('#best-timeline');
  if(timeline){
    const hours=AIN.hoursForDate(marine,date), values=hours.map(item=>AIN.scoreHour(best,item.index,marine,weather)), max=Math.max(...values,1);
    timeline.innerHTML=hours.map((item,index)=>`<span title="${String(item.hour).padStart(2,'0')}:00 · ${values[index]}/100" style="height:${Math.max(12,Math.round(values[index]/max*100))}%" class="${item.index===i?'peak':''}"></span>`).join('');
  }
  AIN.$('#air-temp').textContent=`${Math.round(temperature)}°`; AIN.$('#water-temp').textContent=Number.isFinite(water)?`${Math.round(water)}°`:'--°'; AIN.$('#weather-text').textContent=AIN.weatherName(code); AIN.$('#weather-icon').textContent=AIN.weatherIcon(code);
};
