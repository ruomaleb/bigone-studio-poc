import {participantsOf} from '../server/targeting.mjs';
import {
  pageFor,
  localVariantPrices,
  variantCurrent,
  reviewChanges,
  totals,
  eligible,
  anomalies
} from '../server/model.mjs?v=6';
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
export const sel = (name, label, options, selected) => '<label class="field">' + esc(label) + '<select name="' + name + '">' + options.map(([k, v]) =>
  '<option value="' + esc(k) + '" ' + (k === selected ? 'selected' : '') + '>' + esc(v) + '</option>').join('') + '</select></label>';
export const checks = (name, options, chosen) => options.map(([k, v]) => '<label class="pick"><input type="checkbox" name="' + esc(name) + '" value="' + esc(k) +
  '" ' + (chosen.includes(k) ? 'checked' : '') + '> ' + esc(v) + '</label>').join(' ');
export const submit = label => '<button type="submit" class="primary">' + esc(label) + '</button>';
const none = label => '<p class="sub">' + esc(label) + '</p>';
const metric = (val, label, to) => '<a class="stat" href="' + esc(to) + '"><strong>' + esc(val) + '</strong><span>' + esc(label) + '</span></a>';
export const stateOf = (s, t) => s.replies[t.id]?.confirmed ? (s.replies[t.id].yn === 'yes' ? 'engage' : 'non') : t.status;
export const statNames = {
  engage: 'Engagé',
  attente: 'En attente',
  non: 'Non participant'
};
export const filterStores = (s, f) => participantsOf(s).filter(t => f === 'heritage' ? stateOf(s, t) === 'engage' && !s.replies[t.id]?.confirmed : f === 'confirmed' ? s
  .replies[t.id]?.confirmed : !f || stateOf(s, t) === f);
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
  return summary + jal + card('À préparer', row('Confirmer les choix de supports', t.heritage + ' sélections héritées · ' + t.attente +
      ' participations en attente.', link('#participants?filtre=heritage', 'Voir les participants')) + row('Compléter les produits utilisés', miss.length +
      ' fiche(s) avec un prix manquant.', link(route('produits', {
        id: miss[0]?.id
      }), 'Ouvrir le PIM')) + (next ? row('Relire les supports', next.name + ' · ' + next.state, link(route('production', {
      id: next.id
    }), 'Ouvrir le BAT')) : ''), link('#configurer', 'Proposer une version par groupe')) +
    card('Engagement du réseau', '<div class="stats">' + metric(t.engage, 'Engagés', '#participants?filtre=engage') + metric(t.attente, 'En attente',
      '#participants?filtre=attente') + metric(t.non, 'Non participant', '#participants?filtre=non') + '</div>');
}
export function participants(s, q) {
  const t = totals(s),
    f = q.get('filtre') || '',
    rows = filterStores(s, f),
    page = Math.max(1, Math.min(Math.ceil(rows.length/25), parseInt(q.get('page'),10)||1)),
    store = q.get('id'),
    x = participantsOf(s).find(t => t.id === store),
    r = x && s.replies[x.id];
  const filters = [
    ['', 'Tous'],
    ['heritage', 'Sélections héritées'],
    ['attente', 'En attente'],
    ['confirmed', 'Confirmés'],
    ['non', 'Non participants']
  ];
  return card('Participants', '<p class="sub">' + participantsOf(s).length + ' points de vente ciblés sur '+s.stores.length+' dans le réseau.</p><div class="stats">' + metric(t.engage, 'Engagés',
      '#participants?filtre=engage') + metric(t.heritage, 'Sélections à confirmer', '#participants?filtre=heritage') + metric(t.confirmed ? t.quantity : '—',
      'Affiches A1 confirmées', '#participants?filtre=confirmed') + '</div><div class="filters">' + filters.map(([k, v]) => link(route('participants', {
      filtre: k
    }), v, 'chip ' + (k === f ? 'active' : ''))).join('') + '</div>' + table(['Point de vente', 'Participation', 'Version', 'Choix de supports', ''], rows.slice((page-1)*25,page*25).map(
      t => {
        const r = s.replies[t.id];
        return tr(link(route('participants', {
          filtre: f,
          id: t.id
        }), t.name, 'quiet'), tag(statNames[stateOf(s, t)] || 'À renseigner', stateOf(s, t) === 'engage' ? 'good' : ''), esc(r?.v || t.assigned ||
          'À affecter'), esc(r?.review ? 'À revoir' : r?.confirmed ? 'Confirmés' : stateOf(s, t) === 'engage' ? 'Hérités' : '—'), btn('invite',
          'Accès magasin', t.id))
      })) + (rows.length>25?'<div class="actions">'+(page>1?link(route('participants',{filtre:f,page:page-1}),'Précédente'):'')+'<span>Page '+page+' sur '+Math.ceil(rows.length/25)+'</span>'+(page*25<rows.length?link(route('participants',{filtre:f,page:page+1}),'Suivante'):'')+'</div>':'') + (rows.length ? '' : none('Aucun participant dans cette sélection.')) + '<div class="actions">' + btn('reminder', 'Préparer une relance', f) + btn(
      'refresh', 'Actualiser les réponses') + '</div>', link('#configurer', 'Proposer une version par groupe', 'primary')) +
    (x ? card(x.name, row('Version affectée', x.assigned || 'À affecter', esc(s.targetGroups?.find(g=>g.id===x.groupId)?.name || '')) + row('Réponse du magasin', r?.review ? 'À revoir' : r?.confirmed ? 'Confirmée' : r ? 'Brouillon' : 'À recueillir', link(route(
      'participation', {
        id: x.id
      }), 'Ouvrir le parcours magasin')) + (r ? '<p>Affiches au détail · ' + esc(r.counts.a1 ?? 0) + ' · Tract · ' + esc(r.copies) + ' ex. · Budget local · ' +
      euros(r.budget || 0) + '</p>' : '')) : '') +
    (s.reminders.length ? card('Brouillons de relance', s.reminders.slice(-5).reverse().map(r => row(r.stores.length + ' destinataire(s)', r.text, tag(
      'Brouillon'))).join('')) : '');
}
export function pim(s, q) {
  const v = q.get('v') || '',
    ps = v ? eligible(s, v) : s.products;
  const rows = ps.map(p => {
    const href = route('produits', {
      v,
      id: p.id
    });
    return tr(link(href, p.name, 'quiet'), esc(p.pack), p.versions.map(id => tag(id, 'violet')).join(' ') || tag('À affecter', 'warn'),
      p.price == null ? tag('Prix manquant', 'warn') : esc(euros(p.price)), link(href, 'Ouvrir', 'quiet'));
  });
  return card('Produits', '<p class="sub">Offre commerciale de l’opération · ' + s.products.length + ' références distinctes.</p><div class="filters">' + [
      ['', 'Toutes les versions'], ...s.config.versions.map(x => [x.id, x.id + ' · ' + x.name])
    ].map(([key, label]) =>
      link(route('produits', {
        v: key
      }), label, 'chip ' + (key === v ? 'active' : ''))).join('') + '</div>' +
    table(['Produit', 'Conditionnement', 'Versions éligibles', 'Prix / anomalie', 'Fiche'], rows) + none(ps.length +
      ' référence(s) dans cette sélection.'), btn('new-product', 'Ajouter une référence'));
}
export function productForm(s, p) {
  return '<form id="product" data-id="' + esc(p.id) + '"><div class="fields">' + field('name', 'Libellé', p.name, 'text', 'required') +
    field('ref', 'Référence commerciale', p.ref || '') + field('pack', 'Conditionnement', p.pack) + field('price', 'Prix national TTC (€)', p.price,
      'number', 'min=".01" step=".01"') +
    field('brand', 'Marque', p.brand) + field('rayon', 'Rayon', p.rayon) +
    '</div><label class="field">Description<textarea name="description" maxlength="1800">' + esc(p.description || '') +
    '</textarea></label>' + field('note', 'Mentions', p.note) + '<fieldset><legend>Versions éligibles</legend>' + checks('versions', s.config.versions.map(
      v => [v.id, v.id + ' · ' + v.name]), p.versions) +
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
export function supports(s, q, prodMode = false) {
  const page = prodMode ? 'production' : 'supports',
    x = s.supports.find(x => x.id === q.get('id'));
  const listing = card(prodMode ? 'Supports en production' : 'Supports à préparer', none(prodMode ? 'Révisions, fichiers de travail et décisions de BAT.' :
    'Formats, produits retenus et variantes du dispositif.') + table(prodMode ? ['Support', 'Révision', 'État', ''] : ['Support', 'Format', 'Produits', ''], s
    .supports.map(y => tr(esc(y.name), esc(prodMode ? 'R' + y.revision : y.format), prodMode ? tag(y.state, y.review ? 'warn' : '') : esc(y.products.length),
      link(route(page, {
        id: y.id
      }), prodMode ? 'Voir le BAT' : 'Voir le dispositif')))), prodMode ? '' : btn('new-device', 'Ajouter un support'));
  if (!x) return listing;
  const ps = s.products.filter(p => x.products.includes(p.id)),
    pg = Math.max(1, Math.min(x.pages, Number(q.get('page')) || 1));
  if (!prodMode) return listing + card(x.name, '<form id="support" data-id="' + esc(x.id) + '"><div class="fields">' + (x.participantItemId === 'a1' ?
        '<p>Quantité d’affiches à saisir par point de vente dans Ma participation.</p>' : '') + field('format', 'Format attendu', x.format) +
      sel('scope', 'Version commerciale', [
        ['Toutes', 'Toutes les versions'], ...s.config.versions.map(v => [v.id, v.id + ' · ' + v.name])
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
  return listing + card(x.name + ' · BAT R' + x.revision, tag(x.state) + (changes.length ? '<details><summary>Modifications depuis la dernière revue (' + changes
      .length + ')</summary><ul>' + changes.map(text => '<li>' + esc(text) + '</li>').join('') + '</ul></details>' : '') + (x.review ? ' ' + tag(
      'Nouvelle revue requise', 'warn') : '') + '<p>Décision attendue · ' +
    esc(x.decider) + '</p><div class="filters">' + sel('batpage', 'Page du BAT', Array.from({
      length: Math.min(x.pages, 200)
    }, (_, i) => [String(i + 1), 'Page ' + (i + 1)]), String(pg)) + '</div>' + table(['Offre sur cette page', 'Prix national', 'Fiche'], ps.filter(p => pageFor(x,
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
export function flows(s, q) {
  const id = q.get('id');
  const selected = id ? s.flows.filter(f => f.id === id) : s.flows;
  return card('Flux', none('Contrôler l’offre par version, générer un fichier et consigner sa remise.') + (id ? link('#flux', 'Tous les flux') : '') + (id && !
    selected.length ? none('Ce flux est indisponible dans le dossier.') : '') + selected.map(f => {
    const errors = anomalies(s, f.v);
    return '<section class="inset" style="margin:12px 0"><div class="hrow"><h3>' + esc(f.name) + '</h3>' + tag(f.stage, f.stage === 'À corriger' ? 'warn' :
        '') + '</div><div class="filters">' + sel('flow-' + f.id, 'Version commerciale', [
        ['', 'À affecter'], ...s.config.versions.map(v => [v.id, v.id + ' · ' + v.name])
      ], f.v) + '</div>' + errors.map(p => row(p.name, 'Prix national manquant', link(route('produits', {
        v: f.v,
        id: p.id
      }), 'Corriger dans le PIM'))).join('') + (f.checked ? none('Dernier contrôle · ' + new Date(f.checked).toLocaleString('fr-FR')) : '') +
      '<div class="actions">' + btn('check', 'Contrôler', f.id) + (f.stage === 'Contrôlé' && f.validated ? btn('generate', 'Générer le CSV', f.id) : '') + (f
        .rows?.length ? btn('download', 'Télécharger le fichier généré', f.id) : '') + (f.stage === 'Généré' ? btn('deliver', 'Enregistrer la remise', f.id) :
        '') + '</div>' + (f.review ? none('L’offre a évolué depuis la remise. Relancez le contrôle.') : '') + (f.receipt ? none('Reçu de remise · ' + f
        .receipt) : '') + (f.archive?.length ? '<details><summary>Fichiers précédents (' + f.archive.length + ')</summary>' + f.archive.map((h, i) => row(h
        .v + ' · ' + new Date(h.generated).toLocaleDateString('fr-FR'), h.receipt ? 'Reçu · ' + h.receipt : 'Fichier généré', btn('historic-flow',
          'Télécharger', f.id + '|' + i))).reverse().join('') + '</details>' : '') + '</section>'
  }).join(''))
}
