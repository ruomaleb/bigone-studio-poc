import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Contrôles sans réseau : navigation d'un même dossier, écrans vides,
// échappement des données et contraste des textes de l'interface.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/studio.css'),'utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const node={addEventListener(){},querySelector(){return node},focus(){},setAttribute(){},removeAttribute(){}};
const document={querySelector(){return node},querySelectorAll(){return []},addEventListener(){},title:''};
const location={hash:'#accueil'};
const context=vm.createContext({document,location,window:{addEventListener(){},history:{replaceState(_state,_title,hash){location.hash=hash}}},localStorage:{getItem(){return null}},console,setTimeout,clearTimeout,URL,URLSearchParams,Date});
vm.runInContext(js,context);
const run=s=>vm.runInContext(s,context);
run(`S.operations.push({id:'qa-design',nom:'Opération <test> & prix',reseau:'Réseau QA',debut:'2027-01-05',fin:'2027-01-17',brief:{objectif:'Trafic',responsable:'QA'}});cur='qa-design';status='ok';`);
assert.equal(run("banner()"),'');
assert.equal(run("src('demo')"),'');
assert.ok(run("src('public')").includes('Relevé public'));
assert.equal(html.match(/data-act="code"/g)?.length,1);
assert.ok(html.includes('aria-controls="acces-dialog"'));
assert.ok(!run("vAdministration('droits')").includes('prototype'));
for(const tab of ['cadrage','offres','magasins','dispositif','calendrier']){
  location.hash='#preparation--qa-design--'+tab;
  assert.equal(run('route().tab'),tab);
  const page=run(`vPreparation('${tab}')`);
  assert.ok(page.includes('Opération &lt;test&gt; &amp; prix'));
  assert.ok(page.includes('#production--qa-design'));
  assert.ok(page.includes('id="opsel"'));
}
location.hash='#production--qa-design';
assert.equal(run('route().v'),'production');
assert.ok(run('vProduction()').includes('#preparation--qa-design--cadrage'));
for(const tab of ['magasins','modeles','droits','connexions']){
  location.hash='#administration--'+tab;
  assert.equal(run('route().tab'),tab);
  assert.ok(run(`vAdministration('${tab}')`).includes('<h1>Administration</h1>'));
  assert.equal(run('cur'),'qa-design','Administration doit conserver le dossier sélectionné');
}
// Une priorité BAT doit mener à la bonne variante, même après un rechargement.
run(`S.supports.push({id:'meta-id',op:'qa-design',type:'Bannières Meta',prod:true,statut:'bat',bat:2,rev:2});`);
assert.ok(run('vAccueil()').includes('#production--qa-design--support-meta-id'));
location.hash='#production--qa-design--support-meta-id';
assert.ok(run('vProduction(route().tab)').includes('Préparer le paquet Media'));
location.hash='#production--qa-design--support-inconnu';
assert.ok(run('vProduction(route().tab)').includes('Ce support est indisponible'));
assert.ok(run(`matchesOperation(curOp(),'reseau qa')`));
run(`S.supports[0].perime=true;`);
assert.ok(!run(`actions(curOp()).some(action=>action.t==='Examiner le BAT 2')`));
run('S.supports.length=0');
location.hash='#administration--inconnue';
assert.equal(run('route().tab'),'magasins');
location.hash='#pilotage';
assert.equal(run('route().v'),'accueil','L’ancien lien doit ouvrir le planning dans l’accueil');
assert.equal(location.hash,'#accueil');
assert.equal(run('planningOpen'),true);
location.hash='#inconnue';
assert.equal(run('route().v'),'accueil');
run("S.operations.length=0;cur='qa-design';status='loading'");
assert.equal(run('curOp()'),null);
assert.equal(run('cur'),'qa-design','Le chargement ne doit pas effacer le dossier mémorisé');
run("status='ok';cur=null");
assert.ok(run(`vPreparation('cadrage')`).includes('Créer une opération'));
assert.ok(run('vProduction()').includes('Ouvrir la préparation'));
assert.ok(run('vAccueil()').includes('Aucun dossier ouvert'));

const lum=hex=>{const rgb=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
const ratios=[];
for(const [fg,bg] of [['111721','ffffff'],['626571','ffffff'],['626571','f5f5fb'],['7440dd','ffffff'],['7440dd','f4f0ff'],['033fe2','eef3ff'],['236842','eaf5ed'],['994d0c','fff4e6'],['b42336','fff0f2'],['ffffff','111721']]){
 const a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert.ok(ratio>=4.5,`${fg}/${bg}: ${ratio}`);ratios.push({foreground:'#'+fg,background:'#'+bg,ratio:+ratio.toFixed(2)});
}
for(const file of ['bigone-logo.png','fonts/gilmer-400.otf','fonts/gilmer-700.otf','fonts/diagramm-700.otf'])assert.ok(fs.statSync(path.join(root,'assets',file)).size>1000);
assert.ok(!html.includes('fonts.googleapis.com'));
assert.ok(!css.includes('#c2185b'));

// Une approbation doit porter sur les valeurs du BAT et respecter les prix locaux.
run(`S.operations.push({id:'op',nom:'Printemps',reseau:'Horizon',enseignes:['Jardin Horizon'],
  debut:'2027-03-01',fin:'2027-03-15',brief:{objectif:'Trafic',client:'Pilote enseigne'}});
  S.produits.push({id:'produit',op:'op',libelle:'Jardinière',prix:24.9});
  const national={id:'affiche',op:'op',type:'Affiche',statut:'bat',rev:1,fichier:'V1.pdf',destinataire:'Pilote',checks:sansCoche()};
  const local={...national,id:'locale',groupe:'affiche',prixVar:{produit:19.9}};
  S.supports.push(national,local);
  for(const s of [national,local])s.instantane=snapshot(s);`);
assert.match(run("refusStat(national,'bat')"),/Prix et libellés/);
assert.ok(run("briefComplet(opById('op').brief)"));
assert.ok(run("matchesOperation(opById('op'),'jardin horizon')"));
assert.ok(run("matchesOperation(opById('op'),'pilote enseigne')"));
assert.ok(run("!manquants(national,'valide').includes('PDF de comparaison relu')"));
assert.ok(run("manquants({...national,rev:2},'valide').includes('PDF de comparaison relu')"));
run("S.produits[0].prix=22.9; national.checks=Object.fromEntries(CHECKS.map(([k])=>[k,true]));");
for(const action of ['bat','valide','livre']){
  assert.match(run(`refusStat(national,'${action}')`),/nouvelle révision/);
}
assert.equal(run("revisionRequise(local)"),false);
assert.equal(run("national.instantane[0].prix"),24.9);
run("national.statut=local.statut='livre'");
assert.match(run("refusCloture(opById('op')).join(' ')"),/Nouvelle révision requise/);
assert.ok(run("fichierHtml('V1.pdf').includes('nom de fichier')"));
assert.ok(run("!fichierHtml('javascript:alert(1)').includes('<a ')"));
assert.ok(run("fichierHtml('https://example.org/affiche.pdf').includes('<a ')"));

console.log(JSON.stringify({result:'PASS',checks:'5 onglets préparation, continuité production, 4 rubriques administration, routes inconnues, états vides, données échappées, assets locaux',contrast:ratios},null,2));
