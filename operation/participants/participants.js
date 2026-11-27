'use strict';
const icons = {
  setup: 'M4 7h16 M4 17h16 M8 4v6 M15 14v6',
  box: 'm3 7 9-4 9 4-9 4z M3 7v10l9 4 9-4V7 M12 11v10',
  radio: 'M4 9a12 12 0 0 1 16 0 M7 12a8 8 0 0 1 10 0 M10 15a4 4 0 0 1 4 0 M12 19h.01',
  ad: 'm3 10 13-5v14L3 14z M5 15l2 5h3l-2-5 M20 9l1-1 M20 13h2',
  tag: 'M3 4h8l9 9-7 7-10-10z M7 8h.01',
  check: 'm4 12 5 5L20 6',
  list: 'M8 6h12 M8 12h12 M8 18h12 M4 6h.01 M4 12h.01 M4 18h.01',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  arrow: 'M4 12h15 M13 6l6 6-6 6',
  info: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 11v6 M12 7h.01',
  shop: 'M3 9h18l-2-5H5z M5 9v11h14V9 M9 20v-6h6v6',
  plus: 'M12 5v14 M5 12h14',
  spark: 'm12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z',
  trash: 'M4 6h16 M8 6V4h8v2 M6 6l1 14h10l1-14'
};
const ico = k => '<svg class="ico" aria-hidden="true" viewBox="0 0 24 24"><path d="' + icons[k] + '"/></svg>';
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
} [c]));
const eur = v => Number(v || 0).toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }),
  nf = v => Number(v).toLocaleString('fr-FR');
const core = window.parent.studioWizard();
const stores = core.stores.map(s => s.name);
const channels = ['SMS', 'RCS', 'E-mail', 'Écrans internes', 'Réseaux sociaux organiques'];
const products = core.products;
const adminTabs = [
  ['rules', 'Proposition par groupe', 'setup'],
  ['plv', 'PLV', 'box'],
  ['owned', 'Canaux propriétaires', 'radio'],
  ['ads', 'Publicité', 'ad'],
  ['offer', 'Offre produits', 'tag']
];
const shopTabs = [
  ['entry', 'Ma participation', 'shop'],
  ['local', 'PLV et canaux', 'box'],
  ['media', 'Ma publicité', 'ad'],
  ['products', 'Mon offre produits', 'tag'],
  ['summary', 'Récapitulatif', 'check']
];
const isSnapshot = false;
let persistOK = true,
  data = core.data;
let mode = core.mode,
  tab = core.tab,
  store = core.store;
const R = () => data.replies[store],
  V = id => data.versions.find(x => x.id === id) || {
    id: '',
    name: 'À affecter',
    desc: ''
  },
  must = () => data.rules[store] === 'must',
  yes = () => must() || R().yn === 'yes';
const offersFor = id => data.offer ? products.map((p, i) => ({
  ...p,
  i
})).filter(p => data.eligibility[p.i]?.[id]) : [];
const eligible = () => offersFor(R().v);

function assortment(id) {
  if (!data.offer) return '';
  const names = offersFor(id).map(p => p.name);
  return '<small class="assortment">' + esc(names.join(' · ') || 'Aucune référence associée') + '</small>';
}
let chain = Promise.resolve(),
  pending = 0;

function save() {
  const request = core.command(mode, store, structuredClone(data));
  pending++;
  window.parent.studioPending(true);
  chain = chain.then(async () => {
    try {
      const fresh = await core.save(request);
      persistOK = true;
      if (request.action === 'config' && pending === 1) {
        core.stores.forEach((t, i) => {
          const r = fresh.state.replies[t.id];
          data.replies[i].confirmed = !!r?.confirmed;
          data.replies[i].review = !!r?.review
        });
        render()
      }
      if (request.payload.confirm) toast('Réponse confirmée et enregistrée.')
    } catch (e) {
      persistOK = false;
      if (R()) R().confirmed = false;
      render();
      toast(e.message)
    } finally {
      if (--pending === 0) window.parent.studioPending(false)
    }
  });
  return chain
}

function sanitize() {
  data.replies.forEach((r, i) => {
    if (!data.localVersion || !data.versions.some(v => v.id === r.v)) r.v = data.assigned[i];
    if (data.rules[i] === 'must') r.yn = 'yes';
    for (const p of Object.keys(r.picks))
      if (!data.eligibility[p]?.[r.v]) delete r.picks[p];
    for (const p of Object.keys(r.prices))
      if (!data.eligibility[p]?.[r.v]) delete r.prices[p]
  })
}
const at = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);

function put(obj, path, v) {
  const keys = path.split('.');
  let o = obj;
  for (const k of keys.slice(0, -1)) o = o[k] ??= {};
  o[keys.at(-1)] = v
}
const btn = (label, act, cls = '', icon = '') => '<button type="button" class="btn ' + cls + '" data-action="' + act + '">' + (icon ? ico(icon) : '') + esc(label) +
  '</button>';
const field = (p, val, aria, type = 'text', attrs = '') => '<input aria-label="' + esc(aria) + '" data-path="' + p + '" type="' + type + '" value="' + esc(val) +
  '" ' + attrs + '>';
const ck = (p, yes, label, attrs = '') => '<label class="pick"><input type="checkbox" data-path="' + p + '" ' + (yes ? 'checked ' : '') + attrs + '><span>' + esc(
  label) + '</span></label>';
const radio = (p, val, sel, label, disabled = false) => '<label class="pick pill"><input type="radio" name="' + p + '" data-path="' + p + '" value="' + esc(val) +
  '" ' + (val === sel ? 'checked ' : '') + (disabled ? 'disabled' : '') + '>' + esc(label) + '</label>';
const sel = (p, val, opts, label) => '<select aria-label="' + esc(label) + '" data-path="' + p + '">' + opts.map(o => '<option value="' + esc(o[0]) + '" ' + (o[
  0] === val ? 'selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>';
const fld = (label, html) => '<label class="field"><span>' + esc(label) + '</span>' + html + '</label>';
const section = (title, body) => '<section class="section"><h3>' + esc(title) + '</h3>' + body + '</section>';
const note = txt => '<div class="notice">' + ico('info') + '<span>' + esc(txt) + '</span></div>';
const tag = (s, c = '') => '<span class="tag ' + c + '">' + esc(s) + '</span>';
const tbl = (heads, rows) => '<div class="tableWrap"><table><thead><tr>' + heads.map(s => '<th>' + s + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') +
  '</tbody></table></div>';
const tr = (...cells) => '<tr>' + cells.map(x => '<td>' + x + '</td>').join('') + '</tr>';
const row = (a, b) => '<div class="row"><div>' + a + '</div><div>' + b + '</div></div>';
const title = (t, sub) => '<div class="kicker">' + (mode === 'admin' ? 'Paramétrage enseigne' : 'Espace point de vente') + '</div><h2>' + esc(t) +
  '</h2><p class="intro">' + esc(sub) + '</p>';
const math = (a, b) => '<div class="math"><span>' + esc(a) + '</span><strong>' + esc(b) + '</strong></div>';
const allItems = () => [...data.items, ...data.kits];
const available = () => allItems().filter(x => x.on);
const composition = k => Object.entries(k.parts).map(([id, n]) => {
  const s = data.items.find(x => x.id === id);
  return s && n > 0 ? n + ' × ' + s.name : null
}).filter(Boolean).join(' + ') || 'Composition à définir';
const verOpts = () => data.versions.map(v => [v.id, v.id + ' · ' + v.name]);
const modeBtn = (id, label) => '<button class="' + (mode === id ? 'chosen' : '') + '" aria-pressed="' + (mode === id) + '" data-action="mode:' + id + '">' + esc(
  label) + '</button>';

const network = core.network || [],
  axes = core.axes;
let groups = structuredClone(core.groups || []),
  editing = '';
const draftGroup = () => ({
  id: crypto.randomUUID(),
  name: '',
  version: data.versions[0]?.id || 'V1',
  rule: 'free',
  criteria: {
    format: [],
    region: [],
    zone: []
  }
});
let draft = draftGroup();
const groupSummary = g => Object.values(g.criteria).filter(x => x.length).map(x => x.join(' ou ')).join(' · ') || 'Tout le réseau';
const plan = () => core.targetPlan(network, groups);
const chosenOffers = () => products.filter((_, i) => data.eligibility[i]?.[draft.version]);
const opt = (val, label, chosen) => '<option value="' + esc(val) + '" ' + (val === chosen ? 'selected' : '') + '>' + esc(label) + '</option>';

function groupEditor() {
  const version = fld('Version proposée', '<select id="group-version">' + data.versions.map(v => opt(v.id, v.id + ' · ' + v.name, draft.version)).join(
    '') + '</select>');
  const items = chosenOffers();
  const assortment = '<div class="assort"><strong>Assortiment de ' + esc(draft.version) + ' · ' + items.length + ' référence' + (items.length > 1 ? 's' :
      '') + '</strong><p>' + esc(items.map(p => p.name).join(' · ') || 'Associez des produits à cette version dans le PIM.') +
    '</p><a target="_parent" href="' + esc(core.pimLink(draft.version)) + '">Consulter cette version dans le PIM</a></div>';
  const facets = Object.entries(axes).map(([key, label]) => {
    const values = [...new Set(network.map(t => t[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
    return '<fieldset class="facet"><legend>' + esc(label) + '</legend>' + values.map(v =>
      '<label class="pick pill"><input type="checkbox" data-axis="' + key + '" value="' + esc(v) + '" ' + (draft.criteria[key].includes(v) ?
        'checked' : '') + '>' + esc(v) + '</label>').join('') + '</fieldset>';
  }).join('');
  const targets = network.filter(t => core.matches(t, draft.criteria));
  const name = fld('Nom du groupe', '<input id="group-name" maxlength="80" placeholder="Ex. Hypers de Bretagne" value="' + esc(draft.name) + '">');
  const rule = fld('Participation', '<select id="group-rule">' + opt('free', 'Au choix du magasin', draft.rule) + opt('must', 'Obligatoire', draft.rule) +
    '</select>');
  return section('Version et assortiment', version + assortment) + section(editing ? 'Modifier le groupe' : 'Composer un groupe de magasins',
    '<p>Combinez format, région et zone. Sans filtre, tout le réseau est éligible.</p>' + facets +
    '<div class="assort" role="status"><strong>' + targets.length + ' point' + (targets.length === 1 ? '' : 's') + ' de vente correspondant' + (targets
      .length === 1 ? '' : 's') + ' sur ' + network.length + '</strong><p>' + esc(targets.slice(0, 3).map(t => t.name).join(' · ')) +
    '</p></div><div class="fields">' + name + rule + '</div><div class="actions">' +
    btn(editing ? 'Mettre à jour le groupe' : 'Ajouter le groupe en priorité', 'draft-add', 'prime') + (editing ? btn('Annuler la modification',
      'draft-cancel') : groups.length ? btn('Cibler uniquement ce groupe', 'draft-only') : '') + '</div>');
}

function rules() {
  const result = plan();
  const dirty = JSON.stringify(groups) !== JSON.stringify(core.groups) || core.legacy;
  const removed = network.filter(t => t.targeted !== false && !result.assignments.has(t.id)).length;
  const changed = network.filter(t => t.targeted !== false && result.assignments.has(t.id) && result.assignments.get(t.id).version !== t.assigned).length;
  const reviewCount = network.filter(t => core.confirmed.includes(t.id) && (!result.assignments.has(t.id) || result.assignments.get(t.id).version !== t
    .assigned || result.assignments.get(t.id).rule !== t.rule)).length;
  const rows = groups.map((g, i) => tr('<b>' + esc(g.name) + '</b><br><small>' + esc(groupSummary(g)) + '</small>', tag(g.version) + '<br><small>' + esc(g
      .rule === 'must' ? 'Obligatoire' : 'Au choix') + '</small>', String(result.counts[i].assigned) + ' / ' + result.counts[i].matched,
    '<div class="group-tools">' + btn('Modifier', 'draft-edit:' + g.id) + (i ? btn('Monter', 'draft-up:' + g.id) : '') + btn('Retirer',
      'draft-remove:' + g.id) + '</div>'));
  return title('Proposition par groupe', 'Choisissez une version de l’offre, puis les groupes de points de vente auxquels la proposer.') + (core.legacy ?
      note('Ce dossier conserve des affectations historiques. Appliquez la proposition pour passer au ciblage par groupes.') : '') + groupEditor() +
    section('Groupes de la proposition',
      '<p>Les groupes sont lus de haut en bas. Un magasin reçoit la version du premier groupe auquel il correspond.</p>' +
      (rows.length ? tbl(['Groupe', 'Version', 'Retenus / éligibles', 'Actions'], rows) : note('Aucun groupe dans cette proposition.')) +
      '<p><strong>' + result.assignments.size + ' magasins ciblés sur ' + network.length + '</strong> · ' + (network.length - result.assignments.size) +
      ' hors proposition.</p>' +
      (dirty ? '<p>' + removed + ' sortie(s) du ciblage · ' + changed + ' changement(s) de version · ' + reviewCount + ' confirmation(s) à revoir.</p>' :
        '') +
      '<button class="btn prime" data-action="draft-apply" ' + (!dirty ? 'disabled' : '') + '>Appliquer la proposition</button>') +
    section('Versions commerciales', tbl(['Code', 'Nom de la version', 'Descriptif'], data.versions.map((v, i) => tr(tag(v.id), field('versions.' + i +
      '.name', v.name, 'Nom ' + v.id, 'text', 'required maxlength="48"'), field('versions.' + i + '.desc', v.desc, 'Descriptif ' + v.id, 'text',
      'required maxlength="160"')))));
}

function plv() {
  const rows = data.items.map((s, i) => tr(ck('items.' + i + '.on', s.on, 'Proposer'), field('items.' + i + '.name', s.name, 'Nom du support ' + (i + 1), 'text',
    'required maxlength="55"'), field('items.' + i + '.unit', s.unit, 'Unité ' + (i + 1), 'text', 'required maxlength="30"'), field('items.' + i + '.price', s
    .price, 'Prix unitaire ' + (i + 1), 'number', 'min="0" step=".01" required')));
  return title('PLV au détail et en kit', 'Composez le catalogue et choisissez les prix indicatifs visibles au moment de la commande.') + section(
    'Supports au détail', tbl(['Disponible', 'Support', 'Unité', 'Prix HT (€)'], rows) + '<div class="gap">' + btn('Ajouter un support', 'addItem', 'small',
      'plus') + '</div>') + section('Kits PLV', data.kits.map((k, i) => '<div class="tile"><div class="settings">' + ck('kits.' + i + '.on', k.on, 'Proposer') +
    fld('Nom du kit', field('kits.' + i + '.name', k.name, 'Nom du kit', 'text', 'required maxlength="55"')) + fld('Prix HT du kit (€)', field('kits.' + i +
      '.price', k.price, 'Prix indicatif du kit', 'number', 'min="0" step=".01" required')) + '</div><div class="settings gap">' + data.items.map(s =>
      '<label class="field">' + esc(s.name) + ' / kit' + field('kits.' + i + '.parts.' + s.id, k.parts[s.id] || 0, 'Nombre de ' + s.name + ' dans le kit',
        'number', 'min="0" step="1" required style="width:80px"') + '</label>').join('') + '</div></div>').join('') + '<div class="gap">' + btn(
    'Ajouter un kit', 'addKit', 'small', 'plus') + '</div>') + section('Indicateurs de prix affichés', '<div class="settings">' + ck('showUnit', data.showUnit,
    'Prix à l’unité / au kit') + ck('showTotal', data.showTotal, 'Sous-total PLV estimé') + '</div>')
}

function owned() {
  return title('Canaux propriétaires', 'Activez les canaux que le magasin pourra mobiliser pour relayer l’opération.') + section('CRM', '<div class="rows">' +
    channels.slice(0, 3).map((c, i) => row('<span class="channel">' + ico('radio') + '<b>' + c + '</b></span>', ck('owned.' + i, data.owned[i], 'Proposer')))
    .join('') + '</div>') + section('Points de contact du magasin', '<div class="rows">' + channels.slice(3).map((c, i) => row('<span class="channel">' + ico(i ?
    'radio' : 'box') + '<b>' + c + '</b></span>', ck('owned.' + (i + 3), data.owned[i + 3], 'Proposer'))).join('') + '</div>') + note(
    'Les publications sur les comptes du magasin figurent ici. Les campagnes sponsorisées se paramètrent dans Publicité.')
}
const dk = () => data.digitalKits.find(k => k.id === R().digital) || data.digitalKits[0];

function ads() {
  return title('Publicité', 'Configurez les supports payants et les informations que le magasin verra avant de s’engager.') + section('Tract imprimé',
    '<div class="settings">' + ck('ads.0', data.ads[0], 'Proposer le tract') + fld('Pagination du tract', field('pages', data.pages, 'Pagination du tract',
      'number', 'min="1" step="1" required style="width:105px"')) + '<span class="subtle">Le magasin indique son nombre d’exemplaires.</span></div>') + section(
    'Publicité digitale', '<div class="settings">' + ck('ads.1', data.ads[1], 'Proposer le kit média') + '</div>' + tbl(['Kit média proposé',
      'Budget local recommandé (€ HT)'
    ], data.digitalKits.map((k, i) => tr(field('digitalKits.' + i + '.name', k.name, 'Nom du kit média ' + (i + 1), 'text', 'required maxlength="65"'), field(
      'digitalKits.' + i + '.budget', k.budget, 'Budget recommandé du kit ' + (i + 1), 'number', 'min=".01" step=".01" required')))) + '<div class="arow gap">' +
    btn('Ajouter un kit média', 'addDigital', 'small', 'plus') +
    '<span class="subtle">BigOne Digital · recommandations à reporter, montants de démonstration.</span></div>') + section('Autres médias', '<div class="rows">' +
    row('<b>Presse</b>', ck('ads.2', data.ads[2], 'Proposer')) + row('<b>Affichage extérieur (OOH)</b>', ck('ads.3', data.ads[3], 'Proposer')) + '</div>')
}

function offer() {
  return title('Offre produits à personnaliser', 'Sélectionnez les références du PIM qui composent chaque version de l’offre.') + section('Offre de l’opération',
    '<div class="rows">' + row('<b>Offre commerciale de l’opération</b><span class="hint">Source · Espace Produits de BigOne Studio</span>', ck('offer', data
      .offer, 'Associer cette offre')) + '</div>') + (data.offer ? section('Composition des versions', tbl(['Produit', 'Conditionnement', ...data.versions.map(
      v => esc(v.id) + ' · ' + esc(v.name))],
    products.map((p, i) => tr('<b>' + esc(p.name) + '</b>', esc(p.pack), ...data.versions.map(v =>
      '<input type="checkbox" aria-label="' + esc(p.name + ' · ' + v.id) + '" data-path="eligibility.' + i + '.' + v.id + '" ' + (data.eligibility[i][v
        .id] ? 'checked' : '') + '>'
    )))
  )) + section('Droits du participant', '<div class="settings">' + ck('selectProducts', data.selectProducts, 'Choisir les références locales') + ck(
    'localPrice', data.localPrice, 'Renseigner un prix local') + '</div>') + note(
    'Cochez les versions dans lesquelles chaque référence doit sortir. Une même fiche produit peut alimenter plusieurs versions.') : note(
    'L’étape produits est masquée pour les magasins tant qu’aucune offre n’est associée.'))
}

function entry() {
  const r = R(),
    v = V(r.v);
  return title('Ma participation', 'Indiquez votre participation et vérifiez la version commerciale de votre magasin.') + section('Participer à l’opération',
  must() ? '<div class="rows">' + row('<b>Participation obligatoire</b><span class="hint">Votre enseigne a inscrit ce magasin à l’opération.</span>', tag(
      'Obligatoire', 'green')) + '</div>' : '<div class="pills">' + radio('reply.yn', 'yes', r.yn, 'Oui, je participe') + radio('reply.yn', 'no', r.yn,
      'Non, je décline') + '</div>') + (yes() ? section('Ma version de l’offre', data.localVersion ? '<div class="threecol">' + data.versions.map(x =>
    '<label class="choice"><input type="radio" name="ver" data-path="reply.v" value="' + x.id + '" ' + (r.v === x.id ? 'checked' : '') + '><span><b>' + x.id +
    ' · ' + esc(x.name) + '</b><small>' + esc(x.desc) + '</small>' + assortment(x.id) + '</span></label>').join('') + '</div>' : '<div class="tile">' + tag(v
    .id) + ' <b>' + esc(v.name) + '</b><span>' + esc(v.desc) + '</span>' + assortment(v.id) + '</div>') + note(
    'Votre version détermine les produits proposés. Vous choisissez ensuite vos supports et vos canaux de diffusion.') : note(r.yn === 'no' ?
    'Vous pouvez confirmer votre refus dans le récapitulatif. Aucune quantité ni dépense ne sera engagée.' :
    'Répondez pour accéder aux choix proposés pour votre opération.'))
}

function local() {
  const r = R(),
    list = available();
  return title('PLV et canaux propriétaires', 'Saisissez le nombre d’unités ou de kits et cochez les canaux que vous utiliserez.') + section('Mes quantités de PLV',
    list.length ? tbl(['Support ou kit', ...(data.showUnit ? ['Prix indicatif HT'] : []), 'Quantité'], list.map(s => tr('<b>' + esc(s.name) +
      '</b><span class="hint">' + esc(s.parts ? composition(s) : 'Au détail · ' + s.unit) + '</span>', ...(data.showUnit ? [eur(s.price) + ' / ' + (s.parts ?
        'kit' : 'unité')] : []), field('reply.counts.' + s.id, r.counts[s.id] || 0, 'Quantité ' + s.name, 'number',
        'min="0" step="1" required style="width:80px"')))) + (data.showTotal ? '<div class="arow tile gap"><b>Sous-total PLV estimé</b><b>' + eur(plvTotal()) +
      ' HT</b></div>' : '') : '<p class="subtle">Aucun support proposé pour cette opération.</p>') + section('Mes canaux propriétaires', channels.some((_, i) =>
      data.owned[i]) ? '<div class="pills">' + channels.map((c, i) => data.owned[i] ? ck('reply.owned.' + i, r.owned[i], c) : '').join('') + '</div>' :
    '<p class="subtle">Aucun canal proposé pour cette opération.</p>')
}
const mediaNames = ['Tract imprimé', 'Publicité digitale', 'Presse', 'Affichage extérieur (OOH)'];

function media() {
  const r = R();
  return title('Ma publicité', 'Choisissez les médias que vous souhaitez activer pour votre magasin.') + (data.ads.some(Boolean) ? data.ads.map((on, i) => {
    if (!on) return '';
    let sub = '';
    if (i === 0) sub = tag(data.pages + ' pages') + '<div class="gap">' + fld('Nombre d’exemplaires', field('reply.copies', r.copies, 'Nombre d’exemplaires',
      'number', 'min="1" step="1" required style="width:140px"')) + '</div>';
    if (i === 1) sub = '<div class="fields">' + fld('Kit à activer', sel('reply.digital', dk().id, data.digitalKits.map(k => [k.id, k.name]),
        'Kit média retenu')) + fld('Mon budget local retenu (€ HT)', field('reply.budget', r.budget ?? dk().budget, 'Budget local retenu', 'number',
        'min=".01" step=".01" required')) + '</div><div class="hint">Budget recommandé · ' + eur(dk().budget) +
      ' HT · référence BigOne Digital (exemple)</div>';
    return '<section class="section"><div class="arow"><h3>' + mediaNames[i] + '</h3>' + ck('reply.media.' + i, r.media[i], 'Activer') + '</div>' + (i < 2 ? (
      r.media[i] ? sub : '<span class="hint">' + (i === 0 ? data.pages + ' pages' : data.digitalKits.length +
        ' kits disponibles · budget recommandé par kit') + '</span>') : '') + '</section>'
  }).join('') : '<div class="empty">Aucun média proposé pour cette opération.</div>')
}

function pSelected(i) {
  return data.selectProducts ? R().picks[i] === true : true
}

function shopOffer() {
  const r = R(),
    list = eligible();
  return title('Mon offre produits', 'Personnalisez les références proposées pour votre magasin et sa version commerciale.') + section(r.v + ' · ' + V(r.v).name,
    tbl(['Produit', 'Présence locale', ...(data.localPrice ? ['Prix local TTC (€)'] : [])], list.map(p => tr('<b>' + esc(p.name) + '</b><span class="hint">' +
      esc(p.pack) + '</span>', data.selectProducts ? ck('reply.picks.' + p.i, pSelected(p.i), 'Retenir') : tag('Inclus', 'green'), ...(data.localPrice ? [
        field('reply.prices.' + p.i, r.prices[p.i] ?? '', 'Prix local ' + p.name, 'number', 'min=".01" step=".01" placeholder="Facultatif" ' + (pSelected(p
          .i) ? '' : 'disabled'))
      ] : []))))) + note('Votre personnalisation est propre à ' + stores[store] + '. Les autres magasins conservent leur offre.')
}

function plvTotal() {
  return yes() ? available().reduce((n, s) => n + (R().counts[s.id] || 0) * s.price, 0) : 0
}

function mediaCost() {
  return yes() && data.ads[1] && R().media[1] ? R().budget ?? dk().budget : 0
}

function answer() {
  return must() ? 'Obligatoire' : R().yn === 'yes' ? 'Oui' : R().yn === 'no' ? 'Non' : 'À renseigner'
}

function issue() {
  if (!must() && !R().yn) return ['entry', 'Renseignez votre participation.'];
  if (!yes()) return null;
  if (data.ads[0] && R().media[0] && !(R().copies > 0)) return ['media', 'Indiquez le nombre d’exemplaires du tract.'];
  if (data.ads[1] && R().media[1] && !(mediaCost() > 0)) return ['media', 'Indiquez le budget local retenu pour le kit digital.'];
  return null
}

function summary() {
  const r = R(),
    i = issue();
  let rows = [
    ['Participation', answer()]
  ];
  if (yes()) {
    rows.push(['Version de l’offre', r.v + ' · ' + V(r.v).name], ['PLV', available().filter(s => r.counts[s.id] > 0).map(s => r.counts[s.id] + ' × ' + s.name).join(
      ', ') || 'Aucune'], ['Canaux propriétaires', channels.filter((_, i) => data.owned[i] && r.owned[i]).join(', ') || 'Aucun'], ['Publicité', mediaNames.map((
      m, i) => data.ads[i] && r.media[i] ? (i === 0 ? 'Tract ' + data.pages + ' pages · ' + nf(r.copies) + ' ex.' : i === 1 ? dk().name + ' · ' + eur(
      mediaCost()) + ' HT' : m) : '').filter(Boolean).join(' / ') || 'Aucune']);
    if (eligible().length) rows.push(['Produits locaux', eligible().filter(p => pSelected(p.i)).map(p => p.name + (data.localPrice && r.prices[p.i] ? ' · ' + eur(r
      .prices[p.i]) + ' TTC' : '')).join(', ') || 'Aucun']);
  }
  return title('Récapitulatif de ma réponse', stores[store] + ' · ' + core.title) + '<div class="rows">' + rows.map(x => row('<b>' + esc(x[0]) + '</b>', esc(x[1])))
    .join('') + '</div>' + (yes() ? '<div class="twocol gap">' + (data.showTotal ? '<div class="tile"><span class="subtle">PLV · coût indicatif</span><b>' + eur(
        plvTotal()) + ' HT</b></div>' : '') + '<div class="tile"><span class="subtle">Digital · budget retenu</span><b>' + eur(mediaCost()) +
      ' HT</b></div></div>' : '') + (r.confirmed ? '<div class="notice">' + ico('check') + '<b>Réponse confirmée.</b></div>' : i ? note(i[1]) : note(
      'Relisez vos choix avant de confirmer votre réponse.'))
}

function tabs() {
  if (mode === 'admin') return adminTabs;
  return shopTabs.filter(([k]) => k === 'entry' || (k === 'summary' && (yes() || R().yn === 'no')) || (yes() && (k !== 'products' || eligible().length > 0)))
}

function right() {
  let cap = '',
    desc = '',
    lines = [];
  if (mode === 'admin') {
    const pair = {
      rules: ['Portée de la proposition', 'Un magasin ciblé reçoit une seule version commerciale.', [
        ['Réseau', network.length], ['Groupes', groups.length], ['Magasins ciblés', plan().assignments.size]
      ]],
      plv: ['Catalogue visible', 'Le magasin saisit une quantité pour chaque support ou kit proposé.', [
        ['Supports au détail', data.items.filter(x => x.on).length],
        ['Kits PLV', data.kits.filter(x => x.on).length],
        ['Prix unitaires', data.showUnit ? 'Affichés' : 'Masqués'],
        ['Sous-total', data.showTotal ? 'Affiché' : 'Masqué']
      ]],
      owned: ['Relais du magasin', 'Le participant choisit chaque canal indépendamment.', [
        ['Canaux CRM', data.owned.slice(0, 3).filter(Boolean).length + ' sur 3'],
        ['Écrans internes', data.owned[3] ? 'Proposés' : 'Masqués'],
        ['Publications organiques', data.owned[4] ? 'Proposées' : 'Masquées']
      ]],
      ads: ['Dispositif publicitaire', 'Le budget média et les quantités imprimées restent distincts.', [
        ['Tract', data.ads[0] ? data.pages + ' pages' : 'Masqué'],
        ['Kits média proposés', data.ads[1] ? data.digitalKits.length : 'Masqués'],
        ['Presse', data.ads[2] ? 'Proposée' : 'Masquée'],
        ['OOH', data.ads[3] ? 'Proposé' : 'Masqué']
      ]],
      offer: ['Éligibilité par version', 'Un produit commun figure une fois dans le PIM et peut être éligible à plusieurs versions.', data.versions.map(v => [v
        .id + ' · ' + v.name, (data.offer ? offersFor(v.id).length : 0) + ' réf.'
      ])]
    };
    [cap, desc, lines] = pair[tab]
  } else {
    cap = stores[store];
    desc = 'La version définit l’offre produits du magasin. Les choix de supports figurent dans les étapes suivantes.';
    lines = [
      ['Participation', answer()], ...(yes() ? [
        ['Version', R().v + ' · ' + V(R().v).name], ...(data.showTotal ? [
          ['PLV estimée', eur(plvTotal()) + ' HT']
        ] : []), ['Budget digital retenu', eur(mediaCost()) + ' HT']
      ] : []), ['Réponse', R().confirmed ? 'Confirmée' : 'Brouillon']
    ]
  }
  return '<div class="asideHead">' + ico(mode === 'admin' ? 'eye' : 'list') + (mode === 'admin' ? 'Aperçu des règles' : 'Ma réponse') +
    '</div><div class="asideBody"><h3>' + esc(cap) + '</h3><p>' + esc(desc) + '</p>' + lines.map(x => math(x[0], x[1])).join('') + '</div><div class="asideFoot">' +
    (mode === 'admin' ? 'Paramétrage de l’opération' :
      'Montants de démonstration. Les coûts de presse, d’OOH et d’impression du tract sont hors de ces montants.') + '</div>'
}
const pages = {
  rules,
  plv,
  owned,
  ads,
  offer,
  entry,
  local,
  media,
  products: shopOffer,
  summary
};

function render() {
  sanitize();
  const menu = tabs();
  if (!menu.some(t => t[0] === tab)) tab = menu[0][0];
  document.querySelector('#modes').innerHTML = (core.shop ? '' : modeBtn('admin', 'Paramétrer les choix') + (stores.length ? modeBtn('shop', 'Aperçu magasin') : ''));
  document.querySelector('#nav').innerHTML = '<div class="navHead">' + ico(mode === 'admin' ? 'setup' : 'shop') + (mode === 'admin' ? 'Choix proposés' :
      'Ma participation') + '</div><div class="navBody">' + menu.map(([k, t, ic]) => '<button type="button" data-action="go:' + k + '" class="navItem ' + (tab ===
      k ? 'active' : '') + '" ' + (tab === k ? 'aria-current="page"' : '') + '>' + ico(ic) + esc(t) + '</button>').join('') +
    '</div>' + (mode === 'shop' && !core.shop ? '<div class="navFoot"><label>Magasin de l’aperçu<select id="store">' + stores.slice(0,20).map((s,i)=>'<option value="'+i+'" '+(i===store?'selected':'')+'>'+esc(s)+'</option>').join('')+(store>=20?'<option selected value="'+store+'">'+esc(stores[store])+'</option>':'')+'</select></label></div>' : '');
  const n = menu.findIndex(t => t[0] === tab),
    next = menu[n + 1],
    prev = menu[n - 1],
    problem = mode === 'shop' ? issue() : null;
  let action = '';
  if (next) action = btn(mode === 'admin' ? 'Suivant' : 'Continuer', 'go:' + next[0], 'prime', 'arrow');
  else if (mode === 'admin') action = stores.length ? btn('Tester côté magasin', 'mode:shop', 'prime', 'eye') : '';
  else if (!R().confirmed) action = problem ? btn('Compléter ma réponse', 'go:' + problem[0], 'prime') : btn('Confirmer ma réponse', 'confirm', 'prime', 'check');
  else action = btn('Revoir ma participation', 'go:entry', '', 'arrow');
  document.querySelector('#panel').innerHTML = pages[tab]() + '<div class="actions"><div>' + (prev ? btn('Précédent', 'go:' + prev[0]) : '<span class="subtle">' + (
    isSnapshot ? 'Essai temporaire de la planche' : persistOK ? 'Sauvegarde serveur' : 'Enregistrement à reprendre') + '</span>') + '</div>' + action + '</div>';
  document.querySelector('#aside').innerHTML = right()
}
let timer;

function toast(txt) {
  const m = document.querySelector('#msg');
  m.textContent = txt;
  clearTimeout(timer);
  timer = setTimeout(() => m.textContent = '', 2400)
}

function navigate(t) {
  tab = t;
  render();
  if (innerWidth < 651) document.querySelector('#panel').scrollIntoView({
    block: 'start'
  })
}

function update(el) {
  const p = el.dataset.path;
  if (!p) return;
  if (!el.validity.valid) {
    el.reportValidity();
    const old = p.startsWith('reply.') ? at(R(), p.slice(6)) : at(data, p);
    el.value = old ?? '';
    return
  }
  let v = el.type === 'checkbox' ? el.checked : el.type === 'number' ? (el.value === '' ? '' : Number(el.value)) : el.value.trim();
  if (el.required && el.type === 'text' && !v) {
    render();
    return
  }
  if (p.startsWith('reply.')) {
    put(R(), p.slice(6), v);
    R().confirmed = false;
    if (p === 'reply.digital') R().budget = dk().budget;
    if (p === 'reply.media.1' && v && R().budget === null) R().budget = dk().budget
  } else {
    const atBefore = at(data, p);
    if (p.startsWith('eligibility.') && atBefore && !v) {
      const [,product,version] = p.split('.');
      const keep = data.versions.some(other => other.id !== version && data.eligibility[product][other.id]);
      if (!keep) {
        el.checked = true;
        toast('Cochez une autre version avant de retirer la dernière.');
        return;
      }
    }
    if (p.match(/^kits\.\d+\.on$/) && v && !Object.values(data.kits[Number(p.split('.')[1])].parts).some(n => n > 0)) {
      toast('Ajoutez un support au kit avant de le proposer.');
      return
    }
    put(data, p, v);
    if (p.match(/^kits\.\d+\.parts\./)) {
      const k = data.kits[Number(p.split('.')[1])];
      if (!Object.values(k.parts).some(n => n > 0)) k.on = false
    }

  }
  sanitize();
  save();
}
const edited = new Set();
document.addEventListener('input', e => {
  if (e.target.matches('input[type=text][data-path],input[type=number][data-path]')) edited.add(e.target)
});

function flushFields() {
  for (const el of edited) {
    edited.delete(el);
    if (el.isConnected) update(el)
  }
}
document.addEventListener('change', e => {
  const el = e.target;
  edited.delete(el);
  if (el.id === 'group-name') {draft.name=el.value;return;}
  if (el.id === 'group-rule') {draft.rule=el.value;return;}
  if (el.id === 'group-version') {draft.version=el.value;render();return;}
  if (el.dataset.axis) {
    const key=el.dataset.axis;
    draft.criteria[key]=el.checked?[...draft.criteria[key],el.value]:draft.criteria[key].filter(v=>v!==el.value);
    render();
    const next=[...document.querySelectorAll('[data-axis]')].find(n=>n.dataset.axis===key&&n.value===el.value);
    next?.focus({preventScroll:true});
    return;
  }
  if (el.id === 'store') {
    store = Number(el.value);
    render();
    return
  }
  if (!el.dataset.path) return;
  update(el);
  if (el.matches('input[type=text],input[type=number]')) {
    document.querySelector('#aside').innerHTML = right();
    if (tab === 'plv' && el.dataset.path.includes('.parts.')) {
      const i = Number(el.dataset.path.split('.')[1]);
      document.querySelector('input[data-path="kits.' + i + '.on"]').checked = data.kits[i].on
    }
    if (tab === 'local') {
      const a = document.querySelector('#panel .tile b:last-child');
      if (a) a.textContent = eur(plvTotal()) + ' HT'
    }
    return
  }
  render()
});
document.addEventListener('click', async e => {
  const el = e.target.closest('button[data-action]');
  if (!el) return;
  flushFields();
  const [a, arg] = el.dataset.action.split(':');
  if(a.startsWith('draft-')) {
    const i=groups.findIndex(g=>g.id===arg);
    if(a==='draft-add' || a==='draft-only') {
      if(!chosenOffers().length) return toast('Cette version doit contenir au moins un produit.');
      if(!network.some(t=>core.matches(t,draft.criteria))) return toast('Aucun magasin ne correspond à ces critères.');
      draft.name=(document.querySelector('#group-name').value.trim() || groupSummary(draft)).slice(0,80);
      if(a==='draft-only') groups=[structuredClone(draft)];
      else if(editing) groups[groups.findIndex(g=>g.id===editing)]=structuredClone(draft);
      else groups.unshift(structuredClone(draft));
      editing='';draft=draftGroup();
    } else if(a==='draft-edit' && i>=0) {editing=arg;draft=structuredClone(groups[i]);}
    else if(a==='draft-cancel') {editing='';draft=draftGroup();}
    else if(a==='draft-remove' && i>=0) {groups.splice(i,1);if(editing===arg){editing='';draft=draftGroup();}}
    else if(a==='draft-up' && i>0) {[groups[i-1],groups[i]]=[groups[i],groups[i-1]];}
    else if(a==='draft-apply') {
      el.disabled=true;
      try {await chain; await core.applyGroups(groups);} catch(err){el.disabled=false;toast(err.message);}
      return;
    }
    render();
    if(a==='draft-edit') document.querySelector('#group-version').focus();
    return;
  }
  if (a === 'go') {
    navigate(arg);
    return
  }
  if (a === 'mode') {
    if (core.shop) return;
    mode = arg;
    navigate(mode === 'admin' ? 'rules' : 'entry');
    return
  }
  if (a === 'addItem') {
    const id = 's' + Date.now();
    data.items.push({
      id,
      name: 'Nouveau support',
      unit: 'unité',
      price: 0,
      on: true
    })
  } else if (a === 'addDigital') {
    data.digitalKits.push({
      id: 'd' + Date.now(),
      name: 'Nouveau kit média',
      budget: 100
    })
  } else if (a === 'addKit') {
    const id = 'k' + Date.now();
    data.kits.push({
      id,
      name: 'Nouveau kit',
      price: 0,
      on: false,
      parts: {}
    })
  } else if (a === 'confirm') {
    if (issue()) {
      navigate(issue()[0]);
      return
    }
    R().confirmed = true
  } else return;
  save();
  render()
});

render();
new ResizeObserver(() => window.parent.studioWizardSize(document.documentElement.offsetHeight)).observe(document.body);
