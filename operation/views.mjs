import {bricoId, isBricoDemo, catalogueId, missingBonialUnit, displayVersions, versionLabel, versionOptions} from '../server/brico.mjs?v=20261128.8';
import {participantsOf} from '../server/targeting.mjs';
import {
  pageFor,
  localVariantPrices,
  variantCurrent,
  reviewChanges,
  totals,
  eligible,
  anomalies
} from '../server/model.mjs?v=20261128.8';
export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
} [c]));
export const euros = v => v == null ? 'À renseigner' : Number(v).toLocaleString('fr-FR', {
  style: 'currency',
  currency: 'EUR'
});
export const tag = (s, c = '') => '<span class="tag ' + c + '">' + esc(s) + '</span>';
export const btn = (a, label, id = '', c = 'act') => '<button type="button" class="' + c + '" data-do="' + a + '" data-id="' + esc(id) + '">' + esc(label) +
  '</button>';
export function route(page, params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  return '#' + page + (q.size ? '?' + q : '')
}
export const link = (to, label, c = 'act') => '<a href="' + esc(to) + '" class="' + c + '">' + esc(label) + '</a>';
export const card = (title, body, action = '') => '<section class="sheet"><div class="hrow sectionhead"><h2>' + esc(title) + '</h2>' + action + '</div>' + body +
  '</section>';
const row = (name, sub, action) => '<div class="rowline"><div><strong>' + esc(name) + '</strong><p>' + esc(sub) + '</p></div>' + action + '</div>';
export const table = (hs, rows) => '<div class="listwrap"><table><thead><tr>' + hs.map(x => '<th scope="col">' + esc(x) + '</th>').join('') +
  '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
const tr = (...values) => '<tr>' + values.map(x => '<td>' + x + '</td>').join('') + '</tr>';
export const field = (name, label, value, type = 'text', attrs = '') => '<label class="field">' + esc(label) + '<input type="' + type + '" name="' + esc(name) +
  '" value="' + esc(value) + '" ' + attrs + '></label>';
export const sel = (name, label, options, selected) => '<label class="field">' + esc(label) + '<select aria-label="' + esc(label) + '" name="' + name + '">' + options.map(([k, v]) =>
  '<option value="' + esc(k) + '" ' + (k === selected ? 'selected' : '') + '>' + esc(v) + '</option>').join('') + '</select></label>';
export const checks = (name, options, chosen) => options.map(([k, v]) => '<label class="pick"><input type="checkbox" name="' + esc(name) + '" value="' + esc(k) +
  '" ' + (chosen.includes(k) ? 'checked' : '') + '> ' + esc(v) + '</label>').join(' ');
export const submit = label => '<button type="submit" class="primary">' + esc(label) + '</button>';
const none = label => '<p class="sub">' + esc(label) + '</p>';
const metric = (val, label, to) => '<a class="stat" href="' + esc(to) + '"><strong>' + esc(val) + '</strong><span>' + esc(label) + '</span></a>';
export const stateOf = (s, t) => s.replies[t.id]?.confirmed ? (s.replies[t.id].yn === 'yes' ? 'engage' : 'non') : t.status;
export const priorityNames = {star:'Star',top:'Top',standard:'Standard'};
export const statNames = {
  engage: 'Engagé',
  attente: 'En attente',
  non: 'Non participant'
};
export const filterStores = (s, f) => participantsOf(s).filter(t => f === 'engagements' ? s.replies[t.id]?.confirmed && s.replies[t.id].yn==='yes' : f === 'heritage' ? stateOf(s, t) === 'engage' && !s.replies[t.id]?.confirmed : f === 'confirmed' ? s
  .replies[t.id]?.confirmed : !f || stateOf(s, t) === f);
const cataloguePdf = '../assets/brico-deco/catalogue.pdf';
function sourcePage(n) {
  return '<a class="catalogue-page" rel="noopener" target="_blank" href="' + cataloguePdf + '#page=' + n +
    '"><img src="../assets/brico-deco/page-' + n + '.webp" alt="Page ' + n + ' du catalogue Brico-déco"><span>Catalogue original · ouvrir la page ' + n + ' du PDF ↗</span></a>';
}
export function info(s, q) {
  const o = s.op,
    t = totals(s),
    miss = s.products.filter(x => x.price === null),
    next = s.supports.find(x => x.state === 'En revue') || s.supports[0];
  const summary = card('Informations', row('Objectif commercial', o.objective || 'À renseigner', '') + row('Pilotage', [o.owner, o.contact].filter(Boolean).join(
    ' · ') || 'À renseigner', ''), btn('edit-info', 'Modifier'));
  const f = q.get('etat') || '',
    sup = q.get('support') || '',
    taskRows = s.tasks.filter(x => (!sup || x.support === sup) && (!f || (f === 'fait') === x.done));
  const jal = '<section class="sheet"><details id="dates" ' + (q.get('jalons') === '1' ? 'open' : '') +
    '><summary>Dates et jalons</summary><p class="sub">Période commerciale du ' + esc(o.start) + ' au ' + esc(o.end) + '.</p><div class="filters">' + sel(
      'taskfilter', 'État', [
        ['', 'Tous'],
        ['ouvert', 'À faire'],
        ['fait', 'Terminés']
      ], f) + sel('tasksupport', 'Support', [
      ['', 'Tous'], ...s.supports.map(x => [x.id, x.name])
    ], sup) + btn('schedule', 'Générer le rétroplanning') + '</div>' + table(['Jalon', 'Support', 'Échéance', 'État'], taskRows.map(x => tr(esc(x.name), esc(s
      .supports.find(y => y.id === x.support)?.name || 'Général'), esc(x.due), btn('task', x.done ? 'Terminé' : 'À faire', x.id)))) + '</details></section>';
  const source = o.id === bricoId ? '<section class="sheet catalogue-intro"><a href="' + route('production',{id:catalogueId,page:1}) +
    '"><img src="../assets/brico-deco/page-1.webp" alt="Feuilleter le catalogue Brico-déco"></a><div><h2>Catalogue Brico-déco</h2>' +
    '<p>Édition Nanotera Levallois du 19 au 26 novembre 2022. Les pages 2 à 5 présentent les 21 références de l’offre d’origine.</p><div class="actions">' +
    link(route('production',{id:catalogueId,page:2}), 'Feuilleter le catalogue') + link(route('production',{id:catalogueId,atelier:'fer',page:2}),'Chemin de fer') + link(route('production',{id:catalogueId,atelier:'bat',page:2}),'BAT collaboratif') + link('#produits','Consulter les fiches produits') +
    '<a class="quiet" target="_blank" rel="noopener" href="' + cataloguePdf + '">Ouvrir le PDF original ↗</a></div></div></section>' : '';
  if(s.kit)return summary+jal+source;
  return source + summary + jal + card('À préparer', row('Confirmer les choix de supports', t.heritage + ' sélections héritées · ' + t.attente +
      ' participations en attente.', link('#participants?filtre=heritage', 'Voir les participants')) + row(miss.length ? 'Compléter les produits utilisés' : 'Vérifier l’offre commerciale', miss.length ? miss.length + ' fiche(s) avec un prix manquant.' : s.products.length + ' références avec un prix renseigné.', link(route('produits', {
        id: miss[0]?.id
      }), 'Ouvrir le PIM')) + (next ? row('Relire les supports', next.name + ' · ' + next.state, link(route('production', {
      id: next.id
    }), 'Ouvrir le BAT')) : '')) +
    card('Engagement du réseau', '<div class="stats">' + metric(t.engage, 'Engagés', '#participants?filtre=engage') + metric(t.attente, 'En attente',
      '#participants?filtre=attente') + metric(t.non, 'Non participant', '#participants?filtre=non') + '</div>');
}
const quantities = new Intl.NumberFormat('fr-FR');
function confirmedChoices(s, answer) {
  if (!answer?.confirmed || answer.yn !== 'yes') return ['—', '—', '—'];
  const printed = answer.media?.[0] && answer.copies > 0 ? quantities.format(answer.copies) : 'Aucun';
  const kits = s.config.kits.filter(kit => answer.counts?.[kit.id] > 0)
    .map(kit => quantities.format(answer.counts[kit.id]) + ' × ' + kit.name);
  const digital = answer.media?.[1] ? s.config.digitalKits.find(kit => kit.id === answer.digital)?.name : null;
  return [printed, kits.join(' · ') || 'Aucun', digital || 'Aucun'];
}

export function participants(s, q) {
  const stores = participantsOf(s), t = totals(s), demo = isBricoDemo(s);
  const opened = !!s.engagementsOpened;
  const f = q.get('filtre') || (demo && opened ? 'engagements' : '');
  const version = q.get('version');
  const confirmed = store => s.replies[store.id]?.confirmed && s.replies[store.id].yn === 'yes';
  const rows = (f === 'engagements' ? stores.filter(confirmed) : filterStores(s,f==='tous'?'':f))
    .filter(store => !version || (confirmed(store) && s.replies[store.id].v === version));
  const page = Math.max(1, Math.min(Math.ceil(rows.length/25), parseInt(q.get('page'),10)||1));
  const x = stores.find(t => t.id === q.get('id'));
  const r = x && s.replies[x.id];
  const url = (params={}) => route('participants',{filtre:f||'tous',version,...params});
  const versions = '<div class="stats">' + displayVersions(s).map(v => {
    const count = eligible(s,v.id).length;
    return '<div class="stat"><h3>' + esc(versionLabel(s,v.id)) + '</h3>' +
      (v.desc ? '<span>'+esc(v.desc)+'</span>' : '') +
      link(route('produits',{v:v.id}),count+' référence(s)','quiet') + '</div>';
  }).join('') + '</div>';
  const counts = '<div class="stats">' + displayVersions(s).map(v => metric(
    stores.filter(store=>confirmed(store) && s.replies[store.id].v===v.id).length,
    versionLabel(s,v.id),url({filtre:'engagements',version:v.id})
  )).join('') + '</div>';
  const setup = demo ? card('Versions de l’offre',versions+
    '<div class="actions">'+link('#configurer','Configurer les versions et les groupes')+
    (!opened && !s.op.closed ? btn('open-engagements','Ouvrir les engagements','','primary') : '')+'</div>') : '';
  const responseAction = demo && opened && !s.op.closed && stores.some(t=>!s.replies[t.id]) ?
    btn('demo-replies','Charger les réponses de démonstration','','primary') : '';
  const filters = [['tous','Tous'],['engagements','Engagements confirmés'],['heritage','Sélections héritées'],
    ['attente','En attente'],['confirmed','Confirmés'],['non','Non participants']];
  return setup + card(demo ? 'Engagements des magasins' : 'Participants',
    none(stores.length+' points de vente ciblés sur '+s.stores.length+' dans le réseau.') +
    (demo ? (opened ? counts : none('Les engagements sont à ouvrir.')) :
      '<div class="stats">'+metric(t.confirmed,'Engagements confirmés',url({filtre:'engagements',version:''}))+
      metric(t.heritage,'Sélections à confirmer',url({filtre:'heritage',version:''}))+metric(t.confirmed?t.quantity:'—','Affiches A1 confirmées',url({filtre:'confirmed',version:''}))+'</div>')+
    '<div class="filters">' + filters.map(([key,label]) => link(url({filtre:key,version:''}),label,
      'chip '+ (key === (f||'tous') && !version ? 'active' : ''))).join('')+
    (version ? tag(versionLabel(s,version),'violet') : '')+'</div>'+
    table(['Point de vente','Participation','Version retenue','Exemplaires du tract','Kit PLV','Pack digital',''],
      rows.slice((page-1)*25,page*25).map(store => {
        const answer=s.replies[store.id], state=stateOf(s,store);
        const status=answer?.review?'À revoir':state==='engage'&&!confirmed(store)?'À confirmer':statNames[state]||'À renseigner';
        return tr(link(url({id:store.id,page}),store.name,'quiet'),tag(status,confirmed(store)&&!answer.review?'good':''),
          confirmed(store)?tag(versionLabel(s,answer.v),'violet'):'—',
          ...confirmedChoices(s,answer).map(esc),btn('invite','Accès magasin',store.id));
      }))+
    (rows.length ? '' : none('Aucun participant dans cette sélection.'))+
    (rows.length<=25 ? '' : '<div class="actions">'+(page>1?link(url({page:page-1}),'Précédente'):'')+
      '<span>Page '+page+' sur '+Math.ceil(rows.length/25)+'</span>'+(page*25<rows.length?link(url({page:page+1}),'Suivante'):'')+'</div>')+
    '<div class="actions">'+btn('reminder','Préparer une relance',f==='tous'?'':f)+btn('refresh','Actualiser les réponses')+'</div>',responseAction)+
    (x ? card(x.name,row('Version affectée',x.assigned?versionLabel(s,x.assigned):'À affecter',esc(s.targetGroups?.find(g=>g.id===x.groupId)?.name||''))+
      row('Réponse du magasin',r?.review?'À revoir':r?.confirmed?'Confirmée':r?'Brouillon':'À recueillir',
        link(route('participation',{id:x.id}),'Ouvrir le parcours magasin'))+
      (confirmed(x) ? row('Version retenue',versionLabel(s,r.v),'')+
        confirmedChoices(s,r).map((value,i)=>row(['Exemplaires du tract','Kit PLV','Pack digital'][i],value,'')).join('') : '')+
      (r?.demo?none('Réponse de démonstration'):'')) : '');
}

export function viewFilter(key,label,values,selected,all='Tous') {
  return '<label class="field">'+esc(label)+'<select aria-label="'+esc(label)+'" data-screen-filter="'+esc(key)+'">'+
    [[ '',all],...values.map(v=>Array.isArray(v)?v:[v,v])].map(([value,name])=>'<option value="'+esc(value)+'"'+(value===selected?' selected':'')+'>'+esc(name)+'</option>').join('')+'</select></label>';
}
export function pim(s, q) {
  const v = q.get('v') || '',
    assortment = v ? eligible(s, v) : s.products,
    rayon=q.get('rayon')||'',
    ps=assortment.filter(p=>!rayon||(p.rayon||'À renseigner')===rayon);
  const rows = ps.map(p => {
    const href = route('produits', {
      v,rayon,
      id: p.id
    });
    return tr(link(href, p.name, 'quiet'), esc(p.pack), p.versions.map(id => tag(versionLabel(s,id), 'violet')).join(' ') || tag('À affecter', 'warn'),
      p.price == null ? tag('Prix manquant', 'warn') : esc(euros(p.price)), link(href, 'Ouvrir', 'quiet'));
  });
  return card('Produits', '<div class="filters">'+viewFilter('rayon','Rayon',[...new Set(s.products.map(p=>p.rayon||'À renseigner'))].sort(),rayon,'Tous les rayons')+'</div><p class="sub">Offre commerciale de l’opération · ' + s.products.length + ' références distinctes.</p><div class="filters">' + [
      ['', 'Toutes les versions'], ...versionOptions(s)
    ].map(([key, label]) =>
      link(route('produits', {
        v: key,rayon
      }), label, 'chip ' + (key === v ? 'active' : ''))).join('') + '</div>' +
    table(['Produit', 'Conditionnement', 'Versions éligibles', 'Prix / anomalie', 'Fiche'], rows) + none(ps.length +
      ' référence(s) dans cette sélection.'), btn('new-product', 'Ajouter une référence'));
}
export function productForm(s, p) {
  return '<form id="product" data-id="' + esc(p.id) + '"><div class="fields">' + field('name', 'Libellé', p.name, 'text', 'required') +
    field('ref', 'Référence commerciale', p.ref || '') + field('pack', 'Conditionnement', p.pack) + field('price', 'Prix national TTC (€)', p.price,
      'number', 'min=".01" step=".01"') +
    field('brand', 'Marque', p.brand) + field('rayon', 'Rayon', p.rayon) +
    sel('priority','Priorité de l’offre',Object.entries(priorityNames),p.priority || 'standard') +
    '</div><label class="field">Description<textarea name="description" maxlength="1800">' + esc(p.description || '') +
    '</textarea></label>' + field('note', 'Mentions', p.note) + '<fieldset><legend>Versions éligibles</legend>' + checks('versions', versionOptions(s), p.versions) +
    '</fieldset><div class="actions"><button class="btn" type="button" data-ps-back>Annuler</button>' + submit('Enregistrer la fiche') + '</div></form>';
}

function variantPanel(s, support) {
  const rows = [];
  for (const store of s.stores) {
    const saved = (support.variants || []).find(z => z.store === store.id);
    const prices = localVariantPrices(s, support, store.id);
    const current = saved && variantCurrent(s, support, saved);
    if (!saved && !Object.keys(prices).length) continue;
    const amounts = Object.keys(prices).length ? prices : saved.prices;
    const detail = Object.entries(amounts).map(([id, price]) => {
      const product = s.products.find(p => p.id === id);
      return (product?.name || id) + (product ? ' · page ' + pageFor(support, product) : '') + ' · ' + euros(price) + ' TTC';
    }).join(', ');
    const key = support.id + '|' + store.id;
    const actions = current ? tag('Validée', 'good') : (saved ? tag('À revoir', 'warn') : '') + (Object.keys(prices).length ? btn('variant', 'Valider la variante',
      key) : '') + (saved ? btn('removeVariant', 'Retirer du support', key) : '');
    rows.push(row(store.name, detail, actions));
  }
  return card('Variantes locales', rows.join('') || none('Aucun prix local distinct et confirmé pour ce support.'));
}
function editorLinks(id,page=1) {
  return '<div class="actions">'+link(route('production',{id,atelier:'fer',page}),'Chemin de fer')+
    link(route('production',{id,atelier:'bat',page}),'BAT collaboratif')+'</div>';
}
export function supports(s, q, prodMode = false) {
  const page = prodMode ? 'production' : 'supports',
    x = s.supports.find(x => x.id === q.get('id')),
    key=prodMode?'state':'format',value=q.get(key)||'',
    visible=s.supports.filter(y=>!value||y[key]===value),
    filters='<div class="filters">'+viewFilter(key,prodMode?'État du support':'Format',[...new Set(s.supports.map(y=>y[key]).filter(Boolean))].sort(),value)+'</div>';
  const listing = card(prodMode ? 'Supports en production' : 'Supports à préparer', none(prodMode ? 'Révisions, fichiers de travail et décisions de BAT.' :
    'Formats, produits retenus et variantes du dispositif.') + filters + (!visible.length?none('Aucun support pour ces critères.'):'') + table(prodMode ? ['Support', 'Révision', 'État', ''] : ['Support', 'Format', 'Produits', ''], visible.map(y => tr(esc(y.name), esc(prodMode ? 'R' + y.revision : y.format), prodMode ? tag(y.state, y.review ? 'warn' : '') : esc(y.products.length),
      link(route(page, {
        [key]:value,id: y.id
      }), prodMode ? 'Voir le BAT' : 'Voir le dispositif') + editorLinks(y.id)))), prodMode ? '' : btn('new-device', 'Ajouter un support'));
  if (!x) return listing;
  const ps = s.products.filter(p => x.products.includes(p.id)),
    pg = Math.max(1, Math.min(x.pages, Number(q.get('page')) || 1));
  if (!prodMode) return listing + card(x.name, editorLinks(x.id,pg) + '<form id="support" data-id="' + esc(x.id) + '"><div class="fields">' + (x.participantItemId === 'a1' ?
        '<p>Quantité d’affiches à saisir par point de vente dans Ma participation.</p>' : '') + field('format', 'Format attendu', x.format) +
      sel('scope', 'Version commerciale', [
        ['Toutes', 'Toutes les versions'], ...versionOptions(s)
      ], x.scope || 'Toutes') + field('note', 'Consignes et quantités attendues', x.note) + '</div><fieldset><legend>Offres utilisées</legend>' + checks(
        'products', s.products.map(p => [p.id, p.name]), x.products) + '</fieldset>' + submit('Enregistrer le dispositif') + '</form><div class="actions">' +
      link(route('production', {
        id: x.id
      }), 'Voir les révisions') + '</div>') +
    variantPanel(s, x);
  const revision = q.get('revision');
  if (prodMode && revision && revision !== String(x.revision)) {
    const records = x.history.filter(h => String(h.revision) === revision);
    const baseline = String(x.reviewBaseline?.revision) === revision ? x.reviewBaseline : null;
    const archived = records.findLast(h => h.decision !== 'Nouvelle révision') || baseline || records.at(-1);
    const details = archived ? row('Décision conservée', archived.decision, tag('Archive')) +
      (archived.file ? row('Fichier de la révision', archived.file, '') : '') + (archived.attachment ? btn('get-file', archived.attachment.name, archived.attachment
        .id) : '') +
      (archived.products?.length ? table(['Référence', 'Page', 'Prix TTC'], archived.products.map(p => tr(esc(p.name || p.id), esc(p.page || '—'), esc(euros(p
        .price))))) : none('Aucun relevé produit conservé pour cette décision.')) : none('Cette révision est indisponible dans ce dossier.');
    return listing + card(x.name + ' · BAT R' + revision, details, link(route('production', {
      id: x.id
    }), 'Revenir au BAT actuel'));
  }
  const changes = reviewChanges(s, x);
  return listing + card(x.name + ' · BAT R' + x.revision, editorLinks(x.id,pg) + tag(x.state) + (changes.length ? '<details><summary>Modifications depuis la dernière revue (' + changes
      .length + ')</summary><ul>' + changes.map(text => '<li>' + esc(text) + '</li>').join('') + '</ul></details>' : '') + (x.review ? ' ' + tag(
      'Nouvelle revue requise', 'warn') : '') + '<p>Décision attendue · ' +
    esc(x.decider) + '</p><div class="filters">' + sel('batpage', 'Page du BAT', Array.from({
      length: Math.min(x.pages, 200)
    }, (_, i) => [String(i + 1), 'Page ' + (i + 1)]), String(pg)) + '</div>' + (s.op.id === bricoId && x.id === catalogueId && pg <= 6 ? sourcePage(pg) : '') + table(['Offre sur cette page', 'Prix national', 'Fiche'], ps.filter(p => pageFor(x,
      p) === pg).map(p => tr(link(route('produits',{id:p.id}),p.name,'quiet'), p.price === null ? tag('Prix manquant', 'warn') : esc(euros(p.price)), link(route('produits', {
      id: p.id
    }), 'Ouvrir le PIM')))) +
    '<div class="actions">' + (x.file && /^https:\/\//i.test(x.file) ? '<a class="act" target="_blank" rel="noreferrer" href="' + esc(x.file) +
      '">Ouvrir le fichier de travail</a>' : '') + (x.attachment ? btn('get-file', x.attachment.name, x.attachment.id) : '') + btn('upload', 'Déposer un BAT', x
      .id) + btn('file', 'Associer un lien', x.id) + link(route('supports', {
      id: x.id
    }), 'Ouvrir le dispositif') + '</div><div class="actions">' + (['En préparation', 'En corrections'].includes(x.state) ? ['En revue'] : x.state ===
      'En revue' ? ['Validé', 'En corrections'] : x.state === 'Validé' ? ['Remis'] : []).concat('Nouvelle révision').map(a => btn('decision', a, x.id + '|' + a))
    .join('') + '</div>') + card('Historique des décisions', x.history.slice().reverse().map(h => row('R' + h.revision + ' · ' + h.decision, h.comment ||
      'Décision enregistrée', esc(h.at.slice(0, 10)) + (h.revision !== x.revision ? link(route('production', {
        id: x.id,
        revision: h.revision
      }), 'Ouvrir R' + h.revision) : '') + (h.changes?.length ? '<details><summary>Changements consignés</summary><ul>' + h.changes.map(text =>
        '<li>' + esc(text) + '</li>').join('') + '</ul></details>' : '') + (h.attachment ? btn('get-file', h.attachment.name, h.attachment.id) : ''))).join('') ||
    none(
      'Aucune nouvelle décision enregistrée.'));
}
export function flows(s, q, back) {
  const id = q.get('id');
  const stage=q.get('statut')||'';
  const selected=s.flows.filter(f=>id?f.id===id:!stage||f.stage===stage);
  return card('Flux', none('Contrôler l’offre par version, générer un fichier et consigner sa remise.') + (id ? (back||link('#flux', 'Tous les flux')) : '<div class="filters">'+viewFilter('statut','État du flux',[...new Set(s.flows.map(f=>f.stage))],stage)+'</div>') + (!id&&!selected.length?none('Aucun flux pour ces critères.'):'') + (id && !
    selected.length ? none('Ce flux est indisponible dans le dossier.') : '') + selected.map(f => {
    const errors = anomalies(s, f.v);
    const missingUnit = missingBonialUnit(s,f);
    return '<section class="inset" style="margin:12px 0"><div class="hrow"><h3>' + esc(f.name) + '</h3>' + tag(f.stage, f.stage === 'À corriger' ? 'warn' :
        '') + '</div><div class="filters">' + sel('flow-' + f.id, 'Version commerciale', [
        ['', 'À affecter'], ...versionOptions(s)
      ], f.v) + '</div>' + (missingUnit?row(missingUnit.name,'Conditionnement à renseigner pour le flux Bonial',link(route('produits',{id:missingUnit.id}),'Corriger dans le PIM')):'') + errors.map(p => row(p.name, 'Prix national manquant', link(route('produits', {
        v: f.v,
        id: p.id
      }), 'Corriger dans le PIM'))).join('') + (f.checked ? none('Dernier contrôle · ' + new Date(f.checked).toLocaleString('fr-FR')) : '') +
      '<div class="actions">' + btn('check', 'Contrôler', f.id) + (f.stage === 'Contrôlé' && f.validated ? btn('generate', 'Générer le CSV', f.id) : '') + (f
        .rows?.length ? btn('download', 'Télécharger le fichier généré', f.id) : '') + (f.stage === 'Généré' ? (isBricoDemo(s) ? btn('test-deposit','Déposer le CSV en recette',f.id,'primary') : btn('deliver', 'Enregistrer la remise', f.id)) :
        '') + '</div>' + (f.review ? none('L’offre a évolué depuis la remise. Relancez le contrôle.') : '') + (f.receipt ? none((isBricoDemo(s)?'Reçu de dépôt en recette · ':'Reçu de remise · ') + f
        .receipt) : '') + (f.rows?.length ? '<details><summary>Aperçu du CSV · '+f.rows.length+' offres</summary>'+
        table(['Référence','Offre','Conditionnement','Prix TTC','Version'],f.rows.slice(0,50).map(r=>tr(esc(r.reference),esc(r.libelle),esc(r.conditionnement),esc(euros(r.prix_ttc)),esc(versionLabel(s,r.version)))))+'</details>' : '') + (f.archive?.length ? '<details><summary>Fichiers précédents (' + f.archive.length + ')</summary>' + f.archive.map((h, i) => row(h
        .v + ' · ' + new Date(h.generated).toLocaleDateString('fr-FR'), h.receipt ? 'Reçu · ' + h.receipt : 'Fichier généré', btn('historic-flow',
          'Télécharger', f.id + '|' + i))).reverse().join('') + '</details>' : '') + '</section>'
  }).join(''))
}
