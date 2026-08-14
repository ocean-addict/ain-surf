AIN.$ = selector => document.querySelector(selector);
AIN.clamp = (value,min,max) => Math.max(min,Math.min(max,value));
AIN.angleDiff = (a,b) => Math.abs(((a-b+540)%360)-180);
AIN.compass = degrees => ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round(degrees/22.5)%16];
AIN.labelFor = score => score>=85?['Excellent','good']:score>=72?['Bon','good']:score>=58?['Sympa','fun']:score>=42?['Correct','okay']:['Faible','poor'];
AIN.weatherName = code => code===0?'Ciel dégagé':code<=3?'Partiellement nuageux':code<=48?'Brume':code<=67?'Pluie':code<=82?'Averses':'Orageux';
AIN.weatherIcon = code => code===0?'☀︎':code<=3?'◐':code<=67?'≋':'☁︎';
AIN.tideState = (levels,index) => !Number.isFinite(levels[index])?'Indisponible':(levels[Math.min(index+1,levels.length-1)]-levels[Math.max(0,index-1)]>.04?'Rising':levels[Math.min(index+1,levels.length-1)]-levels[Math.max(0,index-1)]<-.04?'Falling':'Near turn');
AIN.tideMarkup = state => {
  const type=state==='Rising'?'rising':state==='Falling'?'falling':'steady';
  const arrow=type==='rising'?'↗︎':type==='falling'?'↘︎':'→︎';
  const label=state==='Rising'?'Montante':state==='Falling'?'Descendante':state==='Near turn'?'À l’étale':'Indisponible';
  return `<span class="tide-trend ${type}"><i>${arrow}</i><span class="tide-label">${label}</span></span>`;
};
