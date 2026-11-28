const {
  chromium
} = require('playwright'), {
  DatabaseSync
} = require('node:sqlite'), http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), {
  pathToFileURL
} = require('node:url');
const root = path.resolve(__dirname, '..'),
  api = 'https://bigone-studio-operations.github-46e.workers.dev';
async function checkWorkspaceStart(page) {
  const layout=await page.evaluate(()=>{
    const header=document.querySelector('.app-header,.mast').getBoundingClientRect();
    const menu=document.querySelector('#studio-rail').getBoundingClientRect();
    const start=document.querySelector('main').firstElementChild.getBoundingClientRect().top;
    return {gap:start-header.bottom,offset:Math.abs(start-menu.top),inset:menu.left};
  });
  assert(layout.gap>0 && layout.gap<=48,'Le contenu commence juste sous le bandeau.');
  assert(layout.offset<=1,'Le menu et le contenu démarrent au même niveau.');
  assert(layout.inset>0,'Le menu est détaché du bord de la fenêtre.');
}
async function testBricoDemo(p,c,rootUrl,record,env) {
    const catalogFetch = global.fetch;
    env.CATALOG = 'https://catalogue-test.invalid';
    const records = new Map();
    global.fetch = async (url, options) => {
      if (!String(url).startsWith(env.CATALOG)) return catalogFetch(url,options);
      const address = new URL(url);
      if (address.pathname.endsWith('/studio_write2')) return Response.json({ok:true,role:'responsable'});
      return Response.json([...records.values()].filter(row =>
        address.searchParams.get('id') === 'eq.'+row.id && row.col==='operations'));
    };
    await c.route('**/rest/v1/rpc/studio_write2',route=>{
      const {p_op,p_col,p_id,p_data}=route.request().postDataJSON();
      if (p_op==='set') records.set(p_id,{col:p_col,id:p_id,data:p_data});
      return route.fulfill({json:{ok:true,version:1,role:'responsable'}});
    });
    await c.route('**/assets/brico-deco/*.webp',route=>route.fulfill({
      path:path.join(root,'assets/brico-deco',path.basename(new URL(route.request().url()).pathname)),
      contentType:'image/webp'
    }));
    try {
      await p.setViewportSize({width:1440,height:900});
      await p.goto(rootUrl+'#accueil');
      await p.getByRole('button',{name:'Créer une opération',exact:true}).click();
      const creation=p.getByRole('dialog');
      await creation.getByLabel('Nom',{exact:true}).fill('Brico-déco · Recette');
      await creation.getByLabel('Réseau',{exact:true}).fill('Nanotera');
      await creation.getByLabel('Début de la période commerciale').fill('2027-01-19');
      await creation.getByLabel('Fin de la période commerciale').fill('2027-02-01');
      await creation.getByLabel('Modèle de dossier').selectOption('brico-demo');
      await creation.getByRole('button',{name:'Enregistrer'}).click();
      await p.getByRole('heading',{name:'Brico-déco · Recette',exact:true}).waitFor();
      const operation=new URL(p.url()).searchParams.get('op');
      assert(operation && operation!=='bd-2704-deco');
      assert.equal(records.get(operation).data.scenario,'brico-demo');
      await p.getByRole('link',{name:'Participants',exact:true}).click();
      await p.getByRole('heading',{name:'Versions de l’offre'}).waitFor();
      for (const count of [17,21,4]) assert(await p.getByRole('link',{name:count+' référence(s)',exact:true}).isVisible());
      await p.getByRole('button',{name:'Ouvrir les engagements'}).click();
      await p.getByRole('link',{name:'Tous',exact:true}).click();
      const firstRow=p.locator('#content tbody tr').first();
      await firstRow.getByRole('button',{name:'Accès magasin'}).click();
      const shop=await c.newPage();
      await shop.goto(await p.getByLabel('Lien du magasin').inputValue());
      const wizard=shop.frameLocator('.wizard');
      await wizard.getByRole('button',{name:'Consulter V2',exact:true}).click();
      await wizard.getByText(/SUSPENSION ZÉLIE · LAMPADAIRE ZÉLIE/).waitFor();
      await shop.close();
      await p.getByRole('button',{name:'Fermer',exact:true}).click();
      await p.getByRole('button',{name:'Actualiser les réponses'}).click();
      await firstRow.locator('td').nth(3).getByText('V2',{exact:true}).waitFor();
      assert.equal(await firstRow.locator('td').nth(4).innerText(),'—');
      await p.getByRole('button',{name:'Charger les réponses de démonstration'}).click();
      await p.waitForURL(/filtre=engagements/);
      assert.equal(await p.locator('#content tbody tr').count(),6);
      assert.match(await firstRow.locator('td').nth(3).innerText(),/V1/);
      assert.equal(await firstRow.locator('td').nth(4).innerText(),'V1');
      await p.setViewportSize({width:390,height:844});
      assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await p.setViewportSize({width:1440,height:900});
      await p.getByRole('navigation',{name:'Espaces Studio'}).getByRole('link',{name:'Produits'}).click();
      await p.getByRole('link',{name:'V1 · Luminaires et miroirs',exact:true}).click();
      await p.getByRole('link',{name:'LAMPE À POSER GAIA',exact:true}).click();
      await record.getByText('Star',{exact:true}).waitFor();
      await record.locator('.ps-stage img').evaluate(img=>img.decode());
      await record.getByRole('button',{name:'Modifier le produit'}).click();
      await record.getByLabel('Conditionnement').fill('1 pièce');
      await record.getByRole('button',{name:'Enregistrer la fiche'}).click();
      await record.getByText('1 pièce',{exact:true}).waitFor();
      await record.getByRole('button',{name:'Fermer la fiche produit'}).click();
      await p.getByRole('navigation',{name:'Espaces Studio'}).getByRole('link',{name:'Production'}).click();
      await p.getByRole('link',{name:'Chemin de fer',exact:true}).click();
      await p.getByRole('link',{name:/^Page 2/}).click();
      const gaia=p.locator('.ed-paper [data-block="bd-03"]');
      assert.equal(await gaia.count(),0);
      await p.locator('.ed-item[data-from="bd-03"]').dragTo(p.locator('.ed-paper'),{targetPosition:{x:50,y:110}});
      await gaia.waitFor();
      await p.getByRole('link',{name:'Aperçu E-catalogue'}).click();
      await p.getByRole('region',{name:'Aperçu E-catalogue'}).locator('.ed-paper [data-block="bd-03"]').waitFor();
      await p.getByRole('link',{name:'Chemin de fer',exact:true}).click();
      await p.getByRole('button',{name:'Transmettre au BAT'}).click();
      await gaia.click();
      await p.getByLabel('Signature').fill('Centrale Nanotera');
      await p.getByLabel('Correction demandée').fill('Agrandir le bloc Gaia.');
      await p.getByRole('button',{name:'Publier le commentaire'}).click();
      await p.getByText('Agrandir le bloc Gaia.',{exact:true}).waitFor();
      await p.getByRole('link',{name:'Chemin de fer',exact:true}).click();
      await gaia.click();
      const width=p.getByLabel('Largeur (%)');
      await width.fill('40');
      await p.getByRole('button',{name:'Appliquer',exact:true}).click();
      await p.waitForFunction(()=>document.querySelector('.ed-paper [data-block="bd-03"]').style.width==='40%');
      await p.getByRole('link',{name:'BAT collaboratif',exact:true}).click();
      await p.getByRole('button',{name:'Marquer résolu'}).click();
      await p.getByRole('link',{name:'Chemin de fer',exact:true}).click();
      await p.getByRole('button',{name:'Transmettre au BAT'}).click();
      await p.getByRole('button',{name:'Valider le BAT'}).click();
      await p.getByRole('button',{name:'Confirmer la décision'}).click();
      await p.locator('.ed-header').getByText(/Validé/).waitFor();
      await p.getByRole('link',{name:'Flux',exact:true}).click();
      await p.getByRole('link',{name:/^Bonial · V1/}).click();
      await p.getByRole('button',{name:'Contrôler',exact:true}).click();
      await p.getByRole('button',{name:'Générer le CSV'}).click();
      await p.getByText('Aperçu du CSV · 17 offres').click();
      await p.getByRole('row',{name:/GAIA.*1 pièce.*12,50.*V1/}).waitFor();
      const download = p.waitForEvent('download');
      await p.getByRole('button',{name:'Télécharger le fichier généré'}).click();
      const csv = fs.readFileSync(await (await download).path(),'utf8');
      assert.match(csv,/"bd-03";"LAMPE À POSER GAIA";"1 pièce";"12.5";"V1"/);
      await p.getByRole('button',{name:'Déposer le CSV en recette'}).click();
      await p.getByText(/Reçu de dépôt en recette · REC-/).waitFor();
      await p.reload();
      await p.getByText(/Reçu de dépôt en recette · REC-/).waitFor();
      await p.getByRole('link',{name:'← Mes flux'}).click();
      await p.getByRole('link',{name:/Bonial · V1 · Déposé en recette/}).waitFor();
      assert.equal(new URL(p.url()).searchParams.get('op'),operation);
      console.log('PASS création Brico-déco, consultation magasin et engagements, Gaia, aperçu et BAT, CSV Bonial et reçu de recette persistant');
    } finally {
      global.fetch = catalogFetch;
    }
}
(async () => {
  const mod = (await import(pathToFileURL(root + '/server/worker.mjs'))).default,
    db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(root + '/server/schema.sql', 'utf8'));
  class Q {
    constructor(q, a = []) {
      this.q = q;
      this.a = a
    }
    bind(...a) {
      return new Q(this.q, a)
    }
    first() {
      return db.prepare(this.q).get(...this.a)
    }
    run() {
      return {
        meta: db.prepare(this.q).run(...this.a)
      }
    }
  }
  const env = {
    DEV: 'true',
    DB: {
      prepare: q => new Q(q),
      batch: s => s.map(x => x.run())
    }
  };
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost'),
      p = path.join(root, u.pathname.endsWith('/') ? u.pathname + 'index.html' : u.pathname);
    try {
      const data = fs.readFileSync(p);
      res.writeHead(200, {
        'Content-Type': ({
          '.mjs': 'text/javascript',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.html': 'text/html',
          '.png': 'image/png', '.webp':'image/webp', '.pdf':'application/pdf',
          '.otf': 'font/otf'
        })[path.extname(p)] || 'application/octet-stream'
      });
      res.end(data)
    } catch {
      res.writeHead(404);
      res.end()
    }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = 'http://127.0.0.1:' + server.address().port + '/operation/';
  server.unref();
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined
  });
  try {
    const c = await browser.newContext({
      viewport: {
        width: 1850,
        height: 914
      },
      locale: 'fr-FR'
    });
    await c.route(api + '/**', async route => {
      const q = route.request();
      const r = await mod.fetch(new Request(q.url(), {
        method: q.method(),
        headers: q.headers(),
        body: q.method() === 'POST' ? q.postData() : undefined
      }), env);
      await route.fulfill({
        status: r.status,
        headers: Object.fromEntries(r.headers),
        body: await r.text()
      })
    });
    if(process.env.BRICO_ONLY){
      const p=await c.newPage(),rootUrl=url.replace('/operation/','/');
      p.setDefaultTimeout(7000);
      await c.route('**/rest/v1/docs?**',route=>route.fulfill({json:[]}));
      await c.addInitScript(()=>{localStorage.setItem('bos-code','fixture-test');localStorage.setItem('bos-role','responsable');});
      await testBricoDemo(p,c,rootUrl,p.locator('#product-dialog'),env);
      return;
    }
    await require('./pilot-interface.cjs')(c,url);
    if(process.env.PILOT_ONLY)return;
    const p = await c.newPage();
    p.setDefaultTimeout(7000);
    const errors = [];
    p.on('pageerror', err => errors.push(err.message));
    await p.goto(url+'?op=bd-2704-deco#flux?destination=%C3%89-catalogue');
    await p.getByRole('heading',{name:'Mes flux',exact:true}).waitFor();
    assert.equal(await p.getByLabel('Destination',{exact:true}).inputValue(),'E-catalogue');
    await p.getByRole('link',{name:/E-catalogue.*V1/}).click();
    await p.getByRole('heading',{name:'Flux E-catalogue'}).waitFor();
    assert.deepEqual(await p.locator('tbody tr td:first-child').allTextContents(),['NT-V1-SUD','NT-V1-OUEST']);
    assert(!(await p.locator('#content').innerText()).includes('EC-001'));
    await p.getByRole('link',{name:'Ouvrir le support E-catalogue'}).click();
    await p.getByRole('link',{name:'Flux',exact:true}).click();
    await p.getByRole('link',{name:/Bonial.*V1/}).click();
    await p.getByRole('link',{name:'Corriger dans le PIM'}).first().waitFor();
    await p.getByRole('link',{name:'← Mes flux'}).click();
    await p.locator('.flow-board').waitFor();
    await p.getByLabel('État du flux',{exact:true}).selectOption('À vérifier');
    await p.waitForURL(/statut=/);
    assert.deepEqual(await p.locator('.version-code').allTextContents(),['V1']);
    await p.getByRole('link',{name:/Bonial.*V1/}).click();
    await p.getByRole('link',{name:'← Mes flux'}).click();
    assert.equal(await p.getByLabel('État du flux',{exact:true}).inputValue(),'À vérifier');
    await p.getByRole('link',{name:'Réinitialiser'}).click();
    await p.getByRole('link',{name:'Réinitialiser'}).waitFor({state:'detached'});
    await p.getByLabel('Rechercher dans les flux').fill('ampoules');
    await p.getByRole('button',{name:'Filtrer',exact:true}).click();
    await p.waitForURL(/recherche=ampoules/);
    await p.locator('.version-code').filter({hasText:'V1'}).waitFor({state:'detached'});
    assert.deepEqual(await p.locator('.version-code').allTextContents(),['V3']);
    await p.getByLabel('Validité',{exact:true}).fill('2020-01-01');
    await p.getByText('Aucun flux pour ces critères.').waitFor();
    await p.getByRole('link',{name:'Effacer les filtres'}).click();
    await p.getByRole('link',{name:'Version',exact:true}).click();
    await p.waitForURL(/tri=-version/);
    await p.locator('th[aria-sort=descending]').waitFor();
    assert.deepEqual(await p.locator('.version-code').allTextContents(),['V3','V2','V1']);
    await p.goto(url+'?op=u-2649-pbs#flux');
    await p.locator('.flow-board').waitFor();
    assert.equal(await p.locator('.flow-head').allTextContents().then(cols=>cols.join()),'Bonial,Tiendeo');
    await p.getByRole('link',{name:/Tiendeo.*V2/}).click();
    await p.getByRole('heading',{name:'Tiendeo'}).waitFor();
    await p.goto(url+'?op=bd-2704-deco#participants?filtre=confirmed');
    await p.getByRole('heading',{name:'Participants',exact:true}).waitFor();
    await checkWorkspaceStart(p);
    assert.equal(await p.locator('#content a[href="#configurer"]').count(),0);
    assert.equal(await p.locator('#rail-links a[href="#configurer"]').count(),0);
    assert(await p.locator('#rail-links').getByRole('link',{name:'Administration',exact:true}).isVisible());
    const settings=p.getByLabel('Réglages de l’opération',{exact:true});
    await p.setViewportSize({width:390,height:844});
    await settings.click();await p.keyboard.press('Escape');assert(await settings.evaluate(el=>el===document.activeElement));
    await settings.click();await p.getByRole('link',{name:'Administration de la mécanique'}).click();
    await p.getByRole('heading',{name:'Administration de la mécanique'}).waitFor();
    assert(p.url().includes('op=bd-2704-deco#configurer'));
    await p.frameLocator('iframe').getByRole('button',{name:'Paramétrer les choix'}).waitFor();
    assert(await p.evaluate(()=>document.querySelector('#work').scrollWidth<=innerWidth));
    await p.setViewportSize({width:1850,height:914});
    await p.goto(url+'?op=bd-2704-deco');
    await p.getByRole('heading',{level:1,name:'Brico-déco'}).waitFor();
    await p.getByRole('link',{name:'Feuilleter le catalogue',exact:true}).click();
    await p.locator('.catalogue-page img').waitFor();
    assert(await p.locator('.catalogue-page').getAttribute('href') === '../assets/brico-deco/catalogue.pdf#page=2');
    await p.getByRole('link',{name:'SUSPENSION ZÉLIE',exact:true}).click();
    const sheet=p.locator('#product-dialog');
    await sheet.getByRole('tab',{name:'Caractéristiques'}).waitFor();
    await sheet.locator('.ps-stage img').evaluate(im=>im.decode());
    assert((await sheet.locator('.ps-stage img').getAttribute('src')).includes('bd-01.webp'));
    for(const viewport of [{width:390,height:844},{width:1850,height:914}]){
      await p.setViewportSize(viewport);
      const fits=await sheet.locator('.ps-stage img').evaluate(image=>{
        const frame=image.parentElement.getBoundingClientRect(),media=image.getBoundingClientRect();
        return media.width>0 && media.height>0 && media.left>=frame.left && media.right<=frame.right &&
          media.top>=frame.top && media.bottom<=frame.bottom &&
          Math.abs((media.left+media.right)-(frame.left+frame.right))<2 &&
          Math.abs((media.top+media.bottom)-(frame.top+frame.bottom))<2;
      });
      assert(fits,'L’image entière est centrée dans la galerie de la fiche produit.');
    }
    await sheet.getByRole('tab',{name:'Supports associés'}).click();
    await sheet.getByRole('link',{name:/E-catalogue Brico-déco.*Page 2/}).click();
    await p.locator('.catalogue-page[href$="#page=2"]').waitFor();
    await p.setViewportSize({width:390,height:844});
    assert(await p.locator('.catalogue-page img').evaluate(el=>el.getBoundingClientRect().width<=390));
    await p.reload();
    await p.locator('.catalogue-page').waitFor();
    await p.setViewportSize({width:1850,height:914});
    console.log('PASS Brico-déco par défaut, catalogue, visuel produit, retour à la page et mobile');
    await p.goto(url+'?op=bd-2704-deco#production?id=bd-ecatalogue&atelier=fer&page=2');
    const paper=p.locator('.ed-paper');
    await paper.waitFor();
    assert.equal(await p.locator('.ed-thumb').count(),6);
    if(process.env.STUDIO_SCREEN_DIR)await p.screenshot({path:process.env.STUDIO_SCREEN_DIR+'/mise-en-page.png'});
    await p.getByRole('button',{name:'Visuels',exact:true}).click();
    await p.getByRole('button',{name:'Placer le visuel Logo Nanotera'}).click();
    await paper.locator('.ed-image').waitFor();
    await p.locator('.ed-side').getByRole('button',{name:'Produits',exact:true}).click();
    await p.locator('[data-filter="rayon"]').selectOption('Bricolage');
    const search=p.getByRole('searchbox',{name:'Rechercher un produit'});
    await search.fill('NINA');
    const rail=p.getByRole('navigation',{name:'Navigation principale',exact:true});
    assert(await rail.getByRole('link',{name:'Production'}).isVisible());
    const atelierUrl=p.url();
    await p.getByRole('button',{name:'Plein écran',exact:true}).click();
    assert(await rail.isHidden());
    assert.equal(await search.inputValue(),'NINA');
    await p.keyboard.press('Escape');
    assert(await rail.isVisible());
    assert.equal(p.url(),atelierUrl);
    assert.equal(await search.inputValue(),'NINA');
    assert.equal(await p.locator('.ed-item').count(),1);
    await p.locator('.ed-item[data-from="bd-06"]').dragTo(paper,{targetPosition:{x:80,y:120}});
    await p.getByText('Placement enregistré sur la page 2.').waitFor();
    await paper.locator('[data-block="bd-06"]').waitFor();
    const moved=paper.locator('[data-block="bd-06"]');
    const before=await moved.boundingBox();
    const handle=await moved.locator('.ed-grip').boundingBox();
    await p.mouse.move(handle.x+5,handle.y+5);await p.mouse.down();
    await p.mouse.move(handle.x+29,handle.y+22,{steps:5});await p.mouse.up();
    await p.waitForFunction(width=>document.querySelector('.ed-paper [data-block="bd-06"]').getBoundingClientRect().width>width+10,before.width);
    await p.getByRole('button',{name:'Agrandir le zoom'}).click();
    await p.getByRole('button',{name:'Ajuster à la page'}).click();
    await p.getByRole('button',{name:'Ajouter un bloc texte'}).click();
    const textInput=p.locator('.ed-properties input[name=text]');
    await textInput.fill('Les miroirs Nanotera');
    await p.locator('.ed-properties').getByRole('button',{name:'Appliquer'}).click();
    await paper.locator('.ed-text').filter({hasText:'Les miroirs Nanotera'}).waitFor();
    await p.reload();
    await paper.locator('.ed-text').filter({hasText:'Les miroirs Nanotera'}).waitFor();
    await p.getByRole('button',{name:'Transmettre au BAT'}).click();
    await p.locator('.ed-paper.reviewing').waitFor();
    assert.equal(await p.getByLabel('Révision du BAT').inputValue(),'2');
    await p.getByRole('button',{name:'Inviter un relecteur'}).click();
    const invitation=await p.getByLabel('Lien de relecture de ce support').inputValue();
    const rev=await c.newPage();
    await rev.goto(invitation);
    await rev.getByText('Accès relecteur').waitFor();
    assert(await rev.locator('#operation-settings').isHidden());
    assert.equal(await rev.getByRole('link',{name:'Chemin de fer',exact:true}).count(),0);
    await rev.locator('.ed-thumb').nth(1).click();
    await rev.locator('.ed-paper').click({position:{x:120,y:100}});
    await rev.getByLabel('Signature').fill('Relecture catalogue');
    await rev.getByLabel('Correction demandée').fill('Agrandir le prix du miroir Nina.');
    await rev.getByRole('button',{name:'Publier le commentaire'}).click();
    await rev.locator('.ed-thread').getByText('Agrandir le prix du miroir Nina.',{exact:true}).waitFor();
    await p.reload();
    const thread=p.locator('.ed-thread').filter({hasText:'Agrandir le prix du miroir Nina.'});
    await thread.waitFor();
    await p.getByLabel('Signature').fill('Studio production');
    await thread.getByRole('button',{name:'Répondre'}).click();
    await thread.getByLabel('Réponse',{exact:true}).fill('Correction prise en compte.');
    await thread.getByRole('button',{name:'Publier la réponse'}).click();
    await thread.getByText('Correction prise en compte.').waitFor();
    if(process.env.STUDIO_SCREEN_DIR)await p.screenshot({path:process.env.STUDIO_SCREEN_DIR+'/bat-collaboratif.png'});
    await thread.getByRole('button',{name:'Marquer résolu'}).click();
    await thread.getByRole('button',{name:'Rouvrir'}).waitFor();
    await p.getByLabel('Révision du BAT').selectOption('1');
    await p.locator('.ed-paper img[src$="page-2.webp"]').waitFor();
    assert.equal(await p.locator('.ed-thread').count(),0);
    await p.setViewportSize({width:390,height:844});
    assert(await p.locator('.ed-paper').evaluate(el=>el.getBoundingClientRect().width<=390));
    await p.setViewportSize({width:1850,height:914});
    await rev.close();
    console.log('PASS mise en page, déplacement et persistance, BAT révisé, commentaire géolocalisé, réponse à deux accès, résolution et archive');
    const pdfWidth=await p.evaluate(async()=>{
      const {mountProof}=await import('./proof-file.mjs');
      const el=document.createElement('section');el.innerHTML='<div class="ed-file-layer"></div>';document.body.append(el);
      await mountProof({mode:'file',file:'../assets/brico-deco/catalogue.pdf'},3,el);
      const width=el.querySelector('canvas')?.width||0;el.remove();return width;
    });
    assert(pdfWidth>300,'Le BAT peut rendre une page de PDF avec ses vraies proportions');

    await p.goto(url + '?op=u-2649-pbs&assistant=1');
    await p.getByRole('heading', {
      name: 'Comment puis-je vous aider ?'
    }).waitFor();
    const panel = p.locator('#ai'),
      suggestions = await panel.locator('button[data-question]').allTextContents();
    assert.equal(suggestions.length, 3);
    const bounds = await panel.boundingBox();
    assert.equal(bounds.x, 1390);
    assert.equal(bounds.width, 460);
    assert.equal(Math.round((await panel.locator('.aifoot').boundingBox()).y), 720);
    for (const [index, question] of suggestions.entries()) {
      await panel.getByRole('button', {
        name: question
      }).click();
      await panel.locator('.bubble').filter({
        hasText: question
      }).waitFor();
      await panel.locator('.ans a').first().waitFor();
      assert((await panel.locator('.ans a').first().getAttribute('href')).startsWith(['#participants', '#produits', '#production'][index]));
      await panel.getByRole('button', {
        name: 'Nouvelle conversation'
      }).click();
    }
    const box = panel.getByRole('textbox', {
      name: 'Question à l’assistant'
    });
    await box.fill('Une question');
    await box.press('Shift+Enter');
    await box.press('End');
    assert((await box.inputValue()).includes('\n'));
    await box.press('Escape');
    assert(await p.locator('#open-ai').evaluate(el => el === document.activeElement));
    const prep = p.getByRole('button', {
      name: 'Rubriques de Préparation',
      exact: true
    });
    await prep.focus();
    await prep.press('Space');
    assert.equal(await prep.getAttribute('aria-expanded'), 'false');
    await prep.press('Enter');
    assert.equal(await prep.getAttribute('aria-expanded'), 'true');
    const dates = p.locator('#dates'),
      summary = dates.locator('summary');
    await summary.click();
    const taskFilter = p.locator('select[name=taskfilter]');
    await taskFilter.selectOption({
      label: 'À faire'
    });
    const value = await taskFilter.inputValue();
    await p.locator('#dates summary').click();
    await p.locator('#dates summary').click();
    assert(await p.locator('#dates').evaluate(d => d.open));
    assert.equal(await taskFilter.inputValue(), value);
    await p.getByRole('button', {
      name: 'Assistant',
      exact: true
    }).click();
    const ask = async text => {
      const input = p.getByRole('textbox', {
        name: 'Question à l’assistant'
      });
      await input.fill(text);
      await input.press('Enter');
    };
    await ask('Quel est le prix de l’emmental ?');
    await p.getByRole('link', {
      name: 'Ouvrir Prospectus · page 6'
    }).click();
    await p.locator('#content').getByText('Emmental râpé', {
      exact: true
    }).waitFor();
    assert.equal(await p.getByLabel('Page du BAT').inputValue(), '6');
    console.log('PASS assistant → emmental → prospectus page 6');
    await ask('Prépare un prospectus commun et laisse chaque magasin choisir sa quantité d’affiches A1.');
    await p.getByRole('button', {
      name: 'Relire la proposition de dispositif'
    }).click();
    await p.locator('#modal').getByText('Prospectus commun', {
      exact: true
    }).waitFor();
    await p.locator('#modal').getByText('Affiche A1', {
      exact: true
    }).waitFor();
    await p.getByRole('button', {
      name: 'Appliquer le dispositif'
    }).click();
    await p.getByText('Quantité d’affiches à saisir par point de vente dans Ma participation.').waitFor();
    await p.getByRole('button', {
      name: 'Fermer l’assistant'
    }).click();
    await p.goto(url + '?op=u-2649-pbs#participants?filtre=heritage');
    assert.equal(await p.locator('tbody tr').count(), 25);
    await p.goto(url + '?op=u-2649-pbs#produits?id=s49-08');
    await p.getByRole('button',{name:'Modifier le produit'}).click();
    await p.getByLabel('Prix national TTC (€)').fill('4.99');
    await p.getByRole('button', {
      name: 'Enregistrer la fiche'
    }).click();
    await p.getByRole('tab',{name:'Caractéristiques'}).waitFor();
    await p.getByText('Fiche produit enregistrée.').waitFor();
    await p.getByRole('tab',{name:'Supports associés'}).click();
    await p.locator('#product-dialog').getByRole('link',{name:/Prospectus.*Page 6/}).click();
    await p.getByText(/Modifications depuis la dernière revue/).click();
    await p.getByText(/Emmental râpé · page 6 · prix TTC/).waitFor();
    await p.getByRole('button', {
      name: 'Nouvelle révision'
    }).click();
    await p.getByRole('button', {
      name: 'Confirmer la décision'
    }).click();
    await p.getByRole('heading', {
      name: 'Prospectus · BAT R2'
    }).waitFor();
    await p.getByText('Changements consignés', {
      exact: true
    }).click();
    await p.getByRole('link', {
      name: 'Ouvrir R1',
      exact: true
    }).click();
    await p.getByRole('heading', {
      name: 'Prospectus · BAT R1'
    }).waitFor();
    assert((await p.getByRole('row').filter({
      hasText: 'Emmental râpé'
    }).innerText()).includes('À renseigner'));
    await p.getByRole('link', {
      name: 'Revenir au BAT actuel'
    }).click();
    await p.goto(url + '?op=u-2649-pbs#configurer');
    const form = p.frameLocator('iframe');
    await form.getByRole('button', {
      name: 'Offre produits',
      exact: true
    }).click();
    const sole = form.getByRole('checkbox', {
      name: 'Café moulu · V1',
      exact: true
    });
    await sole.click();
    assert(await sole.isChecked());
    await form.getByRole('button', {
      name: 'Aperçu magasin'
    }).click();
    const proposed = form.getByRole('heading', {name:'Version et assortiment proposés'}).locator('..');
    assert((await proposed.innerText()).includes('Café moulu'));
    assert(!(await proposed.innerText()).includes('Champagne brut'));
    await form.getByRole('radio', {
      name: 'Oui, je participe'
    }).check();
    await form.getByRole('button', {
      name: 'Mon offre produits',
      exact: true
    }).click();
    const coffee = form.getByRole('row').filter({
      hasText: 'Café moulu'
    });
    await coffee.getByRole('checkbox', {
      name: 'Retenir'
    }).check();
    await coffee.getByRole('spinbutton').fill('6.75');
    await form.getByRole('button', {
      name: 'Récapitulatif'
    }).click();
    await form.getByRole('button', {
      name: 'Confirmer ma réponse'
    }).click();
    await form.getByText('Réponse confirmée et enregistrée.').waitFor();
    await p.goto(url + '?op=u-2649-pbs#supports?id=s49-prospectus');
    await p.getByRole('button', {
      name: 'Valider la variante'
    }).click();
    const preview = await p.locator('#modal').innerText();
    for (const value of ['Nanotera Paris 001', 'Prospectus', 'V1', 'Café moulu', 'page 7', '8,40', '6,75']) assert(preview.includes(value));
    await p.locator('#modal').getByRole('button', {
      name: 'Valider',
      exact: true
    }).click();
    await p.getByText('Validée', {
      exact: true
    }).waitFor();
    console.log('PASS variante locale → magasin V1, café page 7, prix national et local relus avant validation');
    console.log('PASS offre corrigée → révision R2 et changements archivés');
    await p.setViewportSize({
      width: 390,
      height: 844
    });
    await p.getByRole('button', {
      name: 'Assistant',
      exact: true
    }).click();
    assert.equal(Math.round((await p.locator('#ai').boundingBox()).width), 390);
    await p.getByRole('button', {
      name: 'Fermer l’assistant'
    }).click();
    await p.goto(url + '?op=u-2649-pbs#supports');
    const head = p.getByRole('heading', {
      name: 'Supports à préparer'
    });
    await head.waitFor();
    assert.equal(await p.locator('tbody tr').count(), 2);
    console.log('PASS deux supports réutilisés sans doublon, affiches par point de vente et mobile');
    await p.goto(url+'?op=u-2649-pbs#configurer');
    const groups=p.frameLocator('iframe');
    await groups.getByLabel('Version proposée').selectOption('V3');
    await groups.getByLabel('Hypermarché',{exact:true}).check();
    await groups.getByLabel('Bretagne',{exact:true}).check();
    await groups.getByLabel('Centre commercial',{exact:true}).check();
    await groups.getByLabel('Nom du groupe').fill('Hypers de Bretagne en centre commercial');
    assert((await groups.locator('.assort').first().innerText()).includes('Champagne brut'));
    assert((await groups.locator('[role=status].assort').innerText()).includes('6 points de vente'));
    await groups.getByRole('button',{name:'Ajouter le groupe en priorité'}).click();
    await groups.getByRole('button',{name:'Appliquer la proposition'}).click();
    await p.locator('#notice').getByText('Proposition appliquée aux groupes de magasins.').waitFor();
    await p.reload();
    const row=groups.getByRole('row').filter({hasText:'Hypers de Bretagne en centre commercial'});
    assert((await row.innerText()).includes('6 / 6'));
    assert.equal(await groups.locator('select[data-path^="assigned"]').count(),0);
    for(const label of ['Supermarchés','Hypermarchés','Supérettes']) await groups.getByRole('row').filter({hasText:label}).getByRole('button',{name:'Retirer'}).click();
    await groups.getByRole('button',{name:'Appliquer la proposition'}).click();
    await p.locator('#notice').getByText('Proposition appliquée aux groupes de magasins.').waitFor();
    await p.goto(url+'?op=u-2649-pbs#participants');
    await p.getByText('6 points de vente ciblés sur 900 dans le réseau.').waitFor();
    assert.equal(await p.locator('tbody tr').count(),6);
    assert(!(await p.locator('main').innerText()).includes('Super U'));
    console.log('PASS ciblage depuis le mobile → assortiment V3, six hypers en Bretagne en centre commercial, relecture et liste des destinataires');
    const rootUrl=url.replace('/operation/','/');
    const seed=[
      {col:'operations',id:'bd-2704-deco',version:1,data:{nom:'Brico-déco',debut:'2026-11-01',fin:'2026-11-30',source:'demo',enseignes:['Nanotera']}},
      {col:'operations',id:'u-2649-pbs',version:1,data:{nom:'Offres S49',debut:'2026-12-01',fin:'2026-12-10',source:'demo'}},
      {col:'produits',id:'s49-unique',version:1,data:{op:'u-2649-pbs',libelle:'Produit témoin S49',rayon:'Épicerie',prix:4}},
      {col:'supports',id:'s49-unique-bat',version:1,data:{op:'u-2649-pbs',type:'Affiche A1',fichier:'BAT-exclusif-S49.pdf',prod:true}},
      {col:'produits',id:'bd-18',version:1,data:{op:'bd-2704-deco',libelle:'AMPOULE LED ÉDITION FANTASTIC COLORS',marque:'Nanotera',rayon:'Bricolage',prix:11.99,description:'5 W · E27'}},
      {col:'supports',id:'aff-demo',version:1,data:{op:'bd-2704-deco',type:'Affiche A1',produits:['bd-18'],statut:'amonter'}}
    ];
    const reads=[];
    await c.route('**/rest/v1/docs?**',route=>{
      const q=new URL(route.request().url()).searchParams,cols=q.get('col'),op=q.get('data->>op');
      reads.push({cols,op});
      const matches=cols?.startsWith('in.(')?cols.slice(4,-1).split(','):cols?[cols.slice(3)]:null;
      return route.fulfill({json:seed.filter(r=>(!matches||matches.includes(r.col))&&(!op||r.data.op===op.slice(3)))});
    });
    await c.route('**/rest/v1/rpc/studio_write2',route=>route.fulfill({json:{ok:true,version:2,role:'responsable'}}));
    await p.evaluate(()=>{localStorage.setItem('bos-code','fixture-test');localStorage.setItem('bos-role','responsable');});
    await p.setViewportSize({width:1850,height:914});
    await p.goto(rootUrl+'#contenus--assets?destination=flux&mode=partage');
    await p.getByRole('heading',{name:'Mes flux',exact:true}).waitFor();
    const chooseFlux=p.getByRole('link',{name:'Brico-déco',exact:true});
    await chooseFlux.waitFor();
    assert.match(await chooseFlux.getAttribute('href'),/mode=partage.*#flux/);
    assert.equal(await p.locator('.flow-cell').count(),0);
    assert(reads.every(r=>r.cols==='eq.operations'));
    await p.goto(rootUrl+'#contenus--produits?vue=liste');
    await p.getByRole('heading',{name:'Choisir une opération'}).waitFor();
    assert.equal(await p.locator('[data-product-id]').count(),0);
    assert(reads.length && reads.every(r=>r.cols==='eq.operations'));
    await p.getByRole('link',{name:/^Brico-déco/}).click();
    await p.locator('.product-table').waitFor();
    assert.equal(await p.locator('.global-nav a[data-v=administration]').count(),0);
    await p.getByLabel('Réglages de l’opération',{exact:true}).click();
    assert((await p.locator('#operation-settings a').getAttribute('href')).includes('op=bd-2704-deco#configurer'));
    await p.keyboard.press('Escape');
    assert(reads.some(r=>r.op==='eq.bd-2704-deco'));
    assert(!(await p.locator('#view').innerText()).includes('Produit témoin S49'));
    await p.getByRole('navigation',{name:'Espaces Studio'}).getByRole('link',{name:'Production'}).click();
    await p.getByRole('link',{name:'Production de l’opération'}).waitFor();
    assert.equal(new URLSearchParams(p.url().split('?').at(-1)).get('op'),'bd-2704-deco');
    assert(!(await p.locator('#view').innerText()).includes('BAT-exclusif-S49'));
    await p.getByRole('link',{name:'Changer d’opération'}).click();
    await p.getByRole('link',{name:/^Offres S49/}).click();
    await p.reload();await p.getByRole('link',{name:/BAT-exclusif-S49/}).waitFor();
    await p.getByRole('navigation',{name:'Espaces Studio'}).getByRole('link',{name:'Produits'}).click();
    await p.getByRole('link',{name:/Produit témoin S49/}).waitFor();
    assert(!(await p.locator('#view').innerText()).includes('FANTASTIC COLORS'));
    await p.getByRole('link',{name:'Changer d’opération'}).click();
    await p.setViewportSize({width:390,height:844});
    await checkWorkspaceStart(p);
    const mobileRail=p.getByRole('navigation',{name:'Navigation principale',exact:true});
    assert(await mobileRail.getByRole('link',{name:'Production'}).isVisible());
    await p.getByRole('button',{name:'Déployer le menu'}).click();
    assert.equal(await p.getByRole('button',{name:'Réduire le menu'}).getAttribute('aria-expanded'),'true');
    await p.keyboard.press('Escape');
    await p.getByRole('button',{name:'Filtres',exact:true}).click();
    assert(await p.locator('#view').evaluate(el=>el.contains(document.activeElement)));
    await p.getByLabel('Rechercher une opération').fill('Brico');
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await p.setViewportSize({width:1850,height:914});
    assert.equal(await p.locator('.operation-choices a').count(),1);
    await p.goto(url+'#produits?id=bd-18');await p.getByRole('heading',{name:'Choisir une opération'}).waitFor();
    assert.equal(await p.locator('#product-dialog[open]').count(),0);
    await p.getByRole('link',{name:/^Brico-déco/}).click();await p.locator('#product-dialog[open]').waitFor();
    await p.goto(rootUrl+'#contenus--produits?vue=liste&op=bd-2704-deco');
    console.log('PASS sélection obligatoire, liens directs, conservation entre rubriques, changement de dossier et isolation S49 / Brico-déco');
    const record=p.locator('#product-dialog');
    await p.getByRole('link',{name:'AMPOULE LED ÉDITION FANTASTIC COLORS',exact:true}).click();
    await record.getByRole('tab',{name:'Caractéristiques'}).waitFor();
    assert((await record.boundingBox()).width>=1100);
    assert(await record.locator('.ps-stage img').evaluate(el=>el.complete && el.naturalWidth>0));
    await record.getByRole('button',{name:/^Logo ·/}).click();
    assert(await record.locator('.ps-logo').isVisible());
    await record.getByRole('button',{name:/^Vidéo ·/}).click();
    assert(await record.locator('video[controls]').isVisible());
    await record.getByRole('tab',{name:'Supports associés'}).click();
    await record.getByRole('link',{name:/Affiche A1/}).waitFor();
    await record.getByRole('button',{name:'Fermer la fiche produit'}).click();
    await p.getByRole('button',{name:'Cartes',exact:true}).click();
    await p.locator('a[data-product-id="bd-18"]').click();
    assert.equal(await record.getByRole('tab',{name:'Caractéristiques'}).getAttribute('aria-selected'),'true');
    await record.getByRole('button',{name:'Modifier le produit'}).click();
    assert.equal(await p.locator('dialog[open]').count(),1);
    await record.locator('textarea#f-description').fill('Description mise à jour');
    await record.getByRole('button',{name:'Enregistrer',exact:true}).click();
    await record.getByText('Description mise à jour',{exact:true}).waitFor();
    await record.getByRole('button',{name:'Gérer les médias'}).click();
    await record.getByRole('button',{name:'Ajouter un média'}).click();
    const asset=record.locator('.ps-media-rows fieldset').last();
    await asset.getByLabel('Libellé').fill('Nouvelle photo');
    await asset.getByLabel('Adresse du fichier').fill('https://example.org/photo.jpg');
    await record.getByRole('button',{name:'Enregistrer les médias'}).click();
    await record.getByRole('button',{name:'Image · Nouvelle photo'}).waitFor();
    await p.setViewportSize({width:390,height:844});
    assert((await record.boundingBox()).width<=390);
    console.log('PASS fiche large catalogue + PIM, onglet par défaut, édition sans double fenêtre, photos, logo, vidéo et associations');

    await testBricoDemo(p,c,rootUrl,record,env);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    server.close()
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1
});
