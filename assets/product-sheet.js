/* Shared product record used by the catalogue, operation PIM and support links. */
(() => {
  const assetBase = new URL('produits/', document.currentScript?.src || location.href);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  } [c]));
  const kinds = {
    image: 'Image',
    logo: 'Logo',
    video: 'Vidéo'
  };
  const examples = {
    's49-07': 'beurre',
    's49-08': 'emmental',
    's49-09': 'cafe',
    's49-05': 'champagne'
  };
  const urlOK = url => {
    try {
      const u = new URL(url);
      return u.protocol === 'https:' || (u.origin === location.origin && u.protocol === 'http:');
    } catch {
      return false;
    }
  };

  function mediaFor(product, operation) {
    if (Array.isArray(product.media)) return product.media.filter(x => x && Object.hasOwn(kinds, x.kind) && urlOK(x.url));
    const id = product.id,
      demo = operation === 'u-2649-pbs' || operation === 'bd-2704-deco';
    if (!demo) return [];
    const items = [],
      file = examples[id];
    const asset = (kind, file, label) => ({
      kind,
      url: new URL(file, assetBase).href,
      label
    });
    if (operation === 'bd-2704-deco' && /^bd-(0[1-9]|1[0-9]|2[01])$/.test(id)) {
      const i = Number(id.slice(3)), page = i <= 5 ? 2 : i <= 10 ? 3 : i <= 14 ? 4 : 5;
      items.push(asset('image','../brico-deco/' + id + '.webp','Photographie du catalogue Brico-déco · page ' + page));
      items.push(asset('logo','../brico-deco/logo-catalogue.webp','Signature Nanotera du catalogue'));
      if (id === 'bd-18') items.push(asset('video','ampoule.mp4','Animation illustrative de démonstration · 4 s'));
      return items;
    }
    if (file) items.push(asset('image', file + '.webp', 'Vue produit · illustration de démonstration'));
    if (/^nanotera(?:\s|$)/i.test(product.marque || product.brand || '')) items.push(asset('logo', 'nanotera.png',
    'Signature Nanotera · démonstration'));
    return items;
  }

  function create(dialog, options) {
    let record = null,
      tab = 'facts',
      selected = 0,
      mode = 'read',
      draft = [],
      trigger = null;
    const labels = {
      facts: 'Caractéristiques',
      supports: 'Supports associés'
    };
    const currentMedia = () => record.media[selected];

    function gallery() {
      const media = record.media,
        item = currentMedia();
      const visual = !item ? '<div class="ps-empty">Aucun média associé à ce produit.</div>' : item.kind === 'video' ?
        '<video controls playsinline preload="metadata" aria-label="' + esc(item.label) + '" src="' + esc(item.url) + '"></video>' :
        '<img src="' + esc(item.url) + '" alt="' + esc(item.label) + '" class="' + (item.kind === 'logo' ? 'ps-logo' : '') + '">';
      return '<section class="ps-gallery" aria-label="Médias du produit"><div class="ps-stage">' + visual + '</div>' +
        (item ? '<p class="ps-caption"><b>' + esc(kinds[item.kind]) + '</b> · ' + esc(item.label) + '</p>' : '') +
        '<div class="ps-thumbs">' + media.map((m, i) => '<button type="button" data-ps-media="' + i + '" aria-pressed="' + (i === selected) +
          '" aria-label="' + esc(kinds[m.kind] + ' · ' + m.label) + '">' +
          (m.kind === 'video' ? '<span class="ps-play" aria-hidden="true">▶</span>' : '<img src="' + esc(m.url) + '" alt="" loading="lazy">') +
          '<small>' + esc(kinds[m.kind]) + '</small></button>').join('') + '</div>' +
        (options.saveMedia && !record.closed ? '<button type="button" class="btn sm" data-ps-manage>Gérer les médias</button>' : '') + '</section>';
    }
    const buttons = () => Object.entries(labels).map(([id, label]) => '<button type="button" role="tab" id="ps-tab-' + id +
      '" aria-controls="ps-panel" aria-selected="' + (id === tab) + '" tabindex="' + (id === tab ? 0 : -1) + '" data-ps-tab="' + id + '">' + esc(
      label) + (id === 'supports' ? ' <span>' + record.supports.length + '</span>' : '') + '</button>').join('');

    function read() {
      mode = 'read';
      const facts = record.facts.filter(([k, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => '<div><dt>' + esc(k) + '</dt><dd>' + esc(
        v) + '</dd></div>').join('');
      const supportLinks = record.supports.map(s => '<a class="ps-support" href="' + esc(s.href) + '"><span><b>' + esc(s.name) + '</b><small>' + esc(s
        .detail || '') + '</small></span><span aria-hidden="true">›</span></a>').join('');
      dialog.innerHTML = '<header class="ps-head"><div><p>' + esc(record.operation) + '</p><h2 id="product-dialog-title">' + esc(record.name) +
        '</h2></div><button type="button" class="btn ps-close" data-ps-close aria-label="Fermer la fiche produit">×</button></header>' +
        '<div role="tablist" aria-label="Fiche produit" class="ps-tabs">' + buttons() +
        '</div><div class="ps-body" role="tabpanel" tabindex="0" id="ps-panel" aria-labelledby="ps-tab-' + tab + '">' +
        (tab === 'supports' ? '<div class="ps-supports">' + (supportLinks || '<p class="ps-empty">Aucun support associé à ce produit.</p>') + '</div>' :
          '<div class="ps-columns">' + gallery() + '<section class="ps-features"><div class="ps-labelrow"><h3>Caractéristiques du produit</h3></div>' + (
            record.description ? '<p>' + esc(record.description) + '</p>' : '') +
          '<dl class="ps-facts">' + facts + '</dl>' + (record.closed ? '<p class="ps-caption">Opération clôturée · consultation</p>' : options.edit ?
            '<button type="button" class="btn pri" data-ps-edit>Modifier le produit</button>' : '') + '</section></div>') + '</div>';
    }

    function editorTitle(title) {
      dialog.innerHTML = '<header class="ps-head"><div><p>' + esc(record.name) + '</p><h2 id="product-dialog-title">' + esc(title) +
        '</h2></div><button type="button" class="btn ps-close" data-ps-close aria-label="Fermer la fiche produit">×</button></header><div class="ps-body ps-edit"></div>';
      return dialog.querySelector('.ps-edit');
    }

    function mediaEditor() {
      const body = editorTitle('Médias du produit');
      body.innerHTML =
        '<form class="ps-media-form"><p>Associez une image, un logo ou une vidéo avec un lien HTTPS direct vers le fichier.</p><div class="ps-media-rows">' +
        draft.map((m, i) => '<fieldset><legend>Média ' + (i + 1) + '</legend><label>Type<select name="kind">' + Object.entries(kinds).map(([k, l]) =>
            '<option value="' + k + '" ' + (k === m.kind ? 'selected' : '') + '>' + l + '</option>').join('') +
          '</select></label><label>Libellé<input name="label" value="' + esc(m.label) +
          '" maxlength="120" required></label><label>Adresse du fichier<input name="url" type="url" value="' + esc(m.url) +
          '" maxlength="1800" required></label><button type="button" class="btn" data-ps-remove="' + i + '">Retirer</button></fieldset>').join('') +
        '</div><p role="alert"></p><div class="ps-actions"><button type="button" class="btn" data-ps-add>Ajouter un média</button><button type="button" class="btn" data-ps-back>Annuler</button><button class="btn pri">Enregistrer les médias</button></div></form>';
    }

    function getDraft() {
      return [...dialog.querySelectorAll('.ps-media-rows fieldset')].map(row => Object.fromEntries(['kind', 'label', 'url'].map(k => [k, row
        .querySelector('[name=' + k + ']').value.trim()
      ])));
    }

    function open(next, invoker) {
      const changed = !dialog.open || record?.key !== next.key;
      record = next;
      if (changed) {
        mode = 'read';
        tab = 'facts';
        selected = 0;
        trigger = invoker || document.activeElement;
      }
      if (selected >= record.media.length) selected = 0;
      if (mode === 'read') read();
      if (!dialog.open) {
        dialog.showModal();
        dialog.querySelector('[role=tab]')?.focus({
          preventScroll: true
        });
      }
    }

    function finish() {
      selected = 0;
      tab = 'facts';
      mode = 'read';
      const next = options.reload?.();
      if (!next) {
        dialog.close();
        return;
      }
      record = next;
      read();
      dialog.querySelector('[role=tab]')?.focus({
        preventScroll: true
      });
    }
    dialog.addEventListener('close', () => {
      const item = record;
      record = null;
      mode = 'read';
      dialog.replaceChildren();
      if (trigger?.isConnected) trigger.focus({
        preventScroll: true
      });
      options.close?.(item);
    });
    dialog.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-ps-close')) return dialog.close();
      if (b.dataset.psTab) {
        tab = b.dataset.psTab;
        read();
        dialog.querySelector('[aria-selected=true]').focus({
          preventScroll: true
        });
        return;
      }
      if (b.dataset.psMedia !== undefined) {
        selected = Number(b.dataset.psMedia);
        read();
        dialog.querySelector('[aria-pressed=true]')?.focus({
          preventScroll: true
        });
        return;
      }
      if (b.hasAttribute('data-ps-back')) return finish();
      if (b.hasAttribute('data-ps-edit') && options.edit && !record.closed) {
        if (options.authorize && !options.authorize()) return;
        mode = 'edit';
        options.edit(editorTitle('Modifier le produit'), finish);
        dialog.querySelector('.ps-edit input')?.focus();
        return;
      }
      if (b.hasAttribute('data-ps-manage') && options.saveMedia && !record.closed) {
        if (options.authorize && !options.authorize()) return;
        mode = 'media';
        draft = record.media.map(x => ({
          ...x
        }));
        mediaEditor();
        return;
      }
      if (b.hasAttribute('data-ps-add')) {
        draft = getDraft();
        if (draft.length >= 24) return;
        draft.push({
          kind: 'image',
          label: '',
          url: ''
        });
        mediaEditor();
        dialog.querySelector('.ps-media-rows fieldset:last-child input')?.focus();
      }
      if (b.dataset.psRemove !== undefined) {
        draft = getDraft();
        draft.splice(Number(b.dataset.psRemove), 1);
        mediaEditor();
      }
    });
    dialog.addEventListener('keydown', e => {
      const t = e.target.closest('[role=tab]');
      if (!t || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      tab = e.key === 'Home' ? 'facts' : e.key === 'End' ? 'supports' : tab === 'facts' ? 'supports' : 'facts';
      read();
      dialog.querySelector('[aria-selected=true]').focus();
    });
    dialog.addEventListener('submit', async e => {
      if (!e.target.matches('.ps-media-form')) return;
      e.preventDefault();
      const form = e.target,
        rows = getDraft(),
        alert = form.querySelector('[role=alert]');
      if (rows.some(x => !urlOK(x.url))) {
        alert.textContent = 'Utilisez un lien HTTPS direct pour chaque média.';
        return;
      }
      const save = e.submitter;
      save.disabled = true;
      try {
        await options.saveMedia(rows);
        finish();
      } catch (error) {
        alert.textContent = error.message;
        save.disabled = false;
      }
    });
    return {
      open,
      finish,
      get editing() {
        return mode !== 'read';
      }
    };
  }
  window.StudioProductSheet = {
    create,
    mediaFor
  };
})();
