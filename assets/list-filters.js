/* Les filtres portent uniquement sur la liste affichée. Leur état voyage avec son URL. */
const filterLabels={
  op:'Opération',reseau:'Réseau',phase:'Phase',periode:'Période commerciale',contenu:'Type de contenu',
  rayon:'Rayon',marque:'Marque',mecanique:'Type d’offre',qualite:'Données produit',
  famille:'Famille',type:'Type de support',zone:'Déclinaison',magasin:'Magasin engagé',etat:'État',
  version:'Version',fichier:'Fichier',engagement:'Engagement',support:'Support',jalon:'Jalon',
  identifiant:'Code point de vente',composition:'Composition',nature:'Type d’activité',suivi:'Suivi',priorite:'Priorité'
};
const sortLabels={
  nom:'Nom (A à Z)',nomDesc:'Nom (Z à A)',prix:'Prix croissant',prixDesc:'Prix décroissant',
  debut:'Début le plus ancien',debutDesc:'Début le plus récent',date:'Échéance la plus proche',
  dateDesc:'Échéance la plus lointaine',revDesc:'Révision décroissante',code:'Code point de vente',
  recent:'Plus récent en premier',ancien:'Plus ancien en premier',groupe:'Par support',dossier:'Dossiers ouverts en premier',urgence:'Priorité puis échéance'
};
const compareFrench=new Intl.Collator('fr',{numeric:true,sensitivity:'base'});
function filterParams(){return new URLSearchParams(location.hash.split('?').slice(1).join('?'))}
function writeFilterParams(params){
  const path=location.hash.split('?')[0]||'#accueil',query=params.toString();
  window.history.replaceState(null,'',path+(query?'?'+query:''));
}
function facetValues(row,key){
  const value=row[key];
  return Array.isArray(value)?value:value==null||value===''?[]:[value];
}
function facetLabel(key,value){
  if(key==='priorite')return Object.hasOwn(priorityGroups,value)?priorityGroups[value]:value;
  if(key==='op')return opById(value)?.nom||value;
  if(key==='support'){const s=S.supports.find(s=>s.id===value);return s?titre(s):value}
  if(key==='magasin'){const m=S.magasins.find(m=>m.id===value);return m?[m.nom,m.code].filter(Boolean).join(' · '):value}
  if(key==='contenu')return Object.hasOwn(directories,value)?directories[value].item:value;
  return value;
}
function compareRows(a,b,sort){
  if(['groupe','urgence','dossier'].includes(sort))return 0;
  const field=({prixDesc:'prix',debutDesc:'debut',dateDesc:'date',revDesc:'rev',nom:'name',nomDesc:'name',recent:'date',ancien:'date'})[sort]||sort;
  const x=a[field],y=b[field];
  if(x==null||x===''||y==null||y==='')return Number(x==null||x==='')-Number(y==null||y==='');
  const cmp=typeof x==='number'&&typeof y==='number'?x-y:compareFrench.compare(x,y);
  const desc=sort.endsWith('Desc')||sort==='recent';
  return (desc?-cmp:cmp)||compareFrench.compare(a.name||'',b.name||'');
}
function filterList(rows,keys,sorts,{prefix='',searchKey='',query='',matches,ids={},options={}}={}){
  const params=filterParams();
  const selected=Object.fromEntries(keys.map(k=>[k,params.get(prefix+k)||'']));
  const active=keys.filter(k=>selected[k]);
  const chosen=params.get(prefix+'tri'),sort=sorts.includes(chosen)?chosen:sorts[0];
  const accepts=(r,except)=>active.every(k=>k===except||facetValues(r,k).includes(selected[k]));
  const visible=rows.filter(r=>accepts(r)&&(!query||!matches||matches(r,query))).sort((a,b)=>compareRows(a,b,sort));
  const select=(key,title,choices,value,id)=>`<label>${title}<select id="${esc(id||'filter-'+prefix+key)}" data-facet="${esc(prefix+key)}">${choices.map(([k,label])=>`<option value="${esc(k)}"${k===value?' selected':''}>${esc(label)}</option>`).join('')}</select></label>`;
  const controls=keys.map(key=>{
    const values=new Set(rows.filter(r=>accepts(r,key)).flatMap(r=>facetValues(r,key)));
    if(!active.some(k=>k!==key)||key==='contenu')for(const v of options[key]||[])values.add(v);
    if(selected[key])values.add(selected[key]);
    const choices=[...values].map(v=>[v,facetLabel(key,v)]).sort((a,b)=>compareFrench.compare(a[1],b[1]));
    const all=['op','phase','periode','marque','qualite','famille','zone','version','composition','nature','priorite'].includes(key)?'Toutes':'Tous';
    return select(key,filterLabels[key],[['',all],...choices],selected[key],ids[key]);
  }).join('');
  const sortChoices=sorts.map((k,i)=>[i?k:'',sortLabels[k]]);
  const resetKeys=[...keys,'tri'].map(k=>prefix+k).concat(searchKey?[searchKey]:[]).join(' ');
  const changed=active.length>0||sort!==sorts[0]||!!query;
  const toolbar=`<div class="list-filters" role="group" aria-label="Filtres et tri"><div class="filters-heading"><strong>${uiIcon('filter')} Filtres et tri</strong><button type="button" class="filter-reset" data-reset-filters="${resetKeys}"${changed?'':' disabled'}>Effacer les filtres</button></div><div class="filter-fields">${controls}${select('tri','Trier par',sortChoices,sort===sorts[0]?'':sort)}</div></div>`;
  return {visible,toolbar,changed,sort,count:`<p class="filter-count" role="status">${visible.length} sur ${rows.length}</p>`};
}
function refreshFilteredView(control,resetKeys){
  const params=filterParams();
  if(resetKeys){for(const key of resetKeys.split(' '))params.delete(key)}
  else if(control.value)params.set(control.dataset.facet||'q',control.value);
  else params.delete(control.dataset.facet||'q');
  writeFilterParams(params);
  const open=[...document.querySelectorAll('#view details[id][open]')].map(el=>el.id);
  const text=control.type==='search',start=text?control.selectionStart:null,end=text?control.selectionEnd:null;
  const panel=control.closest('.list-filters');
  const focusId=resetKeys?panel?.querySelector('select')?.id:control.id;
  render();
  for(const id of open){const detail=document.getElementById(id);if(detail)detail.open=true}
  const focus=document.getElementById(focusId);
  if(focus){focus.focus({preventScroll:true});if(text&&start!=null)focus.setSelectionRange(start,end)}
}
