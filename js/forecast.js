AIN.renderForecastTable = () => {
  if(!AIN.spots[0].forecast){
    const container=AIN.$('#five-day');
    if(container)container.innerHTML='<div class="forecast-error">Forecast temporarily unavailable. Please try again shortly.</div>';
    return;
  }
  const dates=[...new Set(AIN.spots[0].forecast.time.map(time=>time.slice(0,10)))].slice(0,5);
  AIN.state.forecastDay=AIN.clamp(AIN.state.forecastDay,0,dates.length-1);
  const activeDate=dates[AIN.state.forecastDay], formatter=new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',timeZone:'Africa/Casablanca'});
  const dayLabel=date=>formatter.format(new Date(`${date}T12:00:00`)); let dayBest=null;
  AIN.spots.forEach(spot=>spot.forecast?.time?.forEach((time,index)=>{const hour=Number(time.slice(11,13));if(time.startsWith(activeDate)&&[6,10,14,18].includes(hour)){const score=AIN.scoreHour(spot,index,spot.forecast,spot.weather);if(!dayBest||score>dayBest.score)dayBest={spot,index,score}}}));
  if(!dayBest){
    const container=AIN.$('#five-day');
    if(container)container.innerHTML='<div class="forecast-error">Forecast temporarily unavailable for this date.</div>';
    return;
  }
  if(!AIN.state.forecastSpotId)AIN.state.forecastSpotId=dayBest.spot.id;
  const spot=AIN.spots.find(item=>item.id===AIN.state.forecastSpotId)||dayBest.spot;
  const heading=AIN.$('#forecast-heading-date');
  if(heading)heading.textContent=`SURF WEATHER · ${spot.name.toUpperCase()} · ${dayLabel(activeDate).toUpperCase()}`;
  AIN.scoreRows={};
  const headline=AIN.$('#forecast-headline'),subtitle=AIN.$('#forecast-subtitle');
  if(headline){const count=dayBest.score>=88?5:dayBest.score>=76?4:dayBest.score>=62?3:dayBest.score>=48?2:1;headline.innerHTML=`Best surf today: ${dayBest.spot.name} <span class="best-stars">${'★'.repeat(count)}${'☆'.repeat(5-count)}</span>`}
  if(subtitle)subtitle.textContent=`${dayBest.spot.wave} · ${dayBest.spot.wind} · Créneau idéal ${dayBest.spot.window}`;
  const rows=[6,10,14,18].map(hour=>{
    const index=spot.forecast.time.findIndex(time=>time.startsWith(activeDate)&&Number(time.slice(11,13))===hour);
    if(index<0)return '';
    const modelWave=spot.forecast.wave_height?.[index]??spot.forecast.swell_wave_height?.[index]??0;
    const score=AIN.scoreHour(spot,index,spot.forecast,spot.weather),quality=AIN.labelFor(score),starCount=score>=88?5:score>=76?4:score>=62?3:score>=48?2:score>=28?1:0;
    const stars=Array.from({length:5},(_,star)=>`<span class="forecast-star ${star<starCount?'filled':''}">${star<starCount?'★':'☆'}</span>`).join('');
    const specializedTide=AIN.tideAt(activeDate,hour),tide=specializedTide?.state||AIN.tideState(spot.forecast.sea_level_height_msl,index),tideHeight=specializedTide?.height??spot.forecast.sea_level_height_msl[index];
    const gust=Math.round(spot.weather.wind_gusts_10m?.[index]??spot.weather.wind_speed_10m[index]);
    AIN.scoreRows[hour]={spot,index,score};
    const swellHeight=spot.forecast.swell_wave_height?.[index]??0, swellPeriod=spot.forecast.swell_wave_period?.[index]??0, swellDirection=spot.forecast.swell_wave_direction?.[index]??0, windSpeed=spot.weather.wind_speed_10m?.[index]??0, windDirection=spot.weather.wind_direction_10m?.[index]??0, weatherCode=spot.weather.weather_code?.[index]??0, temperature=spot.weather.temperature_2m?.[index]??0;
    return `<tr class="forecast-row" data-score-row="${hour}" title="Click to see score details"><td class="time-cell">${String(hour).padStart(2,'0')}:00</td><td><div class="star-rating" title="${score}/100 · ${quality[0]}">${stars}</div></td><td><strong class="wave-value"><span class="metric-icon">≈</span><b>${(modelWave*.85).toFixed(1)}</b><small>m</small><i>–</i><b>${(modelWave*1.2).toFixed(1)}</b><small>m</small></strong></td><td><strong><span class="metric-icon">〰</span>${swellHeight.toFixed(1)} m</strong><span>${Math.round(swellPeriod)}s · ${AIN.compass(swellDirection)}</span></td><td class="wind-cell"><strong><span class="metric-icon">↘</span>${Math.round(windSpeed)}</strong><span>km/h · ${AIN.compass(windDirection)}</span><em>Gusts ${gust} km/h</em></td><td>${AIN.tideMarkup(tide)}<span>${tideHeight.toFixed(2)} m</span></td><td><strong class="weather-cell">${AIN.weatherIcon(weatherCode)} ${Math.round(temperature)}°</strong><span>${AIN.weatherName(weatherCode)}</span></td></tr>`;
  }).join('');
  const tabs=dates.map((date,index)=>`<button class="forecast-day-tab ${index===AIN.state.forecastDay?'active':''}" data-forecast-day="${index}"><strong>${dayLabel(date)}</strong></button>`).join('');
  const options=AIN.spots.map(item=>`<option value="${item.id}" ${item.id===spot.id?'selected':''}>${item.id===dayBest.spot.id?'★ ':''}${item.name}${item.id===dayBest.spot.id?' (Best)':''}</option>`).join('');
  const marker=spot.id===dayBest.spot.id?'<span class="best-marker">★ <b>(Best)</b></span>':'';
  const localTidePoints=AIN.tidePointsForDay?.(activeDate)||[];
  const tidePoints=localTidePoints.length?localTidePoints:spot.forecast.time.map((time,index)=>({time,hour:Number(time.slice(11,13)),value:spot.forecast.sea_level_height_msl[index]})).filter(point=>point.time.startsWith(activeDate)&&Number.isFinite(point.value));
  const turns=tidePoints.map((point,index,list)=>{
    if(index===0||index===list.length-1)return null;
    if(point.value<=list[index-1].value&&point.value<=list[index+1].value&&(point.value<list[index-1].value||point.value<list[index+1].value))return {...point,type:'low'};
    if(point.value>=list[index-1].value&&point.value>=list[index+1].value&&(point.value>list[index-1].value||point.value>list[index+1].value))return {...point,type:'high'};
    return null;
  }).filter(Boolean);
  const apiExtremes=AIN.tides?.extremes?.filter(item=>item.date?.startsWith(activeDate))||[];
  const lows=apiExtremes.length?apiExtremes.filter(item=>item.type==='Low').map(item=>({hour:Number(item.date.slice(11,13))+Number(item.date.slice(14,16))/60,time:item.date})):turns.filter(point=>point.type==='low').slice(0,2);
  const highs=apiExtremes.length?apiExtremes.filter(item=>item.type==='High').map(item=>({hour:Number(item.date.slice(11,13))+Number(item.date.slice(14,16))/60,time:item.date})):turns.filter(point=>point.type==='high').slice(0,2);
  const times=list=>list.length?list.map(point=>point.time?.slice(11,16)||`${String(Math.floor(point.hour)).padStart(2,'0')}:00`).join(' · '):'Data unavailable';
  const tideSource=AIN.tides?'Modèle harmonique de Casablanca':'Approximation Open-Meteo';
  AIN.$('#five-day').innerHTML=`<div class="forecast-day-tabs">${tabs}</div><div class="table-summary"><label for="forecast-spot">SPOT</label><div class="forecast-spot-picker"><select id="forecast-spot">${options}</select></div>${marker}<span class="selected-date">${dayLabel(activeDate)}</span></div><div class="forecast-table-scroll"><table class="forecast-table"><thead><tr><th>Heure</th><th>Qualité</th><th>Vagues estimées</th><th>Houle offshore</th><th>Vent <small>MOYEN + RAFALES</small></th><th>Marée</th><th>Météo</th></tr></thead><tbody>${rows}</tbody></table></div><div id="score-breakdown" class="score-breakdown" hidden></div><section class="tide-chart"><div class="tide-chart-head"><div><small>MARÉE BASSE</small><strong>${times(lows)}</strong></div><div><small>MARÉE HAUTE</small><strong>${times(highs)}</strong></div><div><small>SOURCE</small><strong>${tideSource}</strong></div></div><div class="tide-canvas-wrap"><canvas id="tide-canvas" aria-label="Courbe de marée pour ${dayLabel(activeDate)}"></canvas></div><p class="tide-disclaimer">${AIN.tides?'Calcul local basé sur les prédictions harmoniques de Casablanca. Les horaires sont convertis en heure locale du Maroc.':'Calendrier des marées indisponible ; une estimation temporaire est affichée.'}</p></section>`;
  requestAnimationFrame(()=>AIN.drawTideChart(tidePoints,activeDate));
};

AIN.showScoreBreakdown = hour => {
  const row=AIN.scoreRows?.[hour],panel=AIN.$('#score-breakdown');
  if(!row||!panel)return;
  const parts=AIN.scoreBreakdown(row.spot,row.index,row.spot.forecast,row.spot.weather);
  panel.hidden=false;
  panel.innerHTML=`<strong>Score modèle AIN : ${parts.total}/100</strong><span>Hauteur des vagues <b>+${parts.wave}</b></span><span>Vent et rafales <b>+${parts.wind}</b></span><span>Direction et période de la houle <b>+${parts.swell}</b></span><span>Marée <b>+${parts.tide}</b></span><span>Courant <b>+${parts.current}</b> <small>(${parts.conditions.currentSource})</small></span><span>Niveau requis <b>${parts.conditions.skillLabel}</b></span>`;
};

AIN.drawTideChart = (points,date) => {
  const canvas=AIN.$('#tide-canvas'); if(!canvas||!points.length)return;
  const ratio=window.devicePixelRatio||1,width=Math.max(650,canvas.parentElement.clientWidth),height=150;
  canvas.width=width*ratio;canvas.height=height*ratio;canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
  const context=canvas.getContext('2d');context.scale(ratio,ratio);
  const left=18,right=18,top=14,bottom=28,plotWidth=width-left-right,plotHeight=height-top-bottom;
  const values=points.map(point=>point.value),minimum=Math.min(...values),maximum=Math.max(...values),range=maximum-minimum||1;
  const x=hour=>left+(hour/24)*plotWidth,y=value=>top+(maximum-value)/range*plotHeight;
  context.strokeStyle='#c5d4d1';context.lineWidth=1;context.fillStyle='#60787b';context.font='600 9px Montserrat, Arial';context.textAlign='center';
  [0,3,6,9,12,15,18,21,23].forEach(hour=>{const position=x(hour);context.beginPath();context.moveTo(position,top);context.lineTo(position,top+plotHeight);context.stroke();context.fillText(`${String(hour).padStart(2,'0')}:00`,position,height-8)});
  const gradient=context.createLinearGradient(0,top,0,top+plotHeight);gradient.addColorStop(0,'rgba(60,174,201,.85)');gradient.addColorStop(1,'rgba(11,111,121,.72)');
  context.beginPath();context.moveTo(x(points[0].hour),top+plotHeight);points.forEach(point=>context.lineTo(x(point.hour),y(point.value)));context.lineTo(x(points.at(-1).hour),top+plotHeight);context.closePath();context.fillStyle=gradient;context.fill();
  context.beginPath();points.forEach((point,index)=>index?context.lineTo(x(point.hour),y(point.value)):context.moveTo(x(point.hour),y(point.value)));context.strokeStyle='#2d9fba';context.lineWidth=2;context.stroke();
  const dayExtremes=(AIN.tides?.extremes||[]).filter(item=>item.date.startsWith(date));
  dayExtremes.forEach(item=>{const hour=Number(item.date.slice(11,13))+Number(item.date.slice(14,16))/60,positionX=x(hour),positionY=y(item.height);context.beginPath();context.arc(positionX,positionY,4,0,Math.PI*2);context.fillStyle='#fff';context.fill();context.strokeStyle='#087681';context.lineWidth=2;context.stroke();context.fillStyle='#073d46';context.font='700 9px Montserrat, Arial';context.fillText(`${item.type.toUpperCase()} ${item.date.slice(11,16)}`,positionX,item.type==='High'?Math.max(11,positionY-9):Math.min(height-31,positionY+16))});
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Casablanca'}).format(new Date());
  if(date===today){const hour=Number(new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hour12:false,timeZone:'Africa/Casablanca'}).format(new Date()));const position=x(AIN.clamp(hour,0,23));context.beginPath();context.moveTo(position,top);context.lineTo(position,top+plotHeight);context.strokeStyle='#e27945';context.lineWidth=2;context.stroke();context.fillStyle='#e27945';context.fillText('NOW',position,11)}
};
