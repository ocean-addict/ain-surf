window.AIN = window.AIN || {};

/* Condition thresholds are deliberately explicit so the recommendation can
   explain why a session is beginner-friendly (or not).  Current velocity is
   in km/h when supplied by Open-Meteo. */
AIN.conditionAt = (spot,index,marine,weather) => {
  const wave=(marine.wave_height?.[index] ?? marine.swell_wave_height?.[index] ?? 0) * spot.power;
  const period=marine.swell_wave_period?.[index] ?? marine.wave_period?.[index] ?? 0;
  const swellDirection=marine.swell_wave_direction?.[index] ?? marine.wave_direction?.[index] ?? 0;
  const windSpeed=weather.wind_speed_10m?.[index] ?? 30;
  const windGust=weather.wind_gusts_10m?.[index] ?? windSpeed;
  const windDirection=weather.wind_direction_10m?.[index] ?? 270;
  const time=marine.time?.[index], hour=time ? Number(time.slice(11,13)) : 6, date=time?.slice(0,10);
  const specialized=date && AIN.tides?.heights?.length ? AIN.tideAt(date,hour) : null;
  const tideState=specialized?.state || AIN.tideState(marine.sea_level_height_msl || [],index);
  const tideHeight=specialized?.height ?? marine.sea_level_height_msl?.[index];
  const measuredCurrent=marine.ocean_current_velocity?.[index];
  const hasMeasuredCurrent=Number.isFinite(measuredCurrent);
  const previous=marine.sea_level_height_msl?.[Math.max(0,index-1)], next=marine.sea_level_height_msl?.[Math.min((marine.sea_level_height_msl?.length||1)-1,index+1)];
  const tidalRate=Number.isFinite(previous)&&Number.isFinite(next) ? Math.abs(next-previous) : 0;
  // A transparent fallback for coastal cells where the model does not return
  // current velocity. It is an estimate, never presented as a measurement.
  const currentSpeed=hasMeasuredCurrent ? measuredCurrent : AIN.clamp(.12 + tidalRate*12 + wave*.08 + Math.max(0,windGust-windSpeed)*.01,0,.9);
  const currentSource=hasMeasuredCurrent ? 'Open-Meteo ocean-current model' : 'tide/wave estimate';
  let conditionRank=1;
  const currentLimit=spot.currentTolerance ?? .35;
  const shorebreakPenalty=spot.shorebreakRisk ?? (spot.type.includes('shorebreak') ? 1 : 0);
  if(wave>1 || windGust>24 || period>=11 || currentSpeed>currentLimit || (shorebreakPenalty && (wave>.85 || windSpeed>16)))conditionRank=2;
  if(wave>1.6 || windGust>32 || period>=14 || currentSpeed>currentLimit*1.5 || spot.danger==='High' || (shorebreakPenalty && (wave>1.25 || windSpeed>22)))conditionRank=3;
  const defaultLabel=['','Beginner-friendly','Intermediate','Advanced only'][conditionRank];
  const skillLabel=conditionRank===2 && spot.intermediateLabel ? spot.intermediateLabel : defaultLabel;
  return {wave,period,swellDirection,windSpeed,windGust,windDirection,tideState,tideHeight,currentSpeed,currentSource,conditionRank,skillLabel,hour,date};
};

AIN.levelRank = level => level?.startsWith('Beginner') ? 1 : level?.startsWith('Intermediate') ? 2 : 3;
AIN.currentComfortLimit = comfort => ({Cautious:.25,Comfortable:.45,'Very comfortable':.9,'Strong currents okay':.9}[comfort] ?? .25);
AIN.currentLabel = speed => speed <= .2 ? 'Current calme' : speed <= .35 ? 'Current modérée' : speed <= .55 ? 'Current forte' : 'Current très forte';

AIN.scoreBreakdown = (spot,index,marine,weather) => {
  const c=AIN.conditionAt(spot,index,marine,weather), [low,high]=spot.ideal, center=(low+high)/2;
  const waveScore=c.wave>=low&&c.wave<=high?30:AIN.clamp(30-Math.abs(c.wave-center)*28,0,30);
  const periodScore=AIN.clamp((c.period-5)*2.14,0,15);
  const directionScore=AIN.clamp(15-AIN.angleDiff(c.swellDirection,spot.swellTarget)/6,0,15);
  const gustPenalty=Math.max(0,c.windGust-c.windSpeed)*.35;
  const windScore=AIN.clamp(20-c.windSpeed*.52-AIN.angleDiff(c.windDirection,spot.windTarget)/22-gustPenalty,0,20);
  const tideScore=(spot.tideBias==='rising'&&c.tideState==='Rising')||(spot.tideBias==='mid'&&c.tideState!=='Near turn')?10:5;
  const currentScore=AIN.clamp(10-c.currentSpeed*12,0,10);
  const total=Math.round(AIN.clamp(waveScore+periodScore+directionScore+windScore+tideScore+currentScore,0,100));
  return {total,wave:Math.round(waveScore),wind:Math.round(windScore),swell:Math.round(periodScore+directionScore),tide:tideScore,current:Math.round(currentScore),conditions:c};
};

AIN.scoreHour=(spot,index,marine,weather)=>AIN.scoreBreakdown(spot,index,marine,weather).total;

AIN.applyForecast=(spot,marine,weather)=>{
  const date=marine.time[0].slice(0,10), hours=[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
  const candidates=marine.time.map((time,index)=>({index,hour:Number(time.slice(11,13)),date:time.slice(0,10)})).filter(item=>item.date===date&&hours.includes(item.hour)).map(item=>({...item,score:AIN.scoreHour(spot,item.index,marine,weather)})).sort((a,b)=>b.score-a.score);
  const best=candidates[0]||{index:0,hour:6,score:0}, i=best.index, c=AIN.conditionAt(spot,i,marine,weather);
  spot.score=best.score; spot.wave=`${(c.wave*.85).toFixed(1)} m – ${(c.wave*1.2).toFixed(1)} m`; spot.period=Math.round(c.period); spot.direction=AIN.compass(c.swellDirection);
  spot.windSpeed=Math.round(c.windSpeed); spot.windGust=Math.round(c.windGust); spot.windDirection=AIN.compass(c.windDirection); spot.wind=`${spot.windSpeed} km/h ${spot.windDirection}`;
  spot.tideState=c.tideState; spot.tide=Number.isFinite(c.tideHeight)?`${c.tideState} · ${c.tideHeight.toFixed(2)} m`:'Unavailable'; spot.currentSpeed=c.currentSpeed; spot.currentSource=c.currentSource; spot.currentDirection=marine.ocean_current_direction?.[i];
  const windowStart=Math.max(6,best.hour-1),windowEnd=Math.min(21,best.hour+2); spot.window=`${String(windowStart).padStart(2,'0')}:00–${String(windowEnd).padStart(2,'0')}:00`;
  [spot.label,spot.tone]=AIN.labelFor(spot.score); spot.conditionRank=c.conditionRank; spot.skillLabel=c.skillLabel; spot.forecast=marine; spot.weather=weather; spot.bestIndex=i;
};
