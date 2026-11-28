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
vm.runInContext(fs.readFileSync(path.join(root,'assets/list-filters.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'assets/visuels.js'),'utf8'),context);
vm.runInContext(js,context);
vm.runInContext("imagesDepart.set('atelier','data:image/png;base64,AA=='); imagesDepart.set('fleurs','data:image/png;base64,AA==')",context);
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
assert.ok(!run('vAccueil()').includes('id="priority-filter"'));
run('suiviOpen=true');
assert.ok(run('vAccueil()').includes('#production--qa-design--support-meta-id'));
run('suiviOpen=false');
location.hash='#production--qa-design--support-meta-id';
assert.ok(run('vProduction(route().tab)').includes('Préparer le paquet Media'));
location.hash='#production--qa-design--support-inconnu';
assert.ok(run('vProduction(route().tab)').includes('Ce support est indisponible'));
assert.ok(run(`matchesOperation(curOp(),'reseau qa')`));
run(`S.supports[0].perime=true;`);
assert.ok(!run(`actions(curOp()).some(action=>action.t==='Examiner le BAT 2')`));
const target=(tab,id,revision)=>new URL(run(`dossierUrl(curOp(),${JSON.stringify(tab)},${JSON.stringify(id)},${JSON.stringify(revision)})`),'https://studio.test/');
assert.equal(target('cadrage').hash,'#informations');
assert.equal(target('calendrier').hash,'#informations?jalons=1');
assert.equal(target('magasins','m01').hash,'#participants?id=m01');
assert.equal(target('offres','p02').hash,'#produits?id=p02');
assert.equal(target('production','meta-id','rev-1').hash,'#production?id=meta-id&revision=1');
run("S.supports.push({id:'export-fixture',op:'qa-design',type:'Flux Bonial'})");
assert.equal(target('production','export-fixture').hash,'#flux?id=export-fixture');
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
for(const file of ['preparation.webp','produits.webp','production.webp','bigone-logo.png','fonts/gilmer-400.otf','fonts/gilmer-700.otf','fonts/diagramm-700.otf'])assert.ok(fs.statSync(path.join(root,'assets',file)).size>1000);
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

// Les recherches mènent au dossier, au document et à la révision correspondants.
run(`S.operations.push({id:'clos',nom:'Automne',cloture:true,debut:'2026-09-01',fin:'2026-09-10'});
  S.produits.push({id:'autre',op:'clos',libelle:'Jardinière',ref:'ARC-91',prix:18});
  national.archives=[{rev:1,fichier:'https://example.org/Catalogue%20archive.pdf'}];
  national.rev=2;national.fichier='https://example.org/Affiche-final.pdf';
  S.supports.push({id:'prep',op:'op',type:'Prospectus',prod:false,remise:'2027-03-02'})`);
assert.equal(run("contentItems('produits','').length"),0);
assert.equal(run("contentItems('produits','clos').filter(r=>matchesContent(r,'arc-91'))[0].href"),'#preparation--clos--offres--autre');
assert.equal(run("contentItems('produits','op').filter(r=>matchesContent(r,'arc-91')).length"),0);
assert.equal(run("contentItems('supports','op').filter(r=>matchesContent(r,'Prospectus'))[0].href"),'#preparation--op--dispositif--prep');
assert.equal(run("contentItems('assets','op').filter(r=>matchesContent(r,'Prospectus')).length"),0);
assert.equal(run("contentItems('assets','op').filter(r=>matchesContent(r,'catalogue archive'))[0].href"),'#production--op--support-affiche--rev-1');
location.hash='#preparation--clos--offres--autre';
assert.ok(run("vPreparation(route().tab,route().context)").includes('18,00 €'));
location.hash='#preparation--op--offres--autre';
assert.ok(run("vPreparation(route().tab,route().context)").includes('Ce produit est indisponible'));
location.hash='#production--op--support-affiche--rev-1';
assert.match(run("vProduction(route().tab,route().context)"),/Catalogue%20archive.pdf/);
assert.ok(!run("vProduction(route().tab,route().context)").includes('Affiche-final.pdf'));
location.hash='#preparation--inconnue--offres--produit';
assert.equal(run('route().v'),'absent');
location.hash='#contenus--produits?q=ARC-91&op=clos';
assert.equal(run('route().tab'),'produits');
assert.ok(run('vDirectory(route().tab)').includes('#preparation--clos--offres--autre'));
location.hash='#accueil?q=ARC-91';
assert.ok(!run('vAccueil()').includes('#preparation--clos--offres--autre'));
// Les filtres sont propres à leur liste et se combinent avec la recherche et le tri.
run(`const filterRows=[
  {name:'Lot 10',rayon:'Jardin',marque:'Atelier',prix:null,magasin:['a','b']},
  {name:'Lot 2',rayon:'Jardin',marque:'Atelier',prix:2,magasin:['a']},
  {name:'Lot 15',rayon:'Jardin',marque:'Atelier',prix:100,magasin:['b']},
  {name:'Meuble',rayon:'Maison',marque:'Mobilier',prix:5,magasin:[]}
];`);
location.hash='#contenus--produits?rayon=Jardin&marque=Atelier&tri=prixDesc';
const filtered=run("filterList(filterRows,['rayon','marque'],['nom','prix','prixDesc'])");
assert.deepEqual(Array.from(filtered.visible,r=>r.name),['Lot 15','Lot 2','Lot 10']);
assert.ok(!filtered.toolbar.includes('Mobilier'));
location.hash='#accueil?plan-tri=nomDesc&magasin=b';
assert.deepEqual(Array.from(run("filterList(filterRows,['magasin'],['nom','nomDesc']).visible"),r=>r.name),['Lot 10','Lot 15']);
assert.equal(run("filterList(filterRows,[],['nom','nomDesc'],{prefix:'plan-'}).visible[0].name"),'Meuble');
location.hash='#contenus--assets?version=Archivée';
assert.equal(run("filterList(contentItems('assets','op'),contentFilters.assets,contentSorts.assets).visible[0].href"),'#production--op--support-affiche--rev-1');
location.hash='#contenus--produits?op=op&rayon=Inexistant';
assert.match(run("vDirectory('produits')"),/Aucun résultat avec ces filtres/);
// Le même ensemble filtré ouvre les mêmes fiches dans les deux affichages.
location.hash='#contenus--produits?op=clos&tri=prix&vue=liste';
const productList=run("vDirectory('produits')");
assert.match(productList,/<table class="product-table"/);
assert.match(productList,/href="#preparation--clos--offres--autre"/);
assert.ok(!productList.includes('#preparation--op--offres--produit'));
assert.match(productList,/data-product-id="autre" data-operation-id="clos" aria-haspopup="dialog"/);
assert.match(productList,/Réf. ARC-91/);
assert.match(productList,/18,00 €/);
location.hash=location.hash.replace('vue=liste','vue=cartes');
assert.match(run("vDirectory('produits')"),/content-row object-card/);
assert.match(run("vDirectory('produits')"),/data-product-id="autre" data-operation-id="clos" aria-haspopup="dialog"/);
assert.ok(!run("productDetail(opById('clos'),'autre')").includes('data-prod="'));
location.hash='#contenus--assets?vue=liste';
assert.ok(!run("vDirectory('assets')").includes('data-product-view'));
for(const [hash,section] of [['#contenus--produits','produits'],['#production','assets'],['#produits','produits'],['#contenus--assets?op=inconnue','assets'],['#contenus--supports','supports']]){
  location.hash=hash;
  assert.equal(run('route().tab'),section);
  const screen=run('vDirectory(route().tab)');
  assert.match(screen,/Choisir une opération/);assert.doesNotMatch(screen,/Atelier visuel|Filtres et tri|Jardinière|Affiche-final|data-product-view/);
}
location.hash='#contenus--produits?op=clos';
assert.doesNotMatch(run("vDirectory('produits')"),/id="catalog-op"|data-reset-filters="op|#preparation--op--offres/);
assert.equal(run("contentItems('assets').length"),0);
location.hash='#contenus--assets?op=op';
assert.doesNotMatch(run("vDirectory('assets')"),/La nuit des ateliers|Le marché des fleurs/);
assert.match(run("galerieVisuelle(national)"),/La nuit des ateliers/);
// Depuis le support, la fiche conserve la sélection et les prix de la variante.
location.hash='#preparation--op--dispositif--locale';
const variantProducts=run("supportProducts(local,opById('op'))");
assert.match(variantProducts,/19,90 €/);
assert.match(variantProducts,/Prix local/);
assert.match(variantProducts,/data-product-id="produit" data-operation-id="op"/);
assert.doesNotMatch(variantProducts,/data-choix=|ARC-91/);
assert.match(run("supportProducts(national,opById('op'))"),/22,90 €/);
location.hash='#preparation--op--dispositif--locale?q=jardiniere';
assert.match(run("supportProducts(local,opById('op'))"),/data-product-id="produit"/);
location.hash='#preparation--op--dispositif--locale?rayon=Inexistant';
assert.match(run("supportProducts(local,opById('op'))"),/Aucun produit ne correspond/);
location.hash='#preparation--op--dispositif--affiche';
assert.match(run("supportProducts({...national,produits:[]},opById('op'))"),/Aucune offre sélectionnée/);
assert.match(run("supportProducts({...national,institutionnel:true},opById('op'))"),/aucune offre attendue/);
assert.match(run("tDispositif(opById('op'),'affiche')"),/<h1 id="support-name">/);
console.log(JSON.stringify({result:'PASS',checks:'5 onglets préparation, continuité production, 4 rubriques administration, routes inconnues, états vides, données échappées, assets locaux',contrast:ratios},null,2));

assert.equal(run("refVisuelle('atelier').pages.length"),1);
assert.equal(run("sourceVisuelle({ref:'inconnu',image:'javascript:alert(1)'})"),'');
assert.throws(()=>run("lireSelection('{}')"));
