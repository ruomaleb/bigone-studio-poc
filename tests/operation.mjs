import assert from 'node:assert/strict';
import {
  DatabaseSync
} from 'node:sqlite';
import {
  readFileSync
} from 'node:fs';
import worker from '../server/worker.mjs';
import {
  example,
  importRows,
  pageFor,
  reviewChanges,
  localVariantPrices,
  variantCurrent,
  eligible,
  mutate,
  blank,
  totals,
  forRole,
  anomalies
} from '../server/model.mjs';
const s = example(),
  t = s.stores[0];
assert.deepEqual(['V1', 'V2', 'V3'].map(v => eligible(s, v).length), [2, 2, 1]);
assert.deepEqual(totals(s), {
  engage: 540,
  attente: 270,
  non: 90,
  heritage: 540,
  quantity: 0,
  confirmed: 0
});
const r = {
  ...blank(),
  yn: 'yes',
  counts: {
    a1: 2,
    kit1: 1
  },
  media: {
    0: true,
    1: true
  },
  copies: 1500,
  budget: 400,
  picks: {
    's49-09': true
  },
  prices: {
    's49-09': 6.75
  }
};
assert(mutate(s, 'reply', {
  confirm: true,
  reply: r
}, t.id));
assert.equal(totals(s).quantity, 4);
assert.equal(s.replies.m01.prices['s49-09'], 6.75);
assert.equal(s.products[1].price, 8.4);
assert.equal(mutate(s, 'reply', {
  confirm: true,
  reply: r
}, t.id), false);
assert.equal(s.config.items[0].price * 2 + s.config.kits[0].price, 27);
assert.throws(() => mutate(s, 'product', {
  id: 's49-08'
}, t.id));
assert.equal(forRole(s, t.id).stores.length, 1);
assert.equal(forRole(s, t.id).supports, undefined);
// Exercise the historical locally editable version mode.
s.config.localVersion = true;
mutate(s, 'reply', {
  reply: {
    ...r,
    v: 'V3',
    counts: {
      a1: 20
    }
  },
  confirm: true
}, t.id);
assert.equal(totals(s).quantity, 20);
assert.deepEqual(s.replies.m01.prices, {});
assert.throws(() => mutate(s, 'reply', {
  reply: {
    ...r,
    copies: 0
  },
  confirm: true
}, t.id));
assert.throws(() => mutate(s, 'reply', {
  reply: {
    ...r,
    budget: 0
  },
  confirm: true
}, t.id));
mutate(s, 'flow', {
  id: 's49-bonial',
  step: 'check'
});
assert.equal(s.flows[0].stage, 'À corriger');
assert.throws(() => mutate(s, 'flow', {
  id: 's49-bonial',
  step: 'generate'
}));
mutate(s, 'product', {
  ...s.products[0],
  price: 4.99
});
assert(s.supports[0].review);
assert.equal(anomalies(s, 'V1').length, 0);
for (const step of ['check', 'generate']) mutate(s, 'flow', {
  id: 's49-bonial',
  step
});
assert.equal(s.flows[0].rows.length, 2);
mutate(s, 'flow', {
  id: 's49-bonial',
  step: 'deliver',
  receipt: 'Recette POC'
});
assert.equal(s.flows[0].stage, 'Remis');
for (const step of ['Nouvelle révision', 'En revue', 'Validé']) mutate(s, 'support', {
  id: s.supports[0].id,
  step
});
assert.equal(s.supports[0].revision, 2);
const snap = JSON.stringify(s.supports[0].history);
mutate(s, 'product', {
  ...s.products[0],
  price: 5.25
});
assert.equal(JSON.stringify(s.supports[0].history), snap);
const db = new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('../server/schema.sql', import.meta.url), 'utf8'));
class Prepared {
  constructor(sql, args = []) {
    this.sql = sql;
    this.args = args
  }
  bind(...args) {
    return new Prepared(this.sql, args)
  }
  first() {
    return db.prepare(this.sql).get(...this.args)
  }
  run() {
    return {
      meta: db.prepare(this.sql).run(...this.args)
    }
  }
}
const env = {
  DB: {
    prepare: sql => new Prepared(sql),
    batch: stmts => {
      db.exec('begin');
      try {
        const r = stmts.map(x => x.run());
        db.exec('commit');
        return r
      } catch (e) {
        db.exec('rollback');
        throw e
      }
    }
  }
};
const call = async (path, token, body = {}) => {
  const res = await worker.fetch(new Request('https://studio.test' + path, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify(body)
  }), env);
  return [res.status, await res.json()]
};
const manager = 'b'.repeat(64);
const bricoToken = 'e'.repeat(64);
assert.equal((await call('/session', bricoToken))[0], 200);
const [, bricoWorkspace] = await call('/read', bricoToken);
const brico = bricoWorkspace.state;
assert.equal(brico.op.id, 'bd-2704-deco');
assert.equal(brico.stores.length, 900);
assert.equal(brico.products.length, 21);
assert.deepEqual(brico.config.versions.map(v => brico.products.filter(p => p.versions.includes(v.id)).length), [17,21,4]);
const catalogue = brico.supports.find(x => x.id === 'bd-ecatalogue');
assert.deepEqual([1,2,3,4,5,6].map(n => Object.values(catalogue.useByPage).filter(page => page === n).length), [0,5,5,4,7,0]);
assert.equal((await call('/session', manager, {operation:'u-2649-pbs'}))[0], 200);
const [_, initial] = await call('/read', manager);
assert.equal(initial.role, 'enseigne');
const [, inv] = await call('/invite', manager, {
  store: 'm01'
});
const [, store] = await call('/read', inv.key);
assert.equal(store.state.stores.length, 1);
assert.equal(store.role, 'magasin');
assert.equal((await call('/invite', inv.key, {
  store: 'm02'
}))[0], 403);
const action = {
  revision: 1,
  action: 'reply',
  payload: {
    store: 'm02',
    reply: r,
    confirm: true
  }
};
const [, first] = await call('/change', inv.key, action);
assert.equal(first.revision, 2);
assert.equal((await call('/change', inv.key, action))[1].revision, 2);
const [, after] = await call('/read', manager);
assert.equal(after.state.replies.m02, undefined);
assert(after.state.replies.m01.confirmed);
assert.equal((await call('/change', manager, {
  revision: 1,
  action: 'task',
  payload: {
    id: 'bat1',
    done: true
  }
}))[0], 409);
const [, ans] = await call('/ask', inv.key, {
  question: 'Quel est mon assortiment ?'
});
assert(!JSON.stringify(ans).includes('Démo 02'));
assert(ans.links.length);
console.log('PASS · PIM V1/V2/V3 · rôle magasin · brouillon et confirmation idempotente · révisions immuables · flux CSV · concurrence API');

const raw = [{
    col: 'operations',
    id: 'u-2649-pbs',
    data: {
      nom: 'S49',
      debut: '2026-12-01',
      fin: '2026-12-13'
    }
  },
  {
    col: 'produits',
    id: 's49-08',
    data: {
      op: 'u-2649-pbs',
      libelle: 'Fromage du dossier',
      prix: 4.75,
      page: 6
    }
  },
  {
    col: 'supports',
    id: 's49-prospectus',
    data: {
      op: 'u-2649-pbs',
      type: 'Prospectus',
      format: '12 pages, 210 x 297 mm',
      bat: 2
    }
  },
  {
    col: 'chemins',
    id: 'u-2649-pbs',
    data: {
      pages: [{
        n: 1
      }, {
        n: 12
      }]
    }
  },
];
const imported = importRows(raw, 'u-2649-pbs');
assert.equal(imported.products[0].price, 4.75);
assert.equal(imported.products[0].name, 'Fromage du dossier');
assert.equal(pageFor(imported.supports[0], imported.products[0]), 6);
assert.equal(imported.supports[0].pages, 12);
assert.equal(imported.supports[0].revision, 2);
const versioned = example(),
  flow = versioned.flows[1];
versioned.products[0].price = 4.75;
for (const step of ['check', 'generate', 'deliver']) mutate(versioned, 'flow', {
  id: flow.id,
  step,
  receipt: 'R01'
});
const before = structuredClone(flow.rows);
mutate(versioned, 'flow', {
  id: flow.id,
  step: 'scope',
  v: 'V3'
});
assert.equal(flow.rows, undefined);
assert.deepEqual(flow.archive[0].rows, before);
assert.equal(flow.archive[0].v, 'V2');
assert.equal(flow.archive[0].receipt, 'R01');
const independent = example();
delete independent.targetGroups; // Pre-group catalogue compatibility.
mutate(independent, 'reply', {
  confirm: true,
  reply: r
}, 'm01');
const configPayload = {
  config: structuredClone(independent.config),
  rules: Object.fromEntries(independent.stores.map(t => [t.id, t.rule])),
  assign: Object.fromEntries(independent.stores.map(t => [t.id, t.assigned])),
  eligibility: Object.fromEntries(independent.products.map(p => [p.id, p.versions]))
};
configPayload.assign.m02 = 'V3';
mutate(independent, 'config', configPayload);
assert(independent.replies.m01.confirmed);
configPayload.assign.m01 = 'V2';
mutate(independent, 'config', configPayload);
assert(independent.replies.m01.review);
assert(!independent.replies.m01.confirmed);
assert(!Object.hasOwn(independent.replies.m01.prices, 's49-09'));
mutate(independent, 'addProduct', {
  name: 'Offre test',
  id: 'T-01',
  pack: '1 kg',
  versions: ['V3'],
  price: 3
});
mutate(independent, 'device', {
  kind: 'affiche',
  name: 'Affiche témoin',
  format: 'A2',
  v: 'V3',
  products: ['T-01', 's49-09']
});
const created = independent.supports.at(-1);
assert.deepEqual(created.products, ['T-01']);
assert.equal(created.scope, 'V3');
mutate(independent, 'schedule', {
  id: created.id,
  due: '2026-12-07'
});
assert.equal(independent.tasks.find(t => t.id === created.id + '-bat1').due, '2026-11-25');
const upload = await call('/upload', manager, {
  id: 's49-affiche',
  revision: 2,
  name: 'test.pdf',
  content: btoa('%PDF-1.4\nPOC')
});
assert.equal(upload[0], 200);
const asset = upload[1].state.supports.find(x => x.id === 's49-affiche').attachment;
assert.equal((await call('/file', manager, {
  id: asset.id
}))[1].name, 'test.pdf');
assert.equal((await call('/file', inv.key, {
  id: asset.id
}))[0], 403);
console.log('PASS · import BAT · archivage du CSV · modifications isolées · offre et dispositif versionnés · rétroplanning · pièces jointes réservées');

const pilot = example();
const initialOffer = structuredClone(pilot.products[0]);
const baseSupport = pilot.supports[0];
const poster = pilot.supports[1];
const change = (action, payload) => mutate(pilot, action, payload);
const decision = (step, id = baseSupport.id) => change('support', {
  step,
  id
});
const registerPrice = (store, v, price) => mutate(pilot, 'reply', {
  confirm: true,
  reply: {
    ...blank(v),
    yn: 'yes',
    v,
    picks: {
      [initialOffer.id]: true
    },
    prices: {
      [initialOffer.id]: price
    }
  }
}, store);
change('commonPlan', {});
assert.equal(pilot.supports.length, 2);
assert.equal(poster.participantItemId, 'a1');
assert.equal(change('commonPlan', {}), false);
const noDevices = example();
noDevices.supports = [];
noDevices.config.items[0].on = false;
mutate(noDevices, 'commonPlan', {});
assert.equal(noDevices.supports.length, 2);
assert(noDevices.config.items[0].on);
assert.equal(mutate(noDevices, 'commonPlan', {}), false);
const sharedPrice = {
  ...initialOffer,
  price: 4.99
};
change('product', sharedPrice);
assert.equal(change('product', sharedPrice), false);
assert(reviewChanges(pilot, baseSupport).some(x => x.includes('page 6') && x.includes('4,99')));
for (const step of ['Nouvelle révision', 'En revue', 'Validé']) decision(step);
const noted = baseSupport.history.find(x => x.decision === 'Nouvelle révision');
assert(noted.changes.some(x => x.includes('4,99')));
assert.equal(noted.products.find(x => x.id === initialOffer.id).page, 6);
change('device', {
  kind: 'affiche',
  name: 'Affiche festive',
  format: 'A2',
  v: 'V2',
  products: [initialOffer.id]
});
const festive = pilot.supports.at(-1);
assert.throws(() => change('device', {
  kind: 'affiche',
  name: 'Affiche festive',
  format: 'A3',
  v: 'V2',
  products: []
}));
assert.equal(festive.format, 'A2');
assert.equal(festive.review, false);
registerPrice('m01', 'V1', 3.79);
assert.deepEqual(localVariantPrices(pilot, festive, 'm01'), {});
assert.throws(() => change('support', {
  id: festive.id,
  step: 'variant',
  store: 'm01'
}));
registerPrice('m02', 'V2', 4.99);
assert.deepEqual(localVariantPrices(pilot, festive, 'm02'), {});
registerPrice('m02', 'V2', 4.29);
change('support', {
  id: festive.id,
  step: 'variant',
  store: 'm02'
});
assert.equal(change('support', {
  id: festive.id,
  step: 'variant',
  store: 'm02'
}), false);
decision('En revue', festive.id);
decision('Validé', festive.id);
assert.equal(festive.history.at(-1).variants[0].prices[initialOffer.id], 4.29);
const v2history = structuredClone(festive.history);
change('product', {
  ...pilot.products[0],
  versions: ['V1']
});
assert(!festive.products.includes(initialOffer.id));
assert(festive.review);
assert(!variantCurrent(pilot, festive, festive.variants[0]));
assert.deepEqual(festive.history, v2history);
assert.equal(pilot.replies.m02.review, true);
assert.equal(pilot.replies.m01.confirmed, true);
assert.equal(pilot.replies.m01.prices[initialOffer.id], 3.79);
assert.equal(pilot.products[0].price, 4.99);
assert.throws(() => decision('Remis', festive.id));
console.log('PASS · proposition prospectus + affiche A1 · portée V1/V2 et prix locaux · BAT R1 et historique des changements');

const constrained = example();
constrained.config.localVersion = false;
constrained.config.localPrice = false;
constrained.config.owned[0] = false;
constrained.config.items[0].on = false;
const beforeChoice = {
  ...blank('V3'),
  yn: 'no',
  v: 'V3',
  owned: {
    0: true
  },
  counts: {
    a1: 5
  },
  picks: {
    's49-08': true
  },
  prices: {
    's49-08': 3
  }
};
mutate(constrained, 'reply', {
  reply: beforeChoice,
  confirm: true
}, 'm01');
assert.equal(constrained.replies.m01.yn, 'no');
mutate(constrained, 'reply', {
  reply: beforeChoice,
  confirm: true
}, 'm02');
assert.equal(constrained.replies.m02.yn, 'yes');
assert.equal(constrained.replies.m02.v, 'V2');
assert.deepEqual(constrained.replies.m02.prices, {});
assert.deepEqual(constrained.replies.m02.owned, {});
assert.deepEqual(constrained.replies.m02.counts, {});
assert(forRole(constrained, 'm02').config.items.every(x => x.on));
assert.deepEqual(forRole(constrained, 'm02').config.versions.map(v => v.id), ['V2']);
assert.throws(() => mutate(constrained, 'product', {
  ...constrained.products[0],
  versions: []
}));
console.log('PASS · participation obligatoire et refus facultatif · version fixée · options fermées · dernière version requise');

const participantTwo = (await call('/invite', manager, {
  store: 'm02'
}))[1];
const ownView = (await call('/read', participantTwo.key))[1];
assert.equal(ownView.state.stores.length, 1);
assert.equal(ownView.state.replies.m02.v, 'V2');
assert.equal(ownView.state.replies.m01, undefined);
const draft = await call('/change', participantTwo.key, {
  revision: ownView.revision,
  action: 'reply',
  payload: {
    confirm: false,
    reply: {
      ...blank('V2'),
      yn: 'yes',
      counts: {
        a1: 20
      }
    }
  }
});
assert.equal(draft[0], 200);
assert.equal((await call('/read', participantTwo.key))[1].state.replies.m02.confirmed, false);
const confirmation = {
  revision: draft[1].revision,
  action: 'reply',
  payload: {
    confirm: true,
    reply: draft[1].state.replies.m02
  }
};
const done = (await call('/change', participantTwo.key, confirmation))[1];
assert.equal(done.state.replies.m02.copies, 0);
assert.equal(done.state.replies.m02.counts.a1, 20);
assert.equal((await call('/change', participantTwo.key, confirmation))[1].revision, done.revision);
assert.equal(totals((await call('/read', manager))[1].state).quantity, 24);

const lastVersion = example();
delete lastVersion.targetGroups;
const eligibility = Object.fromEntries(lastVersion.products.map(p => [p.id, p.versions]));
const setup = {
  config: lastVersion.config,
  assign: Object.fromEntries(lastVersion.stores.map(t => [t.id, t.assigned])),
  rules: Object.fromEntries(lastVersion.stores.map(t => [t.id, t.rule])),
  eligibility
};
assert.throws(() => mutate(structuredClone(lastVersion), 'config', {
  ...setup,
  eligibility: {
    ...eligibility,
    's49-09': []
  }
}), /au moins une version/);
assert.throws(() => mutate(structuredClone(lastVersion), 'config', {
  ...setup,
  assign: {
    ...setup.assign,
    m01: ''
  }
}), /Affectation incorrecte/);
console.log('PASS · dernière éligibilité et affectation unitaire protégées dans le paramétrage');

const {targetPlan, participantsOf, projectCatalog} = await import('../server/targeting.mjs');
const {upgradeDemo} = await import('../server/model.mjs');
const net = example();
assert.equal(net.stores.length,900);
assert(net.stores.every(t=>t.name.startsWith('Nanotera ')));
const firstGroup = {id:'hyper-ouest',name:'Hypers du centre commercial',version:'V3',rule:'free',
  criteria:{format:['Hypermarché'],region:['Bretagne','Normandie'],zone:['Centre commercial']}};
const impacts=targetPlan(net.stores,[firstGroup,...net.targetGroups]);
const matching=net.stores.filter(t=>t.format==='Hypermarché' && ['Bretagne','Normandie'].includes(t.region) && t.zone==='Centre commercial');
assert(matching.length>1 && matching.length<300);
assert.equal(impacts.counts[0].assigned,matching.length);
assert.equal(impacts.counts[2].assigned,300-matching.length);
assert.equal(impacts.assignments.size,900);
const managerState=(await call('/read',manager))[1];
const applied=(await call('/change',manager,{revision:managerState.revision,action:'targeting',payload:{groups:[firstGroup]}}))[1];
assert.equal(participantsOf(applied.state).length,matching.length);
assert.equal((await call('/read',inv.key))[0],403);
assert.equal((await call('/invite',manager,{store:'m01'}))[0],422);
assert.equal((await call('/read',participantTwo.key))[1].state.stores[0].assigned,'V3');
assert.equal((await call('/read',participantTwo.key))[1].state.replies.m02.confirmed,false);
assert.deepEqual((await call('/read',participantTwo.key))[1].state.products.map(p=>p.name),['Champagne brut']);
assert.equal((await call('/change',manager,{revision:applied.revision,action:'targeting',payload:{groups:[firstGroup]}}))[1].revision,applied.revision);
assert.equal((await call('/change',manager,{revision:applied.revision,action:'targeting',payload:{groups:[{...firstGroup,criteria:{...firstGroup.criteria,region:['Introuvable']}}]}}))[0],422);
const old=example();delete old.networkEdition;delete old.targetGroups;old.stores=old.stores.slice(0,10);
old.op.network='Magasins U';old.stores[0].name='Super U Démo 01';old.stores[0].assigned='V3';old.replies.m01={...blank('V3'),yn:'yes',confirmed:true};
const migrated=upgradeDemo(old);
assert.equal(migrated.stores.length,900);assert.equal(migrated.op.network,'Nanotera');assert(migrated.replies.m01.confirmed);assert.equal(migrated.stores[0].assigned,'V3');
const demoData=projectCatalog({operations:[{id:'u-2649-pbs',nom:'Carte U',enseignes:['Super U']}],magasins:[],supports:[],produits:[],engagements:[{id:'u-2649-pbs'}]},false);
assert.equal(demoData.magasins.length,900);assert(!/Super U|Carte U/.test(JSON.stringify(demoData)));
console.log('PASS · réseau Nanotera de 900 · exemple multi-critères '+matching.length+' magasins · priorités, persistance, accès et migration');

const photo={kind:'image',label:'Photo de face',url:'https://studio.example/face.webp'};
const fresh=(await call('/read',manager))[1];
const attached=(await call('/change',manager,{revision:fresh.revision,action:'productMedia',payload:{id:'s49-05',media:[photo]}}))[1];
assert.deepEqual(attached.state.products.find(p=>p.id==='s49-05').media[0],photo);
assert.deepEqual((await call('/read',participantTwo.key))[1].state.products[0].media,[photo]);
assert.equal((await call('/change',participantTwo.key,{revision:attached.revision,action:'productMedia',payload:{id:'s49-05',media:[]}}))[0],403);
assert.equal((await call('/change',manager,{revision:attached.revision,action:'productMedia',payload:{id:'s49-05',media:[{...photo,url:'javascript:alert(1)'}]}}))[0],422);
console.log('PASS · médias PIM persistants, accès magasin et validation du lien');

const serial=async token=>(await call('/read',token))[1].revision;
const edChange=async(token,action,payload,revision)=>call('/change',token,{action,payload,revision:revision??await serial(token)});
const bId='bd-ecatalogue';
const box={id:bId,step:'place',block:'bd-06',page:2,x:15,y:22,w:36,h:24};
const baseRev=await serial(bricoToken);
assert.equal((await edChange(bricoToken,'layout',box))[0],200);
assert.equal((await edChange(bricoToken,'layout',{...box,x:60},baseRev))[0],409);
assert.equal((await edChange(bricoToken,'layout',{...box,w:120}))[0],422);
assert.equal((await edChange(bricoToken,'submitLayout',{id:bId}))[0],200);
const [,ticket]=await call('/review-invite',bricoToken,{id:bId});
const [,limited]=await call('/read',ticket.key);
assert.equal(limited.role,'relecteur');
assert.deepEqual(Object.keys(limited.state).sort(),['op','supports']);
assert.equal((await call('/file',ticket.key,{id:'outside'}))[0],403);
assert.equal((await call('/review-invite',ticket.key,{id:bId}))[0],403);
assert.equal((await edChange(ticket.key,'layout',box))[0],403);
const note={id:bId,step:'add',noteId:crypto.randomUUID(),revision:2,page:2,x:27,y:42,author:'Relecture',text:'Vérifier le prix.'};
assert.equal((await edChange(ticket.key,'annotation',{...note,id:'autre'}))[0],403);
assert.equal((await edChange(ticket.key,'annotation',note))[0],200);
const written=await serial(ticket.key);
assert.equal((await edChange(ticket.key,'annotation',note))[0],200);
assert.equal(await serial(ticket.key),written);
assert.equal((await edChange(bricoToken,'support',{id:bId,step:'Validé'}))[0],422);
assert.equal((await edChange(bricoToken,'layout',{...box,x:31}))[0],200);
assert.equal((await call('/read',ticket.key))[1].state.supports[0].proofs.find(p=>p.revision===2).blocks.find(b=>b.id==='bd-06').x,15);
assert.equal((await edChange(bricoToken,'submitLayout',{id:bId}))[0],200);
const [,reviewAfter]=await call('/read',ticket.key);
assert.equal(reviewAfter.state.supports[0].revision,3);
assert.equal(reviewAfter.state.supports[0].comments[0].revision,2);
assert.equal(reviewAfter.state.supports[0].proofs.find(p=>p.revision===3).blocks.find(b=>b.id==='bd-06').x,31);
assert.equal((await edChange(ticket.key,'annotation',{...note,noteId:crypto.randomUUID()}))[0],409);
console.log('PASS BAT partagé limité au support, révisions figées, conflits concurrents et commentaires idempotents.');
