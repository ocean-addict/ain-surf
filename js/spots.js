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
    <div class="local-note large"><span>⌁</span><p><strong>Note locale</strong>${spot.note}</p></div>`;
};

AIN.renderSpots = () => {
  const selected = AIN.spots.find(spot => spot.id === AIN.state.selectedSpotId) || AIN.spots[0];
  const homeSpots = AIN.$('#home-spots');
  if(homeSpots) homeSpots.innerHTML = AIN.spots.map(AIN.spotCard).join('');
  AIN.$('#spot-tabs').innerHTML = AIN.spots.map(spot => `
    <button data-select-spot="${spot.id}" class="spot-compare-card ${spot.id === selected.id ? 'selected' : ''}">
      <span class="spot-tab-name">${spot.name}</span>
      <span class="spot-tab-score"><b>${spot.forecast ? spot.score : '--'}</b><small>/100</small></span>
      <span class="spot-compare-quality">${spot.label}</span>
      <span class="spot-compare-meta">${spot.wave} · ${spot.window === '--' ? '--' : spot.window}</span>
    </button>`).join('');
  AIN.$('#spot-detail').innerHTML = AIN.spotDetail(selected);
};
