import {esc,tag,btn,card,table,route,link,sel,field,euros,flows} from './views.mjs';
import {eligible} from '../server/model.mjs';
import {photo} from '../server/edition.mjs';

const editions=[['NT-V1-SUD','Sud','V1'],['NT-V1-OUEST','Ouest','V1'],['NT-V2-EST','Est','V2'],['NT-V3-NORD','Nord','V3']];
const homeOffers=['bd-03','bd-01','bd-06','bd-04'];
const content=[
  ['Les matières de Gaia','bd-03','Image','Ordinateur et mobile','Avant produit','Fiche offre','2027-01-19'],
  ['Poser la suspension','bd-01','Vidéo','Mobile','Après produit','Lien externe','2027-01-19'],
  ['Choisir son miroir','bd-06','Image','Ordinateur et mobile','Avant produit','Fiche offre','2027-01-25']
];
const tr=(...v)=>'<tr>'+v.map(s=>'<td>'+s+'</td>').join('')+'</tr>';
const go=(vue,label,params={},cls='act')=>link(route('flux',{...params,vue}),label,cls);
export function monitor(s,q,network=[]) {
  const view=q.get('vue')||'suivi',source=q.get('depuis')==='reseau'?'reseau':'suivi';
  const doc=editions.find(d=>d[0]===q.get('edition'));
  const keep=Object.fromEntries(q);
  const back=go(source,source==='reseau'?'← Mes flux':'← Flux de Brico-déco',keep);
  if(view==='editions'){
    return card('Flux É-catalogue',back+'<p>Brico-déco · 4 éditions territoriales · Suivi de recette du 20 janvier 2027. Publication prévue le 18 janvier. Reçu EC-001 · En attente de confirmation de publication.</p>'+
      table(['Document','Édition','Assortiment','Produits','Aperçu Studio'],editions.map(([id,title,v])=>tr(esc(id),esc(title),v,eligible(s,v).length,
        go('visuels','Ouvrir les visuels',{...keep,edition:id})+' '+go('enrichis','Contenus enrichis',{...keep,edition:id})+' '+btn('pilot-copy','Copier le lien Studio',route('flux',{vue:'visuels',edition:id}))))));
  }
  if(view==='visuels'||view==='enrichis'){
    if(!doc)return card('Édition introuvable',go('editions','Retour aux éditions',keep));
    const products=eligible(s,doc[2]), lookup=id=>products.find(p=>p.id===id);
    const nav='<div class="actions">'+go('editions','← Éditions',keep)+go('visuels','Visuels d’accueil',keep)+go('enrichis','Contenus enrichis',keep)+'</div>';
    const context='<p>'+esc(doc[0])+' · '+esc(doc[1])+' · '+doc[2]+' · '+products.length+' offres · '+esc(s.op.start)+' au '+esc(s.op.end)+'</p>';
    if(view==='visuels'){
      const gallery=homeOffers.map(lookup).filter(Boolean);
      return card('Visuels de la page d’accueil',nav+context+(gallery.length?'<div class="kit-gallery">'+gallery.map((p,i)=>'<a href="'+esc(route('produits',{id:p.id}))+'"><div><small>NANOTERA · BRICO-DÉCO</small><h3>'+esc(p.name)+'</h3><strong>'+esc(euros(p.price))+'</strong><small>Emplacement '+(i+1)+'</small></div><img src="'+esc(photo(s,p))+'" alt="'+esc(p.name)+'"></a>').join('')+'</div>':'<p>Aucun emplacement d’accueil configuré pour cette édition.</p>'));
    }
    const day=q.get('date')||'2027-01-20';
    const rows=content.filter(([,id])=>lookup(id)).map(([name,id,type,device,pos,action,start])=>{
      const p=lookup(id),state=day<start?'Planifié':day>s.op.end?'Échu':'Actif';
      return tr(link(route('produits',{id}),name,'quiet'),tag(state,state==='Actif'?'good':''),id==='bd-06'?'Miroirs':'Luminaires',type,device,pos,action,esc(start)+' au '+esc(s.op.end),'<img class="kit-thumb" src="'+esc(photo(s,p))+'" alt="Vignette '+esc(p.name)+'">');
    });
    return card('Contenus enrichis',nav+context+'<form class="filters" id="pilot-date">'+field('date','Simuler la date',day,'date','required')+'<button class="act">Afficher</button></form>'+table(['Nom','Statut','Catégorie','Type','Affichage','Insertion','Action','Validité','Média'],rows)+(rows.length?'':'<p>Aucun enrichissement associé.</p>')+'<p class="sub">Données éditoriales du scénario. Les vignettes vidéo illustrent leur emplacement.</p>');
  }
  if(view==='reseau'){
    const term=(q.get('recherche')||'').trim().toLocaleLowerCase('fr-FR'),family=q.get('famille')||'',date=q.get('validite')||'',pub=q.get('publication')||'',type=q.get('type')||'',order=q.get('tri')||'nom';
    const dossiers=[{state:s,href:'',pilot:true},...network];
    const fixed=['É-catalogue','Bonial','Tiendeo'];
    const families=[...new Set([...fixed,...network.flatMap(x=>x.state.flows.map(f=>f.name))])];
    const columns=family?[family]:families;
    const body=[];
    for(const {state,href,pilot} of dossiers.sort((a,b)=>String(order==='date'?a.state.op.start:a.state.op.title).localeCompare(order==='date'?b.state.op.start:b.state.op.title,'fr'))){
      const code=pilot?'BD-2704':state.op.id;
      if(!(state.op.title+' '+state.op.id+' '+code).toLocaleLowerCase('fr-FR').includes(term) || (date&&(date<state.op.start||date>state.op.end)) || (type&&type!==state.op.scope))continue;
      const cells=new Map();
      if(pilot){
        cells.set(fixed[0],{label:'Actif · reçu EC-001',url:route('flux',{...keep,vue:'editions',depuis:'reseau'}),planned:'2027-01-18',detail:'Suivi de recette du 20 janvier · publication à confirmer'});
        const f=state.flows.find(x=>x.id==='bd-bonial'),missing=state.products.find(x=>x.id===state.kit.product && !x.pack?.trim());
        cells.set('Bonial',{label:missing?'À vérifier':f?.stage,url:route('flux',{...keep,id:'bd-bonial',depuis:'reseau'}),detail:missing?'Gaia · unité de vente à renseigner':'Contrôle du dossier'});
        cells.set('Tiendeo',{label:'Non prévu'});
      }else for(const f of state.flows)cells.set(f.name,{label:f.stage,url:href+route('flux',{id:f.id}),detail:f.receipt||''});
      if(family&&!cells.has(family) || pub&&!columns.some(k=>cells.get(k)?.planned===pub))continue;
      body.push(tr(esc(state.op.title)+'<br><small>'+esc(code)+'</small>',esc(state.op.scope||'—'),esc(state.op.start)+' au '+esc(state.op.end),...columns.map(k=>{
        const cell=cells.get(k);if(!cell)return '—';
        return (cell.url?link(cell.url,cell.label||k,'quiet'):tag(cell.label))+(cell.detail?'<br><small>'+esc(cell.detail)+'</small>':'');
      })));
    }
    const types=[...new Set(dossiers.map(d=>d.state.op.scope).filter(Boolean))];
    return card('Mes flux','<p>Dossiers enseigne accessibles depuis ce navigateur.</p><form class="filters" id="pilot-network">'+field('recherche','Opération ou code',term,'search')+sel('famille','Destination',[['','Toutes'],...families.map(k=>[k,k])],family)+sel('type','Portée',[['','Toutes'],...types.map(k=>[k,k])],type)+field('validite','Valide le',date,'date')+field('publication','Publication prévue le',pub,'date')+sel('tri','Trier par',[['nom','Nom'],['date','Début de validité']],order)+'<button class="act">Filtrer</button></form>'+table(['Opération','Portée','Validité',...columns],body)+(body.length?'':'<p>Aucune opération pour ces critères.</p>')+go('suivi','Flux de Brico-déco'));
  }
  const bonial=s.flows.find(f=>f.id==='bd-bonial');
  return card('Flux de l’opération',table(['Destination','Configuration','Dernier contrôle','Remise','Publication'],[
    tr(go('editions','É-catalogue',{depuis:'suivi'}),tag('Actif','good'),'Aperçu de recette','EC-001 · exemple','À confirmer'),
    tr(link(route('flux',{id:'bd-bonial'}),'Bonial'),tag('Actif','good'),esc(s.products.some(p=>p.id===s.kit.product && !p.pack?.trim())?'À vérifier · unité de Gaia':bonial?.stage||'À contrôler'),esc(bonial?.receipt||'En attente'),'À confirmer'),
    tr('Tiendeo',tag('Non prévu'),'—','—','—')])+go('reseau','Toutes les opérations'))+
    (bonial?flows(s,new URLSearchParams({id:bonial.id})):'');
}
