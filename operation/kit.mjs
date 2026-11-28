import {formats,kitDemand,currentProof,verifyFrame} from '../server/kit.mjs';
import {blank} from '../server/model.mjs';
import {esc,route,btn,link,card,tag,table,euros,field,sel} from './views.mjs';
import {drawOutput,encodeOutput,downloadBlob,fromBase64,archive} from './kit-export.mjs';

const tr=(...cells)=>'<tr>'+cells.map(c=>'<td>'+c+'</td>').join('')+'</tr>';
const to=(page,area,label,extra={},cls='act')=>link(route(page,{vue:area,...extra}),label,cls);
const status=f=>!f?'À générer':f.approved?'Validé':f.notes.some(n=>!n.resolved)?'En corrections':'En revue';
const dates=t=>new Date(t).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Paris'});
const metric=(value,label)=>'<div class="stat"><strong>'+esc(value)+'</strong><span>'+esc(label)+'</span></div>';
const productLink=s=>link(route('produits',{id:s.kit.product}),s.products.find(p=>p.id===s.kit.product)?.name||'Voir la fiche produit','quiet');
const tabs=(s,selected)=>'<nav class="kit-tabs" aria-label="Kit digital">'+[['kit','Rendus'],['bat','BAT digital'],['remises','Remises']].map(([v,l])=>to('production',v,l,{},v===selected?'chip active':'chip')).join('')+'</nav>';

const humanDay=v=>new Date(v+'T12:00:00Z').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'});
const participantLink=(filter,value,label)=>'<a class="stat" href="'+esc(route('participants',{filtre:filter}))+'"><strong>'+value+'</strong><span>'+esc(label)+'</span></a>';
const frameLabels={revision:'Révision',start:'Début commercial',end:'Fin commerciale',open:'Ouverture des engagements',close:'Clôture des engagements',kit:'Kit digital'};
export function pilotIntro(s) {
  const f=s.kitFrame;
  const frame=f?card('Cadre de l’opération', '<p><b>BD-2704</b> · PAC Nanotera · Révision '+f.revision+'</p><p>Engagements du '+humanDay(f.open)+' au '+humanDay(f.close)+'. Kit digital '+esc(f.kit)+' pour le groupe témoin V1.</p><div class="actions">'+btn('kit-frame-export','Télécharger le cadre JSON')+btn('kit-frame-import','Importer une révision')+'</div>'):'';
  return frame+card('Production du kit digital', '<div class="kit-intro"><img src="../assets/brico-deco/bd-03.webp" alt="Lampe Gaia"><div><h3>Brico-déco · Lampe Gaia</h3><p>Du choix du magasin aux fichiers carrés et verticaux.</p><div class="actions">'+link('#participants','Voir les engagements','primary')+to('production','kit','Atelier digital')+to('flux','suivi','Suivi des flux')+'</div></div></div>');
}
export function pilotParticipants(s,q) {
  const {counts}=kitDemand(s),filter=q.get('filtre')||'',bySupport=q.get('par')==='support',included=s.kitFrame?.kit==='inclus';
  const tabs='<div class="kit-tabs">'+link('#participants','Par magasin',bySupport?'chip':'chip active')+link('#participants?par=support','Par support',bySupport?'chip active':'chip')+'</div>';
  const select=(key,value,label)=>participantLink(key,value,label);
  const metrics='<div class="stats kit-stats">'+select('',counts.invited,'Invités')+select('oui',counts.yes,'Participants')+select('kit',counts.shops,'Destinataires du kit')+select('non',counts.no,'Refus')+select('attente',counts.waiting,'À confirmer')+'</div>';
  if(bySupport)return card('Engagements par support',tabs+metrics+table(['Choix','Volume confirmé','Magasins'],[
    tr('Kit digital',counts.shops+' kits',link('#participants?filtre=kit','Destinataires')),
    tr('Kit digital décliné',counts.yes-counts.shops,link('#participants?filtre=sans-kit','Voir les magasins')),
    tr('Affiches A3 · lots de dix',counts.posters+' affiches',link('#participants?filtre=affiche','Commandes')),
    tr('Diffusion locale',esc(euros(counts.budget)),link('#participants?filtre=media','Budgets engagés'))]));
  const shops=s.stores.filter(x=>x.targeted!==false).filter(t=>{
    const r=s.replies[t.id],yes=r?.confirmed&&!r.review&&r.yn==='yes';
    return filter==='kit'?yes&&(r.kit||included):filter==='sans-kit'?yes&&!r.kit&&!included:filter==='attente'?(!r?.confirmed||r.review):filter==='non'?r?.confirmed&&r.yn==='no':filter==='oui'?yes:filter==='affiche'?yes&&r.counts?.['lot-a3']>0:filter==='media'?yes&&r.budget>0:true;
  });
  return card('Engagements des magasins',tabs+metrics+'<div class="filters">'+[['','Tous'],['kit','Kit confirmé'],['sans-kit','Participants sans kit'],['attente','Sans confirmation']].map(([v,l])=>link(route('participants',{filtre:v}),l,'chip '+(filter===v?'active':''))).join('')+'</div>'+
    table(['Magasin','Participation','Kit digital','Affiches A3','Budget local',''],shops.map(t=>{
      const r=s.replies[t.id],confirmed=r?.confirmed&&!r.review&&r.yn==='yes';
      return tr('<b>'+esc(t.name)+'</b>',tag(r?.review?'À revoir':r?.confirmed?(confirmed?'Participe':'Refus'):'À répondre',confirmed?'good':''),confirmed?(included?'Inclus':r.kit?'Confirmé':'Décliné'):'—',confirmed?esc((r.counts?.['lot-a3']||0)*10):'—',confirmed?euros(r.budget||0):'—',to('participation','choix','Ouvrir',{id:t.id})+' '+btn('invite','Accès magasin',t.id));
    }))+'<p>'+counts.posters+' affiches confirmées · Budget média '+esc(euros(counts.budget))+'</p>',to('production','kit','Voir les rendus',{},'primary'));
}
export function shopYear(s,other=[]) {
  const dossiers=[{s,href:'#participation'},...other];
  return card('Mon année',table(['Opération','Période commerciale','Confirmation','Choix confirmés',''],dossiers.map(({s:op,href})=>{
    const shop=op.stores[0],r=op.replies[shop.id],yes=r?.confirmed&&!r.review&&r.yn==='yes';
    return tr(esc(op.op.title),humanDay(op.op.start)+' au '+humanDay(op.op.end),tag(r?.review?'À revoir':r?.confirmed?(yes?'Participe':'Refus'):'À répondre'),
      yes?(op.config.productionPilot?(r.kit||op.kitFrame?.kit==='inclus'?'Kit digital · ':'')+(r.counts?.['lot-a3']||0)*10+' affiches · ':'')+esc(euros(r.budget||0)):'—',link(href,'Ma participation'));
  })));
}
export function shopView(s,id,shopRole) {
  const t=s.stores.find(t=>t.id===id) || s.stores[0],r=s.replies[t.id]||blank(t.assigned);
  const product=s.products.find(p=>p.id==='bd-03');
  const selected=(v)=>v?' checked':'';
  return card('Ma participation · '+t.name,(shopRole?link('#participation?vue=annee','← Mon année'):'')+'<div class="kit-year"><h3>'+esc(s.op.title)+'</h3><p>'+esc(s.op.start)+' au '+esc(s.op.end)+' · '+esc(r.v)+' · '+esc(s.products.filter(p=>p.versions.includes(r.v)).length)+' offres éligibles</p>'+tag(r.review?'Confirmation à revoir':r.confirmed?'Réponse confirmée':'À répondre',r.confirmed?'good':'warn')+'</div><form id="kit-response" data-store="'+esc(t.id)+'" class="kit-response">'+sel('yn','Participation',[['','À renseigner'],['yes','Je participe'],['no','Je ne participe pas']],r.yn)+'<fieldset><legend>Mes choix</legend><label class="pick"><input type="checkbox" name="kit"'+selected(r.kit||s.kitFrame?.kit==='inclus')+(s.kitFrame?.kit==='inclus'?' disabled':'')+'> Kit digital Gaia · carré et vertical</label>'+field('lots','Affiches A3 · lots de 10',r.counts?.['lot-a3']||0,'number','min="0" max="10000" step="1"')+field('budget','Budget de diffusion locale (€ HT)',r.budget||0,'number','min="0" max="1000000" step="0.01"')+(product?field('price','Prix local de Gaia (€ TTC) · prix commun '+euros(product.price),r.prices?.[product.id]??'','number','min="0.01" max="1000000" step="0.01" placeholder="Utiliser le prix commun"'):'')+'</fieldset><div class="actions"><button class="primary">Confirmer ma participation</button></div></form>'+(!shopRole?link('#participants','Revenir au suivi des engagements'):'')+(s.deliveredKits?.length?'<h3>Mes fichiers disponibles</h3>'+s.deliveredKits.map(d=>btn('kit-zip','Télécharger '+d.id,d.id)).join(' '):''));
}
export function shopPayload(form,submit) {
  const d=new FormData(form),price=d.get('price'),budget=Number(d.get('budget'));
  return {store:form.dataset.store,confirm:submit,reply:{yn:d.get('yn'),kit:d.has('kit'),counts:{'lot-a3':Number(d.get('lots'))},media:budget?{1:true}:{},budget,
    picks:{'bd-03':true},prices:price?{'bd-03':Number(price)}:{}}};
}

export function kitView(s,q) {
  const area=q.get('vue')||'kit',k=s.kit,{outputs,issues,counts}=kitDemand(s);
  const here=tabs(s,area);
  if(area==='remises')return card('Remises du kit Gaia',here+btn('kit-deliver','Mettre les fichiers validés à disposition','','primary')+
    (!k.deliveries.length?'<p>Aucun bordereau enregistré.</p>':k.deliveries.slice().reverse().map(d=>'<section class="inset"><h3>'+esc(d.id)+'</h3><p>'+esc(dates(d.at))+' · '+d.files.length+' fichiers · '+d.files.reduce((n,f)=>n+f.shops.length,0)+' affectations</p>'+table(['Fichier','BAT','Destinataires'],d.files.map(f=>tr(esc(f.name),'R'+f.revision,esc(f.shops.map(t=>t.name).join(', ')))))+'<div class="actions">'+btn('kit-zip','Télécharger le ZIP et le bordereau',d.id)+(d.receipt?tag('Reçu · '+d.receipt,'good'):btn('kit-receipt','Consigner un reçu',d.id))+'</div><p>Publication à confirmer par la destination.</p></section>').join('')));
  if(area==='bat'){
    const f=k.proofs.find(f=>f.id===q.get('epreuve'))||k.proofs.at(-1);
    if(!f)return card('BAT digital',here+'<p>Générez les PNG dans Rendus pour ouvrir les épreuves.</p>');
    const old=k.proofs.filter(p=>p.id!==f.id&&p.spec.format===f.spec.format&&p.shops.some(t=>f.shops.includes(t))&&p.at<f.at).at(-1);
    const proofImage=(proof)=>'<figure class="kit-proof"><img data-kit-proof="'+esc(proof.id)+'" alt="Épreuve enregistrée '+esc(formats[proof.spec.format].name)+'"><figcaption>R'+proof.revision+' · '+esc(euros(proof.spec.cents/100))+'</figcaption></figure>';
    return card('BAT digital · '+formats[f.spec.format].name,here+'<div class="filters">'+k.proofs.map(v=>to('production','bat',formats[v.spec.format].name+' · '+euros(v.spec.cents/100)+' · R'+v.revision,{epreuve:v.id},v===f?'chip active':'chip')).join('')+'</div><div class="kit-bat"><div class="kit-proofs">'+(old?proofImage(old):'')+proofImage(f)+'</div><section class="inset"><h3>Commentaires</h3>'+tag(status(f),f.approved?'good':'warn')+btn('kit-invite','Inviter un relecteur',f.id)+'<p>'+esc(f.shops.map(id=>s.stores.find(t=>t.id===id)?.name||id).join(', '))+'</p>'+f.notes.map(n=>'<div class="rowline"><span>'+esc(n.zone||'Ensemble du rendu')+' · '+esc(n.text)+'<small> · '+esc(n.author||'Studio')+' · '+esc(dates(n.at))+'</small></span>'+(n.resolved?tag('Résolu','good'):btn('kit-resolve','Résoudre',f.id+'|'+n.id))+'</div>').join('')+(!f.approved?'<div class="actions">'+btn('kit-note','Demander une correction',f.id)+btn('kit-approve','Valider ce BAT',f.id,'primary')+'</div>':'')+'</section></div>');
  }
  const filter=q.get('format')||'',store=q.get('magasin')||'';
  const ix=Math.max(0,Number(q.get('rendu'))||0);
  const visible=outputs.map((o,i)=>({o,i})).filter(({o})=>(!filter||o.spec.format===filter)&&(!store||o.shops.some(t=>t.id===store)));
  const current=visible.find(x=>x.i===ix)||visible[0];
  const controls='<form class="filters" id="kit-filter">'+sel('format','Format',[['','Tous'],...Object.entries(formats).map(([id,d])=>[id,d.name])],filter)+sel('magasin','Magasin',[['','Tous'],...s.stores.filter(t=>t.targeted!==false).map(t=>[t.id,t.name])],store)+'<button class="act">Filtrer</button></form>';
  const tiles=visible.map(({o,i})=>{
    const proof=currentProof(k,o.signature);
    return '<a class="kit-tile '+(i===current?.i?'chosen':'')+'" href="'+esc(route('production',{vue:'kit',rendu:i,format:filter,magasin:store}))+'"><div class="kit-stage"><canvas data-kit-output="'+i+'" aria-label="'+esc(formats[o.spec.format].name)+'"></canvas></div><b>'+formats[o.spec.format].name+' · '+esc(euros(o.spec.cents/100))+'</b><small>'+esc(o.shops.map(t=>t.name).join(', '))+'</small>'+tag(status(proof),proof?.approved?'good':'')+'</a>';
  }).join('');
  let detail='';
  if(current){
    const o=current.o,f=currentProof(k,o.signature),d=formats[o.spec.format];
    detail='<section class="inset"><h3>'+d.name+' · '+esc(euros(o.spec.cents/100))+'</h3><p>'+d.width+' × '+d.height+' px</p><p>'+productLink(s)+'</p><p>Destinataires · '+esc(o.shops.map(t=>t.name).join(', '))+'</p>'+tag(status(f))+(f?'<div class="actions">'+to('production','bat','Relire le BAT',{epreuve:f.id})+btn('kit-png','Télécharger le PNG',f.id)+'</div>':'')+'</section>';
  }
  return card('Kit digital · Lampe Gaia',here+'<div class="stats kit-stats">'+metric(outputs.length,'Fichiers distincts')+metric(counts.shops,'Magasins engagés')+metric(outputs.reduce((n,o)=>n+o.shops.length,0),'Affectations')+'</div>'+controls+(issues.length?'<p class="issue">'+issues.map(esc).join('<br>')+'</p>':'')+'<div class="kit-work"><div class="kit-wall">'+(tiles||'<p>Aucun rendu pour cette sélection.</p>')+'</div>'+detail+'</div><div class="actions">'+btn('kit-generate','Générer les PNG manquants','','primary')+btn('kit-theme','Modifier le modèle')+'</div>');
}
export function kitReviewView(s) {
  const f=s.proofs.at(-1);
  return card('BAT digital · '+formats[f.format].name, '<p>'+esc(s.op.title)+' · Accès relecteur</p><div class="kit-bat"><div class="kit-proofs">'+s.proofs.map(p=>'<figure class="kit-proof"><img data-kit-proof="'+esc(p.id)+'" alt="Épreuve R'+p.revision+'"><figcaption>R'+p.revision+' · '+esc(euros(p.cents/100))+'</figcaption></figure>').join('')+'</div><section class="inset"><h3>Commentaires</h3>'+tag(status(f)) +f.notes.map(n=>'<p>'+esc(n.text)+' · '+esc(n.author||'Studio')+' · '+esc(dates(n.at))+(n.resolved?' · Résolu':'')+'</p>').join('')+(!f.approved?btn('kit-note','Demander une correction',f.id):'')+'</section></div>');
}
export function mountKit(s,api) {
  const outputs=s.kit?kitDemand(s).outputs:[];
  for(const c of document.querySelectorAll('[data-kit-output]')){
    drawOutput(c,outputs[Number(c.dataset.kitOutput)].spec).catch(()=>{c.replaceWith('Aperçu indisponible');});
  }
  for(const im of document.querySelectorAll('[data-kit-proof]')){
    api('/kit-file',{id:im.dataset.kitProof}).then(f=>{im.src='data:image/png;base64,'+f.content;}).catch(()=>{im.alt='Épreuve inaccessible';});
  }
}
export async function kitAction(action,id,{context,api,save,modal,notify,refresh,adopt}) {
  const s=context().state,kit=s.kit;
  if(action==='kit-generate'){
    let n=0;const errors=[];
    try{
      for(const o of kitDemand(s).outputs){
        if(currentProof(context().state.kit,o.signature))continue;
        try{
        const canvas=await drawOutput(document.createElement('canvas'),o.spec);
        const data=await encodeOutput(canvas);
        const next=await api('/kit-render',{signature:o.signature,revision:context().revision,content:data});
        adopt(next);n++;
        }catch(e){
          errors.push(formats[o.spec.format].name+' · '+(e.status?e.message:'Vérifiez le média de '+o.spec.title+' et sa disponibilité.'));
          if(e.status===409)break;
        }
      }
    }finally{await refresh();}
    if(errors.length)return modal('Génération à reprendre','<p>'+n+' PNG enregistrés.</p><ul>'+errors.map(e=>'<li>'+esc(e)+'</li>').join('')+'</ul>');
    notify(n?n+' PNG enregistrés.':'Les fichiers demandés sont déjà à jour.');return;
  }
  if(action==='kit-invite'){
    const r=await api('/kit-review-invite',{id});
    const u=new URL('./',location.href);
    u.search=new URLSearchParams({epreuve:id,op:s.op.id,parcours:'production'});u.hash='acces='+r.key;
    return modal('Accès relecteur',field('url','Lien de relecture de cette épreuve',u.href,'url','readonly')+btn('copy-invite','Copier le lien'));
  }
  if(action==='kit-frame-export')return downloadBlob(new Blob([JSON.stringify(s.kitFrame,null,2)],{type:'application/json'}),'BD-2704-PAC-R'+s.kitFrame.revision+'.json');
  if(action==='kit-frame-import')return modal('Importer un cadre PAC', '<label class="field">Fichier JSON du cadre<input type="file" name="frame" accept=".json,application/json" required></label>',async d=>{
    const file=d.get('frame');if(file.size>10000)throw Error('Cadre trop volumineux.');
    let value;try{value=JSON.parse(await file.text());}catch{throw Error('Le fichier doit contenir un cadre JSON valide.');}
    const next=verifyFrame(s,value,(ok,error)=>{if(!ok)throw Error(error);});
    const diff=Object.keys(frameLabels).filter(k=>s.kitFrame[k]!==next[k]);
    if(!diff.length)return modal('Cadre déjà reçu','<p>Cette révision est déjà appliquée. Les réponses et fichiers sont conservés.</p>');
    const impact=next.kit!==s.kitFrame.kit?s.stores.filter(t=>{const r=s.replies[t.id];return t.targeted!==false&&r?.confirmed&&r.yn==='yes'&&!r.kit;}):[];
    return modal('Relire la révision PAC',table(['Champ','Cadre actuel','Cadre reçu'],diff.map(k=>tr(esc(frameLabels[k]),esc(s.kitFrame[k]),esc(next[k]))))+'<p>Confirmations à revoir · '+esc(impact.map(t=>t.name).join(', ')||'Aucune')+'</p>',()=>save('kit-frame',{frame:next}),'Appliquer la révision');
  },'Comparer');
  if(action==='kit-theme') return modal('Modèle du kit',sel('theme','Palette',[['sauge','Sauge'],['sable','Sable'],['lavande','Lavande']],kit.theme),d=>save(action,{theme:d.get('theme')}));
  if(action==='kit-note')return modal('Demander une correction',sel('zone','Repère sur l’épreuve',['Ensemble du rendu','Prix','Visuel','Titre'].map(x=>[x,x]),'Ensemble du rendu')+field('text','Commentaire','','text','required maxlength="800"'),d=>save(action,{id,text:d.get('text'),zone:d.get('zone')}));
  if(action==='kit-receipt')return modal('Consigner la réception',field('receipt','Référence fournie par le destinataire','','text','required maxlength="160"'),d=>save(action,{id,receipt:d.get('receipt')}));
  if(action==='kit-resolve'){const [proof,note]=id.split('|');return save(action,{id:proof,note});}
  if(action==='kit-approve'||action==='kit-deliver')return save(action,{id});
  if(action==='kit-png'){const f=await api('/kit-file',{id});return downloadBlob(new Blob([fromBase64(f.content)],{type:'image/png'}),f.name);}
  if(action==='kit-zip'){
    const d=(kit?.deliveries||s.deliveredKits||[]).find(d=>d.id===id);
    if(!d)throw Error('Bordereau indisponible.');
    const entries=[];
    for(const file of d.files){const f=await api('/kit-file',{id:file.id});entries.push({name:f.name,bytes:fromBase64(f.content)});}
    entries.push({name:'bordereau.json',bytes:new TextEncoder().encode(JSON.stringify(d,null,2))});
    downloadBlob(archive(entries),id+'.zip');
  }
}
