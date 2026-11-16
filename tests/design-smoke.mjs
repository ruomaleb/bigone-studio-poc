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
const context=vm.createContext({document,location,window:{addEventListener(){}},localStorage:{getItem(){return null}},console,setTimeout,clearTimeout,URL,URLSearchParams,Date});
vm.runInContext(js,context);
const run=s=>vm.runInContext(s,context);
run(`S.operations.push({id:'qa-design',nom:'Opération <test> & prix',reseau:'Réseau QA',debut:'2027-01-05',fin:'2027-01-17',brief:{objectif:'Trafic',responsable:'QA'}});cur='qa-design';status='ok';`);
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
location.hash='#administration--inconnue';
assert.equal(run('route().tab'),'magasins');
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
console.log(JSON.stringify({result:'PASS',checks:'5 onglets préparation, continuité production, 4 rubriques administration, routes inconnues, états vides, données échappées, assets locaux',contrast:ratios},null,2));
