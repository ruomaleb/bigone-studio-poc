// Positions are percentages of the printed page, independent of the browser viewport.
import {bricoId, catalogueId} from './brico.mjs';
const check = (ok, message, status = 422) => {
  if (!ok) throw Object.assign(new Error(message), {status});
};
const stamp = () => new Date().toISOString();
const bounded = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi;
const short = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;
export const isCatalogue = (s, x) => s.op.id === bricoId && x.id === catalogueId;
export function photo(s,p) {
  if (Array.isArray(p.media)) return p.media.find(m=>m?.kind==='image' && /^https:\/\//i.test(m.url))?.url || '';
  if (s.op.id === bricoId && /^bd-(0[1-9]|1[0-9]|2[01])$/.test(p.id)) return '../assets/brico-deco/'+p.id+'.webp';
  const demo = {'s49-08':'emmental','s49-09':'cafe','s49-05':'champagne'};
  return s.op.id==='u-2649-pbs' && demo[p.id] ? '../assets/produits/'+demo[p.id]+'.webp' : '';
}
export function visuals(s,p) {
  const assets=(p.media||[]).filter(m=>['image','logo'].includes(m.kind)&&/^https:\/\//i.test(m.url)).map(m=>({url:m.url,label:m.label||p.name}));
  if(Array.isArray(p.media))return assets;
  const image=photo(s,p);
  if(image)assets.push({url:image,label:p.name});
  if(s.op.id===bricoId && /^bd-\d{2}$/.test(p.id))assets.push({url:'../assets/brico-deco/logo-catalogue.webp',label:'Logo Nanotera'});
  return assets;
}
export function compose(s,x) {
  const groups = new Map();
  for (const p of s.products.filter(p=>x.products.includes(p.id))) {
    const page = Math.max(1,Math.min(x.pages, Number(x.useByPage?.[p.id] ?? p.page) || 1));
    if (!groups.has(page)) groups.set(page,[]);
    groups.get(page).push(p);
  }
  const blocks = [];
  for (const [page, products] of groups) {
    const cols = products.length===1 ? 1 : products.length>8 ? 3 : 2;
    const rows = Math.max(2,Math.ceil(products.length/cols));
    products.forEach((p,i)=>{
      const saved=x.layout?.[p.id];
      const box=saved?.page===page ? saved : {x:4+(i%cols)*92/cols,y:7+Math.floor(i/cols)*87/rows,w:92/cols-2,h:87/rows-2};
      blocks.push({id:p.id,kind:'product',name:p.name,price:p.price,image:photo(s,p),page,x:box.x,y:box.y,w:box.w,h:box.h});
    });
  }
  return {pages:x.pages,mode:'composition',covers:isCatalogue(s,x),blocks:[...blocks,...structuredClone(x.textBlocks||[]),...structuredClone(x.imageBlocks||[])]};
}
export function proof(s,x,revision=x.revision) {
  const saved=(x.proofs||[]).find(p=>p.revision===revision);
  if (saved) return saved;
  if (revision!==x.revision) return null;
  if (isCatalogue(s,x) && x.revision===1 && !x.attachment && (!x.file || x.file.endsWith('/brico-deco/catalogue.pdf'))) {
    return {revision,pages:6,mode:'catalogue',blocks:[]};
  }
  if(x.attachment || /^https:\/\//i.test(x.file||'')) {
    return {revision,pages:x.pages,mode:'file',file:x.attachment?'':x.file,attachment:x.attachment||null,blocks:[]};
  }
  return {revision,...compose(s,x)};
}
function freeze(s,x) {
  const current=proof(s,x);
  x.proofs ||= [];
  if (!x.proofs.some(v=>v.revision===current.revision)) x.proofs.push(structuredClone(current));
}
export function preserveProof(s,x) { freeze(s,x); }
export function editLayout(s,x,p) {
  check(!['Validé','Remis'].includes(x.state),'Ouvrez une nouvelle révision avant de modifier cette mise en page.');
  freeze(s,x);
  x.layout||={};
  for (const b of compose(s,x).blocks.filter(b=>b.kind==='product')) {
    x.layout[b.id]={x:b.x,y:b.y,w:b.w,h:b.h,page:b.page};
  }
  if (p.step==='page') {
    check(x.pages<200,'La limite est de 200 pages.');
    x.pages++;
  } else {
    const product=s.products.find(t=>t.id===p.block);
    const text=(x.textBlocks||[]).find(t=>t.id===p.block);
    const image=(x.imageBlocks||[]).find(t=>t.id===p.block);
    const imageSource=p.step==='image' && s.products.find(a=>a.id===p.product&&(!x.scope||x.scope==='Toutes'||a.versions.includes(x.scope)));
    const asset=imageSource && Number.isInteger(p.index) && visuals(s,imageSource)[p.index];
    const newImage=asset&&/^img-[a-f0-9-]{36}$/.test(p.block);

    check(product||text||image||newImage||(p.step==='text' && /^txt-[a-f0-9-]{36}$/.test(p.block)), 'Contenu absent.');
    if (p.step==='remove') {
      if (product) {
        x.products=x.products.filter(id=>id!==product.id);
        if(x.useByPage) delete x.useByPage[product.id];
        if(x.layout) delete x.layout[product.id];
      } else if(image) x.imageBlocks=x.imageBlocks.filter(b=>b.id!==image.id);
      else x.textBlocks=x.textBlocks.filter(b=>b.id!==text.id);
    } else {
      check(['place','text','image'].includes(p.step),'Action de mise en page inconnue.');
      check(Number.isInteger(p.page)&&bounded(p.page,1,x.pages),'Page incorrecte.');
      check(bounded(p.w,6,100)&&bounded(p.h,4,100)&&bounded(p.x,0,100-p.w+0.001)&&bounded(p.y,0,100-p.h+0.001),'Le bloc doit rester dans la page.');
      const box={page:p.page,x:p.x,y:p.y,w:p.w,h:p.h};
      if(product){
        check(!x.scope||x.scope==='Toutes'||product.versions.includes(x.scope),'Produit hors assortiment.');
        if(!x.products.includes(product.id)) x.products.push(product.id);
        (x.useByPage||={})[product.id]=p.page;
        (x.layout||={})[product.id]=box;
      } else if(image||newImage){
        if(image)Object.assign(image,box);
        else {check((x.imageBlocks||[]).length<300,'Le support comporte déjà 300 visuels.');
          (x.imageBlocks||=[]).push({id:p.block,kind:'image',name:asset.label,image:asset.url,...box});}
      } else {
        check(short(p.text || text?.name,220),'Texte requis (220 caractères maximum).');
        const value={id:p.block,kind:'text',name:(p.text||text.name).trim(),...box};
        if(text) Object.assign(text,value);
        else {check((x.textBlocks||[]).length<300,'Le support comporte déjà 300 blocs texte.'); (x.textBlocks||=[]).push(value);}
      }
    }
  }
  x.layoutDirty=true;
  if(x.state==='En revue') x.review=true;
}
export function submitLayout(s,x) {
  check(!['Validé','Remis'].includes(x.state),'Ouvrez une nouvelle révision avant la transmission.');
  const next=compose(s,x);
  check(next.blocks.length||next.covers,'Placez un contenu avant de transmettre le BAT.');
  freeze(s,x);
  // Once seen or annotated, a proof cannot acquire different geometry or prices.
  const current=proof(s,x);
  if(x.state==='En revue' && !x.review && !x.layoutDirty && current.mode==='composition' && JSON.stringify(current.blocks)===JSON.stringify(next.blocks)) return false;
  const old=x.revision;
  if (x.state!=='En préparation' || (x.comments||[]).some(c=>c.revision===old) || current.mode==='catalogue' || x.proofs.some(v=>v.revision===old && v.sent)) x.revision++;
  x.proofs=x.proofs.filter(v=>v.revision!==x.revision);
  x.proofs.push({...next,revision:x.revision,sent:stamp()});
  x.state='En revue'; x.review=false; x.layoutDirty=false;
  return true;
}
export function annotate(s,x,p,actor) {
  check(p.revision===x.revision,'Cette révision est archivée. Rouvrez le BAT actuel.',409);
  check(!['Validé','Remis'].includes(x.state),'Le BAT est clos. Ouvrez une nouvelle révision.');
  const version=proof(s,x);
  check(Number.isInteger(p.page)&&bounded(p.page,1,version.pages),'Page inconnue.');
  freeze(s,x);
  const list=x.comments||=[];
  if(p.step==='add'){
    const exists=list.find(c=>c.id===p.noteId);
    if(exists) {check(exists.actor===actor&&exists.text===p.text&&exists.page===p.page,'Identifiant déjà utilisé.');return false;}
    check(/^[a-f0-9-]{36}$/.test(p.noteId)&&short(p.text,1500)&&short(p.author,60)&&bounded(p.x,0,100)&&bounded(p.y,0,100),'Auteur, commentaire et position requis.');
    check(list.length<1200,'Nombre maximal de commentaires atteint.');
    list.push({id:p.noteId,revision:p.revision,page:p.page,x:p.x,y:p.y,text:p.text.trim(),author:p.author.trim(),actor,at:stamp(),resolved:false,replies:[]});
  } else {
    const c=list.find(n=>n.id===p.noteId&&n.revision===p.revision&&n.page===p.page);
    check(c,'Commentaire absent.');
    if(p.step==='reply'){
      check(short(p.author,60)&&short(p.text,1500)&&c.replies.length<100,'Saisissez un nom et une réponse (1 500 caractères maximum).');
      check(/^[a-f0-9-]{36}$/.test(p.replyId),'Identifiant de réponse incorrect.');
      if(c.replies.some(r=>r.id===p.replyId)) return false;
      c.replies.push({id:p.replyId,author:p.author.trim(),actor,text:p.text.trim(),at:stamp()});
    } else {
      check(p.step==='resolve'&&typeof p.resolved==='boolean','Action de commentaire inconnue.');
      if(c.resolved===p.resolved)return false;
      c.resolved=p.resolved;
    }
  }
  return true;
}
// A review invitation only exposes renderable proofs and threads for its one support.
export function reviewerState(s,x) {
  return {op:{id:s.op.id,title:s.op.title,closed:!!s.op.closed},supports:[{
    id:x.id,name:x.name,state:x.state,revision:x.revision,pages:x.pages,comments:x.comments||[],
    proofs:[...(x.proofs||[]).filter(p=>p.revision!==x.revision),proof(s,x)]
  }]};
}
