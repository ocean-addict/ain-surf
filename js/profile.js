window.AIN = window.AIN || {};

AIN.wavePreferenceRange=value=>({'Glide: knee to waist':[.3,.8],'Waist to chest':[.6,1.2],'Chest to head-high':[.9,1.6],'Head-high to overhead':[1.3,2.1],'Overhead and bigger':[1.8,99]}[value]||[.6,1.2]);

AIN.boardFit=(type,size,wave)=>{
  const ranges={'Foam board':[.25,1.2],'Longboard':[.25,1.4],'Funboard / Malibu':[.4,1.6],Fish:[.8,1.8],'Mid-length':[.6,2],Shortboard:[.9,2.3],Gun:[1.6,99]};
  let range=ranges[type]||[.4,1.8];
  if(size==='Under 6ft')range=[Math.max(range[0],.8),range[1]];
  if(size==='Over 8ft6')range=[range[0],Math.min(range[1],1.5)];
  return wave>=range[0]&&wave<=range[1];
};
AIN.profilePreferences=()=>{
  let saved={};
  try{saved=JSON.parse(localStorage.getItem('ain-profile')||'{}')}catch(error){saved={}}
  const value=(selector,key,fallback)=>AIN.$(selector)?.value||saved[key]||fallback;
  return {
    level:value('#level','surf_level','Beginner'),
    boardType:value('#board','board_type','Foam board'),
    boardSize:value('#board-size','board_size','6ft to 6ft6'),
    waveSize:value('#wave-size','wave_size','Waist to chest'),
    currentComfort:value('#current-comfort','current_comfort','Cautious'),
    frequency:value('#surf-frequency','surf_frequency','Occasionally')
  };
};

AIN.recommendationForDate=(date)=>{
  const preferences=AIN.profilePreferences(), level=preferences.level, userRank=AIN.levelRank(level), [preferredLow,preferredHigh]=AIN.wavePreferenceRange(preferences.waveSize), currentLimit=AIN.currentComfortLimit(preferences.currentComfort);
  const scored=AIN.spots.map(spot=>{
    if(!spot.forecast?.time||!spot.weather)return null;
    const hours=spot.forecast.time.map((time,index)=>({time,index,hour:Number(time.slice(11,13))})).filter(item=>item.time.startsWith(date)&&item.hour>=6&&item.hour<=20);
    if(!hours.length)return null;
    const best=hours.map(item=>({...item,score:AIN.scoreHour(spot,item.index,spot.forecast,spot.weather)})).sort((a,b)=>b.score-a.score)[0];
    const c=AIN.conditionAt(spot,best.index,spot.forecast,spot.weather), wave=c.wave;
    const waveMatch=wave>=preferredLow&&wave<=preferredHigh, boardMatch=AIN.boardFit(preferences.boardType,preferences.boardSize,wave), levelMatch=c.conditionRank<=userRank, currentMatch=c.currentSpeed<=currentLimit, frequencyMatch=preferences.frequency!=='First sessions'||c.conditionRank===1;
    const distance=wave<preferredLow?preferredLow-wave:wave>preferredHigh?wave-preferredHigh:0, waveFit=waveMatch?1:AIN.clamp(1-distance/1.2,0,1);
    const fitScore=AIN.clamp(best.score*.55+waveFit*20+(boardMatch?15:0)+(levelMatch?10:0)+(currentMatch?10:0)+(frequencyMatch?5:-15),0,100);
    return {spot,c,wave,waveMatch,boardMatch,levelMatch,currentMatch,frequencyMatch,fitScore,distance,index:best.index,score:Math.round(fitScore),preferences};
  }).filter(Boolean);
  if(!scored.length)return null;
  const safe=scored.filter(item=>item.levelMatch&&item.currentMatch&&item.frequencyMatch), pool=safe.length?safe:scored;
  return pool.sort((a,b)=>b.fitScore-a.fitScore||a.distance-b.distance)[0];
};

AIN.renderProfile=()=>{
  const preferences=AIN.profilePreferences(), level=preferences.level,boardType=preferences.boardType,boardSize=preferences.boardSize,waveSize=preferences.waveSize,currentComfort=preferences.currentComfort,frequency=preferences.frequency,board=boardSize?`${boardType} (${boardSize})`:boardType, userRank=AIN.levelRank(level), currentLimit=AIN.currentComfortLimit(currentComfort), [preferredLow,preferredHigh]=AIN.wavePreferenceRange(waveSize);
  const scored=AIN.spots.map(spot=>{
    const hasForecast=spot.forecast&&Number.isInteger(spot.bestIndex), c=hasForecast?AIN.conditionAt(spot,spot.bestIndex,spot.forecast,spot.weather):null, wave=c?.wave??null;
    const waveMatch=wave===null||wave>=preferredLow&&wave<=preferredHigh, boardMatch=wave===null||AIN.boardFit(boardType,boardSize,wave), levelMatch=!c||c.conditionRank<=userRank, currentMatch=!c||c.currentSpeed<=currentLimit, frequencyMatch=!c||frequency!=='First sessions'||c.conditionRank===1;
    const distance=wave===null?0:wave<preferredLow?preferredLow-wave:wave>preferredHigh?wave-preferredHigh:0;
    const waveFit=wave===null ? .5 : waveMatch ? 1 : AIN.clamp(1-distance/1.2,0,1);
    const fitScore=hasForecast?AIN.clamp(spot.score*.55+waveFit*20+(boardMatch?15:0)+(levelMatch?10:0)+(currentMatch?10:0)+(frequencyMatch?5:-15),0,100):0;
    return {spot,c,wave,waveMatch,boardMatch,levelMatch,currentMatch,frequencyMatch,fitScore,distance};
  });
  // Prefer conditions that are safe for the surfer; only then use the score.
  const safe=scored.filter(item=>item.levelMatch&&item.currentMatch&&item.frequencyMatch), pool=safe.length?safe:scored;
  pool.sort((a,b)=>b.fitScore-a.fitScore||a.distance-b.distance);
  const selected=pool[0]||{spot:AIN.spots[0],wave:null,waveMatch:false,boardMatch:false,levelMatch:false,currentMatch:false,frequencyMatch:false,fitScore:0}, spot=selected.spot, score=spot.forecast?Math.round(selected.fitScore):0, count=score>=88?5:score>=76?4:score>=62?3:score>=48?2:0;
  AIN.lastRecommendation={...selected,score,preferences};
  const stars='★'.repeat(count)+'☆'.repeat(5-count), breakdown=spot.forecast&&Number.isInteger(spot.bestIndex)?AIN.scoreBreakdown(spot,spot.bestIndex,spot.forecast,spot.weather):null, waveText=spot.wave==='--'?'Checking waves':spot.wave, windText=spot.wind==='--'?'Checking wind':spot.wind, match=selected.waveMatch&&selected.boardMatch&&selected.levelMatch&&selected.currentMatch&&selected.frequencyMatch;
  const wavePreference=waveSize.replace('Glide: ','');
  const waveBullet=selected.wave===null?`Waiting for live wave data (${wavePreference})`:selected.waveMatch?`${wavePreference} waves match your preference`:`Wave mismatch: ${selected.wave.toFixed(1)} m now; you asked for ${wavePreference}`;
  const boardBullet=selected.boardMatch?`Fits your ${board}`:`Board mismatch: ${board} is not ideal for ${selected.wave?.toFixed(1)||'these'} m waves`;
  const levelBullet=!selected.frequencyMatch?`Your ${frequency.toLowerCase()} profile is better suited to smaller, calmer sessions`:selected.levelMatch?`${selected.c?.skillLabel||'Conditions'} for your ${level} level`:`Conditions are ${selected.c?.skillLabel?.toLowerCase()||'above'} your ${level} level today`;
  const currentLabel=selected.c ? AIN.currentLabel(selected.c.currentSpeed) : 'Current indisponible';
  const currentBullet=selected.currentMatch?`${currentLabel} · within your ${currentComfort.toLowerCase()} limit`:`${currentLabel} · above your ${currentComfort.toLowerCase()} limit`;
  const call=AIN.$('#your-call');if(!call)return;
  call.innerHTML=`<div class="recommendation-score"><button class="score-button" data-profile-score type="button" aria-label="Show match score breakdown"><strong>${score||'--'}</strong><span>Match score · /100</span></button><div><div class="recommendation-stars">${stars}</div><b>${match?'GOOD MATCH':'BEST AVAILABLE · CHECK FIT'}</b><small>Tap the score to see why</small></div></div><h2>${spot.name}</h2><div class="recommendation-window"><span>BEST</span>${spot.window}</div><div class="recommendation-details"><span><i class="text-icon">≈</i><b>${waveText}</b></span><span><i class="text-icon">↘</i><b>${windText}</b></span><span><i class="text-icon">↗</i><b>${spot.tideState||'Tide checking'}</b></span></div><ul class="recommendation-checklist"><li class="${selected.boardMatch?'':'warning'}">${boardBullet}</li><li>${spot.windDirection||'Favourable'} wind · gusts ${spot.windGust??'--'} km/h</li><li class="${selected.waveMatch?'':'warning'}">${waveBullet}</li><li class="${selected.levelMatch&&selected.frequencyMatch?'':'warning'}">${levelBullet}</li><li class="${selected.currentMatch?'':'warning'}">${currentBullet} <small>(${selected.c?.currentSource||'forecast estimate'})</small></li></ul>${breakdown?`<div class="profile-score-data" data-profile-score-panel hidden><strong>Match score · ${score}/100</strong><span>AIN condition score <b>${breakdown.total}</b></span><span>Wave height <b>${breakdown.wave}</b></span><span>Wind & gusts <b>${breakdown.wind}</b></span><span>Swell direction & period <b>${breakdown.swell}</b></span><span>Tide <b>${breakdown.tide}</b></span><span>Current <b>${breakdown.current}</b></span></div>`:''}`;
};

AIN.showProfileScore=()=>{const panel=AIN.$('[data-profile-score-panel]');if(panel)panel.hidden=!panel.hidden};
