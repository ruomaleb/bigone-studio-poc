const codes=['V1','V2','V3'];
export const required=(test,message,status=422)=>{if(!test)throw Object.assign(new Error(message),{status})};
const clean=(s,max=160)=>String(s??'').trim().slice(0,max);
const money=(v,zero=true)=>typeof v==='number'&&Number.isFinite(v)&&v>=(zero?0:.01)&&v<=1e7;
const qty=v=>Number.isInteger(v)&&v>=0&&v<=1e7;
const date=()=>new Date().toISOString();
export const blank=(v='V1')=>({yn:'',v,counts:{},owned:{},media:{},copies:0,digital:'mix',budget:null,picks:{},prices:{},confirmed:false});
function config(){return {versions:[{id:'V1',name:'Sélection du quotidien',desc:'Les références du quotidien.'},{id:'V2',name:'Sélection festive',desc:'Les références du repas de fête.'},{id:'V3',name:'Produit vedette',desc:'Une référence mise en avant.'}],localVersion:true,items:[{id:'a1',name:'Affiche A1',unit:'affiche',price:4.5,on:true},{id:'stop',name:'Stop-rayon',unit:'stop-rayon',price:1.2,on:true}],kits:[{id:'kit1',name:'Kit entrée magasin',price:18,on:true,parts:{a1:2,stop:10}}],showUnit:true,showTotal:true,owned:[true,true,true,true,true],ads:[true,true,true,true],pages:12,digitalKits:[{id:'mix',name:'Display + réseaux sociaux',budget:450},{id:'display',name:'Display',budget:300},{id:'social',name:'Réseaux sociaux sponsorisés',budget:250}],offer:true,selectProducts:true,localPrice:true}}
const prod=(id,name,pack,versions,price,page,rayon)=>({id,name,pack,versions,price,page,rayon,brand:'U',note:''});
const piece=(id,name,format,state,pages,products)=>({id,name,format,products,pages,revision:1,state,history:[],review:false,file:'',note:'',scope:'Toutes',decider:'Chargé de production',variants:[],useByPage:{}});
export function example(){
 const products=[prod('s49-08','Emmental râpé','3 × 200 g',['V1','V2'],null,6,'Crèmerie'),prod('s49-09','Café moulu','4 × 250 g',['V1'],8.4,7,'Épicerie'),prod('s49-05','Champagne brut','75 cl',['V2','V3'],17.9,5,'Boissons')];
 return {op:{id:'u-2649-pbs',title:'Les prix bas de la semaine S49',network:'Magasins U',start:'2026-12-01',end:'2026-12-13',owner:'Chef de projet démo',contact:'Centrale démo',objective:'Soutenir le trafic de début décembre avec les prix bas de la semaine.',scope:'Nationale'},config:config(),products,
 stores:Array.from({length:10},(_,i)=>({id:'m'+String(i+1).padStart(2,'0'),name:(i===8?'U Express':'Super U')+' Démo '+String(i+1).padStart(2,'0'),status:i<6?'engage':i<9?'attente':'non',assigned:codes[i%3],rule:i===1?'must':'free'})),replies:{},
 supports:[piece('s49-prospectus','Prospectus','12 pages · A4','En revue',12,products.map(p=>p.id)),piece('s49-affiche','Affiche A1','594 × 841 mm','En corrections',1,['s49-05'])],
 flows:[{id:'s49-bonial',name:'Bonial',v:'V1',stage:'À contrôler'},{id:'s49-tiendeo',name:'Tiendeo',v:'V2',stage:'À contrôler'}],
 tasks:[{id:'bat1',name:'BAT 1 prêt pour revue',support:'s49-prospectus',due:'2026-11-18',done:false},{id:'correction',name:'Valider les corrections',support:'s49-affiche',due:'2026-11-20',done:false},{id:'remise',name:'Remettre les supports',due:'2026-11-26',done:false}],reminders:[],audit:[]};
}
export function importRows(rows,opId){
 const all=col=>rows.filter(x=>x.col===col).map(x=>({...x.data,id:x.id})),o=all('operations').find(x=>x.id===opId);
 required(o,'Opération introuvable.',404);
 const demo=opId==='u-2649-pbs'?example():null;
 const s=example(),own=col=>all(col).filter(p=>p.op===opId),eng=all('engagements').find(x=>x.id===opId)||{};
 s.op={id:o.id,title:o.nom,network:(o.enseignes||[]).join(' · ')||o.enseigne||'Réseau',start:o.debut,end:o.fin,scope:o.portee||'',closed:!!o.cloture,objective:o.brief?.objectif||'',owner:o.brief?.responsable||'',contact:o.brief?.client||''};
 s.products=own('produits').map(x=>({...prod(x.id,x.libelle||x.id,x.conditionnement||'',[],x.prix??null,x.page||1,x.rayon||''),brand:x.marque||'',...(demo?.products.find(p=>p.id===x.id)||{})}));
 s.stores=all('magasins').filter(x=>Object.hasOwn(eng,x.id)).map(x=>({id:x.id,name:x.nom,status:eng[x.id],assigned:demo?.stores.find(t=>t.id===x.id)?.assigned||'',rule:demo?.stores.find(t=>t.id===x.id)?.rule||'free'}));
 const pieces=own('supports');s.supports=pieces.filter(x=>!/flux/i.test(x.type)).map(x=>({...piece(x.id,x.type||x.id,x.format||'',({bat:'En revue',valide:'Validé',corrections:'En corrections',livre:'Remis'})[x.statut]||'En préparation',Number(x.pages)||1,(Array.isArray(x.produits)?x.produits:demo?.supports.find(p=>p.id===x.id)?.products||[]).filter(id=>s.products.some(p=>p.id===id))),file:x.fichier||'',revision:x.rev||1}));
 s.flows=pieces.filter(x=>/flux/i.test(x.type)).map(x=>({id:x.id,name:x.type,v:demo?.flows.find(f=>f.id===x.id)?.v||'',stage:'À contrôler'}));
 s.tasks=own('taches').map(x=>({id:x.id,name:x.libelle||x.id,support:x.support||'',due:x.echeance||'',done:!!x.fait}));return s;
}
export const eligible=(s,v)=>s.products.filter(p=>p.versions.includes(v));
export function totals(s){
 const counts={engage:0,attente:0,non:0,heritage:0,quantity:0,confirmed:0};
 for(const t of s.stores){const r=s.replies[t.id],status=r?.confirmed?(r.yn==='yes'?'engage':'non'):t.status;counts[status]=(counts[status]||0)+1;
 if(status==='engage'&&!r?.confirmed)counts.heritage++;if(r?.confirmed&&r.yn==='yes'){counts.confirmed++;counts.quantity+=(r.counts.a1||0)+s.config.kits.reduce((n,k)=>n+(r.counts[k.id]||0)*(k.parts.a1||0),0)}}
 return counts;
}
export function forRole(s,storeId){
 if(!storeId)return s;
 const t=s.stores.find(t=>t.id===storeId);required(t,'Participant absent.',404);
 const c=structuredClone(s.config);const v=s.replies[t.id]?.v||t.assigned;
 if(!c.localVersion)c.versions=c.versions.filter(x=>x.id===v);
 c.items=c.items.filter(x=>x.on);c.kits=c.kits.filter(x=>x.on);
 if(!c.showUnit&&!c.showTotal){for(const x of [...c.items,...c.kits])delete x.price}
 return {op:s.op,config:c,products:c.offer?s.products.filter(p=>c.localVersion?p.versions.length:p.versions.includes(v)):[],stores:[t],replies:{[t.id]:s.replies[t.id]||blank(t.assigned)}};
}
function validateConfig(c){
 required(c&&codes.every((v,i)=>c.versions?.[i]?.id===v&&clean(c.versions[i].name,48))&&c.versions.length===3,'Les trois versions doivent être nommées.');
 const items=[...c.items,...c.kits];required(items.length<=50&&c.digitalKits.length>0&&c.digitalKits.length<=20,'Catalogue trop volumineux.');
 const ids=new Set();for(const x of items){required(/^[a-z][a-z0-9-]{0,40}$/i.test(x.id)&&!ids.has(x.id)&&clean(x.name)&&money(x.price),'Support ou kit incorrect.');ids.add(x.id)}
 for(const k of c.kits){required(Object.entries(k.parts).every(([id,n])=>c.items.some(x=>x.id===id)&&qty(n))&&(!k.on||Object.values(k.parts).some(n=>n>0)),'Indiquez la composition du kit.')}
 required(c.digitalKits.every(x=>clean(x.name)&&money(x.budget))&&Number.isInteger(c.pages)&&c.pages>0&&c.pages<=1000,'Vérifiez les kits et la pagination.');
 required(c.owned.length===5&&c.ads.length===4,'Options de participation incorrectes.');
}
function normalize(s,t,raw,confirm){
 const c=s.config,r=blank(t.assigned);
 r.yn=t.rule==='must'?'yes':['yes','no'].includes(raw.yn)?raw.yn:'';
 r.v=c.localVersion&&codes.includes(raw.v)?raw.v:t.assigned;
 if(confirm)required(r.yn&&(! (r.yn==='yes')||codes.includes(r.v)),'Complétez la participation et la version.');
 if(r.yn==='yes'){
 for(const x of [...c.items,...c.kits].filter(x=>x.on)){const n=raw.counts?.[x.id]??0;required(qty(n),'Quantité invalide.');if(n)r.counts[x.id]=n}
 c.owned.forEach((on,i)=>{if(on&&raw.owned?.[i])r.owned[i]=true});c.ads.forEach((on,i)=>{if(on&&raw.media?.[i])r.media[i]=true});
 if(r.media[0]){r.copies=raw.copies||0;required(qty(r.copies)&&(!confirm||r.copies>0),'Indiquez le nombre d’exemplaires.')}
 if(r.media[1]){const k=c.digitalKits.find(x=>x.id===raw.digital)||c.digitalKits[0];r.digital=k.id;r.budget=raw.budget??k.budget;required(money(r.budget,!confirm),'Indiquez un budget positif.')}
 if(c.offer)for(const p of eligible(s,r.v)){if(!c.selectProducts||raw.picks?.[p.id]){r.picks[p.id]=true;const n=raw.prices?.[p.id];if(c.localPrice&&n!==undefined&&n!==null&&n!==''){required(money(n,false),'Prix local invalide.');r.prices[p.id]=n}}}
 }r.confirmed=confirm;return r;
}
function affect(s,ids){for(const p of s.supports)if(p.products.some(id=>ids.includes(id)))p.review=true;for(const f of s.flows){if(!f.stage.startsWith('Remis'))f.stage='À contrôler';delete f.validated}}
export const anomalies=(s,v)=>eligible(s,v).filter(p=>!money(p.price,false));
export function mutate(s,action,p,scope){
 required(!s.op.closed,'Ce dossier est clôturé.',409);
 const t=s.stores.find(x=>x.id===(scope||p.store));if(scope)required(action==='reply','Cet accès est réservé au participant.',403);
 if(action==='reply'){required(t,'Participant inconnu.',404);const r=normalize(s,t,p.reply||{},p.confirm===true);if(JSON.stringify(r)===JSON.stringify(s.replies[t.id]))return false;s.replies[t.id]=r}
 else if(action==='config'){validateConfig(p.config);required(s.stores.every(x=>['free','must'].includes(p.rules[x.id])&&(codes.includes(p.assign[x.id])||p.assign[x.id]==='')),'Affectation incorrecte.');s.config=p.config;
 const changed=[];for(const x of s.products){const vs=codes.filter(v=>p.eligibility[x.id]?.includes(v));if(vs.join()!==x.versions.join())changed.push(x.id);x.versions=vs}
 if(changed.length)affect(s,changed);
 for(const x of s.stores){const old=x.assigned;x.rule=p.rules[x.id];x.assigned=p.assign[x.id];if(s.replies[x.id]){const r=s.replies[x.id];s.replies[x.id]=normalize(s,x,{...r,v:old!==x.assigned?x.assigned:r.v},false)}}}
 else if(action==='product'){const x=s.products.find(y=>y.id===p.id);required(x,'Produit absent.',404);required(p.price===null||money(p.price,false),'Prix invalide.');required(codes.some(v=>p.versions?.includes(v)),'Sélectionnez au moins une version.');x.name=clean(p.name,100);required(x.name,'Libellé obligatoire.');Object.assign(x,{price:p.price,versions:codes.filter(v=>p.versions.includes(v)),pack:clean(p.pack),note:clean(p.note,500),brand:clean(p.brand),rayon:clean(p.rayon)});affect(s,[x.id]);for(const a of s.stores){const r=s.replies[a.id];if(r&&!x.versions.includes(r.v)&&(r.picks[x.id]||r.prices[x.id])){delete r.picks[x.id];delete r.prices[x.id];r.confirmed=false}}}
 else if(action==='info'){for(const k of ['title','network','owner','contact','scope','objective','start','end'])s.op[k]=clean(p[k],k==='objective'?1400:160);required(s.op.title&&/^\d{4}-\d{2}-\d{2}$/.test(s.op.start)&&s.op.end>=s.op.start,'Vérifiez le titre et les dates.')}
 else if(action==='task'){const x=s.tasks.find(x=>x.id===p.id);required(x,'Jalon absent.');x.done=!!p.done}
 else if(action==='schedule'){required(/^\d{4}-\d{2}-\d{2}$/.test(p.due)&&s.supports.some(x=>x.id===p.id),'Choisissez une échéance et un support.');const dates=[['Relecture du BAT',8],['Validation du BAT',3],['Remise',0]];for(const [name,days] of dates){const d=new Date(p.due+'T12:00:00Z');let i=days;while(i){d.setUTCDate(d.getUTCDate()-1);if(![0,6].includes(d.getUTCDay()))i--}const id=p.id+'-'+days,old=s.tasks.find(x=>x.id===id);const val={id,name,support:p.id,due:d.toISOString().slice(0,10),done:!!old?.done};if(old)Object.assign(old,val);else s.tasks.push(val)}}
 else if(action==='support'){const x=s.supports.find(x=>x.id===p.id);required(x,'Support absent.');if(p.step==='setup'){x.format=clean(p.format);x.note=clean(p.note,500);x.products=s.products.filter(y=>p.products?.includes(y.id)).map(y=>y.id);x.review=true}
 else if(p.step==='variant'){const r=s.replies[p.store];required(r?.confirmed&&Object.keys(r.prices||{}).some(id=>x.products.includes(id)),'Aucun prix local confirmé pour ce support.');const local=Object.fromEntries(Object.entries(r.prices).filter(([id])=>x.products.includes(id)));x.variants=x.variants.filter(z=>z.store!==p.store);x.variants.push({store:p.store,prices:local,at:date()});x.review=true}
 else if(p.step==='file'){required(!['Validé','En revue','Remis'].includes(x.state),'Ouvrez une nouvelle révision.');required(!p.file||/^https:\/\//i.test(p.file),'Utilisez une adresse HTTPS.');x.file=clean(p.file,1000)}
 else{required(['En revue','Validé','En corrections','Nouvelle révision','Remis'].includes(p.step),'Décision inconnue.');const allowed={'En revue':['En préparation','En corrections'],'Validé':['En revue'],'En corrections':['En revue'],'Remis':['Validé']};
 if(p.step!=='Nouvelle révision')required(allowed[p.step].includes(x.state),'Transition indisponible.');if(['Validé','Remis'].includes(p.step))required(!x.review&&x.products.every(id=>s.products.find(y=>y.id===id)?.price>0),'Traitez les anomalies et ouvrez une nouvelle révision si nécessaire.');
 x.history.push({at:date(),revision:x.revision,decision:p.step,comment:clean(p.note,500),file:x.file,attachment:x.attachment||null,products:s.products.filter(y=>x.products.includes(y.id)).map(y=>({id:y.id,price:y.price,versions:[...y.versions]}))});if(p.step==='Nouvelle révision'){x.revision++;x.review=false;x.state='En préparation'}else x.state=p.step}}
 else if(action==='flow'){const f=s.flows.find(x=>x.id===p.id);required(f,'Flux absent.');if(p.step==='scope'){required(codes.includes(p.v),'Version inconnue.');f.v=p.v;f.stage='À contrôler';delete f.validated}
 else if(p.step==='check'){const ok=eligible(s,f.v).length&&!anomalies(s,f.v).length;f.stage=ok?'Contrôlé':'À corriger';f.validated=!!ok;f.checked=date()}
 else if(p.step==='generate'){required(f.validated&&!anomalies(s,f.v).length,'Contrôlez les données avant génération.');f.rows=eligible(s,f.v).map(x=>({reference:x.id,libelle:x.name,conditionnement:x.pack,prix_ttc:x.price,version:f.v}));f.stage='Généré';f.generated=date()}
 else if(p.step==='deliver'){required(f.stage==='Généré'&&clean(p.receipt),'Renseignez le reçu de remise du fichier généré.');f.stage='Remis';f.receipt=clean(p.receipt,250);f.delivered=date()}else required(false,'Action inconnue.')}
 else if(action==='reminder'){const ids=s.stores.filter(t=>p.stores?.includes(t.id)).map(t=>t.id);required(ids.length&&clean(p.text),'Sélection et texte obligatoires.');s.reminders.push({id:crypto.randomUUID(),stores:ids,text:clean(p.text,2000),at:date()})}
 else required(false,'Action inconnue.',400);
 s.audit.push({at:date(),action,actor:scope||'Enseigne'});s.audit=s.audit.slice(-120);return true;
}
