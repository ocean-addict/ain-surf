window.AIN = window.AIN || {};

AIN.bestSnapshot = (spot,index,score,personalized=false) => {
  const marine=spot.forecast, weather=spot.weather, c=AIN.conditionAt(spot,index,marine,weather), time=marine.time[index], hour=c.hour;
  const [label,tone]=AIN.labelFor(score), windowStart=Math.max(6,hour-1), windowEnd=Math.min(21,hour+2);
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
    window:`${String(windowStart).padStart(2,'0')}:00–${String(windowEnd).padStart(2,'0')}:00`,
    personalized,
    forecast:marine,
    weather
  };
};

AIN.bestForDate = date => {
  let hasSavedProfile=false;
  try{hasSavedProfile=Boolean(localStorage.getItem('ain-profile'))}catch(error){}
  const personalized=hasSavedProfile?AIN.recommendationForDate?.(date):null;
  if(personalized?.spot)return AIN.bestSnapshot(personalized.spot,personalized.index,personalized.score,true);
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
  const date=dates[AIN.state.bestDay], best=AIN.bestForDate(date);
  if(!best){if(AIN.$('#best-note'))AIN.$('#best-note').innerHTML='<strong>Forecast temporarily unavailable.</strong>';return}
  const i=best.bestIndex, weather=best.weather, marine=best.forecast, code=weather.weather_code?.[i]??0, temperature=weather.temperature_2m?.[i]??0, water=marine.sea_surface_temperature?.[i];
  const formatter=new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',timeZone:'Africa/Casablanca'}), dayLabel=formatter.format(new Date(`${date}T12:00:00`));
  const slider=AIN.$('#best-day-slider'), sliderLabel=AIN.$('#best-day-label');
  if(slider){slider.max=String(dates.length-1);slider.value=String(AIN.state.bestDay)}
  if(sliderLabel)sliderLabel.textContent=dayLabel;
  const titleDate=dayLabel.toUpperCase();
  AIN.$('#best-eyebrow').innerHTML=`BEST PICK · ${titleDate} · <span id="data-status">${AIN.$('#data-status')?.textContent||'LIVE'}</span>`;
  AIN.$('#best-title').textContent=`${best.personalized?'Best pick for YOU':'Best conditions'} · ${best.name}`;
  const displayQuality=AIN.labelFor(best.score); AIN.$('#best-score').textContent=best.score;
  const scoreRing=AIN.$('.score-ring');
  if(scoreRing){scoreRing.style.setProperty('--score',best.score);scoreRing.style.setProperty('--ring-color',displayQuality[1]==='good'?'#27a47f':displayQuality[1]==='fun'?'#0b8a9a':displayQuality[1]==='poor'?'#c45d4d':'#c58b22')}
  AIN.$('#best-quality').textContent=displayQuality[0].toUpperCase(); AIN.$('#best-quality').className=`quality ${displayQuality[1]}`;
  AIN.$('#best-waves').textContent=best.wave; AIN.$('#best-swell').textContent=`${best.direction} · ${best.period}s`;
  const gust=Math.round(weather.wind_gusts_10m?.[i]??best.windSpeed);
  AIN.$('#best-wind').textContent=`${best.windSpeed} km/h`; AIN.$('#best-wind-detail').textContent=`${best.windDirection} · gusts ${gust} km/h · ${AIN.angleDiff(weather.wind_direction_10m?.[i]??0,best.windTarget)<70?'Offshore/cross-off':'Onshore/cross-on'}`;
  AIN.$('#best-tide').innerHTML=AIN.tideMarkup(best.tideState); AIN.$('#best-tide-height').textContent=Number.isFinite(best.tideHeight)?`${best.tideHeight.toFixed(2)} m`:'Model estimate';
  const windQuality=AIN.angleDiff(weather.wind_direction_10m?.[i]??0,best.windTarget)<70?'vent clean':'créneau avec vent plus léger';
  const reason=best.personalized
    ? `La taille des vagues correspond à ton profil, avec un ${windQuality} et une marée ${best.tideState.toLowerCase()}.`
    : `Meilleure combinaison modélisée de taille des vagues, houle, vent et marée.`;
  AIN.$('#best-window').textContent=best.window; AIN.$('#best-link').dataset.spot=best.id; AIN.$('#best-note').innerHTML=`<strong>${best.personalized?'Why this spot':'Why this spot'}</strong> ${reason} <details><summary>Local note</summary><span>${best.note}</span></details>`;
  AIN.$('#air-temp').textContent=`${Math.round(temperature)}°`; AIN.$('#water-temp').textContent=Number.isFinite(water)?`${Math.round(water)}°`:'--°'; AIN.$('#weather-text').textContent=AIN.weatherName(code); AIN.$('#weather-icon').textContent=AIN.weatherIcon(code);
};
