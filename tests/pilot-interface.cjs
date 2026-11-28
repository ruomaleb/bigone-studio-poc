const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {inflateSync}=require('node:zlib');

module.exports=async function pilot(context,url) {
  const p=await context.newPage(), issues=[];
  p.setDefaultTimeout(15000);
  p.on('pageerror',e=>issues.push(e.message));
  const root=url+'?op=bd-2704-deco&parcours=production';
  const go=async hash=>{await p.goto(root+hash);await p.reload();await p.locator('#content').waitFor();};
  const button=(a,where=p)=>where.locator('[data-do="'+a+'"]').first();
  const row=name=>p.getByRole('row').filter({hasText:'Nanotera '+name});
  async function invite(name) {
    await go('#participants');await row(name).getByRole('button',{name:'Accès magasin'}).click();
    const link=await p.getByLabel('Lien du magasin').inputValue();
    await button('close',p.locator('#modal')).click();
    const shop=await context.newPage();await shop.goto(link);await shop.locator('#kit-response').waitFor();return shop;
  }
  async function waitProofs(n){
    await p.waitForFunction(n=>[...document.querySelectorAll('.kit-tile .tag')].filter(el=>el.textContent!=='À générer').length===n,n,{timeout:45000});
  }
  async function approve(i){
    await go('#production?vue=kit&rendu='+i);
    await p.getByRole('link',{name:'Relire le BAT'}).click();
    await button('kit-approve').click();
    await p.locator('.kit-bat .tag').filter({hasText:'Validé'}).waitFor();
  }
  try {
    await go('#participants');assert.equal(await p.locator('tbody tr').count(),6);
    assert.equal(await p.getByRole('button',{name:'Importer une révision'}).count(),0);
    await p.getByLabel('Réglages de l’opération',{exact:true}).click();
    await p.getByRole('link',{name:'Administration de la mécanique'}).click();
    await p.getByRole('button',{name:'Importer une révision'}).waitFor();
    const a=await invite('A');assert(await a.locator('#operation-settings').isHidden());await a.setViewportSize({width:390,height:844});
    await a.locator('select[name=yn]').selectOption('yes');
    await a.getByLabel(/Kit digital Gaia/).check();await a.getByLabel(/Affiches A3/).fill('2');
    await a.getByRole('button',{name:'Confirmer ma participation'}).click();await a.getByText('Participation enregistrée.').waitFor();
    assert(await a.locator('#kit-response').evaluate(e=>e.getBoundingClientRect().right<=390));
    await a.reload();await a.getByText('Réponse confirmée').waitFor();
    await a.getByRole('link',{name:'← Mon année'}).click();await a.getByRole('heading',{name:'Mon année'}).waitFor();
    assert.equal(await a.locator('tbody tr').count(),1);await a.getByRole('table').getByRole('link',{name:'Ma participation'}).click();assert.equal(await a.getByLabel(/Affiches A3/).inputValue(),'2');
    await go('#participants');await p.getByText(/30 affiches confirmées/).waitFor();
    await go('#participants?filtre=sans-kit');assert.equal(await p.locator('tbody tr').count(),1);await row('D').waitFor();
    await go('#production?vue=kit');assert.equal(await p.locator('.kit-tile').count(),2);
    await button('kit-generate').click();await waitProofs(2);await approve(0);await approve(1);
    const c=await invite('C');await c.getByLabel(/Prix local de Gaia/).fill('10.90');
    await c.getByRole('button',{name:'Confirmer ma participation'}).click();await c.getByText('Participation enregistrée.').waitFor();
    await go('#production?vue=kit');assert.equal(await p.locator('.kit-tile').count(),4);
    if(process.env.STUDIO_SCREEN_DIR){await p.locator('canvas').first().waitFor();await p.screenshot({path:path.join(process.env.STUDIO_SCREEN_DIR,'kit-digital.png')});}
    await button('kit-generate').click();await waitProofs(4);await approve(2);
    await go('#production?vue=kit&rendu=3');await p.getByRole('link',{name:'Relire le BAT'}).click();
    await p.locator('.kit-proof img').first().waitFor({state:'attached'});assert.equal(await p.locator('.kit-proof').count(),2);
    await button('kit-invite').click();const urlReview=await p.getByLabel('Lien de relecture de cette épreuve').inputValue();
    await button('close',p.locator('#modal')).click();const rev=await context.newPage();await rev.goto(urlReview);
    await button('kit-note',rev).click();await rev.getByRole('dialog').getByLabel('Commentaire',{exact:true}).fill('Vérifier aussi le prix du carré de Nanotera C.');
    await rev.locator('#modal button[type=submit]').click();await rev.getByText(/Vérifier aussi le prix du carré/).waitFor();
    assert.equal(await rev.locator('[data-do="kit-approve"]').count(),0);await p.reload();
    await button('kit-approve').click();await p.getByText(/Résolvez les corrections ouvertes/).waitFor();
    await button('kit-resolve').click();await p.getByText('Résolu',{exact:true}).waitFor();await button('kit-approve').click();await p.getByText('Validé',{exact:true}).waitFor();
    await go('#production?vue=remises');await button('kit-deliver').click();await p.getByText(/4 fichiers · 6 affectations/).waitFor();
    await button('kit-deliver').click();assert.equal(await p.locator('h3').filter({hasText:'KIT-GAIA-01'}).count(),1);
    async function zip(page){
      const result=page.waitForEvent('download');await button('kit-zip',page).click();
      const data=await fs.readFile(await (await result).path());let off=0;const entries=[];
      while(data.readUInt32LE(off)===0x04034b50){
        const n=data.readUInt16LE(off+26),len=data.readUInt32LE(off+18),start=off+30+n,bytes=data.subarray(start,start+len),name=data.toString('utf8',off+30,start);
        const {crc32}=require('node:zlib');assert.equal(crc32(bytes),data.readUInt32LE(off+14));
        entries.push({name,bytes});off=start+len;
      }
      return entries;
    }
    const files=await zip(p);assert.equal(files.length,5);const manifest=JSON.parse(files.find(e=>e.name==='bordereau.json').bytes);
    assert.deepEqual(manifest.files.map(f=>f.shops.length).sort(),[1,1,2,2]);
    for(const f of manifest.files)assert.equal(require('node:crypto').createHash('sha256').update(files.find(e=>e.name===f.name).bytes).digest('hex'),f.sha256);
    for(const {name,bytes} of files.filter(f=>f.name.endsWith('.png'))){
      assert.equal(bytes.readUInt32BE(16),1080);assert.equal(bytes.readUInt32BE(20),name.includes('vertical')?1920:1080);
      let off=8;const data=[];while(off<bytes.length){const n=bytes.readUInt32BE(off);if(bytes.toString('ascii',off+4,off+8)==='IDAT')data.push(bytes.subarray(off+8,off+8+n));off+=n+12;}
      assert(inflateSync(Buffer.concat(data)).length>1080*1080);
    }
    await c.reload();const own=await zip(c);assert.equal(own.length,3);assert(own.filter(x=>x.name.endsWith('.png')).every(x=>x.name.includes('1090-R2')));
    assert(!JSON.stringify(JSON.parse(own.find(e=>e.name==='bordereau.json').bytes)).includes('Nanotera B'));
    await button('kit-receipt').click();await p.getByLabel('Référence fournie par le destinataire').fill('DG-001');await p.locator('#modal button[type=submit]').click();await p.getByText('Reçu · DG-001').waitFor();
    await go('#flux?vue=editions');assert.deepEqual(await p.locator('tbody tr td:nth-child(4)').allTextContents(),['17','17','21','4']);
    await go('#flux?vue=visuels&edition=NT-V1-SUD');assert.equal(await p.locator('.kit-gallery a').count(),4);await p.getByText(/12,50/).waitFor();
    await go('#flux?vue=enrichis&edition=NT-V1-SUD');assert.equal(await p.locator('tbody tr .tag').filter({hasText:'Actif'}).count(),2);
    await p.getByLabel('Simuler la date').fill('2027-01-25');await p.getByRole('button',{name:'Afficher'}).click();
    await p.waitForFunction(()=>[...document.querySelectorAll('tbody .tag')].filter(t=>t.textContent==='Actif').length===3);
    await go('#flux?vue=reseau');await p.getByRole('heading',{name:'Mes flux',exact:true}).waitFor();
    const partnerMarks=p.locator('.flow-head .flow-partner img');
    assert.equal(await partnerMarks.count(),3);
    assert.deepEqual(await partnerMarks.evaluateAll(images=>images.map(img=>new URL(img.src).pathname.split('/').at(-1))),['bigone-logo.png','bonial.png','tiendeo.png']);
    await partnerMarks.evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
    await p.getByLabel('Publication prévue',{exact:true}).fill('2027-01-18');
    await p.waitForURL(/publication=2027-01-18/);
    assert.equal(await p.locator('.flow-cell a').count(),3);
    await p.getByRole('link',{name:'Réinitialiser'}).click();
    await p.getByRole('link',{name:'Réinitialiser'}).waitFor({state:'detached'});
    await p.locator('.flow-board').waitFor();
    await p.setViewportSize({width:390,height:844});
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await p.locator('[data-flow-toggle]').click();
    await p.getByLabel('Version',{exact:true}).selectOption('V2');
    await p.waitForURL(/version=V2/);
    await p.getByRole('link',{name:/E-catalogue.*Version large/}).click();
    await p.getByText('NT-V2-EST',{exact:true}).waitFor();
    await p.setViewportSize({width:390,height:844});await go('#production?vue=kit');assert(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
    assert.deepEqual(issues,[]);console.log('PASS pilote Nanotera · 6 magasins, 30 affiches, 4 vrais PNG, 6 affectations, révision locale, BAT à deux accès, ZIP de C et flux territoriaux');
    await Promise.all([rev.close(),c.close(),a.close()]);
  }catch(e){console.error('Écran pilote au blocage',p.url().split('#').at(-1),(await p.locator('main').innerText()).slice(-1200),await p.locator('#notice').innerText(),await p.locator('#modalcontent').innerText());throw e;}finally{await p.close();}
};
