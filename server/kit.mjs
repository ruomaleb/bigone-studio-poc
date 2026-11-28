// The production pilot uses the operation's offers and confirmed shop responses.
import {photo} from './edition.mjs';
import {participantsOf} from './targeting.mjs';

export const formats = {
  carre: {name: 'Carré', width: 1080, height: 1080},
  vertical: {name: 'Vertical', width: 1080, height: 1920}
};

export function initPilot(s, blank) {
  s.stores = s.stores.filter(t => t.assigned === 'V1').slice(0, 6).map((t, i) => ({
    ...t, name: 'Nanotera ' + 'ABCDEF'[i], status: 'attente', rule: 'free'
  }));
  s.targetGroups = s.targetGroups.slice(0, 1);
  s.supports.find(x=>x.id==='bd-ecatalogue').scope='V2';
  s.config.items = [{id:'lot-a3', name:'Affiches A3', unit:'lot de 10', on:true, price:0}];
  Object.assign(s.config, {kits:[], showTotal:false, showUnit:false, productionPilot:true});
  const [,b,c,d,e] = s.stores;
  const reply = (props) => ({...blank('V1'), yn:'yes', confirmed:true, picks:{'bd-03':true}, ...props});
  s.replies[b.id] = reply({kit:true, media:{1:true}, budget:150});
  s.replies[c.id] = reply({kit:true});
  s.replies[d.id] = reply({counts:{'lot-a3':1}});
  s.replies[e.id] = reply({yn:'no', picks:{}});
  s.kitFrame = {source:'PAC-NANOTERA',operation:s.op.id,revision:1,start:s.op.start,end:s.op.end,
    open:'2027-01-05',close:'2027-01-14',kit:'facultatif'};
  s.kit = {product:'bd-03', theme:'sauge', proofs:[], deliveries:[]};
  return s;
}

export function kitDemand(s) {
  const stores = participantsOf(s);
  const counts = {invited:stores.length, yes:0, no:0, waiting:0, shops:0, posters:0, budget:0};
  const outputs = new Map();
  const issues = [];
  const product = s.products.find(p => p.id === s.kit.product);
  for (const shop of stores) {
    const r = s.replies[shop.id];
    if (!r?.confirmed || r.review) { counts.waiting++; continue; }
    if (r.yn !== 'yes') { counts.no++; continue; }
    counts.yes++;
    counts.posters += (r.counts?.['lot-a3'] || 0) * 10;
    if (r.media?.[1]) counts.budget += r.budget || 0;
    if (!r.kit && s.kitFrame?.kit!=='inclus') continue;
    counts.shops++;
    if (!product?.versions.includes(r.v) || !r.picks?.[product.id]) {
      issues.push(shop.name + ' · offre absente de la sélection éligible'); continue;
    }
    const price = r.prices?.[product.id] ?? product.price;
    if (!Number.isFinite(price) || price <= 0) {
      issues.push(shop.name + ' · prix manquant'); continue;
    }
    const image=photo(s,product);
    if(!image){issues.push(product.name+' · visuel PIM manquant pour '+shop.name);continue;}
    for (const format of Object.keys(formats)) {
      const spec = {model:1, format, product:product.id, title:product.name, brand:product.brand || s.op.network,
        cents:Math.round(price*100), theme:s.kit.theme, image};
      const signature = JSON.stringify(spec);
      if (!outputs.has(signature)) outputs.set(signature, {signature,spec,shops:[]});
      outputs.get(signature).shops.push({id:shop.id,name:shop.name});
    }
  }
  return {counts,outputs:[...outputs.values()],issues};
}

export function currentProof(kit, signature) {
  return kit.proofs.findLast(p => p.signature === signature);
}
export function storeKits(s, store) {
  return s.kit.deliveries.map(d => ({
    id:d.id, at:d.at, receipt:d.receipt, files:d.files.filter(f=>f.shops.some(x=>x.id===store)).map(f=>({id:f.id,name:f.name,sha256:f.sha256,format:f.format,revision:f.revision}))
  })).filter(d=>d.files.length);
}
export function changeKit(s, action, p, check) {
  const k=s.kit;
  check(k, 'Atelier digital indisponible dans ce dossier.');
  if(action==='kit-frame'){
    const next=verifyFrame(s,p.frame,check),before=s.kitFrame;
    if(next.revision===before.revision)return false;
    if(next.kit!==before.kit){
      for(const shop of participantsOf(s)){
        const r=s.replies[shop.id];
        if(r?.confirmed && r.yn==='yes' && !r.kit)r.review=true;
      }
    }
    s.kitFrames??=[];s.kitFrames.push(before);s.kitFrame=next;
    s.op.start=next.start;s.op.end=next.end;return true;
  }
  if (action==='kit-theme') {
    check(['sauge','sable','lavande'].includes(p.theme),'Choisissez une palette disponible.');
    if(k.theme===p.theme) return false;
    k.theme=p.theme; return true;
  }
  if(action==='kit-deliver') {
    const {outputs,issues}=kitDemand(s);
    check(outputs.length && !issues.length,'Complétez la demande avant la remise.');
    const files=outputs.map(o=>{
      const f=currentProof(k,o.signature);
      check(f?.approved,'Tous les rendus courants doivent avoir un BAT validé.');
      return {id:f.id,name:f.name,sha256:f.sha256,format:f.spec.format,revision:f.revision,shops:structuredClone(o.shops)};
    });
    const last=k.deliveries.at(-1);
    if(last && JSON.stringify(files)===JSON.stringify(last.files)) return false;
    k.deliveries.push({id:'KIT-GAIA-'+String(k.deliveries.length+1).padStart(2,'0'),at:new Date().toISOString(),files,receipt:''});
    return true;
  }
  if(action==='kit-receipt') {
    const d=k.deliveries.find(x=>x.id===p.id);
    const receipt=String(p.receipt||'').trim();
    check(d && receipt.length && receipt.length<=160,'Bordereau et reçu requis.');
    if(d.receipt===receipt)return false;
    check(!d.receipt,'Un reçu est déjà enregistré.');
    d.receipt=receipt;d.received=new Date().toISOString();return true;
  }
  const f=k.proofs.find(x=>x.id===p.id);
  check(f,'Épreuve introuvable.');
  if(action==='kit-approve' && f.approved) return false;
  check(!f.approved,'Cette épreuve est déjà validée.');
  if(action==='kit-note') {
    const text=String(p.text||'').trim();
    check(text && text.length<=800,'Saisissez une correction (800 caractères maximum).');
    check(f.notes.length<100,'Limite de commentaires atteinte pour cette épreuve.');
    f.notes.push({id:crypto.randomUUID(),text,zone:['Prix','Visuel','Titre'].includes(p.zone)?p.zone:'Ensemble du rendu',author:p.author==='Relecteur'?'Relecteur':'Studio',at:new Date().toISOString(),resolved:false});
  } else if(action==='kit-resolve') {
    const note=f.notes.find(n=>n.id===p.note);
    check(note,'Correction introuvable.'); if(note.resolved)return false;note.resolved=true;
  } else if(action==='kit-approve') {
    check(f.notes.every(n=>n.resolved),'Résolvez les corrections ouvertes avant validation.');
    f.approved=new Date().toISOString();
  } else check(false,'Action de kit inconnue.');
  return true;
}

export function verifyFrame(s,input,check) {
  const prev=s.kitFrame;
  check(prev && input?.operation===prev.operation && input?.source===prev.source,'Origine ou opération incorrecte.');
  const next=Object.fromEntries(Object.keys(prev).map(key=>[key,input[key]]));
  check(Number.isSafeInteger(next.revision) && next.revision>=prev.revision,'Révision antérieure ou incorrecte.');
  for(const date of [next.start,next.end,next.open,next.close]){
    const d=new Date(String(date)+'T12:00:00Z');
    check(typeof date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(d.getTime()) && d.toISOString().slice(0,10)===date,'Date PAC incorrecte.');
  }
  check(next.open<=next.close && next.close<=next.start && next.start<=next.end,'Ordre des dates incorrect.');
  check(['facultatif','inclus'].includes(next.kit),'Option de kit inconnue.');
  check(next.revision!==prev.revision || JSON.stringify(next)===JSON.stringify(prev),'Le contenu diffère pour la même révision.');
  return next;
}
