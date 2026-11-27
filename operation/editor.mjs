import {mountProof} from './proof-file.mjs';
import {compose,proof,photo,visuals,isCatalogue} from '../server/edition.mjs';
import {esc,euros,link,route} from './views.mjs?v=8';

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const round=v=>Math.round(v*100)/100;
const paperImage=n=>'../assets/brico-deco/page-'+n+'.webp';
const action=(name,label,attrs='')=>'<button type="button" class="ed-btn" data-ed="'+name+'" '+attrs+'>'+esc(label)+'</button>';
const option=(v,label,active)=>'<option value="'+esc(v)+'" '+(String(v)===String(active)?'selected':'')+'>'+esc(label)+'</option>';
const field=(label,html)=>'<label class="ed-field">'+esc(label)+html+'</label>';
const rect=b=>'left:'+b.x+'%;top:'+b.y+'%;width:'+b.w+'%;height:'+b.h+'%';
const names=['Couverture','Luminaires et miroir','Suspensions et spots','Esprit nature','Luminaires et LED','Dos de couverture'];
const time=t=>new Date(t).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const norm=v=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function department(s,p){
  if(s.op.id!=='bd-2704-deco'||p.rayon!=='Bricolage')return p.rayon||'Sans rayon';
  const name=norm(p.name);
  if(name.includes('miroir'))return 'Miroirs';
  if(name.includes('ampoule'))return 'Ampoules LED';
  return 'Luminaires';
}
function pageLabel(known,i){return known && i<=6 ? names[i-1] : 'Page '+i;}
function visual(plan,n,selected,mini=false,editable=false) {
  const art=plan.mode==='catalogue' || (plan.covers && [1,6].includes(n));
  const blocks=plan.blocks.filter(b=>b.page===n);
  if(plan.mode==='file')return mini?'<span class="ed-file-mini">BAT</span>':'<div class="ed-file-layer">Chargement du fichier…</div>';
  const contents=blocks.map(b=>{
    const picked=b.id===selected && !mini;
    return '<div class="ed-block ed-'+(b.kind==='text'?'text':b.kind==='image'?'image':'offer')+(picked?' picked':'')+'" style="'+rect(b)+'" data-block="'+esc(b.id)+'" '+(editable?'role="button" tabindex="0" aria-label="'+esc(b.name)+' · déplacer le bloc"':'')+'>'+
      (b.kind==='image'?'<img draggable="false" src="'+esc(b.image)+'" alt="'+esc(b.name)+'">':b.kind==='text'?'<strong>'+esc(b.name)+'</strong>':(b.image?'<img draggable="false" src="'+esc(b.image)+'" alt="">':'')+'<b>'+esc(b.name)+'</b><em>'+esc(euros(b.price))+'</em>')+
      (picked?'<span class="ed-grip" title="Redimensionner le bloc"></span>':'')+'</div>';
  }).join('');
  return (art?'<img class="ed-art" draggable="false" src="'+paperImage(n)+'" alt="'+(mini?'':'Catalogue Brico-déco, page '+n)+'">':'')+contents;
}
export function editorController({context,save,api,notify,render}) {
  let selection='', filter='',rayon='',available=false,category='',bank='products', note='',reply='',author='',anchor=null,activeThread='',filterNotes='all',busy=false,drag=null,last='',invite='',draftId='',replyId='',zoom=1;
  try{author=localStorage.getItem('studio.bat.signature')||'';}catch{}
  function current(){
    const ctx=context(),q=new URLSearchParams(location.hash.split('?')[1]),reviewer=ctx?.role==='relecteur';
    if(!ctx||(!reviewer&&!['fer','bat'].includes(q.get('atelier'))))return null;
    const s=ctx.state,x=reviewer?s.supports[0]:s.supports?.find(y=>y.id===q.get('id'));
    if(!x)return null;
    const mode=reviewer?'bat':q.get('atelier'),rev=mode==='bat'?Number(q.get('revision'))||x.revision:x.revision;
    const plan=mode==='fer'?compose(s,x):proof(s,x,rev)||proof(s,x);
    const page=clamp(Math.trunc(Number(q.get('page')))||1,1,plan.pages);
    return {s,x,mode,plan,page,rev:mode==='bat'?plan.revision:rev,reviewer,locked:!!s.op.closed||['Validé','Remis'].includes(x.state)||rev!==x.revision};
  }
  const url=(v,mode,page,revision)=>route('production',{id:v.x.id,atelier:mode,page,revision});
  function panel(v) {
    const {s,x,page,plan,reviewer,locked,rev}=v;
    if(v.mode==='fer'){
      const eligible=s.products.filter(p=>!x.scope||x.scope==='Toutes'||p.versions.includes(x.scope));
      const depts=[...new Set(eligible.map(p=>p.rayon||'Sans rayon'))].sort();
      const families=[...new Set(eligible.filter(p=>!rayon||p.rayon===rayon).map(p=>department(s,p)))].sort();
      const selected=plan.blocks.find(b=>b.id===selection&&b.page===page);
      const products=eligible.filter(p=>(!rayon||(p.rayon||'Sans rayon')===rayon)&&(!category||department(s,p)===category)&&(bank==='images'||!available||!x.products.includes(p.id))&&norm([p.name,p.ref,p.id,p.rayon].join(' ')).includes(norm(filter)));
      const assets=[],seen=new Set();
      for(const p of products)visuals(s,p).forEach((a,i)=>{if(!seen.has(a.url)){seen.add(a.url);assets.push({...a,product:p.id,index:i});}});
      return '<h3>Chutier</h3><div class="ed-bank-switch">'+[['products','Produits'],['images','Visuels']].map(([k,l])=>action('bank',l,'aria-pressed="'+(bank===k)+'" data-bank="'+k+'"')).join('')+'</div>'+field('Rayon','<select data-filter="rayon">'+option('','Tous les rayons',rayon)+depts.map(d=>option(d,d,rayon)).join('')+'</select>')+
        (isCatalogue(s,x)?field('Famille','<select data-filter="category">'+option('','Toutes les familles',category)+families.map(d=>option(d,d,category)).join('')+'</select>'):'')+
        field('Rechercher un produit','<input type="search" data-filter="search" value="'+esc(filter)+'" placeholder="Nom ou référence">')+
        (bank==='images'?'<div class="ed-count">'+assets.length+' visuels</div><div class="ed-bin">'+assets.map(a=>'<div class="ed-item" draggable="'+!locked+'" data-from="'+esc(a.product)+'" data-index="'+a.index+'"><img draggable="false" src="'+esc(a.url)+'" alt=""><div><b>'+esc(a.label)+'</b></div>'+(locked?'':action('image','+','data-product="'+esc(a.product)+'" data-index="'+a.index+'" aria-label="Placer le visuel '+esc(a.label)+'"'))+'</div>').join('')+'</div>':
        '<label class="ed-check"><input type="checkbox" data-filter="free" '+(available?'checked':'')+'> Non placés uniquement</label><div class="ed-count">'+products.length+' produit'+(products.length>1?'s':'')+'</div>'+
        '<div class="ed-bin">'+products.map(p=>{const b=plan.blocks.find(a=>a.id===p.id),im=photo(s,p);return '<div class="ed-item" draggable="'+!locked+'" data-from="'+esc(p.id)+'">'+
          (im?'<img draggable="false" src="'+esc(im)+'" alt="">':'<span class="ed-icon">◇</span>')+'<div><b>'+esc(p.name)+'</b><small>'+esc(euros(p.price))+' · '+(b?'Page '+b.page:'Non placé')+'</small></div>'+
          (locked?'':action('place','+','data-product="'+esc(p.id)+'" title="Placer sur la page '+page+'" aria-label="Placer '+esc(p.name)+' sur la page '+page+'"'))+'</div>'}).join('')+(products.length?'':'<p>Aucun produit pour ces filtres.</p>')+'</div>')+
        (!locked?action('text','Ajouter un bloc texte'):'')+
        (selected&&!locked?'<form class="ed-properties" data-edform="box"><h3>Bloc sélectionné</h3><p>'+esc(selected.name)+'</p>'+
          (selected.kind==='text'?field('Texte','<input name="text" required maxlength="220" value="'+esc(selected.name)+'">'):'')+
          '<div class="ed-coords">'+[['x','Gauche'],['y','Haut'],['w','Largeur'],['h','Hauteur']].map(([k,l])=>field(l+' (%)','<input type="number" step="0.01" min="0" max="100" required name="'+k+'" value="'+round(selected[k])+'">')).join('')+'</div><button class="ed-btn">Appliquer</button>'+action('remove','Retirer de la page')+'</form>':'');
    }
    const threads=(x.comments||[]).filter(c=>c.revision===rev&&c.page===page);
    const filtered=threads.filter(c=>filterNotes==='all'||(filterNotes==='done')===c.resolved);
    const signed=field('Signature','<input name="author" data-draft="author" maxlength="60" value="'+esc(author)+'" placeholder="Votre nom" required>');
    const count=threads.filter(c=>!c.resolved).length;
    return '<h3>Commentaires <small>'+threads.length+'</small></h3>'+field('Afficher','<select data-filter="notes">'+[['all','Tous les commentaires'],['open','À corriger'],['done','Résolus']].map(([v,l])=>option(v,l,filterNotes)).join('')+'</select>')+
      (!locked?'<form data-edform="note">'+signed+field('Correction demandée','<textarea data-draft="note" name="note" maxlength="1500" rows="3" required placeholder="Décrivez la correction à apporter…">'+esc(note)+'</textarea>')+
      '<div class="ed-anchor-label">'+(anchor?'Repère positionné sur la page':'Cliquez sur la page pour positionner le repère.')+'</div><button class="ed-btn ed-primary">'+(anchor?'Publier le commentaire':'Commenter la page')+'</button></form>':'')+
      '<div class="ed-count">'+count+' à corriger · page '+page+'</div><div class="ed-threads">'+filtered.map(c=>{
        const active=c.id===activeThread;
        return '<article class="ed-thread '+(active?'active':'')+'" data-thread="'+esc(c.id)+'"><button class="ed-thread-head" data-ed="focus" data-id="'+esc(c.id)+'"><b>'+((x.comments||[]).indexOf(c)+1)+' · '+esc(c.author)+'</b><span>'+ (c.resolved?'Résolu':'À corriger')+'</span></button><small>'+esc(time(c.at))+' · '+esc(c.actor)+'</small><p>'+esc(c.text)+'</p>'+
          c.replies.map(r=>'<div class="ed-response"><b>'+esc(r.author)+'</b> <small>'+esc(time(r.at))+'</small><p>'+esc(r.text)+'</p></div>').join('')+
          (!locked?'<div class="ed-thread-actions">'+action('reply','Répondre','data-id="'+esc(c.id)+'"')+(reviewer?'':action('resolve',c.resolved?'Rouvrir':'Marquer résolu','data-id="'+esc(c.id)+'"'))+'</div>':'')+
          (!locked&&active?'<form data-edform="reply">'+field('Réponse','<textarea name="response" data-draft="reply" required maxlength="1500">'+esc(reply)+'</textarea>')+'<button class="ed-btn">Publier la réponse</button></form>':'')+'</article>';
      }).join('')+(filtered.length?'':'<p>Aucun commentaire dans cette sélection.</p>')+'</div>';
  }
  function html(v) {
    const {x,s,mode,plan,page,reviewer,rev,locked}=v;
    const id=[context().workspace,x.id,mode,page,rev].join('/');
    if(id!==last){if(mode==='fer'){
      const ids=new Set(plan.blocks.filter(b=>b.page===page&&b.kind==='product').map(b=>b.id));
      const rayons=[...new Set(s.products.filter(p=>ids.has(p.id)).map(p=>p.rayon||'Sans rayon'))];
      rayon=rayons.length===1?rayons[0]:'';category='';filter='';
    }selection='';note='';reply='';anchor=null;activeThread='';invite='';draftId='';replyId='';last=id;}
    const known=isCatalogue(s,x), editing=mode==='fer';
    const revisions=[...new Set([x.revision,...(x.proofs||[]).map(p=>p.revision)])].sort((a,b)=>b-a);
    const threads=(x.comments||[]).filter(c=>c.revision===rev);
    const pins=editing?'':threads.filter(c=>c.page===page).map(c=>'<button class="ed-pin '+(c.resolved?'resolved ':'')+(activeThread===c.id?'active':'')+'" style="left:'+c.x+'%;top:'+c.y+'%" data-ed="focus" data-id="'+esc(c.id)+'" aria-label="Commentaire '+((x.comments||[]).indexOf(c)+1)+'">'+((x.comments||[]).indexOf(c)+1)+'</button>').join('');
    const sourceLabel=plan.mode==='catalogue'?'Catalogue original':plan.sent?'Mise en page transmise':plan.mode==='file'?'Fichier de production':'Composition Studio';
    return '<section class="ed-work" aria-label="'+(editing?'Chemin de fer':'BAT collaboratif')+'"><header class="ed-header"><div>'+
      (!reviewer?link(route('production',{id:x.id,page}),'← Dossier du support','quiet'):'<small>Accès relecteur</small>')+
      '<h1>'+esc(x.name)+'</h1><p>'+esc(s.op.title)+' · '+plan.pages+' page'+(plan.pages>1?'s':'')+' · '+esc(x.state)+(editing&&x.layoutDirty?' · Mise en page modifiée':'')+'</p></div><div class="ed-tools">'+
      (!reviewer?'<nav aria-label="Modes du support">'+[['fer','Chemin de fer'],['bat','BAT collaboratif']].map(([m,l])=>'<a href="'+esc(url(v,m,page))+'" '+(m===mode?'aria-current="page"':'')+'>'+l+'</a>').join('')+'</nav>':'')+
      (editing&&!locked?action('submit','Transmettre au BAT'):!editing&&!reviewer?action('invite','Inviter un relecteur'):'')+(!editing&&!reviewer&&!locked&&x.state==='En revue'?['En corrections','Validé'].map((step,i)=>'<button type="button" class="ed-btn" data-do="decision" data-id="'+esc(x.id+'|'+step)+'">'+(i?'Valider le BAT':'Demander des corrections')+'</button>').join(''):'')+'</div></header>'+
      (invite?'<div class="ed-share">'+field('Lien de relecture de ce support','<input readonly data-invite value="'+esc(invite)+'">')+action('copy','Copier le lien')+'</div>':'')+
      '<div class="ed-desk"><aside class="ed-pages"><h3>Pages</h3><nav aria-label="Pages du support">'+Array.from({length:plan.pages},(_,i)=>{const n=i+1;return '<a class="ed-thumb" href="'+esc(url(v,mode,n,editing?null:rev))+'" '+(n===page?'aria-current="page"':'')+' aria-label="Page '+n+' · '+esc(pageLabel(known,n))+'"><span class="ed-mini" aria-hidden="true">'+visual(plan,n,'',true)+'</span><b>'+String(n).padStart(2,'0')+'</b><small>'+esc(pageLabel(known,n))+'</small>'+(!editing&&threads.some(c=>c.page===n&&!c.resolved)?'<span class="ed-note-count">'+threads.filter(c=>c.page===n&&!c.resolved).length+' à corriger</span>':'')+'</a>'}).join('')+'</nav>'+(editing&&!locked?action('page','Ajouter une page'):'')+'</aside>'+
      '<section class="ed-stage"><div class="ed-stagebar"><strong>Page '+page+' <small>/ '+plan.pages+'</small></strong><span>'+esc(pageLabel(known,page))+'</span>'+
      (!editing?'<select aria-label="Révision du BAT" data-filter="revision">'+revisions.map(r=>option(r,'BAT R'+r,rev)).join('')+'</select>':'')+'<div class="ed-zoom">'+action('zoom-out','−','aria-label="Réduire le zoom"')+action('fit',Math.round(zoom*100)+' %','aria-label="Ajuster à la page"')+action('zoom-in','+','aria-label="Agrandir le zoom"')+'</div></div>'+
      '<div class="ed-board" style="--ed-zoom:'+zoom+'"><div class="ed-paper '+(editing?'editing':'reviewing')+'" aria-label="Page de travail '+page+'" tabindex="0">'+visual(plan,page,editing?selection:'',false,editing&&!locked)+pins+
      (anchor&&!editing?'<span class="ed-pin draft" style="left:'+anchor.x+'%;top:'+anchor.y+'%">+</span>':'')+'</div></div>'+
      '<footer>'+ (editing?'Glissez un produit sur la page. Sélectionnez un bloc pour le déplacer ou le redimensionner.':esc(sourceLabel)+' · '+(locked?'Consultation':'Cliquez sur la page pour ancrer une correction.'))+
      (plan.mode==='file'&&plan.file?' <a target="_blank" rel="noopener" href="'+esc(plan.file)+'">Ouvrir le fichier ↗</a>':'')+(known&&page<=6?' <a href="../assets/brico-deco/catalogue.pdf#page='+page+'" target="_blank" rel="noopener">PDF source ↗</a>':'')+'</footer></section>'+
      '<aside class="ed-side">'+panel(v)+'</aside></div></section>';
  }
  function mounted(v){
    if(v.plan.mode==='file')mountProof(v.plan,v.page,document.querySelector('.ed-paper'),api);
  }
  function redraw(){const root=document.querySelector('.ed-work'),v=current();if(root&&v){const scrollers=['.ed-pages','.ed-bin','.ed-side'];const pos=scrollers.map(q=>root.querySelector(q)?.scrollTop||0);root.outerHTML=html(v);mounted(v);scrollers.forEach((q,i)=>{const el=document.querySelector(q);if(el)el.scrollTop=pos[i];});}}
  function showPanel(){const el=document.querySelector('.ed-side'),v=current();if(v&&el)el.innerHTML=panel(v);}
  function payload(b){return {block:b.id,x:b.x,y:b.y,w:b.w,h:b.h,page:b.page,...(b.kind==='text'?{text:b.name}:{})};}
  async function write(v,action,values) {
    if(busy) return false;
    busy=true;
    try {await save(action,{id:v.x.id,...values},false);return true;}
    catch(e){notify(e.message);redraw();return false;}
    finally{busy=false;}
  }
  function point(e,element){const b=element.getBoundingClientRect();return {x:round(clamp((e.clientX-b.left)*100/b.width,0,100)),y:round(clamp((e.clientY-b.top)*100/b.height,0,100))};}
  async function place(v,id,pos,page=v.page){
    if(v.locked)return;
    const prior=v.plan.blocks.find(b=>b.id===id);
    const w=prior?.w||40,h=prior?.h||27;
    const box={block:id,step:'place',page,w:round(w),h:round(h),x:round(clamp(pos.x,0,100-round(w))),y:round(clamp(pos.y,0,100-round(h)))};
    if(await write(v,'layout',box)) {selection=id;redraw();notify('Placement enregistré sur la page '+page+'.');}
  }
  async function placeImage(v,product,index,pos,page=v.page){
    const block='img-'+crypto.randomUUID();
    if(await write(v,'layout',{step:'image',block,product,index,page,x:Math.min(pos.x,65),y:Math.min(pos.y,76),w:35,h:24})){selection=block;redraw();notify('Visuel placé sur la page '+page+'.');}
  }
  document.addEventListener('keydown',e=>{
    const el=e.target.closest('.ed-paper [data-block]'),v=current();if(!el||!v||v.locked||v.mode!=='fer')return;
    if(e.key==='Enter'||e.key===' '){e.preventDefault();selection=el.dataset.block;redraw();document.querySelector('.ed-properties input')?.focus();}
  });
  document.addEventListener('input',e=>{
    if(e.target.dataset.draft){const k=e.target.dataset.draft;if(k==='author'){author=e.target.value;try{localStorage.setItem('studio.bat.signature',author);}catch{}}if(k==='note')note=e.target.value;if(k==='reply')reply=e.target.value;}
    if(e.target.dataset.filter==='search'){filter=e.target.value;const cursor=e.target.selectionStart;showPanel();const search=document.querySelector('[data-filter="search"]');search.focus();search.setSelectionRange(cursor,cursor);}
  });
  document.addEventListener('change',e=>{const v=current(),k=e.target.dataset.filter;if(!v||!k)return;
    if(k==='revision'){location.hash=url(v,'bat',v.page,e.target.value);return;}
    if(k==='free')available=e.target.checked;if(k==='rayon'){rayon=e.target.value;category='';}if(k==='category')category=e.target.value;if(k==='notes')filterNotes=e.target.value;if(k!=='search')showPanel();
  });
  document.addEventListener('dragstart',e=>{const t=e.target.closest('[data-from]');if(!t)return;e.dataTransfer.setData('application/x-studio-product',t.dataset.from);if(t.dataset.index!==undefined)e.dataTransfer.setData('application/x-studio-media',t.dataset.index);e.dataTransfer.effectAllowed='move';});
  document.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('application/x-studio-product')&&e.target.closest('.ed-paper,.ed-thumb')){e.preventDefault();e.dataTransfer.dropEffect='move';}});
  document.addEventListener('drop',async e=>{const v=current(),t=e.target.closest('.ed-paper,.ed-thumb'),id=e.dataTransfer.getData('application/x-studio-product');if(!v||v.mode!=='fer'||!t||!id)return;e.preventDefault();const dest=t.matches('.ed-thumb')?Number(new URLSearchParams(t.hash.split('?')[1]).get('page')):v.page;const pos=t.matches('.ed-paper')?point(e,t):{x:5,y:6};if(e.dataTransfer.types.includes('application/x-studio-media'))await placeImage(v,id,Number(e.dataTransfer.getData('application/x-studio-media')),pos,dest);else await place(v,id,pos,dest);});
  document.addEventListener('pointerdown',e=>{
    const v=current(),paper=e.target.closest('.ed-paper');if(!v||!paper||v.locked||e.target.closest('[data-ed]')||e.button!==0)return;
    const pt=point(e,paper);
    if(v.mode==='bat'){if(v.plan.mode==='file' && paper.dataset.proofReady!=='true'){notify('Attendez le chargement de la page pour y poser un repère.');return;}anchor=pt;redraw();document.querySelector('[data-draft="note"]')?.focus({preventScroll:true});return;}
    const el=e.target.closest('[data-block]');if(!el){selection='';redraw();return;}
    const b=v.plan.blocks.find(b=>b.id===el.dataset.block);if(!b)return;
    e.preventDefault();selection=b.id;drag={id:e.pointerId,b,pt,el,paper,resize:!!e.target.closest('.ed-grip'),v,box:{...b}};
    el.setPointerCapture(e.pointerId);el.classList.add('picked');
  });
  document.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const {b,pt,paper,el,resize}=drag,p=point(e,paper),dx=p.x-pt.x,dy=p.y-pt.y;
    drag.box=resize?{...b,w:round(clamp(b.w+dx,6,100-b.x)),h:round(clamp(b.h+dy,4,100-b.y))}:{...b,x:round(clamp(b.x+dx,0,100-b.w)),y:round(clamp(b.y+dy,0,100-b.h))};
    el.setAttribute('style',rect(drag.box));
  });
  document.addEventListener('pointercancel',()=>{if(drag){drag=null;redraw();}});
  document.addEventListener('pointerup',async e=>{if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;
    const dest=document.elementFromPoint(e.clientX,e.clientY)?.closest('.ed-thumb');
    if(dest){const page=Number(new URLSearchParams(dest.hash.split('?')[1]).get('page'));
      if(page!==d.v.page){if(await write(d.v,'layout',{step:'place',...payload(d.b),page}))location.hash=url(d.v,'fer',page);return;}}
    if(['x','y','w','h'].some(k=>Math.abs(d.box[k]-d.b[k])>.04))await write(d.v,'layout',{step:'place',...payload(d.box)});
    redraw();
  });
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-ed]'),v=current();if(!b||!v)return;
    const k=b.dataset.ed,id=b.dataset.id;
    try{
      if(['zoom-in','zoom-out','fit'].includes(k)){zoom=k==='fit'?1:clamp(zoom+(k==='zoom-in'?0.25:-0.25),.5,2.5);redraw();return;}
      if(k==='bank'){bank=b.dataset.bank;showPanel();return;}
      if(k==='image')return await placeImage(v,b.dataset.product,Number(b.dataset.index),{x:5,y:6});
      if(k==='place')return await place(v,b.dataset.product,{x:5,y:6});
      if(k==='page'){if(await write(v,'layout',{step:'page'}))location.hash=url(v,'fer',v.x.pages+1);return;}
      if(k==='text'){const block='txt-'+crypto.randomUUID();if(await write(v,'layout',{step:'text',block,text:'Votre texte',page:v.page,x:8,y:8,w:55,h:12})){selection=block;redraw();const input=document.querySelector('.ed-properties input[name="text"]');input?.focus();input?.select();}return;}
      if(k==='remove'){if(await write(v,'layout',{step:'remove',block:selection})){selection='';redraw();}return;}
      if(k==='submit'){if(await write(v,'submitLayout',{})){notify('La mise en page est disponible en relecture.');location.hash=url(v,'bat',v.page);}return;}
      if(k==='focus'||k==='reply'){activeThread=id;reply='';replyId='';redraw();const card=[...document.querySelectorAll('.ed-thread')].find(el=>el.dataset.thread===id);if(k==='reply')card?.querySelector('textarea')?.focus();else card?.scrollIntoView({block:'nearest'});return;}
      if(k==='resolve'){const c=v.x.comments.find(c=>c.id===id);if(await write(v,'annotation',{step:'resolve',noteId:id,page:v.page,revision:v.rev,resolved:!c.resolved}))redraw();return;}
      if(k==='invite'){const res=await api('/review-invite',{id:v.x.id});const u=new URL(location.href);u.search=new URLSearchParams({op:v.s.op.id,relecture:v.x.id});u.hash='acces='+res.key;invite=u.href;redraw();document.querySelector('[data-invite]')?.select();return;}
      if(k==='copy'){await navigator.clipboard.writeText(invite);notify('Lien de relecture copié.');}
    }catch(err){notify(err.message);}
  });
  document.addEventListener('submit',async e=>{
    const form=e.target.closest('[data-edform]'),v=current();if(!form||!v)return;e.preventDefault();
    const data=new FormData(form),type=form.dataset.edform;
    if(type==='box'){const b=v.plan.blocks.find(b=>b.id===selection);if(!b)return;const values=payload(b);
      for(const k of ['x','y','w','h'])values[k]=Number(data.get(k));
      if(data.has('text'))values.text=data.get('text');
      if(await write(v,'layout',{step:'place',...values}))redraw();return;}
    if(!author.trim()){notify('Indiquez votre signature.');document.querySelector('[data-draft="author"]')?.focus();return;}
    const add=type==='note',sent=await write(v,'annotation',{step:add?'add':'reply',page:v.page,revision:v.rev,author:author.trim(),text:(add?note:reply).trim(),noteId:add?(draftId||=crypto.randomUUID()):activeThread,...(add?(anchor||{x:50,y:50}):{replyId:replyId||=crypto.randomUUID()})});
    if(sent){if(add){activeThread=draftId;note='';anchor=null;draftId='';}else {reply='';replyId='';}redraw();notify('Commentaire enregistré.');}
  });
  return {current,html,mounted,redraw,canRefresh:()=>!busy&&!drag&&!document.activeElement?.closest('.ed-side form,.ed-share')};
}
