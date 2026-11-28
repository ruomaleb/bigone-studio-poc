import {formats, currentProof, kitDemand, storeKits} from './kit.mjs';
import {required} from './model.mjs';

export async function storeRender(db,row,s,p) {
  const output=kitDemand(s).outputs.find(x=>x.signature===p.signature);
  required(output,'La demande a changé. Actualisez les rendus.',409);
  if(currentProof(s.kit,output.signature)) return;
  required(p.revision===row.revision,'Le dossier a été modifié. Actualisez le kit.',409);
  required(typeof p.content==='string' && p.content.length>=60 && p.content.length%4===0 && p.content.length<=1300000 && /^[A-Za-z0-9+/]+={0,2}$/.test(p.content),'PNG absent ou supérieur à la capacité du pilote.');
  const bytes=Uint8Array.from(atob(p.content.slice(0,32)),c=>c.charCodeAt(0));
  const dim=formats[output.spec.format];
  required(bytes.length===24 && bytes.slice(0,8).join(',')==='137,80,78,71,13,10,26,10' &&
    new DataView(bytes.buffer).getUint32(16)===dim.width && new DataView(bytes.buffer).getUint32(20)===dim.height,'Dimensions PNG incorrectes.');
  const binary=Uint8Array.from(atob(p.content),c=>c.charCodeAt(0));
  required(new TextDecoder().decode(binary.subarray(12,16))==='IHDR' && new TextDecoder().decode(binary.subarray(-8,-4))==='IEND','PNG incomplet.');
  const digest=await crypto.subtle.digest('SHA-256',binary);
  const sha256=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
  const id=crypto.randomUUID();
  // A different price or template creates a new proof without changing earlier files.
  const generation=s.kit.proofs.filter(f=>f.spec.format===output.spec.format && output.shops.some(t=>f.shops.includes(t.id)));
  const revision=1+generation.reduce((a,f)=>Math.max(a,f.revision),0);
  const name=[output.spec.product,output.spec.format,output.spec.cents,'R'+revision,id.slice(0,8)].join('-')+'.png';
  s.kit.proofs.push({id,name,sha256,revision,signature:output.signature,spec:output.spec,shops:output.shops.map(t=>t.id),at:new Date().toISOString(),approved:null,notes:[]});
  const changes=await db.batch([
    db.prepare('UPDATE workspaces SET document=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(s),row.id,row.revision),
    db.prepare('INSERT INTO files(id,workspace,support_id,revision,name,mime,content) SELECT ?,?,?,?,?,?,? WHERE changes()=1').bind(id,row.id,'kit-gaia',revision,name,'image/png',p.content)
  ]);
  required(changes[0].meta.changes===1,'Modification simultanée. Actualisez avant de reprendre.',409);row.revision++;
}
export async function readRender(db,row,s,id,scope) {
  required(s.kit && s.kit.proofs.some(f=>f.id===id),'Épreuve indisponible.',404);
  if(scope)required(storeKits(s,scope).some(d=>d.files.some(f=>f.id===id)),'Ce fichier ne fait pas partie de votre remise.',403);
  const result=await db.prepare('SELECT name,mime,content FROM files WHERE id=? AND workspace=? AND support_id=?').bind(id,row.id,'kit-gaia').first();
  required(result,'Fichier indisponible.',404);return result;
}
