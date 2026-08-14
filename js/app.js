AIN.bindNavigation();
AIN.updateHeaderAuthState=AIN.updateHeaderAuthState||(()=>{
  const button=AIN.$('#account-cta');
  if(!button)return;
  let signedIn=false;
  try{signedIn=localStorage.getItem('ain-auth-state')==='signed-in'}catch(error){}
  button.textContent=signedIn?'Your account':'Sign in / create account';
  button.classList.toggle('signed-in',signedIn);
});
AIN.updateHeaderAuthState();
const levelField=AIN.$('#level'),boardField=AIN.$('#board'),boardSizeField=AIN.$('#board-size'),waveSizeField=AIN.$('#wave-size'),currentComfortField=AIN.$('#current-comfort'),frequencyField=AIN.$('#surf-frequency'),favoriteField=AIN.$('#favorite-spot'),profileForm=AIN.$('#profile-form');
[levelField,boardField,boardSizeField,waveSizeField,currentComfortField,frequencyField,favoriteField].forEach(field=>{
  if(field)field.addEventListener('change',AIN.renderProfile);
});
if(profileForm)profileForm.addEventListener('submit',async event=>{event.preventDefault();
  const preferences=AIN.profilePreferences?.();
  if(preferences){try{localStorage.setItem('ain-profile',JSON.stringify({surf_level:preferences.level,board_type:preferences.boardType,board_size:preferences.boardSize,wave_size:preferences.waveSize,current_comfort:preferences.currentComfort,surf_frequency:preferences.frequency}))}catch(error){}}
  AIN.renderProfile();
  try{const saved=await AIN.saveProfileToAccount?.();AIN.$('#save-profile').textContent=saved?'Profile saved':'Saved on this device · sign in to sync'}catch(error){AIN.$('#auth-status').textContent=error.message}
});
const todayField=AIN.$('#today-date');
if(todayField)todayField.textContent=new Intl.DateTimeFormat('fr-FR',{weekday:'long',month:'long',day:'numeric',timeZone:'Africa/Casablanca'}).format(new Date()).toUpperCase()+' · CASABLANCA';
if(AIN.$('#spot-tabs'))AIN.renderSpots();
AIN.renderProfile();
if(AIN.$('#five-day')||AIN.$('#spot-tabs')||AIN.$('#your-call'))AIN.loadLiveForecast();
if(AIN.bindAuth)AIN.bindAuth();
if(AIN.initAuth)AIN.initAuth().catch(()=>{});
