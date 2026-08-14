AIN.tides=null;
AIN.casablancaStamp=date=>{const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Casablanca',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(date).map(part=>[part.type,part.value]));return `${parts.year}-${parts.month}-${parts.day}T${parts.hour==='24'?'00':parts.hour}:${parts.minute}`};

AIN.loadSpecializedTides=async()=>{
  const raw=window.AIN_TIDE_EXTREMES;if(!Array.isArray(raw)||raw.length<2)return null;
  const events=raw.map(([seconds,height,type])=>({milliseconds:seconds*1000,height,type:type==='L'?'Low':'High'}));
  // Begin well before the current local day so today's first tide is never clipped
  // when the page is opened late in the afternoon or evening.
  const now=Date.now(),start=now-36*3600000,end=now+7*86400000,relevant=events.filter(event=>event.milliseconds>=start-14*3600000&&event.milliseconds<=end+14*3600000),heights=[];
  for(let time=start;time<=end;time+=15*60000){const nextIndex=relevant.findIndex(event=>event.milliseconds>=time);if(nextIndex<1)continue;const previous=relevant[nextIndex-1],next=relevant[nextIndex],progress=AIN.clamp((time-previous.milliseconds)/(next.milliseconds-previous.milliseconds),0,1),height=previous.height+(next.height-previous.height)*(1-Math.cos(Math.PI*progress))/2;heights.push({date:AIN.casablancaStamp(new Date(time)),height,milliseconds:time})}
  AIN.tides={heights,extremes:relevant.map(event=>({date:AIN.casablancaStamp(new Date(event.milliseconds)),height:event.height,type:event.type,milliseconds:event.milliseconds})),timezone:'Africa/Casablanca',source:'JRC harmonic model',station:{name:'Casablanca 2052'}};return AIN.tides;
};

// Always rebuild a complete local day from its surrounding high/low extrema.
// This avoids a chart beginning at the time the visitor opened the page.
AIN.tidePointsForDay=date=>{
  if(!AIN.tides?.extremes?.length)return [];
  const serial=value=>Date.parse(`${value}:00Z`);
  const events=AIN.tides.extremes.map(event=>({...event,serial:serial(event.date)})).sort((a,b)=>a.serial-b.serial);
  const dayStart=Date.parse(`${date}T00:00:00Z`),points=[];
  for(let minute=0;minute<24*60;minute+=15){
    const target=dayStart+minute*60000,nextIndex=events.findIndex(event=>event.serial>=target);
    if(nextIndex<1)continue;
    const previous=events[nextIndex-1],next=events[nextIndex],progress=AIN.clamp((target-previous.serial)/(next.serial-previous.serial),0,1);
    points.push({time:`${date}T${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`,hour:minute/60,value:previous.height+(next.height-previous.height)*(1-Math.cos(Math.PI*progress))/2});
  }
  return points;
};

AIN.tideAt=(date,hour)=>{const list=AIN.tidePointsForDay(date);if(!list.length)return null;const index=AIN.clamp(Math.round(hour*4),0,list.length-1),current=list[index],previous=list[Math.max(0,index-1)],next=list[Math.min(list.length-1,index+1)],difference=next.value-previous.value;return{height:current.value,state:difference>.01?'Rising':difference<-.01?'Falling':'Near turn',index}};
