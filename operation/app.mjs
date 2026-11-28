import {bricoId} from '../server/brico.mjs?v=20261128.5';
import {pilotIntro,pilotParticipants,shopYear,shopView,shopPayload,pilotFrame,kitView,kitReviewView,mountKit,kitAction} from './kit.mjs?v=20261128.6';
import {monitor} from './monitor.mjs?v=20261128.6';
import {editorController} from './editor.mjs?v=20261128.3';
import {axes, matches, targetPlan, participantsOf} from '../server/targeting.mjs';
import {
  blank,
  eligible,
  pageFor,
  inScope,
  impactedVersions,
  commonPlan,
  localVariantPrices
} from '../server/model.mjs?v=20261128.1';
import {
  esc,
  info,
  participants,
  pim,
  productForm,
  supports,
  route,
  link,
  btn,
  field,
  sel,
  tag,
  submit,
  checks,
  filterStores,
  euros
} from './views.mjs?v=20261128.6';
import {
  setupChat
} from './chat.mjs?v=8';
const apiRoot = 'https://bigone-studio-operations.github-46e.workers.dev';
const $ = s => document.querySelector(s),
  params = new URLSearchParams(location.search);
const slot = params.get('participant'), reviewerSlot=params.get('relecture'), kitSlot=params.get('epreuve'),
  opId=params.get('op')||((slot||reviewerSlot||kitSlot)?'u-2649-pbs':null),
  shared = params.get('mode') === 'partage' || !['bd-2704-deco','u-2649-pbs'].includes(opId);
const storageKey = 'studio.operations.v1.' + (kitSlot ? 'epreuve.'+opId+'.'+kitSlot : reviewerSlot ? 'relecture.'+opId+'.'+reviewerSlot : slot ? 'magasin.' + slot + (opId === 'u-2649-pbs' ? '' : '.' + opId) : shared ? 'partage.' + opId : opId === 'u-2649-pbs' ? 'essai' : 'essai.' + opId);
const pilotRequest=params.get('parcours')==='production' && !slot && !reviewerSlot && !kitSlot && !shared;
const sessionKey=storageKey+(params.get('parcours')==='production'?'.production':'');

const sections = [
  ['Préparation', [
    ['informations', 'Informations'],
    ['participants', 'Participants'],
    ['supports', 'Supports']
  ]],
  ['Produits', [
    ['produits', 'Produits']
  ]],
  ['Production', [
    ['production', 'Supports'],
    ['flux', 'Flux']
  ]]
];
const names = Object.fromEntries(sections.flatMap(x => x[1]).concat([
  ['configurer', 'Administration de la mécanique'],
  ['participation', 'Ma participation']
]));
const groupFor = page => page === 'configurer' || page === 'participation' ? 0 : Math.max(0, sections.findIndex(([, l]) => l.some(x => x[0] === page)));
let ctx = null,
  key = '',
  groupState = [false, false, false],
  lastPage = '',
  pending = false,
  dialogSave = null;
let timer;
let flowFiltersOpen=false;

function notify(text) {
  $('#notice').textContent = text;
  clearTimeout(timer);
  timer = setTimeout(() => $('#notice').textContent = '', 5200)
}

function readStore(name) {
  try {
    return localStorage.getItem(name)
  } catch {
    return null
  }
}

function writeStore(name, v) {
  try {
    localStorage.setItem(name, v)
  } catch {}
}
async function api(path, data = {}) {
  let r;
  try {
    r = await fetch(apiRoot + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + key
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(path === '/ask' ? 60000 : 25000)
    })
  } catch {
    throw Error('Connexion au serveur interrompue. Réessayez pour enregistrer votre action.')
  }
  const b = await r.json();
  if (!r.ok) throw Object.assign(new Error(b.error || 'Demande refusée.'), {
    status: r.status
  });
  return b
}
const editor=editorController({context:()=>ctx, save, api, notify, render});
const chat = setupChat(() => ctx, api, notify);

function newKey() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('')
}

function current() {
  const [p, q] = location.hash.slice(1).split('?');
  return {
    page: ctx?.role === 'magasin' ? 'participation' : Object.hasOwn(names, p) ? p : 'informations',
    q: new URLSearchParams(q || '')
  }
}

function summaryFrame(pg, q) {
  const t = ctx.state.stores.find(x => x.id === q.get('id')) || participantsOf(ctx.state)[0];
  if ((!t || t.targeted === false) && pg === 'participation') return '<section class="sheet">Aucun participant affecté.</section>';
  return '<div class="hrow sectionhead"><h2>' + esc(names[pg]) + '</h2>' + (ctx.role === 'enseigne' ? link('#participants', 'Revenir aux participants') : '') +
    '</div><label class="wizard-filter">Filtrer les étapes<input type="search" id="wizard-filter"></label><iframe src="participants/?v=10" class="wizard" title="Choix des participants"></iframe>'
}

function selectedProduct() {
  const {
    page,
    q
  } = current();
  return page === 'produits' ? ctx.state.products.find(x => x.id === q.get('id')) : null;
}

function operationRecord() {
  const p = selectedProduct();
  if (!p) return null;
  const s = ctx.state;
  const pieces = s.supports.filter(x => x.products.includes(p.id)).map(x => ({
    name: x.name,
    detail: [x.pages > 1 ? 'Page ' + pageFor(x, p) : '', x.state].filter(Boolean).join(' · '),
    href: route('production', {
      id: x.id,
      ...(x.pages > 1 ? {
        page: pageFor(x, p)
      } : {})
    })
  }));
  if(s.kit?.product===p.id)pieces.push({name:'Kit digital Gaia',detail:'Carré et vertical',href:route('production',{vue:'kit'})});
  if(s.op.id===bricoId && ['bd-03','bd-01','bd-06','bd-04'].includes(p.id) && p.versions.includes('V1'))pieces.push({name:'Accueil E-catalogue · Sud',detail:'Visuel de l’édition NT-V1-SUD',href:route('flux',{vue:'visuels',edition:'NT-V1-SUD'})});
  const exports = s.flows.filter(f => p.versions.includes(f.v)).map(f => ({
    name: f.name,
    detail: 'Flux · assortiment ' + f.v + ' · ' + f.stage,
    href: route('flux', {
      id: f.id
    })
  }));
  return {
    key: s.op.id + '/' + p.id,
    name: p.name,
    operation: s.op.title,
    closed: !!s.op.closed,
    description: p.description || '',
    facts: [
      ['Référence', p.ref || p.id],
      ['Marque', p.brand || 'À renseigner'],
      ['Rayon', p.rayon || 'À renseigner'],
      ['Conditionnement', p.pack || 'À renseigner'],
      ['Prix national TTC', euros(p.price)],
      ['Versions commerciales', p.versions.join(' · ') || 'À affecter'],
      ['Mentions', p.note]
    ],
    media: window.StudioProductSheet.mediaFor(p, s.op.id),
    supports: [...pieces, ...exports]
  };
}
const productDialog = $('#product-dialog');
const operationSheet = window.StudioProductSheet.create(productDialog, {
  reload: operationRecord,
  edit: host => {
    host.innerHTML = productForm(ctx.state, selectedProduct());
  },
  saveMedia: media => save('productMedia', {
    id: selectedProduct().id,
    media
  }, false),
  close: record => {
    const {
      page,
      q
    } = current();
    if (page === 'produits' && record && record.key === ctx.state.op.id + '/' + q.get('id')) {
      const id = q.get('id');
      q.delete('id');
      history.replaceState(null, '', route(page, Object.fromEntries(q)));
      const source = [...document.querySelectorAll('#content a')].find(a => new URLSearchParams(a.hash.split('?')[1]).get('id') === id);
      source?.focus({
        preventScroll: true
      });
    }
  }
});

function operationChoice(destination){
  const page=destination.split('?')[0];
  const kind=page==='produits'?'produits':['production','flux'].includes(page)?'assets':page==='supports'?'supports':'operations';
  const q=new URLSearchParams({destination});
  if(params.get('parcours')==='production')q.set('parcours','production');
  if(params.get('mode')==='partage')q.set('mode','partage');
  return '../#contenus--'+kind+'?'+q;
}
function dossierMenu(page) {
  const role=ctx?.role || (kitSlot||reviewerSlot?'relecteur':slot?'magasin':'enseigne');
  StudioNavigation.settings(ctx?.role==='enseigne'&&!ctx.state.op.closed?'#configurer':null,page==='configurer');
  if(role==='enseigne'){
    const urls={pilotage:'../#accueil',preparation:'#informations',produits:'#produits',production:'#production',administration:'../#administration--magasins'};
    const items=StudioNavigation.spaces(urls);
    if(ctx){
      for(const [index,[key,entries]] of sections.entries()){
        if(entries.length<2)continue;
        const item=items.find(item=>item.label===key);
        item.group={index,open:groupState[index],items:entries,current:page==='participation'?'participants':page};
      }
    }
    StudioNavigation.draw(items,page==='configurer'?null:['preparation','produits','production'][groupFor(page)],ctx?.state.op.title);
  }else if(role==='magasin'){
    const year=current().q.get('vue')==='annee';
    const items=[{key:'preparation',label:'Ma participation',href:'#participation'}];
    if(ctx?.state.config.productionPilot)items.push({key:'pilotage',label:'Mon année',href:'#participation?vue=annee'});
    StudioNavigation.draw(items,year?'pilotage':'preparation');
  }else{
    StudioNavigation.draw([{key:'production',label:'BAT à relire',href:kitSlot?'#bat':route('production',{id:reviewerSlot,atelier:'bat',page:1})}],'production');
  }
  if(role!=='enseigne')$('.op-brand').removeAttribute('href');
}
function render() {
  if (!ctx) return;
  if(ctx.role==='relecteur-kit'){
    $('#bar').innerHTML='';$('#ai').hidden=true;$('#open-ai').hidden=true;
    dossierMenu('production');
    $('#main').innerHTML=kitReviewView(ctx.state,current().q);mountKit(ctx.state,api);
    $('#main .sectionhead').insertAdjacentHTML('beforeend',StudioNavigation.focusButton());
    StudioNavigation.filters($('#main'));
    document.title='BAT digital · '+ctx.state.op.title;return;
  }
  const s = ctx.state,
    {
      page,
      q
    } = current(),
    shop = ctx.role === 'magasin',
    g = groupFor(page);
  if (lastPage !== page) groupState[g] = true;
  lastPage = page;
  dossierMenu(ctx.role==='relecteur'?'production':page);
  document.title = names[page] + ' · ' + s.op.title + ' · BigOne Studio';
  $('#bar').innerHTML = shop ? '' : link('../#accueil', 'Pilotage', 'toplink') + sections.map(([name, items], i) => '<a href="#' + items[0][0] + '" ' + (i === g && page!=='configurer' ?
    'aria-current="page"' : '') + '>' + name + '</a>').join('');
  const atelier=(page==='production'||ctx.role==='relecteur')&&editor.current();
  const digitalBat=page==='production' && s.kit && q.get('vue')==='bat';
  if(!atelier&&!digitalBat)StudioNavigation.focusMode(false);
  $('#main').classList.toggle('ed-main',!!atelier);
  if(atelier){
    if(ctx.role==='enseigne')$('#bar').innerHTML+=link(operationChoice(page),'Changer d’opération','toplink');
    if(ctx.role==='relecteur'){$('#bar').innerHTML='';$('#open-ai').hidden=true;$('#ai').hidden=true;}
    document.title=(atelier.mode==='fer'?'Chemin de fer':'BAT collaboratif')+' · '+atelier.x.name+' · BigOne Studio';
    $('#main').innerHTML=editor.html(atelier);editor.mounted(atelier);StudioNavigation.filters($('#main'));
    if(productDialog.open)productDialog.close();
    if(ctx.role!=='relecteur')chat.render();
    return;
  }
  const content = {
    informations: () => (s.kit?pilotIntro(s):'')+info(s,q),
    participants: () => s.kit ? pilotParticipants(s,q):participants(s,q),
    supports: () => supports(s, q),
    produits: () => pim(s, q),
    production: () => s.kit && q.has('vue') ? kitView(s,q) : (s.kit?pilotIntro(s):'')+supports(s,q,true),
    flux: () => monitor(s,q),
    configurer: () => summaryFrame(page, q)+(s.kit?pilotFrame(s,true):''),
    participation: () => s.config.productionPilot && shop && q.get('vue')==='annee' ? shopYear(s,shopDossiers) : s.config.productionPilot ? shopView(s,q.get('id'),shop) : summaryFrame(page,q)
  } [page]();
  $('#main').innerHTML = '<div class="crumb">' + (shop ? 'Studio' : link('../#accueil', 'Studio', 'toplink')) + ' &nbsp; › &nbsp; ' + esc(shop ? 'Participation' :
      page==='configurer'?'Réglages de l’opération':sections[g][0]) + ' &nbsp; › &nbsp; ' + esc(s.op.id === 'u-2649-pbs' ? 'S49' : s.op.title) + '</div><div class="ophead"><div><h1>' + esc(s.op.title) +
    '</h1><div class="meta"><span>' + esc(shop ? s.stores[0].name : s.op.network) + '</span> · <span>' + esc(s.op.start) + ' au ' + esc(s.op.end) +
    '</span> · <span>' + esc(s.op.scope) + '</span>'+(shop?'':' · '+link(operationChoice(page),'Changer d’opération','quiet'))+'</div></div>' + tag(ctx.workspace.startsWith('shared:') ? 'Dossier partagé' : 'Dossier de démonstration',
      'violet') + '</div><div><div id="content">' + content + (!shop &&
      ctx.workspace.startsWith('shared:') ? '<p>' + link('../?classique=1#preparation--' + encodeURIComponent(s.op.id) + '--cadrage', 'Outils du dossier d’origine',
        'quiet') + '</p>' : '') + '</div></div>';
  if(s.kit && page==='production' && q.has('vue'))mountKit(s,api);
  if(digitalBat)$('#content .sectionhead')?.insertAdjacentHTML('beforeend',StudioNavigation.focusButton());
  const view=q.get('vue');
  const search=page==='participation'?(view==='annee'?['tbody tr','Filtrer mes opérations']:['#kit-response fieldset > label','Filtrer mes choix']):
    page==='flux'?({editions:['tbody tr','Filtrer les éditions'],visuels:['.kit-gallery > a','Filtrer les visuels']})[view]:
    page==='production'&&view==='remises'?['.inset','Filtrer les bordereaux']:null;
  const flowToggle=$('[data-flow-toggle]');
  if(flowToggle)flowToggle.setAttribute('aria-expanded',String(flowFiltersOpen));
  StudioNavigation.filters($('#main'),search);
  if(shop && s.config.productionPilot && q.get('vue')==='annee' && !shopLoaded)loadShopYear();
  chat.render();
  const record=shop?null:operationRecord();
  if(record)operationSheet.open(record);
  else if(productDialog.open)productDialog.close();
}
let shopLoaded=false,shopDossiers=[];
async function loadShopYear(){
  shopLoaded=true;
  const t=ctx.state.stores[0];
  const candidates=Object.keys(localStorage).filter(k=>k!==sessionKey && (k==='studio.operations.v1.magasin.'+t.id || k.startsWith('studio.operations.v1.magasin.'+t.id+'.')));
  const accepted=await Promise.all(candidates.map(async k=>{
    try{
      const r=await fetch(apiRoot+'/read',{method:'POST',headers:{Authorization:'Bearer '+readStore(k),'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(5000)});
      if(!r.ok)return null;
      const other=await r.json(),op=other.state;
      if(other.role!=='magasin'||op.op.id===ctx.state.op.id||op.op.network!==ctx.state.op.network||op.stores[0]?.id!==t.id||op.stores[0].name!==t.name)return null;
      return {s:op,href:'?participant='+encodeURIComponent(t.id)+'&op='+encodeURIComponent(op.op.id)+(op.config.productionPilot?'&parcours=production':'')+'#participation'};
    }catch{return null;}
  }));
  shopDossiers=accepted.filter(Boolean);
  if(current().q.get('vue')==='annee')render();
}
async function refresh() {
  ctx = await api('/read');
  render()
}
async function save(action, payload, refreshUI = true) {
  let r;
  try {
    r = await api('/change', {
      action,
      payload,
      revision: ctx.revision
    })
  } catch (e) {
    if (e.status === 409) {
      ctx = await api('/read');
      if (refreshUI) render()
    }
    throw e
  }
  ctx = r;
  if (refreshUI) render();
  return r;
}

function modal(title, html, handler, label = 'Enregistrer') {
  dialogSave = handler;
  $('#modalcontent').innerHTML = '<h2>' + esc(title) + '</h2>' + html + '<p class="issue" role="alert"></p><div class="actions">' + (handler ? submit(label) : '') +
    btn('close', 'Fermer') + '</div>';
  if (!$('#modal').open) $('#modal').showModal()
}
$('#modalform').addEventListener('submit', async e => {
  e.preventDefault();
  if (!dialogSave) return;
  const b = e.submitter;
  if (b) b.disabled = true;
  const action = dialogSave;
  try {
    await action(new FormData(e.target));
    if (dialogSave === action) $('#modal').close()
  } catch (x) {
    $('#modal .issue').textContent = x.message
  } finally {
    if (b) b.disabled = false
  }
});
const pairs = (a, b) => a.map(x => [x[b], x.name]);

function formInfo() {
  const o = ctx.state.op;
  modal('Informations de l’opération', '<div class="fields">' + [
      ['title', 'Nom'],
      ['network', 'Réseau'],
      ['scope', 'Portée'],
      ['owner', 'Pilote enseigne'],
      ['contact', 'Contact agence'],
      ['start', 'Début'],
      ['end', 'Fin']
    ].map(([k, n]) => field(k, n, o[k], ['start', 'end'].includes(k) ? 'date' : 'text', ['title', 'start', 'end'].includes(k) ? 'required' : '')).join('') +
    '</div><label class="field">Objectif commercial<textarea name="objective">' + esc(o.objective) + '</textarea></label>', d => save('info', Object.fromEntries(
      d)))
}

function download(f) {
  const head = ['reference', 'libelle', 'conditionnement', 'prix_ttc', 'version'];
  const safe = x => {
    let s = String(x ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"'
  };
  const csv = [head, ...f.rows.map(x => head.map(k => x[k]))].map(r => r.map(safe).join(';')).join('\r\n');
  const u = URL.createObjectURL(new Blob(['\uFEFF', csv], {
      type: 'text/csv;charset=utf-8'
    })),
    a = document.createElement('a');
  a.href = u;
  a.download = f.id + '-' + f.v + '.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1500)
}
async function perform(a, id) {
  const s = ctx?.state;
  if(a==='pilot-copy'){const url=new URL(location.href);url.hash=id;await navigator.clipboard.writeText(url.href);return notify('Lien Studio copié.');}
  if(a.startsWith('kit-'))return kitAction(a,id,{context:()=>ctx,api,save,modal,notify,refresh,adopt:v=>{ctx=v;}});
  if (a === 'close') return $('#modal').close();
  if (a === 'retry') return dossierMenu(current().page);
init();
  if (a === 'edit-info') return formInfo();
  if (a === 'refresh') {
    await refresh();
    return notify('Réponses actualisées.')
  }
  if (a === 'new-product') {
    const versions = s.config.versions.map(v => [v.id, v.id + ' · ' + v.name]);
    return modal('Ajouter une référence', field('id', 'Référence', '', 'text', 'required maxlength="60" pattern="[A-Za-z0-9_-]+"') + field('name', 'Libellé', '',
      'text', 'required') + field('pack', 'Conditionnement', '') + field('rayon', 'Rayon', '') + field('price', 'Prix national TTC (€)', '', 'number',
      'min=".01" step=".01"') + '<fieldset><legend>Versions éligibles</legend>' + checks('versions', versions, []) + '</fieldset>', async d => {
      await save('addProduct', {
        ...Object.fromEntries(d),
        versions: d.getAll('versions'),
        price: d.get('price') === '' ? null : Number(d.get('price'))
      });
      location.hash = route('produits', {
        id: d.get('id')
      })
    }, 'Créer la référence');
  }
  if (a === 'propose-device') {
    const {
      brochure,
      poster,
      item
    } = commonPlan(s);
    const line = (label, x, details) => '<p><strong>' + esc(label) + '</strong><br>' + esc(x ? 'Réutiliser « ' + x.name + ' » · ' + x.products.length +
      ' offres associées' : details) + '</p>';
    const prices = item ? '<p>Affiche A1 · ' + esc(euros(item.price)) + ' HT par affiche. ' + (item.on ? 'Le choix de quantité est déjà ouvert.' :
        'Son activation rouvrira les participations confirmées.') + '</p>' :
      field('price', 'Prix unitaire HT de l’affiche (€)', '', 'number', 'required min="0" step=".01"');
    return modal('Relire la proposition de dispositif', line('Prospectus commun', brochure,
        'Créer un prospectus A4 commun aux versions avec les produits affectés.') +
      line('Affiche A1', poster, 'Créer une affiche au format 594 × 841 mm. Les offres pourront être choisies dans son dispositif.') + prices +
      '<p>Chaque point de vente pourra saisir sa quantité d’affiches dans Ma participation.</p>', async d => {
        await save('commonPlan', {
          price: item ? item.price : Number(d.get('price'))
        });
        location.hash = route('supports', {
          id: commonPlan(ctx.state).poster.id
        });
        notify('Dispositif appliqué. Les quantités sont ouvertes aux participants.');
      }, 'Appliquer le dispositif');
  }
  if (a === 'new-device') {
    const versions = [
      ['Toutes', 'Toutes les versions'], ...s.config.versions.map(v => [v.id, v.id + ' · ' + v.name])
    ];
    return modal('Ajouter un support', sel('kind', 'Famille', [
        ['prospectus', 'Prospectus'],
        ['affiche', 'Affiche / PLV'],
        ['numerique', 'Support numérique'],
        ['flux', 'Flux']
      ], 'prospectus') +
      field('name', 'Nom du support', '', 'text', 'required') + field('format', 'Format', '') + field('pages', 'Nombre de pages', 1, 'number',
        'min="1" max="200"') +
      sel('v', 'Version commerciale', versions, 'Toutes') + field('note', 'Consignes', '') + '<fieldset><legend>Produits retenus</legend>' + checks('products',
        s.products.map(p => [p.id, p.name]), []) + '</fieldset>', async d => {
        await save('device', {
          ...Object.fromEntries(d),
          products: d.getAll('products')
        });
        location.hash = d.get('kind') === 'flux' ? 'flux' : 'supports';
      }, 'Enregistrer le dispositif');
  }
  if (a === 'historic-flow') {
    const [fid, index] = id.split('|');
    const f = s.flows.find(x => x.id === fid)?.archive?.[index];
    if (f) return download({
      ...f,
      id: fid + '-archive-' + (Number(index) + 1)
    });
  }
  if (a === 'task') {
    const x = s.tasks.find(y => y.id === id);
    await save('task', {
      id,
      done: !x.done
    });
    return
  }
  if (a === 'schedule') return modal('Générer le rétroplanning', sel('id', 'Support', pairs(s.supports, 'id'), '') + field('due', 'Date de remise', '', 'date',
      'required') +
    '<p class="sub">Les jalons dépendent de la famille du support, de la pagination et des jours ouvrés. Un recalcul conserve les tâches terminées.</p>', d =>
    save('schedule', Object.fromEntries(d)));
  if (a === 'invite') {
    const r = await api('/invite', {
      store: id
    });
    const u = new URL('./', location.href);
    u.search = '?participant=' + encodeURIComponent(id) + '&op=' + encodeURIComponent(s.op.id)+(s.kit?'&parcours=production':'');
    u.hash = 'acces=' + r.key;
    return modal('Accès de ' + s.stores.find(t => t.id === id).name, '<p>Ce lien privé ouvre la réponse de ce seul point de vente pendant 60 jours.</p>' + field(
        'url', 'Lien du magasin', u.href, 'url', 'readonly') + '<div class="actions">' + btn('copy-invite', 'Copier le lien') +
      '<a class="act" target="_blank" rel="noopener noreferrer" href="' + esc(u.href) + '">Ouvrir l’espace magasin</a></div>')
  }
  if (a === 'copy-invite') {
    await navigator.clipboard.writeText($('#modal input[name=url]').value);
    return notify('Lien copié.')
  }
  if (a === 'reminder') {
    const list = filterStores(s, id).filter(t => !s.replies[t.id]?.confirmed && t.status !== 'non');
    if (!list.length) return notify('Aucun destinataire à relancer dans cette sélection.');
    return modal('Préparer une relance', sel('group','Destinataires',[['','Toute la sélection · '+list.length],...(s.targetGroups||[]).map(g=>[g.id,g.name+' · '+list.filter(t=>t.groupId===g.id).length]).filter(x=>!x[1].endsWith(' · 0'))], '') +
      '<label class="field">Brouillon<textarea name="text" rows="5" required>Bonjour, merci de confirmer votre participation à ' + esc(s.op.title) +
      ' et la quantité d’affiches A1 souhaitée pour votre magasin.</textarea></label>', d => save('reminder', {
        stores: list.filter(t=>!d.get('group') || t.groupId===d.get('group')).map(t=>t.id),
        text: d.get('text')
      }), 'Enregistrer le brouillon')
  }
  if (a === 'removeVariant') {
    const [sid, store] = id.split('|');
    return modal('Retirer la variante du support', '<p>La décision reste dans l’historique des BAT déjà relus.</p>', () => save('support', {
      id: sid,
      store,
      step: 'removeVariant'
    }), 'Retirer du dispositif');
  }
  if (a === 'variant') {
    const [sid, store] = id.split('|');
    const support = s.supports.find(x => x.id === sid),
      prices = localVariantPrices(s, support, store);
    const details = s.products.filter(p => Object.hasOwn(prices, p.id)).map(p => '<li>' + esc(p.name) + ' · page ' + pageFor(support, p) + ' · ' + esc(euros(p
      .price)) + ' national → ' + esc(euros(prices[p.id])) + ' local TTC</li>').join('');
    return modal('Valider la variante locale', '<p>' + esc(s.stores.find(t => t.id === store).name) + ' · ' + esc(support.name) + ' · ' + esc(s.replies[store]
      .v) + '</p><ul>' + details + '</ul>', () => save('support', {
        id: sid,
        store,
        step: 'variant'
      }), 'Valider')
  }
  if (a === 'decision') {
    const [sid, step] = id.split('|');
    return modal(step, field('note', 'Commentaire de révision', '', 'text', step === 'En corrections' ? 'required' : ''), d => save('support', {
      id: sid,
      step,
      note: d.get('note')
    }), 'Confirmer la décision')
  }
  if (a === 'upload') return modal('Déposer un BAT',
    '<p>La pièce est conservée avec la révision. PDF, JPEG ou PNG, jusqu’à 1 Mo.</p><input name="bat" type="file" accept="application/pdf,image/png,image/jpeg" required>',
    async d => {
      const f = d.get('bat');
      if (!f || f.size > 1048576) throw Error('Choisissez un fichier de 1 Mo maximum.');
      const content = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(f)
      });
      ctx = await api('/upload', {
        id,
        revision: ctx.revision,
        content,
        name: f.name
      });
      render()
    }, 'Déposer');
  if (a === 'get-file') {
    const f = await api('/file', {
        id
      }),
      raw = atob(f.content),
      bytes = Uint8Array.from(raw, x => x.charCodeAt(0)),
      url = URL.createObjectURL(new Blob([bytes], {
        type: f.mime
      }));
    modal(f.name, '<a class="act" target="_blank" rel="noopener" href="' + esc(url) + '">Ouvrir le BAT</a> <a class="act" download="' + esc(f.name) + '" href="' +
      esc(url) + '">Télécharger</a>');
    $('#modal').addEventListener('close', () => setTimeout(() => URL.revokeObjectURL(url), 30000), {
      once: true
    });
    return
  }
  if (a === 'file') return modal('Associer un fichier', field('file', 'Adresse HTTPS du fichier de travail', '', 'url', 'required'), d => save('support', {
    id,
    step: 'file',
    file: d.get('file')
  }));
  if (a === 'download') return download(s.flows.find(f => f.id === id));
  if (a === 'deliver') return modal('Consigner la remise', field('receipt', 'Référence du reçu ou du dépôt', '', 'text', 'required'), d => save('flow', {
    id,
    step: 'deliver',
    receipt: d.get('receipt')
  }), 'Confirmer la remise');
  if (a === 'check' || a === 'generate') {
    await save('flow', {
      id,
      step: a
    });
    return notify(a === 'check' ? 'Contrôle terminé.' : 'Fichier généré.')
  }
}
document.addEventListener('input',e=>{
  if(e.target.id==='wizard-filter')$('.wizard')?.contentWindow?.filterSteps?.(e.target.value);
});
document.addEventListener('click', async e => {
  const toggle=e.target.closest('[data-flow-toggle]');
  if(toggle){
    flowFiltersOpen=!flowFiltersOpen;
    toggle.setAttribute('aria-expanded',String(flowFiltersOpen));
    return;
  }
  const g = e.target.closest('[data-group]');
  if (g) {
    const i = Number(g.dataset.group);
    groupState[i] = !groupState[i];
    g.setAttribute('aria-expanded', groupState[i]);
    g.lastElementChild.textContent = groupState[i] ? '⌄' : '›';
    $('#group-' + i).hidden = !groupState[i];
    return
  }
  const b = e.target.closest('[data-do]');
  if (!b) return;
  b.disabled = true;
  try {
    await perform(b.dataset.do, b.dataset.id)
  } catch (x) {
    notify(x.message)
  } finally {
    b.disabled = false
  }
});
document.addEventListener('change', async e => {
  if(e.target.form?.id==='flow-filters' && e.target.type!=='search'){
    e.target.form.requestSubmit();
    return;
  }
  const n = e.target.name;
  const {
    q
  } = current();
  if(e.target.hasAttribute('data-screen-filter')){
    const field=e.target.dataset.screenFilter;
    if(e.target.value)q.set(field,e.target.value);else q.delete(field);
    if(['state','format','rayon'].includes(field))q.delete('id');
    const page=ctx.role==='relecteur-kit'?'bat':current().page;
    location.hash=route(page,Object.fromEntries(q));
    return;
  }
  if (n === 'taskfilter' || n === 'tasksupport') {
    q.set('jalons', '1');
    q.set(n === 'taskfilter' ? 'etat' : 'support', e.target.value);
    location.hash = 'informations?' + q
  }
  if (n === 'batpage') {
    q.set('page', e.target.value);
    location.hash = 'production?' + q
  }
  if (n?.startsWith('flow-')) try {
    await save('flow', {
      id: n.slice(5),
      step: 'scope',
      v: e.target.value
    })
  } catch (x) {
    notify(x.message)
  }
});
document.addEventListener('toggle', e => {
  if (e.target.id === 'dates') {
    const {
      page,
      q
    } = current();
    if (page === 'informations') {
      if (e.target.open) q.set('jalons', '1');
      else q.delete('jalons');
      history.replaceState(null, '', route(page, Object.fromEntries(q)))
    }
  }
}, true);
document.addEventListener('submit', async e => {
  if(e.target.id==='flow-filters'){
    e.preventDefault();
    location.hash=route('flux',{tri:current().q.get('tri'),...Object.fromEntries(new FormData(e.target))});
    return;
  }
  if(['kit-response','kit-filter','pilot-date'].includes(e.target.id)){
    e.preventDefault();const form=e.target, data=Object.fromEntries(new FormData(form));
    if(form.id==='kit-response'){
      const button=e.submitter;if(button)button.disabled=true;
      try{await save('reply',shopPayload(form,true));notify('Participation enregistrée.');}catch(err){notify(err.message);}finally{if(button)button.disabled=false;}
    }else if(form.id==='kit-filter'){location.hash=route('production',{vue:'kit',...data});}
    else{location.hash=route('flux',{...Object.fromEntries(current().q),...data});}
    return;
  }
  if (!['support', 'product'].includes(e.target.id)) return;
  e.preventDefault();
  const d = new FormData(e.target),
    id = e.target.dataset.id,
    s = ctx.state;
  if (e.target.id === 'support') {
    try {
      await save('support', {
        id,
        step: 'setup',
        products: d.getAll('products'),
        scope: d.get('scope'),
        format: d.get('format'),
        note: d.get('note')
      });
      notify('Dispositif enregistré.')
    } catch (x) {
      notify(x.message)
    }
    return
  }
  const data = {
      ...Object.fromEntries(d),
      id,
      versions: d.getAll('versions'),
      price: d.get('price') === '' ? null : Number(d.get('price'))
    },
    p = s.products.find(x => x.id === id),
    removed = p.versions.filter(v => !data.versions.includes(v));
  if (!data.versions.length) return notify('Sélectionnez au moins une version.');
  const apply = async () => {
    await save('product', data);
    operationSheet.finish();
    notify('Fiche produit enregistrée.')
  };
  if (removed.length) return modal('Impact sur les versions', '<p>Versions retirées · ' + esc(removed.join(', ')) + '</p><p>Participants concernés · ' + esc(s
      .stores.filter(t => t.targeted!==false && removed.includes(s.replies[t.id]?.v || t.assigned)).length) + '</p><p>Supports à revoir · ' +
    esc(s.supports.filter(y => y.products.includes(id) && impactedVersions(p, data).some(v => inScope(y, v))).map(y => y.name + ' · page ' + pageFor(y,
      p)).join(', ') || 'aucun') + '</p>', apply,
    'Confirmer la modification');
  try {
    await apply()
  } catch (x) {
    notify(x.message)
  }
});
window.studioPending = v => {
  pending = v
};
window.studioWizardSize = h => {
  const f = $('.wizard');
  if (f) f.style.height = Math.max(520, h + 10) + 'px'
};
window.studioWizard = () => {
  const {
    page,
    q
  } = current(), s = ctx.state, shop = ctx.role === 'magasin', products = s.products.map(x => ({
    ...x,
    vs: x.versions
  })), stores = participantsOf(s);
  const toIndex = map => Object.fromEntries(products.flatMap((p, i) => map && Object.hasOwn(map, p.id) ? [
    [i, map[p.id]]
  ] : []));
  const toIds = map => Object.fromEntries(products.flatMap((p, i) => map && Object.hasOwn(map, i) ? [
    [p.id, map[i]]
  ] : []));
  const replies = stores.map(t => {
    const r = structuredClone(s.replies[t.id] || blank(t.assigned));
    return {
      ...r,
      picks: toIndex(r.picks),
      prices: toIndex(r.prices)
    }
  });
  const data = {
    ...structuredClone(s.config),
    replies,
    rules: stores.map(t => t.rule),
    assigned: stores.map(t => t.assigned),
    eligibility: products.map(p => Object.fromEntries(s.config.versions.map(v => [v.id, p.versions.includes(v.id)])))
  };
  return {
    pimLink:v=>location.pathname+location.search+route("produits",{v}),
    shop, canConfigure:!shop && page==='configurer', axes, matches, targetPlan, network: shop ? [] : s.stores, groups:s.targetGroups || [], legacy:!!s.legacyAssignments,
    confirmed:shop ? [] : stores.filter(t=>s.replies[t.id]?.confirmed).map(t=>t.id),
    applyGroups: async groups=>{await save('targeting',{groups}); notify('Proposition appliquée aux groupes de magasins.');},
    mode: page === 'configurer' && !shop ? 'admin' : 'shop',
    tab: page === 'configurer' && !shop ? 'rules' : 'entry',
    store: Math.max(0, stores.findIndex(t => t.id === q.get('id'))),
    stores,
    products,
    data,
    title: s.op.title,
    command(mode, i, d) {
      if (mode === 'shop') {
        const r = d.replies[i];
        return {
          action: 'reply',
          payload: {
            store: stores[i].id,
            confirm: r.confirmed,
            reply: {
              ...r,
              picks: toIds(r.picks),
              prices: toIds(r.prices)
            }
          }
        }
      }
      const {
        replies,
        rules,
        assigned,
        eligibility,
        ...config
      } = d;
      return {
        action: 'config',
        payload: {
          config,
          ...(Array.isArray(s.targetGroups) ? {} : {
            rules: Object.fromEntries(stores.map((x, i) => [x.id, rules[i]])),
            assign: Object.fromEntries(stores.map((x, i) => [x.id, assigned[i]]))
          }),
          eligibility: Object.fromEntries(products.map((x, i) => [x.id, Object.keys(eligibility[i]).filter(k => eligibility[i][k])]))
        }
      }
    },
    save: req => save(req.action, req.payload, false)
  };
};
window.addEventListener('beforeunload', e => {
  if (pending) {
    e.preventDefault();
    e.returnValue = ''
  }
});
window.addEventListener('hashchange', () => {
  if (ctx) render()
});
let checkingReview=false;
async function updateReview(){
  const active=editor.current();
  if(!active||active.mode!=='bat'||document.hidden||!editor.canRefresh()||checkingReview)return;
  checkingReview=true;
  try{
    const info=await api('/revision');
    if(info.revision>ctx.revision){
      const fresh=await api('/read');
      if(editor.canRefresh() && fresh.revision>ctx.revision){ctx=fresh;editor.redraw();}
    }
  }catch{}finally{checkingReview=false;}
}
setInterval(updateReview,6000);
document.addEventListener('visibilitychange', async () => {
  if(editor.current()){await updateReview();return;}
  if (ctx && !document.hidden && !pending && !$('#modal').open && !['participation', 'configurer', 'produits'].includes(current().page)) try {
    const fresh = await api('/read');
    if (fresh.revision > ctx.revision) {
      ctx = fresh;
      render()
    }
  } catch {}
});

function login() {
  const main = $('#main');
  main.innerHTML =
    '<section class="sheet" style="max-width:520px;margin:50px auto"><h1>Ouvrir le dossier partagé</h1><p>Utilisez votre code Responsable Studio pour retrouver les données de cette opération.</p><form id="login">' +
    (readStore('bos-code') ? '' : field('code', 'Code Responsable', '', 'password', 'required autocomplete="off"')) + '<div class="actions">' + submit(readStore(
      'bos-code') ? 'Utiliser mon accès Studio' : 'Ouvrir le dossier') + link('./', 'Essayer Brico-déco', 'quiet') +
    '</div><p role="alert" class="issue"></p></form></section>';
  $('#login').onsubmit = async e => {
    e.preventDefault();
    const b = e.submitter;
    b.disabled = true;
    try {
      await start(new FormData(e.target).get('code') || readStore('bos-code'))
    } catch (x) {
      if (!$('#login input[name=code]')) e.target.insertAdjacentHTML('afterbegin', field('code', 'Code Responsable', '', 'password',
        'required autocomplete="off"'));
      $('#login .issue').textContent = x.message
    } finally {
      b.disabled = false
    }
  }
}
async function start(code) {
  key = key || newKey();
  writeStore(sessionKey, key);
  await api('/session', {
    operation: opId,
    ...(pilotRequest?{scenario:'production'}:{}),
    ...(code ? {
      code
    } : {})
  });
  ctx = await api('/read');
  ready()
}

function ready() {
  render();
  $('#open-ai').disabled = ['relecteur','relecteur-kit'].includes(ctx.role);
  if (!$('#open-ai').disabled && params.get('assistant') === '1') chat.open()
}
async function init() {
  try {
    $('#open-ai').disabled = true;
    if(!opId){
      const raw=location.hash.slice(1),page=raw.split('?')[0];
      location.replace(operationChoice(Object.hasOwn(names,page)?raw:'informations'));
      return;
    }
    const invite = location.hash.match(/^#acces=([a-f0-9]{64})$/);
    if ((slot || reviewerSlot || kitSlot) && invite) {
      key = invite[1];
      writeStore(sessionKey, key);
      history.replaceState(null, '', location.pathname + location.search + (kitSlot?'#bat':reviewerSlot?route('production',{id:reviewerSlot,atelier:'bat',page:1}):'#participation'))
    }
    key = readStore(sessionKey) || '';
    if (key) {
      try {
        ctx = await api('/read');
        ready();
        return
      } catch (e) {
        if (e.status !== 401) throw e;
        key = '';
      }
    }
    if (reviewerSlot || kitSlot) throw Error('Lien de relecture incomplet ou expiré. Demandez un nouveau lien.');
    if (slot) throw Error('Ce lien magasin a expiré. Demandez un nouvel accès depuis Participants.');
    if (shared) return login();
    await start();
  } catch (e) {
    $('#main').innerHTML = '<section class="sheet"><h2>Ouverture du dossier</h2><p role="alert">' + esc(e.message) + '</p>' + btn('retry', 'Réessayer') +
      '</section>'
  }
}
init();
