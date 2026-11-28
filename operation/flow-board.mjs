import {esc,route} from './views.mjs?v=20261128.6';
import {eligible} from '../server/model.mjs';
import {bricoId,missingBonialUnit} from '../server/brico.mjs?v=20261128.5';

const icons={
  catalogue:'<path d="M3 5c3-1 6 0 9 2 3-2 6-3 9-2v13c-3-1-6 0-9 2-3-2-6-3-9-2zM12 7v13"/>',
  bonial:'<path d="M4 5h15v13H4zM8 9h7M8 13h4M8 21h13V9"/>',
  tiendeo:'<path d="m3 11 8-8h9v9l-8 8z"/><circle cx="16" cy="7" r="1"/>',
  export:'<path d="M13 3H5v18h14V9zM13 3v6h6M8 15h8m-3-3 3 3-3 3"/>',
  search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>'
};
const svg=key=>'<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+icons[key]+'</svg>';
const norm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
const day=value=>String(value||'').slice(0,10);
const french=date=>/^\d{4}-\d\d-\d\d$/.test(day(date))?day(date).split('-').reverse().join('/'):'—';
const boardKeys=['recherche','destination','version','statut','validite','publication','tri'];
export function boardParams(q){
  const p=Object.fromEntries(boardKeys.map(k=>[k,q.get(k)]).filter(([,v])=>v));
  if(!p.destination&&q.get('famille'))p.destination=q.get('famille');
  if(p.destination==='\u00c9-catalogue')p.destination='E-catalogue';
  return p;
}
const flowFamily=name=>/\bbonial\b/i.test(name)?'Bonial':/\btiendeo\b/i.test(name)?'Tiendeo':name;
const familyIcon=name=>({'E-catalogue':'catalogue',Bonial:'bonial',Tiendeo:'tiendeo'})[name]||'export';
function filterSelect(key,label,options,value,all){
  return '<label class="board-select"><span class="visually-hidden">'+label+'</span><select name="'+key+'" aria-label="'+label+'"><option value="">'+all+'</option>'+
    options.map(([id,name])=>'<option value="'+esc(id)+'"'+(value===id?' selected':'')+'>'+esc(name)+'</option>').join('')+'</select></label>';
}
function filterDate(name,label,value){
  return '<label class="board-date"><span>'+label+'</span><input type="date" name="'+name+'" value="'+esc(value)+'"></label>';
}
function entries(s,editions,p){
  const all=s.config.versions.map(v=>v.id);
  const records=[];
  for(const x of s.supports.filter(x=>/^e-catalogue\b/i.test(x.name)||x.id==='bd-ecatalogue')){
    const territorial=s.op.id===bricoId && x.id==='bd-ecatalogue';
    const pilot=territorial&&s.kit;
    const versions=territorial?[...new Set(editions.map(e=>e[2]))]:all.includes(x.scope)?[x.scope]:all;
    records.push({name:'E-catalogue',label:x.name,versions,stage:pilot?'Aperçu de recette':x.state||'En préparation',
      planned:pilot?'2027-01-18':'',observed:pilot?'2027-01-20':'',
      url:v=>territorial?route('flux',{...p,vue:'editions',assortiment:v}):route('production',{id:x.id})});
  }
  for(const f of s.flows){
    const missing=missingBonialUnit(s,f);
    records.push({name:flowFamily(f.name),label:f.name,versions:[all.includes(f.v)?f.v:'sans-version'],
      stage:missing||f.review?'À vérifier':f.stage||'À contrôler',
      reason:missing?'Unité de vente de '+missing.name+' à renseigner':f.review?'Offre modifiée depuis la remise':'',
      observed:day(f.delivered||f.generated||f.checked),url:()=>route('flux',{...p,id:f.id})});
  }
  return records;
}
function statusTone(stage){
  if(['À corriger','À vérifier','En corrections'].includes(stage))return 'alert';
  if(['Validé','Contrôlé','Remis','Généré'].includes(stage))return 'good';
  return 'pending';
}
function badge(record,version,duplicate){
  const icon=familyIcon(record.name),label=[record.label,version,record.stage,record.reason].filter(Boolean).join(' · ');
  return '<a class="flow-badge" href="'+esc(record.url(version))+'" aria-label="'+esc(label)+'" title="'+esc(label)+'">'+
    '<span class="flow-symbol symbol-'+icon+'">'+svg(icon)+'</span><span class="flow-reading">'+
    (duplicate?'<strong>'+esc(record.label)+'</strong>':'')+'<span class="flow-state tone-'+statusTone(record.stage)+'">'+esc(record.stage)+'</span>'+
    (record.observed?'<time datetime="'+esc(record.observed)+'">'+french(record.observed)+'</time>':'')+'</span></a>';
}
export function flowBoard(s,q,editions){
  const p=boardParams(q),records=entries(s,editions,p),configured=s.config.versions;
  const names=[...new Set([...(s.op.id===bricoId?['E-catalogue','Bonial','Tiendeo']:[]),...records.map(c=>c.name)])];
  const states=[...new Set(records.map(c=>c.stage))];
  if(names.length)states.push('Non prévu');
  const columns=p.destination?names.filter(name=>name===p.destination):names;
  const versions=configured.map(v=>({...v,count:eligible(s,v.id).length}));
  if(records.some(c=>c.versions.includes('sans-version')))versions.push({id:'sans-version',name:'À affecter',count:null});
  const term=norm(p.recherche).trim();
  const rows=[];
  for(const version of versions){
    if(p.version&&p.version!==version.id)continue;
    if(p.validite&&!(s.op.start<=p.validite&&p.validite<=s.op.end))continue;
    const cells=columns.map(name=>records.filter(c=>c.name===name&&c.versions.includes(version.id)));
    const matching=cells.map(items=>items.filter(c=>(!p.statut||c.stage===p.statut)&&(!p.publication||c.planned===p.publication)));
    const notPlanned=p.statut==='Non prévu'&&!p.publication&&cells.some(items=>!items.length);
    if((p.statut||p.publication||p.destination&&!columns.length)&&!notPlanned&&!matching.some(items=>items.length))continue;
    const searchable=[s.op.id,s.op.title,version.id,version.name,version.desc,...matching.flat().flatMap(c=>[c.name,c.label,c.stage,c.reason])];
    if(term&&!norm(searchable.join(' ')).includes(term))continue;
    rows.push({version,cells,matching});
  }
  const sort=p.tri||'version',byName=sort.replace(/^-/,'')==='nom';
  rows.sort((a,b)=>String(a.version[byName?'name':'id']).localeCompare(String(b.version[byName?'name':'id']),'fr',{numeric:true})*(sort.startsWith('-')?-1:1));
  const sortable=(key,title)=>'<th scope="col"'+(sort.replace(/^-/,'')===key?' aria-sort="'+(sort.startsWith('-')?'descending':'ascending')+'"':'')+'><a href="'+esc(route('flux',{...p,tri:sort===key?'-'+key:key}))+'">'+title+' <span aria-hidden="true">'+(sort===key?'↑':sort==='-'+key?'↓':'↕')+'</span></a></th>';
  const activeFilters=Object.keys(p).filter(k=>!['tri','recherche'].includes(k)).length;
  const filters='<form id="flow-filters" class="board-filters" role="search"><label class="board-query">'+svg('search')+'<input type="search" name="recherche" aria-label="Rechercher dans les flux" placeholder="Rechercher…" value="'+esc(p.recherche)+'"></label>'+
    '<button type="button" class="board-toggle" data-flow-toggle aria-expanded="false" aria-controls="board-options">Filtres'+(activeFilters?' ('+activeFilters+')':'')+'</button><div id="board-options" class="board-options">'+
    filterSelect('destination','Destination',names.map(v=>[v,v]),p.destination,'Tous les flux')+
    filterSelect('version','Version',versions.map(v=>[v.id,v.id==='sans-version'?v.name:v.id]),p.version,'Versions')+
    filterSelect('statut','État du flux',states.map(v=>[v,v]),p.statut,'États')+
    filterDate('validite','Validité',p.validite)+filterDate('publication','Publication prévue',p.publication)+'</div>'+
    '<button type="submit" class="board-apply">Filtrer</button>'+(Object.keys(p).length?'<a href="#flux" class="board-reset">Réinitialiser</a>':'')+'</form>';
  const head='<thead><tr>'+sortable('version','Version')+sortable('nom','Assortiment')+'<th scope="col">Validité</th><th scope="col">Publication prévue</th>'+
    columns.map(n=>'<th scope="col" class="flow-head">'+(n==='E-catalogue'&&s.op.id===bricoId&&editions.length&&s.supports.some(x=>x.id==='bd-ecatalogue')?'<a href="'+esc(route('flux',{...p,vue:'editions'}))+'" title="Toutes les éditions E-catalogue">'+esc(n)+'</a>':esc(n))+'</th>').join('')+'</tr></thead>';
  const body=rows.map(({version:v,cells,matching})=>{
    const planned=[...new Set(matching.flat().map(c=>c.planned).filter(Boolean))].sort();
    return '<tr><th scope="row"><span class="version-code">'+esc(v.id==='sans-version'?'—':v.id)+'</span></th><td class="assortment"><strong>'+esc(v.name)+'</strong>'+
      (v.count!==null?'<small>'+v.count+' offre'+(v.count===1?'':'s')+'</small>':'')+'</td><td data-label="Validité"><span class="flow-period"><span>'+french(s.op.start)+'</span><span>'+french(s.op.end)+'</span></span></td><td data-label="Publication prévue">'+(planned.length?planned.map(french).join('<br>'):'—')+'</td>'+
      columns.map((name,i)=>'<td data-label="'+esc(name)+'" class="flow-cell">'+(matching[i].length?matching[i].map(c=>badge(c,v.id,matching[i].length>1)).join(''):!cells[i].length?'<span class="flow-off"><span class="flow-symbol">'+svg(familyIcon(name))+'</span>Non prévu</span>':'<span class="flow-muted">Hors filtre</span>')+'</td>').join('')+'</tr>';
  }).join('');
  return '<section class="flow-board" aria-labelledby="flow-title"><div class="board-heading"><h2 id="flow-title">Mes flux</h2></div>'+filters+
    (!records.length?'<div class="flow-empty"><p>Aucun flux configuré pour cette opération.</p><a href="#supports">Ouvrir les supports en préparation</a></div>':
      rows.length?'<div class="flow-scroll" tabindex="0" role="region" aria-label="Flux par version et destination"><table>'+head+'<tbody>'+body+'</tbody></table></div>':
      '<div class="flow-empty" role="status"><p>Aucun flux pour ces critères.</p><a href="#flux">Effacer les filtres</a></div>')+'</section>';
}
