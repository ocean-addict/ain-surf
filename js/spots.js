window.AIN = window.AIN || {};

AIN.spotCard = spot => `
  <button class="spot-card open-spot" data-spot="${spot.id}">
    <div class="spot-top">
      <span class="quality ${spot.tone}">${spot.label.toUpperCase()}</span>
      <strong>${spot.score || '--'}</strong>
    </div>
    <h3>${spot.name}</h3>
    <p>${spot.area}</p>
    <div class="spot-bottom">
      <span><small>WAVES</small>${spot.wave}</span>
      <span><small>BEST</small>${spot.window === '--' ? '--' : spot.window.split('–')[0]}</span>
      <b>→</b>
    </div>
  </button>`;

AIN.metric = (label,value,detail) => `
  <div class="metric">
    <small>${label}</small>
    <b>${value}</b>
    <span>${detail}</span>
  </div>`;

AIN.spotDetail = spot => {
  const marine = spot.forecast;
  const start = spot.bestIndex ?? 0;
  const gust = spot.weather
    ? Math.round(spot.weather.wind_gusts_10m?.[start] ?? spot.windSpeed)
    : '--';
  const bestDate = marine?.time?.[start]?.slice(0,10);
  const bestHour = Number(marine?.time?.[start]?.slice(11,13));
  const breakdown = marine && spot.weather && Number.isInteger(start) ? AIN.scoreBreakdown(spot,start,marine,spot.weather) : null;
  const specializedTide = bestDate ? AIN.tideAt(bestDate,bestHour) : null;
  const displayedTide = specializedTide || {
    state: spot.tideState,
    height: Number.parseFloat(spot.tide?.split('·')[1])
  };
  const bars = marine
    ? marine.time.filter(time=>time.slice(0,10)===bestDate && Number(time.slice(11,13))%2===0).map(time => {
        const index=marine.time.indexOf(time), value = (marine.wave_height[index] ?? marine.swell_wave_height?.[index] ?? 0) * spot.power;
        return `<div class="bar-col"><div class="bar" style="height:${Math.min(100,value/2*100)}%"><span>${value.toFixed(1)}m</span></div><small>${time.slice(11,16)}</small></div>`;
      }).join('')
    : '<p>Waiting for live data…</p>';
  const current = Number.isFinite(spot.currentSpeed)
    ? `${spot.currentSpeed.toFixed(2)} km/h`
    : '--';
  const currentSource = spot.currentSource || 'Estimation des prévisions';
  const suitability = spot.skillLabel || spot.level;
  const tideSource = AIN.tides ? 'Modèle harmonique de Casablanca' : 'Approximation Open-Meteo';

  return `
    <div class="detail-head">
      <div>
        <span class="quality ${spot.tone}">${spot.label.toUpperCase()}</span>
        <h2>${spot.name}</h2>
        <p>${spot.area}</p>
      </div>
      <div class="big-score">${spot.score || '--'}<small>/100</small></div>
    </div>
    <div class="detail-metrics">
      ${AIN.metric('Waves',spot.wave,`${spot.direction} · ${spot.period || '--'}s`)}
      ${AIN.metric('Tide modélisée',AIN.tideMarkup(displayedTide.state),`${Number.isFinite(displayedTide.height) ? displayedTide.height.toFixed(2)+' m' : 'Estimation du modèle'} · ${tideSource}`)}
      ${AIN.metric('Wind · moyen',spot.wind,`Rafales ${gust} km/h · sur le meilleur créneau`)}
      ${AIN.metric('Courant',current,currentSource)}
      ${AIN.metric('Meilleur créneau',spot.window,'Aujourd’hui')}
    </div>
    <div class="chart">
      <div class="chart-title"><b>Évolution des vagues sur la journée</b><span>Hauteur de wave modélisée · toute la journée · échelle 0–2 m</span></div>
      <div class="chart-plot">
        <div class="y-axis"><span>2.0 m</span><span>1.5 m</span><span>1.0 m</span><span>0.5 m</span><span>0 m</span></div>
        <div class="plot-area"><div class="grid-lines"><i></i><i></i><i></i><i></i><i></i></div><div class="bars">${bars}</div></div>
      </div>
    </div>
    <div class="knowledge">
      <div><small>WAVE TYPE</small><b>${spot.type}</b></div>
      <div><small>TODAY'S SUITABILITY</small><b>${suitability}</b></div>
      <div><small>USUAL CROWD</small><b>${spot.crowd}</b></div>
      <div><small>DANGER BASELINE</small><b>${spot.danger}</b></div>
    </div>
    <div class="local-note large"><span>⌁</span><p><strong>Note locale</strong>${spot.note}</p></div>
    <section class="spot-why"><span class="eyebrow">DÉCISION AIN</span><h3>Pourquoi ce spot aujourd’hui&nbsp;?</h3><ul class="why-list">${breakdown ? `<li class="${breakdown.conditions.windSpeed <= 15 ? 'positive' : 'caution'}">${breakdown.conditions.windSpeed <= 15 ? '✓ Vent léger' : '△ Vent à surveiller'} · ${Math.round(breakdown.conditions.windSpeed)} km/h, rafales ${gust} km/h</li><li class="${breakdown.conditions.period >= 8 ? 'positive' : 'caution'}">${breakdown.conditions.period >= 8 ? '✓ Période suffisante' : '△ Période courte'} · ${Math.round(breakdown.conditions.period)}s</li><li class="${breakdown.wave >= 20 ? 'positive' : 'caution'}">${breakdown.wave >= 20 ? '✓ Taille cohérente' : '△ Taille moins adaptée'} · ${spot.wave}</li><li class="${breakdown.conditions.currentSpeed <= (spot.currentTolerance || .35) ? 'positive' : 'caution'}">${breakdown.conditions.currentSpeed <= (spot.currentTolerance || .35) ? '✓ Courant dans la limite du spot' : '△ Courant à surveiller'} · ${breakdown.conditions.currentSource}</li>` : '<li>Analyse en cours dès que les prévisions sont disponibles.</li>'}</ul></section>
    <section class="spot-guide"><span class="eyebrow">GUIDE DU SPOT</span><h3>À propos de ${spot.name}</h3><div class="spot-guide-grid"><div><small>TYPE DE VAGUE</small><b>${spot.type}</b></div><div><small>MEILLEURES CONDITIONS</small><b>Houle ${spot.direction || 'favorable'} · marée ${spot.tideState || 'à vérifier'}</b></div><div><small>NIVEAU</small><b>${spot.level}</b></div><div><small>À SAVOIR</small><b>${spot.crowd} · danger de base ${spot.danger}</b></div></div><div class="who-spot"><h3>Pour qui&nbsp;?</h3><p><strong>Débutant</strong> · ${spot.conditionRank === 1 ? 'Possible dans les conditions actuelles, avec prudence.' : 'À privilégier seulement si les vagues, le vent et le courant restent calmes.'}</p><p><strong>Intermédiaire</strong> · Spot généralement exploitable quand les conditions restent propres.</p><p><strong>Avancé</strong> · Le niveau requis augmente avec la taille, le shorebreak et le courant.</p></div></section>
    ${spot.localSchool ? `<section class="local-school" aria-labelledby="school-title"><span class="eyebrow">À ANFAPLACE</span><h3 id="school-title">Envie d’apprendre à surfer&nbsp;?</h3><strong>${spot.localSchool.name}</strong><p>${spot.localSchool.description}</p><div class="school-highlights"><span>${spot.localSchool.courses}</span><span>${spot.localSchool.rental}</span><span>${spot.localSchool.languages}</span></div><div class="school-details"><b>${spot.localSchool.prices}</b><span>${spot.localSchool.flexible}</span><span>${spot.localSchool.booking}</span><span>${spot.localSchool.pack}</span></div><div class="school-location"><div class="location-pin">⌖</div><div><b>3 Shari’ Al-Kourneesh</b><span>Casablanca, Casablanca-Settat</span></div></div><div class="school-actions"><a class="school-cta" data-partner="anfa-surf-school" href="https://wa.me/${spot.localSchool.whatsapp}?text=Bonjour%20Anfa%20Surf%20School%2C%20je%20viens%20de%20AIN%20et%20je%20voudrais%20conna%C3%AEtre%20les%20disponibilit%C3%A9s%20pour%20un%20cours%20%C3%A0%20Anfaplace." target="_blank" rel="noopener">Écrire sur WhatsApp</a><a class="school-phone" data-partner="anfa-surf-school" href="tel:${spot.localSchool.phone}">Appeler · ${spot.localSchool.phone}</a><a class="school-map" data-partner="anfa-surf-school" href="${spot.localSchool.mapsUrl}" target="_blank" rel="noopener">Itinéraire Google Maps</a><a class="school-map" data-partner="anfa-surf-school" href="${spot.localSchool.wazeUrl}" target="_blank" rel="noopener">Ouvrir dans Waze</a></div><small>${spot.localSchool.location} · Informations indépendantes du score AIN.</small></section>` : ''}`;
};

AIN.renderSpots = () => {
  const selected = AIN.spots.find(spot => spot.id === AIN.state.selectedSpotId) || AIN.spots[0];
  const date=AIN.spots.find(spot=>spot.forecast?.time)?.forecast?.time?.[0]?.slice(0,10);
  const recommendation=date&&AIN.recommendationForDate?.(date);
  const recommendedId=recommendation?.spot?.id||null;
  const homeSpots = AIN.$('#home-spots');
  if(homeSpots) homeSpots.innerHTML = AIN.spots.map(AIN.spotCard).join('');
  AIN.$('#spot-tabs').innerHTML = AIN.spots.map(spot => `
    <button data-select-spot="${spot.id}" class="spot-compare-card ${spot.id === selected.id ? 'selected' : ''} ${spot.id === recommendedId ? 'recommended' : ''} ${spot.id === 'pepsi' ? 'school-spot-card' : ''}">
      <span class="spot-tab-name">${spot.name}</span>${spot.id==='pepsi'?'<span class="spot-school-badge">★ Club surf</span>':''}${spot.id===recommendedId?'<span class="spot-for-you">Pour toi</span>':''}
      <span class="spot-tab-score"><b>${spot.forecast ? spot.score : '--'}</b><small>/100</small></span>
      <span class="spot-compare-quality">${spot.label}</span>
      <span class="spot-compare-meta">${spot.wave} · ${spot.window === '--' ? '--' : spot.window}</span>
    </button>`).join('');
  AIN.$('#spot-detail').innerHTML = AIN.spotDetail(selected);
  const school=AIN.$('#spot-detail .local-school'), schoolData=selected.localSchool;
  if(school&&schoolData?.coordinates){
    school.querySelector('.school-location')?.remove();
    const photo=document.createElement('img');
    photo.className='school-photo';
    photo.src='images/anfa-surf-school-rip.jpg';
    photo.alt='Anfa Surf School à Anfaplace';
    photo.loading='lazy';
    const preview=document.createElement('div');
    preview.className='school-map-preview';
    preview.innerHTML=`<iframe src="https://www.google.com/maps?q=${schoolData.coordinates}&z=16&output=embed" loading="lazy" title="Localisation de ${schoolData.name}" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    const visuals=document.createElement('div');
    visuals.className='school-visuals';
    visuals.append(photo,preview);
    school.querySelector('.school-actions')?.before(visuals);
    const chart=AIN.$('#spot-detail .chart');
    if(chart)chart.before(school);
  }
};
