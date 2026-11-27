const {
  chromium
} = require('playwright'), {
  DatabaseSync
} = require('node:sqlite'), http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), {
  pathToFileURL
} = require('node:url');
const root = path.resolve(__dirname, '..'),
  api = 'https://bigone-studio-operations.github-46e.workers.dev';
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
          '.png': 'image/png',
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
    const p = await c.newPage();
    p.setDefaultTimeout(7000);
    const errors = [];
    p.on('pageerror', err => errors.push(err.message));
    await p.goto(url + '?assistant=1');
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
      name: 'Préparation',
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
    await p.goto(url + '#participants?filtre=heritage');
    assert.equal(await p.locator('tbody tr').count(), 25);
    await p.goto(url + '#produits?id=s49-08');
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
    await p.goto(url + '#configurer');
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
    await p.goto(url + '#supports?id=s49-prospectus');
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
    await p.goto(url + '#supports');
    const head = p.getByRole('heading', {
      name: 'Supports à préparer'
    });
    await head.waitFor();
    assert.equal(await p.locator('tbody tr').count(), 2);
    console.log('PASS deux supports réutilisés sans doublon, affiches par point de vente et mobile');
    await p.goto(url+'#configurer');
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
    await p.goto(url+'#participants');
    await p.getByText('6 points de vente ciblés sur 900 dans le réseau.').waitFor();
    assert.equal(await p.locator('tbody tr').count(),6);
    assert(!(await p.locator('main').innerText()).includes('Super U'));
    console.log('PASS ciblage depuis le mobile → assortiment V3, six hypers en Bretagne en centre commercial, relecture et liste des destinataires');
    const rootUrl=url.replace('/operation/','/');
    const seed=[
      {col:'operations',id:'bd-2704-deco',version:1,data:{nom:'Brico-déco',debut:'2026-11-01',fin:'2026-11-30',source:'demo',enseignes:['Nanotera']}},
      {col:'produits',id:'bd-18',version:1,data:{op:'bd-2704-deco',libelle:'AMPOULE LED ÉDITION FANTASTIC COLORS',marque:'Nanotera',rayon:'Bricolage',prix:11.99,description:'5 W · E27'}},
      {col:'supports',id:'aff-demo',version:1,data:{op:'bd-2704-deco',type:'Affiche A1',produits:['bd-18'],statut:'amonter'}}
    ];
    await c.route('**/rest/v1/docs?**',route=>route.fulfill({json:seed}));
    await c.route('**/rest/v1/rpc/studio_write2',route=>route.fulfill({json:{ok:true,version:2,role:'responsable'}}));
    await p.evaluate(()=>{localStorage.setItem('bos-code','fixture-test');localStorage.setItem('bos-role','responsable');});
    await p.setViewportSize({width:1850,height:914});
    await p.goto(rootUrl+'#contenus--produits?vue=liste');
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
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    server.close()
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1
});
