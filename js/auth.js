AIN.authClient=null;

AIN.showPasswordReset=()=>{
  const reset=AIN.$('#reset-form'),form=AIN.$('#auth-form'),forgot=AIN.$('#forgot-form'),modal=AIN.$('#account-modal');
  if(reset)reset.hidden=false;
  if(form)form.hidden=true;
  if(forgot)forgot.hidden=true;
  if(modal)modal.hidden=false;
  AIN.$('#reset-password')?.focus();
};

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
  const recoveryCode=new URLSearchParams(window.location.search).get('code');
  if(recoveryCode){
    const {error}=await AIN.authClient.auth.exchangeCodeForSession(recoveryCode);
    if(!error)AIN.showPasswordReset();
    else if(status)status.textContent='Le lien de réinitialisation est invalide ou expiré.';
  }
  const {data}=await AIN.authClient.auth.getUser();
  AIN.updateAuthUI(data.user||null);
  AIN.authClient.auth.onAuthStateChange((event,session)=>{AIN.updateAuthUI(session?.user||null);if(event==='PASSWORD_RECOVERY')AIN.showPasswordReset();if(session?.user)setTimeout(()=>AIN.loadProfileFromAccount(),0)});
  if(window.location.hash.includes('type=recovery')){
    AIN.showPasswordReset();
  }
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
  if(AIN.$('#five-day'))AIN.renderBest?.();
};

AIN.bindAuth=()=>{
  const authForm=AIN.$('#auth-form'),forgotForm=AIN.$('#forgot-form'),signOut=AIN.$('#sign-out'),forgot=AIN.$('#forgot-password'),forgotBack=AIN.$('#forgot-back'),resetForm=AIN.$('#reset-form');
  authForm?.addEventListener('submit',async event=>{
    event.preventDefault();
    const email=AIN.$('#auth-email').value.trim(),password=AIN.$('#auth-password').value,status=AIN.$('#auth-status');
    if(!AIN.authClient){if(status)status.textContent='Configure Supabase first in js/config.js.';return}
    const action=event.submitter?.dataset.authAction||'signup';
    // Resolve relative to the current GitHub Pages project path, not the domain root.
    const redirectTo=new URL('profile.html',window.location.href).href;
    const result=action==='signin'?await AIN.authClient.auth.signInWithPassword({email,password}):await AIN.authClient.auth.signUp({email,password,options:{emailRedirectTo:redirectTo}});
    if(result.error){if(status)status.textContent=result.error.message;return}
    if(action==='signup'&&result.data?.user?.identities?.length===0){if(status)status.textContent='Un compte existe déjà avec cet email. Connecte-toi plutôt que de recréer un compte.';return}
    if(status)status.textContent=action==='signin'?'Connecté. Vérifie ton profil ci-dessous.':'Compte créé. Vérifie ton email pour confirmer.';
  });
  forgot?.addEventListener('click',async()=>{
    const emailInput=AIN.$('#forgot-email'),authEmail=AIN.$('#auth-email');
    const card=AIN.$('.account-modal-card');
    if(emailInput&&authEmail)emailInput.value=authEmail.value;
    if(authForm)authForm.hidden=true;
    if(forgotForm)forgotForm.hidden=false;
    card?.classList.add('forgot-mode');
    emailInput?.focus();
  });
  forgotBack?.addEventListener('click',()=>{
    const card=AIN.$('.account-modal-card');
    if(forgotForm)forgotForm.hidden=true;
    if(authForm)authForm.hidden=false;
    card?.classList.remove('forgot-mode');
  });
  forgotForm?.addEventListener('submit',async event=>{
    event.preventDefault();
    const email=AIN.$('#forgot-email')?.value.trim(),status=AIN.$('#auth-status');
    if(!AIN.authClient){if(status)status.textContent='Supabase n’est pas configuré dans js/config.js.';return}
    const redirectTo=new URL('profile.html',window.location.href).href;
    const {error}=await AIN.authClient.auth.resetPasswordForEmail(email,{redirectTo});
    if(error){
      console.error('Password recovery error',error);
      const detail=[error.message,error.code,error.status].filter(Boolean).join(' · ');
      if(status)status.textContent=`Impossible d’envoyer le lien : ${detail}`;
    }else if(status){
      status.textContent='Un lien de réinitialisation a été envoyé à ton email.';
    }
    if(!error&&forgotForm)forgotForm.hidden=true;
  });
  resetForm?.addEventListener('submit',async event=>{
    event.preventDefault();
    const password=AIN.$('#reset-password')?.value,status=AIN.$('#auth-status');
    if(!AIN.authClient){if(status)status.textContent='Supabase n’est pas configuré.';return}
    const {error}=await AIN.authClient.auth.updateUser({password});
    if(status)status.textContent=error?`Impossible de modifier le mot de passe : ${error.message}`:'Mot de passe mis à jour. Tu peux maintenant te connecter.';
    if(!error){resetForm.hidden=true;history.replaceState({},document.title,window.location.pathname);await AIN.authClient.auth.signOut()}
  });
  signOut?.addEventListener('click',async()=>{await AIN.authClient?.auth.signOut()});
};
