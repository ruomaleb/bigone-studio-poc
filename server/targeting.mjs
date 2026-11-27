export const axes = {
  format: 'Format',
  region: 'Région',
  zone: 'Type de zone'
};
const formats = ['Supermarché', 'Hypermarché', 'Supérette'];
const zones = ['Centre-ville', 'Centre commercial', 'Périphérie', 'Zone rurale'];
const places = [
  ['Île-de-France', 'Paris'],
  ['Bretagne', 'Rennes'],
  ['Normandie', 'Caen'],
  ['Nouvelle-Aquitaine', 'Poitiers'],
  ['Occitanie', 'Albi'],
  ['Grand Est', 'Nancy'],
  ['Hauts-de-France', 'Arras'],
  ['Pays de la Loire', 'Cholet'],
  ['Auvergne-Rhône-Alpes', 'Lyon'],
  ['Centre-Val de Loire', 'Tours'],
  ['Bourgogne-Franche-Comté', 'Dijon'],
  ['Provence-Alpes-Côte d’Azur', 'Arles'],
  ['Corse', 'Bastia']
];
export function demoNetwork() {
  return Array.from({
    length: 900
  }, (_, i) => {
    const [region, city] = places[i % places.length];
    return {
      id: 'm' + String(i + 1).padStart(2, '0'),
      name: 'Nanotera ' + city + ' ' + String(i + 1).padStart(3, '0'),
      format: formats[i % 3],
      region,
      zone: zones[i % 4],
      status: i % 10 < 6 ? 'engage' : i % 10 < 9 ? 'attente' : 'non',
      assigned: 'V' + (1 + i % 3),
      rule: i % 3 === 1 ? 'must' : 'free',
      targeted: true,
      groupId: 'format-' + i % 3
    };
  });
}
export const demoGroups = () => formats.map((format, i) => ({
  id: 'format-' + i,
  name: format + 's',
  version: 'V' + (i + 1),
  rule: i === 1 ? 'must' : 'free',
  criteria: {
    format: [format],
    region: [],
    zone: []
  }
}));
export const participantsOf = s => s.stores.filter(t => t.targeted !== false);
export const matches = (store, criteria) => Object.keys(axes).every(k => !criteria[k].length || criteria[k].includes(store[k]));
export function targetPlan(stores, groups) {
  const assignments = new Map(),
    counts = groups.map(() => ({
      matched: 0,
      assigned: 0
    }));
  for (const store of stores) {
    for (const [i, group] of groups.entries()) {
      if (!matches(store, group.criteria)) continue;
      counts[i].matched++;
      if (assignments.has(store.id)) continue;
      counts[i].assigned++;
      assignments.set(store.id, group);
    }
  }
  return {
    assignments,
    counts
  };
}
export function networkText(text) {
  return typeof text === 'string' ? text.replace(/\b(?:Magasins U|Système U|Coopérative U|Hyper U|Super U|Marché U|U Express|E\.Leclerc)\b/gi, 'Nanotera')
    .replace(/\bU\b/g, 'Nanotera') : text;
}

// The public catalogue also contains independently created workspaces. Only project seeded demo records.
export const demoId = id => /^(?:u-\d{4}-[a-z0-9-]+|bd-2704-deco)$/.test(id);
export function demoFields(value) {
  if (Array.isArray(value)) return value.map(demoFields);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, demoFields(v)]));
  if (typeof value !== 'string' || /^https?:\/\//i.test(value)) return value;
  return networkText(value);
}
export function projectCatalog(catalog, includeWorkspaces) {
  const ids = new Set(catalog.operations.filter(o => demoId(o.id)).map(o => o.id));
  const supportIds = new Set(catalog.supports.filter(t => ids.has(t.op)).map(t => t.id));
  const network = demoNetwork();
  catalog.magasins = [...network.map(t => ({
      id: t.id,
      nom: t.name,
      code: t.id,
      enseigne: 'Nanotera',
      reseau: 'Nanotera',
      format: t.format,
      region: t.region,
      zone: t.zone,
      source: 'demo'
    })),
    ...(includeWorkspaces ? catalog.magasins.filter(m => !/^m\d+$/.test(m.id)) : [])
  ];
  for (const key of Object.keys(catalog).filter(k => k !== 'magasins')) {
    catalog[key] = catalog[key].flatMap(row => {
      if (!ids.has(row.id) && !ids.has(row.op) && !supportIds.has(row.id)) return includeWorkspaces ? [row] : [];
      const out = demoFields(row);
      if (key === 'operations') Object.assign(out, {
        reseau: 'Nanotera',
        enseignes: ['Nanotera']
      });
      if (key === 'engagements' && row.id === 'u-2649-pbs')
        for (const t of network) out[t.id] ??= t.status;
      return [out];
    });
  }
  return catalog;
}
