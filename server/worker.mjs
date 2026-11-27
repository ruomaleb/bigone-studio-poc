import {
  example,
  bricoExample,
  importRows,
  upgradeDemo,
  forRole,
  mutate,
  required
} from './model.mjs';
import {
  answer
} from './assistant.mjs';
const pages = 'https://ruomaleb.github.io';
const keyPattern = /^[a-f0-9]{64}$/;
const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), n => n.toString(16).padStart(2,
  '0')).join('');
const token = () => crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
const day = () => new Date().toISOString().slice(0, 10);
async function quota(db, key, limit) {
  const r = await db.prepare('INSERT INTO counters(label,n) VALUES(?,1) ON CONFLICT(label) DO UPDATE SET n=n+1 WHERE n<? RETURNING n').bind(day() + ':' + key,
    limit).first();
  return !!r;
}

function sessionStmt(db, d, w, s) {
  return db.prepare("INSERT INTO sessions(digest,workspace,store_id,expires) VALUES(?,?,?,datetime('now','+60 days'))").bind(d, w, s)
}
async function openSession(req, env, p) {
  const key = req.headers.get('Authorization')?.slice(7) || '';
  required(keyPattern.test(key), 'Session invalide.', 401);
  const digest = await hash(key),
    db = env.DB;
  const prior = await db.prepare("SELECT workspace FROM sessions WHERE digest=? AND expires>CURRENT_TIMESTAMP").bind(digest).first();
  if (prior) return {
    workspace: prior.workspace
  };
  const ip = await hash(req.headers.get('CF-Connecting-IP') || 'local');
  required(await quota(db, 'start-' + ip.slice(0, 20), 40), 'Limite de création journalière atteinte.', 429);
  const linked = typeof p.code === 'string' && p.code.length > 0 && p.code.length <= 256;
  let s, w;
  if (linked) {
    const headers = {
      apikey: env.PUBLIC_KEY,
      Authorization: 'Bearer ' + env.PUBLIC_KEY,
      'Content-Type': 'application/json'
    };
    const res = await fetch(env.CATALOG + '/rest/v1/rpc/studio_write2', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        p_code: p.code,
        p_op: 'check'
      })
    });
    const access = await res.json();
    required(res.ok && access?.ok === true && access.role === 'responsable', 'Accès Responsable Studio requis.', 403);
    required(typeof p.operation === 'string' && /^[\w-]{1,100}$/.test(p.operation), 'Opération invalide.');
    w = 'shared:' + p.operation;
    const existing = await db.prepare('SELECT id FROM workspaces WHERE id=?').bind(w).first();
    if (!existing) {
      const query = async suffix => {
        const r = await fetch(env.CATALOG + '/rest/v1/docs?select=col,id,data&order=col,id&' + suffix, {
          headers
        });
        required(r.ok, 'Catalogue Studio indisponible.', 503);
        return r.json()
      };
      const id = encodeURIComponent(p.operation);
      const [meta, related] = await Promise.all([query('col=in.(operations,engagements)&id=eq.' + id), query(
        'col=in.(produits,supports,taches)&data->>op=eq.' + id)]);
      const keys = Object.keys(meta.find(x => x.col === 'engagements')?.data || {}).filter(x => /^[a-zA-Z0-9_-]+$/.test(x));
      const groups = [];
      for (let i = 0; i < keys.length; i += 100) groups.push(query('col=eq.magasins&id=in.(' + keys.slice(i, i + 100).join(',') + ')'));
      const planIds = [p.operation, ...related.filter(x => x.col === 'supports').map(x => x.id)].filter(x => /^[a-zA-Z0-9_-]+$/.test(x));
      for (let i = 0; i < planIds.length; i += 100) groups.push(query('col=eq.chemins&id=in.(' + planIds.slice(i, i + 100).join(',') + ')'));
      s = importRows([...meta, ...related, ...(await Promise.all(groups)).flat()], p.operation);
    }
  } else {
    required(!p.operation || ['bd-2704-deco','u-2649-pbs'].includes(p.operation), 'Ouvrez cette opération avec votre accès enseigne.', 403);
    s = p.operation === 'u-2649-pbs' ? example() : bricoExample();
    w = crypto.randomUUID()
  }
  const stmt = [];
  if (s) stmt.push(db.prepare('INSERT OR IGNORE INTO workspaces(id,document) VALUES(?,?)').bind(w, JSON.stringify(s)));
  stmt.push(sessionStmt(db, digest, w, null));
  await db.batch(stmt);
  return {
    workspace: w
  };
}
async function dispatch(req, env) {
  const url = new URL(req.url),
    path = url.pathname;
  if (path === '/health') return {
    version: '2026-11-27.7',
    ok: true
  };
  required(req.method === 'POST', 'Méthode indisponible.', 405);
  const body = await req.text();
  required(body.length < (path === '/upload' ? 1420000 : 120000), 'Demande trop volumineuse.', 413);
  let p;
  try {
    p = JSON.parse(body || '{}')
  } catch {
    required(false, 'Format JSON invalide.', 400)
  }
  if (path === '/session') return openSession(req, env, p);
  const key = req.headers.get('Authorization')?.replace(/^Bearer /, '') || '';
  required(keyPattern.test(key), 'Accès requis.', 401);
  const row = await env.DB.prepare(
      'SELECT w.id,w.revision,w.document,t.store_id FROM sessions t JOIN workspaces w ON w.id=t.workspace WHERE t.digest=? AND t.expires>CURRENT_TIMESTAMP')
    .bind(await hash(key)).first();
  required(row, 'Accès expiré ou inconnu.', 401);
  const s = upgradeDemo(JSON.parse(row.document)),
    scope = row.store_id;
  if (scope) required(s.stores.some(t=>t.id===scope && t.targeted!==false), 'Ce point de vente ne fait pas partie du ciblage.', 403);
  const view = () => ({
    state: forRole(s, scope),
    revision: row.revision,
    role: scope ? 'magasin' : 'enseigne',
    workspace: row.id
  });
  if (path === '/read') return view();
  if (path === '/invite') {
    required(!scope, 'Accès enseigne requis.', 403);
    required(s.stores.some(x => x.id === p.store && x.targeted !== false), 'Magasin absent.');
    const k = token();
    await sessionStmt(env.DB, await hash(k), row.id, p.store).run();
    return {
      key: k
    }
  }
  if (path === '/file') {
    required(!scope, 'Accès enseigne requis.', 403);
    const f = await env.DB.prepare('SELECT name,mime,content FROM files WHERE id=? AND workspace=?').bind(String(p.id), row.id).first();
    required(f, 'Fichier absent.', 404);
    return f;
  }
  if (path === '/upload') {
    required(!scope, 'Accès enseigne requis.', 403);
    required(!s.op.closed, 'Dossier clôturé.', 409);
    const x = s.supports.find(y => y.id === p.id);
    required(x, 'Support absent.');
    required(!['Validé', 'En revue', 'Remis'].includes(x.state), 'Ouvrez une nouvelle révision.');
    required(typeof p.content === 'string' && p.content.length <= 1400000 && p.content.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(p.content),
      'Fichier incorrect ou supérieur à 1 Mo.');
    const head = atob(p.content.slice(0, 16));
    const mime = head.startsWith('%PDF-') ? 'application/pdf' : head.startsWith('\x89PNG\r\n') ? 'image/png' : head.startsWith('\xff\xd8\xff') ?
      'image/jpeg' : '';
    required(mime, 'Utilisez un document PDF ou une image PNG/JPEG.');
    required(row.revision === p.revision, 'Le dossier a été modifié. Actualisez avant le dépôt.', 409);
    const fid = crypto.randomUUID(),
      name = String(p.name || 'BAT').slice(0, 120);
    x.attachment = {
      id: fid,
      name,
      mime
    };
    x.file = '';
    s.audit.push({
      at: new Date().toISOString(),
      action: 'upload',
      actor: 'Enseigne'
    });
    const result = await env.DB.batch([env.DB.prepare('UPDATE workspaces SET document=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(
      s), row.id, row.revision), env.DB.prepare(
      'INSERT INTO files(id,workspace,support_id,revision,name,mime,content) SELECT ?,?,?,?,?,?,? WHERE changes()=1').bind(fid, row.id, x.id, x
      .revision, name, mime, p.content)]);
    required(result[0].meta.changes === 1, 'Modification simultanée. Actualisez le dossier.', 409);
    row.revision++;
    return view();
  }
  if (path === '/ask') {
    required(typeof p.question === 'string' && p.question.trim().length && p.question.length <= 600, 'Question vide ou trop longue.');
    const budget = await quota(env.DB, 'assistant:' + row.id, 35) && await quota(env.DB, 'assistant-global', 80);
    return answer(env, forRole(s, scope), scope, p, budget)
  }
  required(path === '/change', 'Page inconnue.', 404);
  const changed = mutate(s, p.action, p.payload || {}, scope);
  if (!changed) return view();
  required(row.revision === p.revision, 'Une autre personne a modifié le dossier. Rechargez avant de reprendre votre saisie.', 409);
  const r = await env.DB.prepare('UPDATE workspaces SET document=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(s), row.id, row
    .revision).run();
  required(r.meta.changes === 1, 'Modification simultanée. Rechargez le dossier.', 409);
  row.revision++;
  return view();
}
export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin'),
      headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Vary': 'Origin',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type'
      };
    if (origin === pages || (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '') && env.DEV === 'true')) headers['Access-Control-Allow-Origin'] =
      origin;
    if (origin && !headers['Access-Control-Allow-Origin']) return new Response('Origine non autorisée', {
      status: 403,
      headers
    });
    if (req.method === 'OPTIONS') return new Response(null, {
      status: 204,
      headers
    });
    try {
      return new Response(JSON.stringify(await dispatch(req, env)), {
        headers
      })
    } catch (e) {
      return new Response(JSON.stringify({
        error: e.status ? e.message : 'Le serveur n’a pas pu traiter cette demande.'
      }), {
        status: e.status || 500,
        headers
      })
    }
  }
};
