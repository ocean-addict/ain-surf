AIN.showPage = name => {
  const target=AIN.$(`#${name}-page`);
  if(!target){window.location.href=name==='spots'?'spots.html':name==='profile'?'profile.html':'index.html';return}
  document.querySelectorAll('.page').forEach(page=>page.classList.remove('active-page'));
  target.classList.add('active-page');
  document.querySelectorAll('nav a').forEach(link=>link.classList.toggle('active',link.getAttribute('href')===`${name==='home'?'index':name}.html`));
  window.scrollTo(0,0);
};

AIN.bindNavigation = () => {
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');
    if(!link||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target==='_blank')return;
    const url=new URL(link.href,window.location.href);
    if(url.origin===window.location.origin&&url.pathname!==window.location.pathname)document.documentElement.classList.add('page-leaving');
  });
  document.addEventListener('click',event=>{
    const page=event.target.closest('[data-page]'),spot=event.target.closest('[data-spot]'),tab=event.target.closest('[data-select-spot]'),day=event.target.closest('[data-forecast-day]'),bestStep=event.target.closest('[data-best-day-step]'),scoreRow=event.target.closest('[data-score-row]'),profileScore=event.target.closest('[data-profile-score]'),authOpen=event.target.closest('[data-auth-open]'),authClose=event.target.closest('[data-auth-close]');
    if(page)AIN.showPage(page.dataset.page);
    if(spot){AIN.state.selectedSpotId=spot.dataset.spot;AIN.renderSpots();AIN.showPage('spots')}
    if(tab){AIN.state.selectedSpotId=tab.dataset.selectSpot;AIN.renderSpots()}
    if(day){AIN.state.forecastDay=Number(day.dataset.forecastDay);AIN.state.bestDay=AIN.state.forecastDay;AIN.state.forecastSpotId=null;AIN.renderForecastTable();AIN.renderBest()}
    if(bestStep){const slider=AIN.$('#best-day-slider');if(slider){slider.value=String(AIN.clamp(Number(slider.value)+Number(bestStep.dataset.bestDayStep),0,Number(slider.max)));AIN.state.bestDay=Number(slider.value);AIN.state.forecastDay=AIN.state.bestDay;AIN.renderBest();AIN.renderForecastTable()}}
    if(scoreRow)AIN.showScoreBreakdown(Number(scoreRow.dataset.scoreRow));
    if(profileScore)AIN.showProfileScore();
    if(authOpen){const modal=AIN.$('#account-modal');if(modal)modal.hidden=false}
    if(authClose){const modal=AIN.$('#account-modal');if(modal)modal.hidden=true}
  });
  document.addEventListener('change',event=>{if(event.target.matches('#forecast-spot')){AIN.state.forecastSpotId=event.target.value;AIN.renderForecastTable()}if(event.target.matches('#best-day-slider')){AIN.state.bestDay=Number(event.target.value);AIN.state.forecastDay=AIN.state.bestDay;AIN.renderBest();AIN.renderForecastTable()}});
};

window.addEventListener('pageshow',()=>document.documentElement.classList.remove('page-leaving'));
