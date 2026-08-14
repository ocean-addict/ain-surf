AIN.authClient=null;

AIN.updateHeaderAuthState=user=>{
  const button=AIN.$('#account-cta');
  if(!button)return;
  const signedIn=Boolean(user);
  button.textContent=signedIn?'Your account':'Sign in / create account';
  button.classList.toggle('signed-in',signedIn);
};

AIN.initAuth=async()=>{
  const config=window.AIN_CONFIG||{};
  const status=AIN.$('#auth-status');
  if(!config.SUPABASE_URL||!config.SUPABASE_ANON_KEY||!window.supabase){
    if(status)status.textContent='Add your Supabase URL and publishable key in js/config.js.';
    return;
  }
  AIN.authClient=window.supabase.createClient(config.SUPABASE_URL,config.SUPABASE_ANON_KEY);
  const {data}=await AIN.authClient.auth.getUser();
  AIN.updateAuthUI(data.user||null);
  AIN.authClient.auth.onAuthStateChange((_event,session)=>{AIN.updateAuthUI(session?.user||null);if(session?.user)setTimeout(()=>AIN.loadProfileFromAccount(),0)});
  if(data.user)await AIN.loadProfileFromAccount();
};

AIN.updateAuthUI=user=>{
  try{
    if(user)localStorage.setItem('ain-auth-state','signed-in');
    else localStorage.removeItem('ain-auth-state');
  }catch(storageError){}
  AIN.updateHeaderAuthState(user);
  const form=AIN.$('#auth-form'),account=AIN.$('#account-email'),signOut=AIN.$('#sign-out'),status=AIN.$('#auth-status');
  if(user){
    if(form)form.hidden=true;
    if(account){account.hidden=false;account.textContent=`Signed in as ${user.email}`}
    if(signOut)signOut.hidden=false;
    if(status)status.textContent='Your profile can now be saved to your account.';
  }else{
    if(form)form.hidden=false;
    if(account)account.hidden=true;
    if(signOut)signOut.hidden=true;
  }
};

AIN.saveProfileToAccount=async()=>{
  if(!AIN.authClient)return false;
  const {data:{user}}=await AIN.authClient.auth.getUser();
  if(!user)return false;
  const profile={id:user.id,surf_level:AIN.$('#level')?.value,board_type:AIN.$('#board')?.value,board_size:AIN.$('#board-size')?.value,wave_size:AIN.$('#wave-size')?.value,current_comfort:AIN.$('#current-comfort')?.value,favorite_spot:AIN.$('#favorite-spot')?.value,surf_frequency:AIN.$('#surf-frequency')?.value,updated_at:new Date().toISOString()};
  const {error}=await AIN.authClient.from('profiles').upsert(profile);
  if(error)throw error;
  return true;
};

AIN.loadProfileFromAccount=async()=>{
  if(!AIN.authClient)return;
  const {data:{user}}=await AIN.authClient.auth.getUser();
  if(!user)return;
  const {data:profile,error}=await AIN.authClient.from('profiles').select('*').eq('id',user.id).maybeSingle();
  if(error||!profile)return;
  try{localStorage.setItem('ain-profile',JSON.stringify(profile))}catch(storageError){}
  const fields={
    '#level':profile.surf_level,
    '#board':profile.board_type,
    '#board-size':profile.board_size,
    '#wave-size':profile.wave_size,
    '#current-comfort':profile.current_comfort,
    '#favorite-spot':profile.favorite_spot,
    '#surf-frequency':profile.surf_frequency
  };
  Object.entries(fields).forEach(([selector,value])=>{const field=AIN.$(selector);if(field&&value&&[...field.options].some(option=>option.value===value))field.value=value});
  AIN.renderProfile?.();
};

AIN.bindAuth=()=>{
  const authForm=AIN.$('#auth-form'),signOut=AIN.$('#sign-out');
  authForm?.addEventListener('submit',async event=>{
    event.preventDefault();
    const email=AIN.$('#auth-email').value.trim(),password=AIN.$('#auth-password').value,status=AIN.$('#auth-status');
    if(!AIN.authClient){if(status)status.textContent='Configure Supabase first in js/config.js.';return}
    const action=event.submitter?.dataset.authAction||'signup';
    // Resolve relative to the current GitHub Pages project path, not the domain root.
    const redirectTo=new URL('profile.html',window.location.href).href;
    const result=action==='signin'?await AIN.authClient.auth.signInWithPassword({email,password}):await AIN.authClient.auth.signUp({email,password,options:{emailRedirectTo:redirectTo}});
    if(result.error){if(status)status.textContent=result.error.message;return}
    if(status)status.textContent=action==='signin'?'Signed in. Check your profile below.':'Account created. Check your email to confirm it.';
  });
  signOut?.addEventListener('click',async()=>{await AIN.authClient?.auth.signOut()});
};
