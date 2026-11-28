// Composer des gabarits de départ sans dépendance à un fichier d’opération.
function modeleDeDepart(key){
  const affiche=key==='atelier',w=affiche?720:800,h=affiche?960:800,c=document.createElement('canvas');c.width=w;c.height=h;
  const g=c.getContext('2d');g.fillStyle=affiche?'#1d2549':'#f4e6cb';g.fillRect(0,0,w,h);
  if(affiche){
    g.fillStyle='#ff784e';g.fillRect(48,66,10,280);g.fillStyle='#fff2d5';g.font='bold 78px Arial';g.fillText('La nuit des',80,142);g.fillText('ateliers',80,224);
    g.font='24px Arial';g.fillText('Création & découverte',82,293);
    g.save();g.translate(w*.55,h*1.02);g.rotate(-.32);
    for(let i=0;i<8;i++){g.strokeStyle=i%2?'#ff7856':'#ffc687';g.lineWidth=23;g.beginPath();g.arc(0,0,75+i*53,Math.PI,2*Math.PI);g.stroke()}g.restore();
  }else{
    const petals=(x,y,r,color)=>{g.fillStyle=color;for(let i=0;i<8;i++){const a=i*Math.PI/4;g.beginPath();g.arc(x+Math.cos(a)*r*.55,y+Math.sin(a)*r*.55,r*.40,0,Math.PI*2);g.fill()}g.fillStyle='#f7c743';g.beginPath();g.arc(x,y,r*.21,0,Math.PI*2);g.fill()};
    petals(664,130,220,'#f07041');petals(677,645,198,'#69855e');petals(427,586,116,'#d69dbe');
    g.fillStyle='#213927';g.font='bold 78px Georgia';g.fillText('Le marché',42,289);g.fillText('des fleurs',42,378);g.font='27px Arial';g.fillText('Rendez-vous en boutique',46,453);
  }
  return c.toDataURL('image/png');
}
const VISUELS_DEPART=[{id:'atelier',nom:'La nuit des ateliers',source:'Modèle Studio · Affiche',pages:[{nom:'Affiche',modele:'atelier'}]},
 {id:'fleurs',nom:'Le marché des fleurs',source:'Modèle Studio · Carré social',pages:[{nom:'Carré social',modele:'fleurs'}]}];
const MODELES_VISUELS=[...VISUELS_DEPART], imagesDepart=new Map(), affectationsVisuelles=new Map();
const refVisuelle=id=>MODELES_VISUELS.find(r=>r.id===id);
function imgVisuelle(page,mini=false){
  if(!page)return '';
  if(page.modele){
    if(!imagesDepart.has(page.modele))imagesDepart.set(page.modele,modeleDeDepart(page.modele));
    return imagesDepart.get(page.modele);
  }
  return (mini&&page.mini)||page.image||'';
}
const visuelDe=s=>s?affectationsVisuelles.get(JSON.stringify([s.op,s.id,s.rev||1])):null;
const imageImportee=v=>typeof v?.image==='string'&&v.image.length<=340000&&/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(v.image);
function sourceVisuelle(v,mini=false){
  const page=refVisuelle(v?.ref)?.pages[v?.page||0];
  return page?imgVisuelle(page,mini):imageImportee(v)?v.image:'';
}
let baseVisuelle;
function stockageVisuel(){
  if(!baseVisuelle)baseVisuelle=new Promise((ok,fail)=>{
    const req=indexedDB.open('bigone-atelier-visuel',1);
    req.onupgradeneeded=()=>{req.result.createObjectStore('references',{keyPath:'id'});req.result.createObjectStore('maquettes')};
    req.onsuccess=()=>ok(req.result);req.onerror=()=>fail(req.error);
  }).catch(e=>{baseVisuelle=null;throw e});
  return baseVisuelle;
}
async function lireVisuels(){
  const db=await stockageVisuel(),tx=db.transaction(['references','maquettes']);
  const refs=tx.objectStore('references').getAll(),links=tx.objectStore('maquettes').openCursor(),saved=new Map();
  links.onsuccess=()=>{const c=links.result;if(c){saved.set(c.key,c.value);c.continue()}};
  await new Promise((ok,fail)=>{tx.oncomplete=ok;tx.onerror=()=>fail(tx.error)});
  MODELES_VISUELS.splice(0,MODELES_VISUELS.length,...refs.result.sort((a,b)=>a.ordre-b.ordre),...VISUELS_DEPART);
  affectationsVisuelles.clear();for(const [k,v] of saved)affectationsVisuelles.set(k,v);
}
async function enregistrerMaquette(s,draft,initial){
  const key=JSON.stringify([s.op,s.id,s.rev||1]),db=await stockageVisuel(),tx=db.transaction('maquettes','readwrite'),store=tx.objectStore('maquettes');
  const current=store.get(key);let conflict=false;
  current.onsuccess=()=>{if((current.result?.stamp||'')!==(initial?.stamp||'')){conflict=true;tx.abort();return}store.put(draft,key)};
  await new Promise((ok,fail)=>{tx.oncomplete=ok;tx.onabort=tx.onerror=()=>fail(new Error(conflict?'La maquette a changé dans un autre onglet. Rouvrez la fiche.':'Enregistrement local indisponible.'))});
  affectationsVisuelles.set(key,draft);
}
function lireSelection(raw){
  const m=JSON.parse(raw),bitmap=x=>typeof x==='string'&&x.length<2400000&&/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(x);
  if(m.format!=='bigone-studio-visuels/v1'||!Array.isArray(m.supports)||!m.supports.length||m.supports.length>40)throw Error();
  return m.supports.map((r,ordre)=>{
    if(typeof r.nom!=='string'||!r.nom.trim()||!Array.isArray(r.pages)||!r.pages.length||r.pages.length>80)throw Error();
    return {nom:r.nom.slice(0,120),source:String(r.source||'Import').slice(0,180),ordre,pages:r.pages.map(p=>{
      if(!bitmap(p.image)||(p.mini&&!bitmap(p.mini)))throw Error();
      return {nom:String(p.nom||'Visuel').slice(0,120),image:p.image,mini:p.mini||''};
    })};
  });
}
async function importerSelection(input){
  const file=input.files[0],op=input.dataset.artPack;if(!file||!op)return;
  try{
    if(file.size>55*1024*1024)throw Error();
    const refs=lireSelection(await file.text());
    for(const r of refs){const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([op,r.nom,r.pages.map(p=>p.image)])));r.id='import-'+Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('')}
    const db=await stockageVisuel(),tx=db.transaction('references','readwrite');
    for(const r of refs)tx.objectStore('references').put({...r,op});
    await new Promise((ok,fail)=>{tx.oncomplete=ok;tx.onabort=tx.onerror=()=>fail(tx.error)});
    await lireVisuels();render();toast(refs.length+' supports importés dans ce navigateur.');
  }catch{toast('Import impossible. Choisissez la sélection Studio (.json) et vérifiez l’espace disponible.')}
  input.value='';
}
document.addEventListener('change',e=>{if(e.target.matches('[data-art-pack]'))importerSelection(e.target)});
function miniatureVisuelle(v){
  const url=sourceVisuelle(v,true);
  if(!url)return '';
  return '<span class="work-thumb"><img loading="lazy" alt="" src="'+esc(url)+'">'+
    (v.texte?'<span style="background:'+couleurVisuelle(v.couleur)+'" class="'+(v.position==='haut'?'en-haut':'')+'">'+esc(v.texte)+'</span>':'')+'</span>';
}
function couleurVisuelle(c){return /^#[0-9a-f]{6}$/i.test(c)?c:'#183852'}
function galerieVisuelle(s,op=s?.op){
  if(!op)return '';
  const legacy=new Set();
  for(const [key,draft] of affectationsVisuelles){
    if(JSON.parse(key)[0]===op)legacy.add(draft.ref);
  }
  const available=MODELES_VISUELS.filter(r=>r.op===op||(s&&VISUELS_DEPART.includes(r))||(!r.op&&legacy.has(r.id)));
  const current=visuelDe(s), saved=sourceVisuelle(current);
  const cards=available.map(r=>`<button class="ref-card" data-reference="${esc(r.id)}" data-vsupport="${esc(s?.id||'')}" aria-haspopup="dialog">
    <img src="${imgVisuelle(r.pages[0],true)}" alt="" loading="lazy">
    <span><strong>${esc(r.nom)}</strong><small>${esc(r.pages.length>1?r.pages.length+' pages · '+r.source:r.source)}</small></span></button>`).join('');
  return `<section class="card visual-shelf" aria-label="Atelier visuel">
    <div class="visual-shelf-head"><div><h2>${saved?'Maquette du support':s?'Atelier visuel':'Visuels de l’opération'}</h2>
    <p class="small muted">${saved?'Maquette de travail enregistrée dans ce navigateur.':s?'Feuilletez le catalogue ou ouvrez un modèle avant de l’utiliser.':'Les sélections importées ici sont rattachées à cette opération.'}</p></div>
    <div class="art-sources"><label class="btn sm pack-label">Importer une sélection<input type="file" data-art-pack="${esc(op)}" accept=".json,application/json" aria-label="Importer une sélection de supports"></label><button class="btn sm" data-reference="import" data-vsupport="${esc(s?.id||'')}">Importer une image</button></div></div>
    ${saved?`<button class="saved-art" data-reference="actuel" data-vsupport="${esc(s.id)}">${miniatureVisuelle(current)}<span><strong>${esc(current.nom||'Maquette')}</strong><small>Ouvrir et personnaliser</small></span></button><h3>Références disponibles</h3>`:''}
    <div class="ref-grid">${cards}</div></section>`;
}
function ouvrirAtelier(ref,s){
  const dialog=document.querySelector('#atelier-dialog'),o=s&&opById(s.op);
  const initial=visuelDe(s), version=s?._v;
  let draft=ref==='actuel'&&sourceVisuelle(initial)?{...initial}:{ref,page:0,texte:'',couleur:'#183852',position:'bas'};
  const modifiable=!!s&&!!o&&!o.cloture&&!gele(s);
  const el=id=>dialog.querySelector('#art-'+id);
  dialog.innerHTML=`<header class="art-header"><div><h2 id="art-titre">Atelier visuel</h2><p class="small muted" id="art-source"></p></div><button class="btn art-close" aria-label="Fermer l’atelier" autofocus>×</button></header>
  <div class="art-body"><section class="art-view"><div class="art-stage"><canvas id="art-canvas" aria-label="Aperçu de la maquette"></canvas><p id="art-empty">Choisissez une image à prévisualiser.</p></div>
  <button class="btn sm art-zoom" id="art-zoom" aria-pressed="false">Voir en taille réelle</button><div class="art-pager" id="art-pager"><button class="btn sm" id="art-prev" aria-label="Page précédente">←</button><span id="art-page" aria-live="polite"></span><button class="btn sm" id="art-next" aria-label="Page suivante">→</button></div>
  <div class="art-strip" id="art-strip" aria-label="Pages du catalogue"></div></section>
  <aside class="art-controls"><h3>Personnalisation</h3>
  <label>Texte du bandeau<input id="art-texte" maxlength="90" placeholder="Ex. Portes ouvertes · Magasin de Levallois"></label>
  <div class="art-fields"><label>Couleur<input type="color" id="art-couleur"></label><label>Position<select id="art-position"><option value="bas">En bas</option><option value="haut">En haut</option></select></label></div>
  <small>Le bandeau s’ajoute en marge du visuel d’origine.</small>
  <label class="art-import">Image à importer<input id="art-file" type="file" accept="image/jpeg,image/png,image/webp"></label>
  <p class="small muted">JPG, PNG ou WebP. Les visuels importés et les maquettes sont conservés dans ce navigateur.</p>
  <div class="art-actions"><button class="btn" id="art-download">Exporter en PNG</button>
  ${modifiable?'<button class="btn pri" id="art-save">Associer au support</button>':''}</div>
  <p id="art-status" class="small" role="status"></p>
  ${s?`<small>Support · ${esc(titre(s))}${modifiable?'':' · consultation'}</small>`:'<small>Pour associer une maquette, ouvrez d’abord la fiche du support.</small>'}
  </aside></div>`;
  let sequence=0,loaded=null,busy=false,reading=false;
  const canvas=el('canvas'),msg=t=>el('status').textContent=t;
  const updateActions=()=>{
    const ready=!!loaded&&!busy&&!reading;
    el('download').disabled=!ready;el('zoom').disabled=!ready;
    if(el('save'))el('save').disabled=!ready;
  };
  function draw(){
    if(!loaded)return;
    const pic=loaded,scale=Math.min(1,1700/Math.max(pic.naturalWidth,pic.naturalHeight));
    const width=Math.round(pic.naturalWidth*scale),height=Math.round(pic.naturalHeight*scale);
    const ctx=canvas.getContext('2d'),label=draft.texte.trim();
    let font=Math.max(12,Math.round(width*.043));
    ctx.font='bold '+font+'px Arial';
    const lines=[];
    if(label){
      let line='';
      for(const char of label){
        const part=line+char;
        if(line&&ctx.measureText(part).width>width*.90){const space=line.lastIndexOf(' ');if(space>0){lines.push(line.slice(0,space));line=line.slice(space+1)+char}else{lines.push(line);line=char}}else line=part;
      }
      if(line.trim())lines.push(line.trim());
    }
    const lh=Math.ceil(font*1.21),band=lines.length?Math.ceil(font*.95)+lh*lines.length:0;
    canvas.width=width;canvas.height=height+band;
    const top=draft.position==='haut';ctx.drawImage(pic,0,top?band:0,width,height);
    if(band){
      const y=top?0:height;ctx.fillStyle=couleurVisuelle(draft.couleur);ctx.fillRect(0,y,width,band);
      const hex=couleurVisuelle(draft.couleur).slice(1),[r,g,b]=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
      ctx.fillStyle=.2126*r+.7152*g+.0722*b>.179?'#101014':'#fff';ctx.font='bold '+font+'px Arial';ctx.textBaseline='middle';
      lines.forEach((l,i)=>ctx.fillText(l,width*.05,y+font*.475+lh*(i+.5),width*.91));
    }
  }
  function show(){
    const item=refVisuelle(draft.ref),pages=item?.pages||[],page=pages[draft.page],src=sourceVisuelle(draft),token=++sequence;
    draft.nom=item?.nom||draft.nom||'Image importée';
    el('titre').textContent=src?draft.nom:'Importer une image';
    el('source').textContent=item?.source||(src?'Fichier importé':'Depuis votre appareil');
    el('texte').value=draft.texte||'';el('couleur').value=couleurVisuelle(draft.couleur);el('position').value=draft.position==='haut'?'haut':'bas';
    el('pager').hidden=el('strip').hidden=pages.length<2;
    el('page').textContent=page?'Page '+(draft.page+1)+' / '+pages.length+' · '+page.nom:'';
    el('prev').disabled=!draft.page;el('next').disabled=draft.page>=pages.length-1;
    el('strip').innerHTML=pages.length>1?pages.map((p,i)=>`<button type="button" data-artpage="${i}" aria-label="Page ${i+1} · ${esc(p.nom)}" aria-pressed="${i===draft.page}"><img alt="" src="${imgVisuelle(p,true)}"></button>`).join(''):'';
    loaded=null;updateActions();canvas.hidden=true;el('empty').hidden=false;el('empty').textContent=src?'Chargement du visuel…':'Choisissez une image à prévisualiser.';
    if(!src)return;
    const pic=new Image();
    pic.onload=()=>{if(token!==sequence||!dialog.open||dialog.querySelector('#art-canvas')!==canvas)return;loaded=pic;el('empty').hidden=true;canvas.hidden=false;draw();updateActions()};
    pic.onerror=()=>{if(token===sequence)el('empty').textContent='Le visuel ne peut pas être chargé.'};
    pic.src=src;
  }
  function go(page){if(!busy&&!reading){draft.page=page;show()}}
  dialog.querySelector('.art-close').onclick=()=>dialog.close();
  el('zoom').onclick=()=>{const zoom=canvas.parentElement.classList.toggle('en-grand');el('zoom').setAttribute('aria-pressed',String(zoom));el('zoom').textContent=zoom?'Ajuster à la fenêtre':'Voir en taille réelle'};
  el('prev').onclick=()=>go(draft.page-1);el('next').onclick=()=>go(draft.page+1);
  el('strip').onclick=e=>{const b=e.target.closest('[data-artpage]');if(b)go(Number(b.dataset.artpage))};
  for(const key of ['texte','position','couleur'])el(key).oninput=()=>{draft[key]=el(key).value;draw()};
  el('file').onchange=async()=>{
    const file=el('file').files[0];if(!file||busy||reading)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20*1024*1024){msg('Choisissez une image JPG, PNG ou WebP de 20 Mo maximum.');return}
    reading=true;updateActions();msg('Préparation de l’image…');const url=URL.createObjectURL(file);
    try{
      const img=new Image();img.src=url;await img.decode();if(!dialog.open||dialog.querySelector('#art-canvas')!==canvas)return;
      const buffer=document.createElement('canvas');let ratio=Math.min(1,1550/Math.max(img.width,img.height)),image='';
      do{buffer.width=Math.max(1,Math.round(img.width*ratio));buffer.height=Math.max(1,Math.round(img.height*ratio));buffer.getContext('2d').drawImage(img,0,0,buffer.width,buffer.height);
        image=buffer.toDataURL('image/webp',.86);ratio*=.8;
      }while(image.length>330000&&buffer.width+buffer.height>4);
      draft={...draft,ref:'import',page:0,image,nom:file.name};msg('Image prête.');show();
    }catch{msg('Impossible de lire cette image.')}finally{URL.revokeObjectURL(url);reading=false;updateActions()}
  };
  el('download').onclick=()=>canvas.toBlob(blob=>{
    if(!blob){msg('Export indisponible.');return}
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=(draft.nom.replace(/\.[^.]+$/,'').replace(/[^\p{L}\p{N} -]/gu,'-')||'maquette')+(refVisuelle(draft.ref)?.pages.length>1?'-p'+(draft.page+1):'')+'.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),12000);
  },'image/png');
  if(el('save'))el('save').onclick=async()=>{
    if(busy||!loaded)return;
    const live=S.supports.find(x=>x.id===s.id);
    if(!live||opById(s.op)?.cloture||gele(live)||live._v!==version){msg('Le support a changé. Rouvrez-le avant de lui associer la maquette.');return}
    busy=true;updateActions();
    try{await enregistrerMaquette(s,{...draft,stamp:crypto.randomUUID()},initial);dialog.close();render();toast('Maquette associée sur cet appareil.')}catch(e){msg(e.message||'L’enregistrement local a échoué.')}
    busy=false;updateActions();
  };
  dialog.showModal();show();if(ref==='import')el('file').focus();
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-reference]');if(!b)return;
  const s=b.dataset.vsupport?S.supports.find(x=>x.id===b.dataset.vsupport):null;
  ouvrirAtelier(b.dataset.reference,s);
});
