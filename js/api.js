AIN.loadLiveForecast = async () => {
  const coordinates=`latitude=${AIN.spots.map(spot=>spot.lat).join(',')}&longitude=${AIN.spots.map(spot=>spot.lng).join(',')}`;
  const marineURL=`https://marine-api.open-meteo.com/v1/marine?${coordinates}&hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,sea_level_height_msl,sea_surface_temperature,ocean_current_velocity,ocean_current_direction&timezone=Africa%2FCasablanca&forecast_days=5&cell_selection=sea`;
  const weatherURL=`https://api.open-meteo.com/v1/forecast?${coordinates}&hourly=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=Africa%2FCasablanca&forecast_days=5`;
  try {
    const tideRequest=AIN.loadSpecializedTides().catch(error=>{console.warn(error);return null});
    const [marineResponse,weatherResponse]=await Promise.all([fetch(marineURL),fetch(weatherURL),tideRequest]);
    if(!marineResponse.ok||!weatherResponse.ok)throw new Error('Forecast service unavailable');
    let marine=await marineResponse.json(),weather=await weatherResponse.json();
    if(!Array.isArray(marine))marine=[marine]; if(!Array.isArray(weather))weather=[weather];
    AIN.spots.forEach((spot,index)=>{
      const marineHourly=marine[index]?.hourly, weatherHourly=weather[index]?.hourly;
      if(!marineHourly?.time||!weatherHourly?.time){
        spot.forecast=null;
        spot.error='Forecast data unavailable for this spot';
        return;
      }
      AIN.applyForecast(spot,marineHourly,weatherHourly);
    });
    await tideRequest;
    if(AIN.$('#spot-tabs'))AIN.renderSpots(); AIN.renderProfile(); if(AIN.$('#five-day')){AIN.renderBest();AIN.renderForecastTable();AIN.$('#data-status').textContent=AIN.tides?'EN DIRECT · TIDES LOCALES':'EN DIRECT · ESTIMATION TIDE'}
  } catch(error) {
    if(AIN.$('#data-status'))AIN.$('#data-status').textContent='HORS LIGNE'; if(AIN.$('#best-note'))AIN.$('#best-note').innerHTML='<strong>Prévisions indisponibles</strong> Aucune condition d’exemple n’est affichée comme donnée en direct.'; console.error(error);
  }
};
