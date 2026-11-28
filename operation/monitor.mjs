import {flowBoard,boardParams} from './flow-board.mjs?v=20261128.8';
import {catalogueId,bricoId} from '../server/brico.mjs?v=20261128.8';
import {esc,tag,btn,card,table,route,link,field,euros,flows} from './views.mjs?v=20261128.8';
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
  const view=q.get('vue');
  const keep=boardParams(q),version=q.get('assortiment');
  const configuredEditions=s.op.id===bricoId?editions.filter(([, ,v])=>s.config.versions.some(item=>item.id===v)):[];
  const back=link(route('flux',keep),'← Mes flux','quiet');
  if(q.has('id'))return flows(s,q,back);
  if(!['editions','visuels','enrichis'].includes(view))return flowBoard(s,q,configuredEditions);
  const doc=editions.find(d=>d[0]===q.get('edition'));
  const pilot=!!s.kit,catalogue=s.supports.find(x=>x.id===catalogueId);
  if(!catalogue||s.op.id!==bricoId)return card('Destination indisponible',back);
  const detailParams={...keep,assortiment:version};
  const catalogueInfo=pilot?'Suivi de recette du 20 janvier 2027. Publication prévue le 18 janvier. Reçu EC-001 · En attente de confirmation de publication.':
    'Support du dossier · '+esc(catalogue.state)+' · R'+esc(catalogue.revision)+'.';
  const currentEditions=configuredEditions.filter(([, ,v])=>!version||v===version);
  if(view==='editions'){
    return card('Flux E-catalogue',back+'<p>'+esc(s.op.title)+' · '+currentEditions.length+(currentEditions.length===1?' édition territoriale':' éditions territoriales')+(version?' · '+esc(version):'')+' · '+catalogueInfo+'</p>'+link(route('production',{id:catalogue.id}),'Ouvrir le support E-catalogue')+
      table(['Document','Édition','Assortiment','Produits','Aperçu Studio'],currentEditions.map(([id,title,v])=>tr(esc(id),esc(title),v,eligible(s,v).length,
        go('visuels','Ouvrir les visuels',{...detailParams,edition:id})+' '+go('enrichis','Contenus enrichis',{...detailParams,edition:id})+' '+btn('pilot-copy','Copier le lien Studio',route('flux',{vue:'visuels',edition:id}))))));
  }
  if(view==='visuels'||view==='enrichis'){
    if(!doc||!currentEditions.includes(doc))return card('Édition introuvable',go('editions','Retour aux éditions',detailParams));
    const products=eligible(s,doc[2]), lookup=id=>products.find(p=>p.id===id);
    const nav='<div class="actions">'+go('editions','← Éditions',detailParams)+go('visuels','Visuels d’accueil',{...detailParams,edition:doc[0]})+go('enrichis','Contenus enrichis',{...detailParams,edition:doc[0]})+'</div>';
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
}
