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
  engage: 6,
  attente: 3,
  non: 1,
  heritage: 6,
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
assert.equal((await call('/session', manager))[0], 200);
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
