import {storeKits,changeKit} from './kit.mjs';
import {editLayout, submitLayout, annotate, preserveProof} from './edition.mjs';
import {bricoId, isBricoDemo, catalogueId, catalogueUrl, bricoProducts, bricoVersions, bonialId, bricoBonial, missingBonialUnit} from './brico.mjs';
import {axes, demoNetwork, demoGroups, participantsOf, targetPlan, networkText, demoId, demoFields} from './targeting.mjs';
const MODELES = {
  imprime: [
    ['donnees', 'Données reçues', -15],
    ['cdf', 'Chemin de fer validé', -12, 1],
    ['bat1', 'BAT 1 prêt pour revue', -8],
    ['retours', 'Retours client', -6],
    ['approb', 'BAT final approuvé', -2],
    ['remise', 'Fichiers remis à l\'imprimeur', 0]
  ],
  numerique: [
    ['donnees', 'Données reçues', -10],
    ['cdf', 'Chemin de fer validé', -8, 1],
    ['bat1', 'BAT 1 prêt pour revue', -6],
    ['approb', 'Approbation', -3],
    ['remise', 'Remise pour mise en ligne', 0]
  ],
  flux: [
    ['donnees', 'Offres prêtes pour le flux', -4],
    ['approb', 'Contrôle du flux', -2],
    ['remise', 'Flux déposé', 0]
  ]
};

const pd = s => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d)
};
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

function feries(y) {
  const a = y % 19,
    b = Math.floor(y / 100),
    c = y % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451),
    mo = Math.floor((h + l - 7 * m + 114) / 31),
    da = (h + l - 7 * m + 114) % 31 + 1;
  const p = new Date(y, mo - 1, da),
    add = n => {
      const x = new Date(p);
      x.setDate(x.getDate() + n);
      return iso(x)
    };
  return [y + '-01-01', add(1), y + '-05-01', y + '-05-08', add(39), add(50), y + '-07-14', y + '-08-15', y + '-11-01', y + '-11-11', y + '-12-25'];
}

function ouvre(d) {
  const w = d.getDay();
  return w !== 0 && w !== 6 && !feries(d.getFullYear()).includes(iso(d))
}

function decale(s, n) {
  const d = pd(s),
    st = n < 0 ? -1 : 1;
  let k = Math.abs(n);
  while (!ouvre(d)) d.setDate(d.getDate() - 1);
  while (k > 0) {
    d.setDate(d.getDate() + st);
    if (ouvre(d)) k--
  }
  return iso(d)
}

const codes = ['V1', 'V2', 'V3'];
export const required = (test, message, status = 422) => {
  if (!test) throw Object.assign(new Error(message), {
    status
  })
};
const clean = (s, max = 160) => String(s ?? '').trim().slice(0, max);
const money = (v, zero = true) => typeof v === 'number' && Number.isFinite(v) && v >= (zero ? 0 : .01) && v <= 1e7;
const qty = v => Number.isInteger(v) && v >= 0 && v <= 1e7;
const date = () => new Date().toISOString();
export const blank = (v = 'V1') => ({
  yn: '',
  v,
  counts: {},
  owned: {},
  media: {},
  copies: 0,
  digital: 'mix',
  budget: null,
  picks: {},
  prices: {},
  confirmed: false
});

function config() {
  return {
    versions: [{
      id: 'V1',
      name: 'Sélection du quotidien',
      desc: 'Les références du quotidien.'
    }, {
      id: 'V2',
      name: 'Sélection festive',
      desc: 'Les références du repas de fête.'
    }, {
      id: 'V3',
      name: 'Produit vedette',
      desc: 'Une référence mise en avant.'
    }],
    localVersion: false,
    items: [{
      id: 'a1',
      name: 'Affiche A1',
      unit: 'affiche',
      price: 4.5,
      on: true
    }, {
      id: 'stop',
      name: 'Stop-rayon',
      unit: 'stop-rayon',
      price: 1.2,
      on: true
    }],
    kits: [{
      id: 'kit1',
      name: 'Kit entrée magasin',
      price: 18,
      on: true,
      parts: {
        a1: 2,
        stop: 10
      }
    }],
    showUnit: true,
    showTotal: true,
    owned: [true, true, true, true, true],
    ads: [true, true, true, true],
    pages: 12,
    digitalKits: [{
      id: 'mix',
      name: 'Display + réseaux sociaux',
      budget: 450
    }, {
      id: 'display',
      name: 'Display',
      budget: 300
    }, {
      id: 'social',
      name: 'Réseaux sociaux sponsorisés',
      budget: 250
    }],
    offer: true,
    selectProducts: true,
    localPrice: true
  }
}
const prod = (id, name, pack, versions, price, page, rayon) => ({
  id,
  name,
  pack,
  versions,
  price,
  page,
  rayon,
  brand: 'Nanotera',
  note: ''
});
const piece = (id, name, format, state, pages, products) => ({
  id,
  name,
  format,
  products,
  pages,
  revision: 1,
  state,
  history: [],
  review: false,
  file: '',
  note: '',
  scope: 'Toutes',
  decider: 'Chargé de production',
  variants: [],
  useByPage: {}
});
export function example() {
  const products = [prod('s49-08', 'Emmental râpé', '3 × 200 g', ['V1', 'V2'], null, 6, 'Crèmerie'), prod('s49-09', 'Café moulu', '4 × 250 g', ['V1'], 8.4, 7,
    'Épicerie'), prod('s49-05', 'Champagne brut', '75 cl', ['V2', 'V3'], 17.9, 5, 'Boissons')];
  return {
    op: {
      id: 'u-2649-pbs',
      title: 'Les prix bas de la semaine S49',
      network: 'Nanotera',
      start: '2026-12-01',
      end: '2026-12-13',
      owner: 'Chef de projet démo',
      contact: 'Centrale démo',
      objective: 'Soutenir le trafic de début décembre avec les prix bas de la semaine.',
      scope: 'Nationale'
    },
    config: config(),
    products,
    stores: demoNetwork(),
    targetGroups: demoGroups(),
    networkEdition: 1,
    replies: {},
    supports: [piece('s49-prospectus', 'Prospectus', '12 pages · A4', 'En revue', 12, products.map(p => p.id)), piece('s49-affiche', 'Affiche A1',
      '594 × 841 mm', 'En corrections', 1, ['s49-05'])],
    flows: [{
      id: 's49-bonial',
      name: 'Bonial',
      v: 'V1',
      stage: 'À contrôler'
    }, {
      id: 's49-tiendeo',
      name: 'Tiendeo',
      v: 'V2',
      stage: 'À contrôler'
    }],
    tasks: [{
      id: 'bat1',
      name: 'BAT 1 prêt pour revue',
      support: 's49-prospectus',
      due: '2026-11-18',
      done: false
    }, {
      id: 'correction',
      name: 'Valider les corrections',
      support: 's49-affiche',
      due: '2026-11-20',
      done: false
    }, {
      id: 'remise',
      name: 'Remettre les supports',
      due: '2026-11-26',
      done: false
    }],
    reminders: [],
    audit: []
  };
}
function catalogue(products) {
  return {
    ...piece(catalogueId, 'E-catalogue Brico-déco', 'PDF · 6 pages', 'En revue', 6, products.map(p => p.id)),
    family: 'numerique', file: catalogueUrl, useByPage: Object.fromEntries(products.map(p => [p.id, p.page]))
  };
}

function initialBonial(versions){
  return {id:bonialId,name:'Bonial',v:versions.some(v=>v.id==='V1')?'V1':'',stage:'À contrôler'};
}
export function bricoExample() {
  const products = bricoProducts();
  return {
    op: {id:bricoId, title:'Brico-déco', network:'Nanotera', start:'2027-01-19', end:'2027-02-01', scope:'Nationale',
      owner:'Équipe Studio', contact:'Réseau Nanotera', objective:'Préparer l’offre de luminaires et de miroirs et recueillir les engagements des magasins.'},
    config:{...config(), pages:6, versions:structuredClone(bricoVersions)}, products,
    stores:demoNetwork(), targetGroups:demoGroups(), networkEdition:1, bricoEdition:1, replies:{},
    supports:[catalogue(products)],
    flows:[{id:'bd-flux-offre', name:'Flux offre Brico-déco', v:'V2', stage:'À contrôler'},initialBonial(bricoVersions)],
    tasks:[{id:'bd-relecture',name:'Relire les prix du catalogue',support:catalogueId,due:'2027-01-11',done:false}],
    reminders:[], audit:[]
  };
}

function enrichBrico(s) {
  if (s.bricoEdition === 1) return s;
  const demo = bricoExample();
  const legacy = config().versions;
  const defaultVersions = s.config.versions.every((v,i) => legacy[i]?.name === v.name);
  if (defaultVersions) s.config.versions = demo.config.versions;
  if (!s.stores.length && !s.targetGroups) {
    s.stores = demo.stores;
    s.targetGroups = demo.targetGroups;
  }
  const source = new Map(demo.products.map(p => [p.id,p]));
  for (const p of s.products) {
    const ref = source.get(p.id);
    if (!ref) continue;
    p.page ??= ref.page;
    if (defaultVersions && !p.versions.length) p.versions = ref.versions;
  }
  if (!s.supports.some(x => x.id === catalogueId)) {
    s.supports.push(catalogue(s.products.filter(p => source.has(p.id)).map(p => source.get(p.id))));
  }
  s.bricoEdition = 1;
  s.op.network = 'Nanotera';
  return s;
}

const demoChoices = [
  [['V1', 'V2'], 'V1'], [['V1', 'V2', 'V3'], 'V2'], [['V1'], 'V1'],
  [['V2', 'V3'], 'V3'], [['V1', 'V2'], 'V2'], [['V1', 'V3'], 'V1']
];
function bricoRecording(op) {
  const s = bricoExample();
  s.op = {...op, scenario:'brico-demo', objective:'Préparer et diffuser l’offre Brico-déco du réseau Nanotera.'};
  s.config.localVersion = true;
  delete s.targetGroups;
  s.stores = s.stores.slice(0, demoChoices.length).map((store, i) => ({
    ...store, status:'attente', rule:'free', assigned:demoChoices[i][1]
  }));
  s.products = s.products.map(product => ({
    ...product, priority:product.id==='bd-03'?'star':'standard',
    pack:product.id==='bd-03'?'':'À l’unité',
    media:[{kind:'image', label:product.name, url:catalogueUrl.replace('catalogue.pdf',product.id+'.webp')}]
  }));
  const support = {
    ...piece(catalogueId, 'E-catalogue Brico-déco', 'Numérique · 3 pages', 'En préparation', 3, ['bd-01', 'bd-06']),
    family:'numerique', scope:'V1',
    layout:{'bd-01':{page:2,x:53,y:17,w:40,h:46}, 'bd-06':{page:3,x:18,y:14,w:64,h:60}},
    textBlocks:[
      {id:'couverture',kind:'text',name:'Brico-déco',page:1,x:8,y:20,w:84,h:18},
      {id:'titre',kind:'text',name:'Luminaires et miroirs',page:2,x:7,y:4,w:86,h:10}
    ]
  };
  s.supports = [support];
  s.flows = [initialBonial(s.config.versions),{id:'bd-tiendeo',name:'Tiendeo',v:'V3',stage:'À contrôler'}];
  s.tasks = [];
  return s;
}

function recordConsultation(s, store, version) {
  required(store && store.targeted !== false && codes.includes(version) &&
    (s.config.localVersion || version === store.assigned) && s.config.offer && eligible(s, version).length,
    'Cette version est indisponible pour ce point de vente.',403);
  const history = (s.consultations ??= {})[store.id] ??= [];
  if (history.includes(version)) return false;
  history.push(version);
  return true;
}

// Upgrade only the S49 demonstration. Existing store IDs, replies and custom assignments survive.
export function upgradeDemo(s) {
  if (s.op.id === bricoId) {
    enrichBrico(s);
    if(!s.op.closed&&!bricoBonial(s))s.flows.push(initialBonial(s.config.versions));
    return s;
  }
  if (s.networkEdition === 1 || !demoId(s.op.id)) return s;
  if (s.op.id !== 'u-2649-pbs') {
    const branded = demoFields(s),
      stores = demoNetwork();
    branded.op.network = 'Nanotera';
    for (const t of branded.stores) {
      const fixture = stores.find(n => n.id === t.id);
      if (fixture) Object.assign(t, {
        name: fixture.name,
        format: fixture.format,
        zone: fixture.zone,
        region: fixture.region
      });
    }
    branded.networkEdition = 1;
    return branded;
  }
  const prior = new Map(s.stores.map(t => [t.id, t]));
  const oldGroups = Array.isArray(s.targetGroups);
  const groups = oldGroups ? s.targetGroups : demoGroups();
  const knownIds = new Set();
  const network = demoNetwork().map(t => {
    const old = prior.get(t.id);
    knownIds.add(t.id);
    return {
      ...t,
      ...old,
      name: t.name,
      format: t.format,
      region: t.region,
      zone: t.zone
    };
  });
  const extras = s.stores.filter(t => !knownIds.has(t.id)).map((t, i) => ({
    ...t,
    name: 'Nanotera · Point de vente ' + (901 + i)
  }));
  s.stores = [...network, ...extras];
  s.targetGroups = groups;
  Object.assign(s, demoFields(s));
  s.op.network = 'Nanotera';
  for (const k of ['title', 'contact', 'objective', 'owner']) s.op[k] = networkText(s.op[k]);
  for (const p of s.products)
    for (const k of ['name', 'brand', 'note']) p[k] = networkText(p[k]);
  for (const r of s.reminders || []) r.text = networkText(r.text);
  // Historically customised assignments continue until the manager applies a new group plan.
  if (!oldGroups && s.stores.some(t => t.assigned !== groups.find(g => g.criteria.format.includes(t.format))?.version || t.rule !== groups.find(g => g
      .criteria.format.includes(t.format))?.rule)) s.legacyAssignments = true;
  s.networkEdition = 1;
  return s;
}

export function importRows(rows, opId) {
  const all = col => rows.filter(x => x.col === col).map(x => ({
      ...x.data,
      id: x.id
    })),
    o = all('operations').find(x => x.id === opId);
  required(o, 'Opération introuvable.', 404);
  const demo = opId === 'u-2649-pbs' ? example() : null;
  const s = example(),
    own = col => all(col).filter(p => p.op === opId),
    eng = all('engagements').find(x => x.id === opId) || {};
  delete s.networkEdition;
  delete s.targetGroups;
  s.op = {
    id: o.id,
    title: o.nom,
    network: o.reseau || ((o.enseignes || []).some(n => /(^|\s)U(\s|$)/.test(n)) ? 'Magasins U' : (o.enseignes || []).join(' · ')) || o.enseigne || 'Réseau',
    start: o.debut,
    end: o.fin,
    scope: o.portee || '',
    closed: !!o.cloture,
    objective: o.brief?.objectif || '',
    owner: o.brief?.responsable || '',
    contact: o.brief?.client || ''
  };
  if (o.scenario === 'brico-demo' && s.op.network === 'Nanotera') return bricoRecording(s.op);
  const sourceProducts = own('produits');
  s.products = sourceProducts.map(x => {
    const witness = demo?.products.find(p => p.id === x.id);
    return {
      ...prod(x.id, x.libelle || x.id, x.conditionnement || x.unite || witness?.pack || '', (Array.isArray(x.versions) ? x.versions.filter(v => codes.includes(v)) :
        witness
        ?.versions) || [], x.prix ?? null, x.page ?? null, x.rayon || ''),
      brand: x.marque || '', ref:x.ref || '', description:x.description || '',
      ...(Array.isArray(x.media)?{media:x.media}:{}),
      note: x.mentions || x.mention || ''
    };
  });
  s.stores = all('magasins').filter(x => Object.hasOwn(eng, x.id)).map(x => ({
    id: x.id,
    name: x.nom,
    format: x.format || x.typologie || x.enseigne || 'Non renseigné', region: x.region || 'Non renseigné', zone: x.zone || 'Non renseigné',
    status: eng[x.id],
    assigned: demo?.stores.find(t => t.id === x.id)?.assigned || '',
    rule: demo?.stores.find(t => t.id === x.id)?.rule || 'free'
  }));
  const pieces = own('supports');
  const bases = pieces.filter(x => !x.groupe);
  const paged = x => x && ['Prospectus', 'E-catalogue'].includes(x.type);
  const firstPaged = bases.find(x => x.type === 'Prospectus') || bases.find(paged);
  s.supports = pieces.filter(x => !/flux/i.test(x.type)).map(x => {
    const base = pieces.find(y => y.id === x.groupe) || x;
    const plan = all('chemins').find(c => c.id === base.id) || (firstPaged?.id === base.id ? all('chemins').find(c => c.id === o.id) : null);
    const useByPage = {};
    const used = sourceProducts.filter(product => {
      if (base.institutionnel) return false;
      if (!paged(base)) return !base.produits || base.produits.includes(product.id);
      const page = Object.hasOwn(product.placements || {}, base.id) ? product.placements[base.id] : (firstPaged?.id === base.id ? product.page : null);
      if (page == null) return false;
      useByPage[product.id] = page;
      return true;
    });
    const pages = Math.max(1, Number(x.pages) || 0, ...(plan?.pages || []).map(page => Number(page.n) || 1), ...Object.values(useByPage).map(Number), Number((x
      .format || '').match(/(\d+)\s*pages/i)?.[1]) || 0);
    const item = piece(x.id, [x.type || x.id, x.variante].filter(Boolean).join(' · '), x.format || '', ({
      bat: 'En revue',
      valide: 'Validé',
      corrections: 'En corrections',
      livre: 'Remis'
    })[x.statut] || 'En préparation', pages, used.map(product => product.id));
    return {
      ...item,
      useByPage,
      family: /numérique|bannière|e-catalogue|sms/i.test(x.type) ? 'numerique' : 'imprime',
      file: x.fichier || '',
      revision: x.rev || x.bat || 1,
      decider: x.destinataire || item.decider,
      history: (x.archives || []).map(h => ({
        at: h.date || '',
        revision: h.rev || 1,
        decision: h.etat || 'Archivée',
        original: true,
        comment: 'Révision du dossier d’origine',
        file: h.fichier || '',
        products: []
      }))
    };
  });
  s.flows = pieces.filter(x => /flux/i.test(x.type)).map(x => ({
    id: x.id,
    name: x.type,
    v: demo?.flows.find(f => f.id === x.id)?.v || '',
    stage: 'À contrôler'
  }));
  s.tasks = own('taches').map(x => ({
    id: x.id,
    name: x.libelle || x.id,
    support: x.support || '',
    due: x.echeance || '',
    done: !!x.fait
  }));
  return upgradeDemo(s);
}
export function pageFor(support, product) {
  return Math.min(support.pages, Math.max(1, Number(support.useByPage?.[product.id] ?? product.page) || 1))
}
export const eligible = (s, v) => s.products.filter(p => p.versions.includes(v));
export function totals(s) {
  const counts = {
    engage: 0,
    attente: 0,
    non: 0,
    heritage: 0,
    quantity: 0,
    confirmed: 0
  };
  for (const t of participantsOf(s)) {
    const r = s.replies[t.id],
      status = r?.confirmed ? (r.yn === 'yes' ? 'engage' : 'non') : t.status;
    counts[status] = (counts[status] || 0) + 1;
    if (status === 'engage' && !r?.confirmed) counts.heritage++;
    if (r?.confirmed && r.yn === 'yes') {
      counts.confirmed++;
      counts.quantity += (r.counts.a1 || 0) + s.config.kits.reduce((n, k) => n + (r.counts[k.id] || 0) * (k.parts.a1 || 0), 0)
    }
  }
  return counts;
}
export function forRole(s, storeId) {
  if (!storeId) return s;
  const t = s.stores.find(t => t.id === storeId);
  required(t && t.targeted !== false, 'Ce point de vente ne fait pas partie du ciblage.', 403);
  const c = structuredClone(s.config);
  const v = s.replies[t.id]?.v || t.assigned;
  if (!c.localVersion) c.versions = c.versions.filter(x => x.id === v);
  c.items = c.items.filter(x => x.on);
  c.kits = c.kits.filter(x => x.on);
  if (!c.showUnit && !c.showTotal) {
    for (const x of [...c.items, ...c.kits]) delete x.price
  }
  return {
    op: s.op,
    config: c,
    ...(s.kit ? {kitFrame:s.kitFrame,deliveredKits:storeKits(s,storeId)} : {}),
    products: c.offer ? s.products.filter(p => c.localVersion ? p.versions.length : p.versions.includes(v)) : [],
    stores: [t],
    consultations: {[t.id]:s.consultations?.[t.id] || []},
    engagementsOpened:s.engagementsOpened,
    replies: {
      [t.id]: s.replies[t.id] || blank(t.assigned)
    }
  };
}

function validateConfig(c) {
  required(c && codes.every((v, i) => c.versions?.[i]?.id === v && clean(c.versions[i].name, 48)) && c.versions.length === 3,
    'Les trois versions doivent être nommées.');
  const items = [...c.items, ...c.kits];
  required(items.length <= 50 && c.digitalKits.length > 0 && c.digitalKits.length <= 20, 'Catalogue trop volumineux.');
  const ids = new Set();
  for (const x of items) {
    required(/^[a-z][a-z0-9-]{0,40}$/i.test(x.id) && !ids.has(x.id) && clean(x.name) && money(x.price), 'Support ou kit incorrect.');
    ids.add(x.id)
  }
  for (const k of c.kits) {
    required(Object.entries(k.parts).every(([id, n]) => c.items.some(x => x.id === id) && qty(n)) && (!k.on || Object.values(k.parts).some(n => n > 0)),
      'Indiquez la composition du kit.')
  }
  required(c.digitalKits.every(x => clean(x.name) && money(x.budget)) && Number.isInteger(c.pages) && c.pages > 0 && c.pages <= 1000,
    'Vérifiez les kits et la pagination.');
  required(c.owned.length === 5 && c.ads.length === 4, 'Options de participation incorrectes.');
}

function normalize(s, t, raw, confirm) {
  const c = s.config,
    r = blank(t.assigned);
  r.yn = t.rule === 'must' ? 'yes' : ['yes', 'no'].includes(raw.yn) ? raw.yn : '';
  r.v = c.localVersion && codes.includes(raw.v) ? raw.v : t.assigned;
  if (confirm) required(r.yn && (!(r.yn === 'yes') || codes.includes(r.v)), 'Complétez la participation et la version.');
  if (r.yn === 'yes') {
    if (s.kit) r.kit = raw.kit === true;
    for (const x of [...c.items, ...c.kits].filter(x => x.on)) {
      const n = raw.counts?.[x.id] ?? 0;
      required(qty(n), 'Quantité invalide.');
      if (n) r.counts[x.id] = n
    }
    c.owned.forEach((on, i) => {
      if (on && raw.owned?.[i]) r.owned[i] = true
    });
    c.ads.forEach((on, i) => {
      if (on && raw.media?.[i]) r.media[i] = true
    });
    if (r.media[0]) {
      r.copies = raw.copies || 0;
      required(qty(r.copies) && (!confirm || r.copies > 0), 'Indiquez le nombre d’exemplaires.')
    }
    if (r.media[1]) {
      const k = c.digitalKits.find(x => x.id === raw.digital) || c.digitalKits[0];
      r.digital = k.id;
      r.budget = raw.budget ?? k.budget;
      required(money(r.budget, !confirm), 'Indiquez un budget positif.')
    }
    if (c.offer)
      for (const p of eligible(s, r.v)) {
        if (!c.selectProducts || raw.picks?.[p.id]) {
          r.picks[p.id] = true;
          const n = raw.prices?.[p.id];
          if (c.localPrice && n !== undefined && n !== null && n !== '') {
            required(money(n, false), 'Prix local invalide.');
            r.prices[p.id] = n
          }
        }
      }
  }
  r.confirmed = confirm;
  return r;
}

function archiveFlow(f) {
  if (f.rows?.length) {
    f.archive ??= [];
    f.archive.push({
      v: f.v,
      rows: f.rows,
      generated: f.generated,
      delivered: f.delivered,
      receipt: f.receipt
    });
  }
  for (const key of ['rows', 'generated', 'delivered', 'receipt', 'validated', 'checked', 'review']) delete f[key];
}

export const inScope = (support, v) => !support.scope || support.scope === 'Toutes' || support.scope === v;

export function localVariantPrices(s, support, storeId) {
  const reply = s.replies[storeId];
  if (!reply?.confirmed || reply.yn !== 'yes' || !inScope(support, reply.v)) return {};
  const prices = {};
  for (const p of eligible(s, reply.v)) {
    const price = reply.prices?.[p.id];
    if (support.products.includes(p.id) && money(price, false) && price !== p.price) prices[p.id] = price;
  }
  return prices;
}

export function variantCurrent(s, support, saved) {
  const actual = localVariantPrices(s, support, saved.store);
  return (!saved.version || saved.version === s.replies[saved.store]?.v) && Object.keys(actual).length > 0 &&
    Object.keys(actual).length === Object.keys(saved.prices).length && Object.entries(actual).every(([id, v]) => saved.prices[id] === v);
}

function reviewSnapshot(s, support) {
  return {
    products: s.products.filter(p => support.products.includes(p.id)).map(p => ({
      id: p.id,
      name: p.name,
      page: pageFor(support, p),
      price: p.price,
      versions: [...p.versions]
    })),
    variants: structuredClone((support.variants || []).filter(z => variantCurrent(s, support, z)))
  };
}
const reviewDecisions = ['En revue', 'Validé', 'En corrections', 'Remis'];

function previousReview(support) {
  return (support.history || []).findLast(h => reviewDecisions.includes(h.decision) && Array.isArray(h.products) && !h.original && h.comment !==
    'Révision du dossier d’origine') || support.reviewBaseline;
}
export function reviewChanges(s, support) {
  const last = previousReview(support);
  if (!last) return [];
  const current = s.products.filter(p => support.products.includes(p.id));
  const changes = [];
  for (const p of current) {
    const prev = last.products.find(x => x.id === p.id);
    const page = pageFor(support, p);
    const place = p.name + ' · page ' + page;
    if (!prev) changes.push(place + ' · offre ajoutée');
    else {
      const price = value => value == null ? 'à renseigner' : value.toLocaleString('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      });
      if (prev.price !== p.price) changes.push(place + ' · prix TTC ' + price(prev.price) + ' → ' + price(p.price));
      if (prev.page && prev.page !== page) changes.push(place + ' · déplacée depuis la page ' + prev.page);
      if (Array.isArray(prev.versions) && eligibilityChange(prev.versions, p.versions).length) changes.push(place + ' · versions ' + (p.versions.join(', ') ||
        'à affecter'));
    }
  }
  for (const prev of last.products)
    if (!current.some(p => p.id === prev.id)) changes.push((prev.name || prev.id) + ' · offre retirée' + (prev.page ? ' de la page ' + prev.page : ''));
  if (last.variants) {
    const currentVariants = (support.variants || []).filter(z => variantCurrent(s, support, z));
    const allStores = new Set([...last.variants, ...currentVariants].map(z => z.store));
    for (const id of allStores) {
      const a = last.variants.find(z => z.store === id),
        b = currentVariants.find(z => z.store === id);
      if (JSON.stringify(a?.prices) !== JSON.stringify(b?.prices) || a?.version !== b?.version) changes.push('Variante locale · ' + (s.stores.find(t => t.id === id)
        ?.name || id) + (b ? ' · prix modifiés' : ' · retirée ou à revoir'));
    }
  }
  return changes;
}

export function commonPlan(s) {
  const common = s.supports.filter(x => !x.scope || x.scope === 'Toutes');
  return {
    brochure: common.find(x => /prospectus/i.test(x.name)),
    poster: common.find(x => x.participantItemId === 'a1' || /affiche.*\bA1\b/i.test(x.name)),
    item: s.config.items.find(x => x.id === 'a1')
  };
}

function applyCommonPlan(s, p) {
  let {
    brochure,
    poster,
    item
  } = commonPlan(s);
  const needed = Number(!brochure) + Number(!poster);
  required(s.supports.length + s.flows.length + needed <= 100, 'Limite de supports atteinte.');
  if (!item) {
    required(!s.config.kits.some(k => k.id === 'a1') && s.config.items.length + s.config.kits.length < 50 && money(p.price),
      'Précisez un prix unitaire HT valide pour l’affiche A1.');
    item = {
      id: 'a1',
      name: 'Affiche A1',
      unit: 'affiche',
      price: p.price,
      on: false
    };
    s.config.items.push(item);
  }
  if (!needed && item.on && poster.participantItemId === 'a1') return false;
  if (!brochure) {
    brochure = piece(crypto.randomUUID(), 'Prospectus commun', 'A4', 'En préparation', Math.min(s.config.pages || 12, 200),
      s.products.filter(x => x.versions.length).map(x => x.id));
    brochure.family = 'imprime';
    s.supports.push(brochure);
  }
  if (!poster) {
    poster = piece(crypto.randomUUID(), 'Affiche A1', '594 × 841 mm', 'En préparation', 1, []);
    poster.family = 'imprime';
    s.supports.push(poster);
  }
  poster.participantItemId = 'a1';
  if (!item.on) {
    item.on = true;
    for (const reply of Object.values(s.replies)) {
      if (reply.confirmed && reply.yn === 'yes') {
        reply.confirmed = false;
        reply.review = true;
      }
    }
  }
  return true;
}

function affect(s, ids, versions) {
  for (const support of s.supports) {
    if (!versions.some(v => inScope(support, v)) || !support.products.some(id => ids.includes(id))) continue;
    if (support.scope && support.scope !== 'Toutes') support.products = support.products.filter(id =>
      !ids.includes(id) || s.products.some(p => p.id === id && p.versions.includes(support.scope)));
    if (support.state !== 'En préparation' && support.state !== 'En corrections') support.review = true;
  }
  for (const f of s.flows) {
    if (!versions.includes(f.v)) continue;
    if (['Remis','Déposé en recette'].includes(f.stage)) {
      f.review = true;
      continue;
    }
    archiveFlow(f);
    f.stage = 'À contrôler';
  }
}
export function impactedVersions(prior, next) {
  const contentChanged = ['name', 'price', 'pack', 'note', 'brand', 'rayon', 'ref', 'description'].some(k => prior[k] !== next[k]);
  return contentChanged ? [...new Set([...prior.versions, ...next.versions])] : eligibilityChange(prior.versions, next.versions);
}

function eligibilityChange(a, b) {
  return codes.filter(v => a.includes(v) !== b.includes(v));
}

function offerImpact(s, t, r) {
  const c = s.config;
  return JSON.stringify([t.assigned, t.rule, c.localVersion, c.offer, c.selectProducts, c.localPrice, c.offer ? eligible(s, r.v).map(p => p.id) : [], c.owned, c
    .ads, c.showTotal, c.showUnit, c.items, c.kits, c.digitalKits, c.pages
  ]);
}
export const anomalies = (s, v) => eligible(s, v).filter(p => !money(p.price, false));
export function mutate(s, action, p, scope) {
  required(!s.op.closed, 'Ce dossier est clôturé.', 409);
  const t = s.stores.find(x => x.id === (scope || p.store));
  if (scope) required(['reply','consultVersion'].includes(action), 'Cet accès est réservé au participant.', 403);
  for (const support of s.supports) {
    if (reviewDecisions.includes(support.state) && !previousReview(support)) support.reviewBaseline = {
      revision: support.revision,
      decision: support.state,
      file: support.file,
      attachment: support.attachment || null,
      ...reviewSnapshot(s, support)
    };
  }
  if (action === 'openEngagements') {
    required(isBricoDemo(s) && s.stores.some(t=>t.targeted!==false) && codes.every(v=>eligible(s,v).length),
      'Préparez les assortiments et les magasins avant d’ouvrir les engagements.');
    if (s.engagementsOpened) return false;
    s.engagementsOpened = date();
  } else if (action === 'demoReplies') {
    required(isBricoDemo(s) && s.engagementsOpened, 'Ouvrez les engagements dans le dossier de démonstration.');
    const pending = s.stores.filter(t=>t.targeted!==false && !s.replies[t.id]);
    if (!pending.length) return false;
    for (const store of pending) {
      const [viewed, choice] = demoChoices[s.stores.indexOf(store)];
      const version = s.config.localVersion ? choice : store.assigned;
      for (const v of s.config.localVersion ? viewed : [version]) {
        if (eligible(s,v).length) recordConsultation(s,store,v);
      }
      s.replies[store.id] = {...normalize(s,store,{yn:'yes',v:version},true), demo:true};
    }
  } else if (action === 'consultVersion') {
    required(scope && (!isBricoDemo(s) || s.engagementsOpened), 'La consultation requiert un accès magasin et des engagements ouverts.',403);
    if (!recordConsultation(s,t,p.v)) return false;
  } else if (action.startsWith('kit-')) {
    if (!changeKit(s,action,{...p,author:'Studio'},required)) return false;
  } else if (['layout','submitLayout','annotation'].includes(action)) {
    const x=s.supports.find(v=>v.id===p.id);
    required(x,'Support absent.');
    if(action==='layout') editLayout(s,x,p);
    if(action==='annotation' && !annotate(s,x,p,'Studio')) return false;
    if(action==='submitLayout'){
      const before={revision:x.revision,at:date(),decision:x.state,comment:'Épreuve précédente',file:x.file,...reviewSnapshot(s,x)};
      if(!submitLayout(s,x)) return false;
      if(before.revision!==x.revision) x.history.push(before);
      x.history.push({revision:x.revision,at:date(),decision:'En revue',comment:'Mise en page transmise au BAT',file:'',...reviewSnapshot(s,x)});
    }
  } else if (action === 'reply') {
    required(t && t.targeted !== false, 'Ce point de vente ne fait pas partie du ciblage.', 403);
    required(!isBricoDemo(s) || s.engagementsOpened, 'Les engagements ne sont pas encore ouverts.',409);
    const r = normalize(s, t, p.reply || {}, p.confirm === true);
    if (JSON.stringify(r) === JSON.stringify(s.replies[t.id])) return false;
    if(s.kit && s.replies[t.id]?.confirmed){
      s.kit.replyHistory??={};
      (s.kit.replyHistory[t.id]??=[]).push({at:new Date().toISOString(),reply:s.replies[t.id]});
    }
    s.replies[t.id] = r
  } else if (action === 'targeting') {
    required(Array.isArray(p.groups) && p.groups.length <= 100, 'Ciblage incorrect (100 groupes maximum).');
    const ids = new Set();
    const groups = p.groups.map(g=>{
      required(g && /^[a-zA-Z0-9_-]{1,80}$/.test(g.id) && !ids.has(g.id), 'Identifiant de groupe incorrect.');
      ids.add(g.id);
      required(clean(g.name,80) && codes.includes(g.version) && eligible(s,g.version).length && ['free','must'].includes(g.rule), 'Nom, version avec assortiment et participation requis.');
      const criteria = {};
      for (const k of Object.keys(axes)) {
        const values = g.criteria?.[k];
        required(Array.isArray(values) && values.length<=100 && values.every(v=>typeof v==='string' && s.stores.some(t=>t[k]===v)), 'Critère de ciblage inconnu.');
        criteria[k] = [...new Set(values)].sort();
      }
      return {id:g.id,name:clean(g.name,80),version:g.version,rule:g.rule,criteria};
    });
    const {assignments}=targetPlan(s.stores,groups);
    s.config.localVersion=false;
    if (!s.legacyAssignments && JSON.stringify(s.targetGroups)===JSON.stringify(groups)) return false;
    for (const t of s.stores) {
      const group=assignments.get(t.id), version=group?.version || '', rule=group?.rule || 'free';
      const changed=!!(group && s.replies[t.id]?.v && s.replies[t.id].v!==version) || t.assigned!==version || t.rule!==rule || (t.targeted!==false)!==!!group;
      Object.assign(t,{assigned:version, rule, targeted:!!group, groupId:group?.id || ''});
      const old=s.replies[t.id];
      if (changed && old) {
        const next=group ? normalize(s,t,{...old,v:version},false) : {...old,confirmed:false};
        if (old.confirmed || old.review) next.review=true;
        s.replies[t.id]=next;
      }
    }
    delete s.legacyAssignments;
    s.targetGroups=groups;
  } else if (action === 'config') {
    const before = structuredClone(s);
    validateConfig(p.config);
    required(Array.isArray(s.targetGroups) || s.stores.every(x => ['free', 'must'].includes(p.rules[x.id]) && (codes.includes(p.assign[x.id]) || (!x.assigned && p.assign[x.id] === ''))),
      'Affectation incorrecte.');
    s.config = {...p.config, ...(s.kit?{productionPilot:true}:{}), localVersion:s.targetGroups && !s.legacyAssignments ? false : p.config.localVersion};

    for(const v of new Set(s.targetGroups?.map(g=>g.version))) {
      required(!eligible(s,v).length || s.products.some(x=>p.eligibility[x.id]?.includes(v)), 'Conservez au moins une référence dans l’assortiment proposé en '+v+'.');
    }
    for (const x of s.products) {
      const vs = codes.filter(v => p.eligibility[x.id]?.includes(v));
      required(!x.versions.length || vs.length > 0, 'Conservez au moins une version pour '+x.name+'.');
      const changed = eligibilityChange(x.versions, vs);
      x.versions = vs;
      if (changed.length) affect(s, [x.id], changed);
    }

    for (const x of s.stores) {
      const old = x.assigned;
      if (!Array.isArray(s.targetGroups)) {
        x.rule = p.rules[x.id];
        x.assigned = p.assign[x.id];
      }
      if (x.targeted === false) continue;
      if (s.replies[x.id]) {
        const r = s.replies[x.id];
        const previous = before.stores.find(y => y.id === x.id);
        const affected = offerImpact(before, previous, r) !== offerImpact(s, x, r);
        const next = normalize(s, x, {
          ...r,
          v: old !== x.assigned ? x.assigned : r.v
        }, r.confirmed && !affected);
        if ((affected && r.confirmed) || r.review) next.review = true;
        s.replies[x.id] = next
      }
    }
  } else if (action === 'productMedia') {
    const product=s.products.find(x=>x.id===p.id);
    required(product, 'Produit absent.', 404);
    required(Array.isArray(p.media) && p.media.length<=24, 'Maximum 24 médias par produit.');
    const media=p.media.map(item=>{
      const label=clean(item?.label,120),kind=item?.kind,url=clean(item?.url,1800);
      let address;
      try{address=new URL(url);}catch{}
      required(['image','logo','video'].includes(kind) && label && address?.protocol==='https:' && !address.username && !address.password,'Média invalide. Un libellé et un lien HTTPS sont requis.');
      return {kind,url,label};
    });
    if(JSON.stringify(product.media)===JSON.stringify(media))return false;
    product.media=media;
    affect(s,[product.id],product.versions);
  } else if (action === 'product') {
    const x = s.products.find(y => y.id === p.id);
    required(x, 'Produit absent.', 404);
    required(p.price === null || money(p.price, false), 'Prix invalide.');
    required(codes.some(v => p.versions?.includes(v)), 'Sélectionnez au moins une version.');
    const prior = {
      ...x
    };
    const name = clean(p.name, 100);
    required(name, 'Libellé obligatoire.');
    const values = {
      name,
      price: p.price,
      pack: clean(p.pack),
      note: clean(p.note, 500),
      ref: Object.hasOwn(p,'ref')?clean(p.ref):x.ref,
      description: Object.hasOwn(p,'description')?clean(p.description,1800):x.description,
      brand: clean(p.brand),
      rayon: clean(p.rayon)
    };
    const priority = ['star','top','standard'].includes(p.priority) ? p.priority : x.priority;
    const nextVersions = codes.filter(v => p.versions.includes(v));
    for (const v of prior.versions.filter(v=>!nextVersions.includes(v))) {
      required(!s.targetGroups?.some(g=>g.version===v) || eligible(s,v).length>1, 'Conservez au moins une référence dans l’assortiment proposé en '+v+'.');
    }
    const changedVersions = eligibilityChange(prior.versions, nextVersions);
    const affected = impactedVersions(prior, {
      ...values,
      versions: nextVersions
    });
    if (!affected.length && priority === x.priority) return false;
    Object.assign(x, values, {priority,
      versions: nextVersions
    });
    if (affected.length) affect(s, [x.id], affected);
    for (const store of s.stores) {
      const r = s.replies[store.id];
      if (store.targeted === false || !r || r.yn !== 'yes' || !s.config.offer || !changedVersions.includes(r.v)) continue;
      const next = normalize(s, store, r, false);
      if (r.confirmed || r.review) next.review = true;
      s.replies[store.id] = next;
    }
  } else if (action === 'addProduct') {
    required(s.products.length < 500, 'Limite de 500 références par dossier.');
    const id = clean(p.id, 60);
    required(/^[a-zA-Z0-9_-]+$/.test(id) && !s.products.some(x => x.id === id), 'Référence vide ou déjà utilisée.');
    const vs = codes.filter(v => p.versions?.includes(v));
    required(vs.length && clean(p.name), 'Libellé et version requis.');
    required(p.price === null || money(p.price, false), 'Prix invalide.');
    s.products.push(prod(id, clean(p.name), clean(p.pack), vs, p.price, 1, clean(p.rayon)));
    affect(s, [id], vs);
    for (const store of s.stores) {
      const r = s.replies[store.id];
      if (store.targeted !== false && s.config.offer && r?.yn === 'yes' && vs.includes(r.v)) {
        const next = normalize(s, store, r, false);
        if (r.confirmed || r.review) next.review = true;
        s.replies[store.id] = next;
      }
    }
  } else if (action === 'commonPlan') {
    if (!applyCommonPlan(s, p)) return false;
  } else if (action === 'device') {
    required(['prospectus', 'affiche', 'numerique', 'flux'].includes(p.kind), 'Famille inconnue.');
    const name = clean(p.name, 80);
    required(name, 'Donnez un nom au support.');
    required(s.supports.length + s.flows.length < 100, 'Limite de supports atteinte.');
    const target = codes.includes(p.v) ? p.v : 'Toutes';
    if (p.kind === 'flux') {
      required(target !== 'Toutes', 'Choisissez une version commerciale.');
      s.flows.push({
        id: crypto.randomUUID(),
        name,
        v: target,
        stage: 'À contrôler'
      })
    } else {
      const normalized = name.trim().toLocaleLowerCase('fr');
      required(!s.supports.some(y => y.name.toLocaleLowerCase('fr') === normalized && (y.scope || 'Toutes') === target),
        'Un support de ce nom existe déjà pour cette version. Ouvrez son dispositif pour le modifier.');
      const x = piece(crypto.randomUUID(), name, clean(p.format), 'En préparation', Math.max(1, Math.min(200, Number(p.pages) || 1)), []);
      s.supports.push(x);
      x.scope = target;
      x.family = p.kind === 'numerique' ? 'numerique' : 'imprime';
      x.note = clean(p.note, 500);
      x.products = s.products.filter(y => (target === 'Toutes' || y.versions.includes(target)) && p.products?.includes(y.id)).map(y => y.id);
    }
  } else if (action === 'info') {
    for (const k of ['title', 'network', 'owner', 'contact', 'scope', 'objective', 'start', 'end']) s.op[k] = clean(p[k], k === 'objective' ? 1400 : 160);
    required(s.op.title && /^\d{4}-\d{2}-\d{2}$/.test(s.op.start) && s.op.end >= s.op.start, 'Vérifiez le titre et les dates.')
  } else if (action === 'task') {
    const x = s.tasks.find(x => x.id === p.id);
    required(x, 'Jalon absent.');
    x.done = !!p.done
  } else if (action === 'schedule') {
    required(/^\d{4}-\d{2}-\d{2}$/.test(p.due) && s.supports.some(x => x.id === p.id), 'Choisissez une échéance et un support.');
    const support = s.supports.find(x => x.id === p.id);
    const model = MODELES[support.family || 'imprime'];
    for (const [code, name, offset, paginated] of model) {
      if (paginated && support.pages <= 1) continue;
      const id = p.id + '-' + code,
        old = s.tasks.find(x => x.id === id);
      const val = {
        id,
        name,
        support: p.id,
        due: decale(p.due, offset),
        done: !!old?.done
      };
      if (old) Object.assign(old, val);
      else s.tasks.push(val)
    }
  } else if (action === 'support') {
    const x = s.supports.find(x => x.id === p.id);
    required(x, 'Support absent.');
    if (p.step === 'setup') {
      const scope = codes.includes(p.scope) ? p.scope : 'Toutes';
      const next = {
        scope,
        format: clean(p.format),
        note: clean(p.note, 500),
        products: s.products.filter(y =>
          p.products?.includes(y.id) && (scope === 'Toutes' || y.versions.includes(scope))).map(y => y.id)
      };
      if (Object.entries(next).every(([k, v]) => JSON.stringify(x[k]) === JSON.stringify(v))) return false;
      Object.assign(x, next);
      if (!['En préparation', 'En corrections'].includes(x.state)) x.review = true;
    } else if (p.step === 'variant') {
      const local = localVariantPrices(s, x, p.store);
      required(Object.keys(local).length, 'Aucun prix local distinct et confirmé pour cette version du support.');
      const last = (x.variants || []).find(z => z.store === p.store);
      if (last && JSON.stringify(last.prices) === JSON.stringify(local) && (!last.version || last.version === s.replies[p.store].v)) return false;
      x.variants = (x.variants || []).filter(z => z.store !== p.store);
      x.variants.push({
        store: p.store,
        version: s.replies[p.store].v,
        prices: local,
        at: date()
      });
      if (!['En préparation', 'En corrections'].includes(x.state)) x.review = true;
    } else if (p.step === 'removeVariant') {
      x.variants = (x.variants || []).filter(z => z.store !== p.store);
      if (!['En préparation', 'En corrections'].includes(x.state)) x.review = true;
    } else if (p.step === 'file') {
      required(!['Validé', 'En revue', 'Remis'].includes(x.state), 'Ouvrez une nouvelle révision.');
      required(!p.file || /^https:\/\//i.test(p.file), 'Utilisez une adresse HTTPS.');
      x.file = clean(p.file, 1000)
    } else {
      required(['En revue', 'Validé', 'En corrections', 'Nouvelle révision', 'Remis'].includes(p.step), 'Décision inconnue.');
      const allowed = {
        'En revue': ['En préparation', 'En corrections'],
        'Validé': ['En revue'],
        'En corrections': ['En revue'],
        'Remis': ['Validé']
      };
      if (p.step==='Nouvelle révision') preserveProof(s,x);
      if (p.step==='Validé') required(!(x.comments||[]).some(c=>c.revision===x.revision&&!c.resolved),'Traitez les commentaires ouverts du BAT avant de valider.');
      if (p.step === 'Validé' || p.step === 'Remis') required((x.variants || []).every(z => variantCurrent(s, x, z)),
        'Revoyez les variantes locales avant de valider le BAT.');
      if (p.step !== 'Nouvelle révision') required(allowed[p.step].includes(x.state), 'Transition indisponible.');
      if (['Validé', 'Remis'].includes(p.step)) required(!x.review && x.products.every(id => s.products.find(y => y.id === id)?.price > 0),
        'Traitez les anomalies et ouvrez une nouvelle révision si nécessaire.');
      if (p.step === 'En revue') x.review = false;
      x.history.push({
        at: date(),
        revision: x.revision,
        decision: p.step,
        comment: clean(p.note, 500),
        file: x.file,
        attachment: x.attachment || null,
        changes: reviewChanges(s, x),
        ...reviewSnapshot(s, x)
      });
      if (p.step === 'Nouvelle révision') {
        x.revision++;
        x.review = false;
        x.state = 'En préparation'
      } else x.state = p.step
    }
  } else if (action === 'flow') {
    const f = s.flows.find(x => x.id === p.id);
    required(f, 'Flux absent.');
    if (p.step === 'scope') {
      required(codes.includes(p.v), 'Version inconnue.');
      if (f.v === p.v) return false;
      archiveFlow(f);
      f.v = p.v;
      f.stage = 'À contrôler';
      delete f.validated
    } else if (p.step === 'check') {
      archiveFlow(f);
      const ok = eligible(s, f.v).length && !anomalies(s, f.v).length && !missingBonialUnit(s,f);
      f.stage = ok ? 'Contrôlé' : 'À corriger';
      f.validated = !!ok;
      f.checked = date()
    } else if (p.step === 'generate') {
      required(f.stage === 'Contrôlé' && f.validated && !anomalies(s, f.v).length && !missingBonialUnit(s,f), 'Contrôlez les données avant génération.');
      f.rows = eligible(s, f.v).map(x => ({
        reference: x.id,
        libelle: x.name,
        conditionnement: x.pack,
        prix_ttc: x.price,
        version: f.v
      }));
      f.stage = 'Généré';
      f.generated = date()
    } else if (p.step === 'test-deposit') {
      required(isBricoDemo(s), 'Ce dépôt est réservé au dossier de recette.',403);
      if (f.stage === 'Déposé en recette') return false;
      required(f.stage === 'Généré' && f.rows?.length, 'Générez le fichier avant le dépôt.');
      f.receipt = 'REC-' + crypto.randomUUID().slice(0,8).toUpperCase();
      f.stage = 'Déposé en recette';
      f.delivered = date();
    } else if (p.step === 'deliver') {
      required(!isBricoDemo(s), 'Utilisez le dépôt de recette pour cette opération.');
      required(f.stage === 'Généré' && clean(p.receipt), 'Renseignez le reçu de remise du fichier généré.');
      f.stage = 'Remis';
      f.receipt = clean(p.receipt, 250);
      f.delivered = date()
    } else required(false, 'Action inconnue.')
  } else if (action === 'reminder') {
    const ids = participantsOf(s).filter(t => p.stores?.includes(t.id)).map(t => t.id);
    required(ids.length && clean(p.text), 'Sélection et texte obligatoires.');
    s.reminders.push({
      id: crypto.randomUUID(),
      stores: ids,
      text: clean(p.text, 2000),
      at: date()
    })
  } else required(false, 'Action inconnue.', 400);
  s.audit.push({
    at: date(),
    action,
    actor: scope || 'Enseigne'
  });
  s.audit = s.audit.slice(-120);
  return true;
}
