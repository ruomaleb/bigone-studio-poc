import {catalogueId,bricoBonial,missingBonialUnit} from '../server/brico.mjs?v=20261128.5';
import {esc,tag,btn,card,table,route,link,sel,field,euros,flows,viewFilter} from './views.mjs?v=20261128.5';
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
export function monitor(s,q) {
  const view=q.get('vue')||'suivi',source=q.get('depuis')==='reseau'?'reseau':'suivi';
  const doc=editions.find(d=>d[0]===q.get('edition'));
  const keep=Object.fromEntries(q);
  const pilot=!!s.kit, catalogue=s.supports.find(x=>x.id===catalogueId);
  const catalogueInfo=pilot?'Suivi de recette du 20 janvier 2027. Publication prévue le 18 janvier. Reçu EC-001 · En attente de confirmation de publication.':
    (catalogue?'Support du dossier · '+esc(catalogue.state)+' · R'+esc(catalogue.revision)+'.':'Support indisponible dans le dossier.');
  const currentEditions=editions.filter(([, ,v])=>s.config.versions.some(item=>item.id===v));
  const back=go(source,source==='reseau'?'← Mes flux':'← Flux de Brico-déco',keep);
  if(view==='editions'){
    return card('Flux É-catalogue',back+'<p>'+esc(s.op.title)+' · '+currentEditions.length+' éditions territoriales de travail · '+catalogueInfo+'</p>'+(catalogue?link(route('production',{id:catalogue.id}),'Ouvrir le support É-catalogue'):'')+
      table(['Document','Édition','Assortiment','Produits','Aperçu Studio'],currentEditions.map(([id,title,v])=>tr(esc(id),esc(title),v,eligible(s,v).length,
        go('visuels','Ouvrir les visuels',{...keep,edition:id})+' '+go('enrichis','Contenus enrichis',{...keep,edition:id})+' '+btn('pilot-copy','Copier le lien Studio',route('flux',{vue:'visuels',edition:id}))))));
  }
  if(view==='visuels'||view==='enrichis'){
    if(!doc||!currentEditions.includes(doc))return card('Édition introuvable',go('editions','Retour aux éditions',keep));
    const products=eligible(s,doc[2]), lookup=id=>products.find(p=>p.id===id);
    const nav='<div class="actions">'+go('editions','← Éditions',keep)+go('visuels','Visuels d’accueil',keep)+go('enrichis','Contenus enrichis',keep)+'</div>';
    const context='<p>'+esc(doc[0])+' · '+esc(doc[1])+' · '+doc[2]+' · '+products.length+' offres · '+esc(s.op.start)+' au '+esc(s.op.end)+'</p>';
    if(view==='visuels'){
      const gallery=homeOffers.map(lookup).filter(Boolean);
      return card('Visuels de la page d’accueil',nav+context+(gallery.length?'<div class="kit-gallery">'+gallery.map((p,i)=>'<a href="'+esc(route('produits',{id:p.id}))+'"><div><small>NANOTERA · BRICO-DÉCO</small><h3>'+esc(p.name)+'</h3><strong>'+esc(euros(p.price))+'</strong><small>Emplacement '+(i+1)+'</small></div><img src="'+esc(photo(s,p))+'" alt="'+esc(p.name)+'"></a>').join('')+'</div>':'<p>Aucun emplacement d’accueil configuré pour cette édition.</p>'));
    }
    const day=q.get('date')||(pilot?'2027-01-20':s.op.start);
    const rows=content.filter(([,id])=>lookup(id)).map(([name,id,type,device,pos,action,start])=>{
      const p=lookup(id),state=day<start?'Planifié':day>s.op.end?'Échu':'Actif';
      return tr(link(route('produits',{id}),name,'quiet'),tag(state,state==='Actif'?'good':''),id==='bd-06'?'Miroirs':'Luminaires',type,device,pos,action,esc(start)+' au '+esc(s.op.end),'<img class="kit-thumb" src="'+esc(photo(s,p))+'" alt="Vignette '+esc(p.name)+'">');
    });
    return card('Contenus enrichis',nav+context+'<form class="filters" id="pilot-date">'+field('date','Simuler la date',day,'date','required')+'<button class="act">Afficher</button></form>'+table(['Nom','Statut','Catégorie','Type','Affichage','Insertion','Action','Validité','Média'],rows)+(rows.length?'':'<p>Aucun enrichissement associé.</p>')+'<p class="sub">Données éditoriales du scénario. Les vignettes vidéo illustrent leur emplacement.</p>');
  }
  const bonial=bricoBonial(s);
  const tiendeo=s.flows.find(f=>/\btiendeo\b/i.test(f.name));
  const destinationRow=(name,flow)=>{
    if(!flow)return {name,configured:false};
    const missing=missingBonialUnit(s,flow);
    return {name,configured:true,stage:missing?'À vérifier':flow.stage,detail:missing?'Unité de vente de Gaia à renseigner':'',
      url:route('flux',{...keep,id:flow.id,depuis:view==='reseau'?'reseau':'suivi'}),receipt:flow.receipt||'En attente'};
  };
  const cells=[
    {name:'É-catalogue',configured:!!catalogue,stage:pilot?'Aperçu de recette':catalogue?.state,
      url:catalogue?route('flux',{...keep,vue:'editions',depuis:view==='reseau'?'reseau':'suivi'}):null,
      receipt:pilot?'EC-001 · exemple':'Aucun reçu enregistré',planned:pilot?'2027-01-18':null},
    destinationRow('Bonial',bonial),destinationRow('Tiendeo',tiendeo),
    ...s.flows.filter(f=>f!==bonial&&f!==tiendeo).map(f=>destinationRow(f.name,f))
  ];
  if(view==='reseau'){
    const family=q.get('famille')||'',date=q.get('validite')||'',pub=q.get('publication')||'';
    const visible=cells.filter(c=>(!family||c.name===family)&&(!pub||c.planned===pub)&&(!date||(s.op.start<=date&&date<=s.op.end)));
    const filters='<form class="filters" id="pilot-network">'+sel('famille','Destination',[['','Toutes'],...cells.map(c=>[c.name,c.name])],family)+field('validite','Valide le',date,'date')+field('publication','Publication prévue le',pub,'date')+'<button class="act">Filtrer</button></form>';
    return card('Mes flux · '+s.op.title,filters+(visible.length?table(['Opération',...visible.map(c=>c.name)],[tr(esc(s.op.title),...visible.map(c=>(c.url?link(c.url,c.stage||'À contrôler','quiet'):tag('Non prévu'))+(c.detail?'<br><small>'+esc(c.detail)+'</small>':'')))]):'<p>Aucun flux pour ces critères.</p>')+go('suivi','Retour au suivi de l’opération'));
  }
  const destination=q.get('destination')||'',visible=cells.filter(c=>!destination||c.name===destination);
  const filters='<div class="filters">'+viewFilter('destination','Destination',[...new Set(cells.map(c=>c.name))],destination,'Toutes les destinations')+'</div>';
  return card('Flux de l’opération',filters+table(['Destination','Configuration','État du dossier','Remise','Publication'],visible.map(c=>
    tr(c.url?link(c.url,c.name):esc(c.name),c.configured?tag('Actif','good'):tag('Non prévu'),esc([c.stage,c.detail].filter(Boolean).join(' · ')||'—'),esc(c.receipt||'—'),c.configured?'À confirmer':'—')
  ))+(!visible.length?'<p>Aucune destination pour ce filtre.</p>':'')+go('reseau','Vue par destination'))+
    (bonial&&(!destination||destination==='Bonial')?flows(s,new URLSearchParams({id:bonial.id})):'');
}
