/* Navigation commune au catalogue et aux dossiers. Les destinations sont fournies
   par chaque écran en fonction de l'opération et des droits de la session. */
const StudioNavigation = (() => {
  const shapes = {
    pilotage: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    preparation: '<path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="3" fill="white"/><circle cx="16" cy="17" r="3" fill="white"/>',
    produits: '<path d="M3 4h9l9 9-8 8-10-10Z"/><circle cx="8" cy="9" r="1.4"/>',
    production: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
    administration: '<path d="M4 7h16M4 17h16"/><circle cx="16" cy="7" r="3" fill="white"/><circle cx="8" cy="17" r="3" fill="white"/>',
    menu: '<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M9 4v16"/>',
    filtres: '<path d="M3 5h18l-7 8v5l-4 2v-7z"/>'
  };
  const icon = key => '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+shapes[key]+'</svg>';
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels = {pilotage:'Pilotage',preparation:'Préparation',produits:'Produits',production:'Production',administration:'Administration'};
  const spaces = urls => Object.entries(labels).filter(([key])=>urls[key]).map(([key,label])=>({key,label,href:urls[key]}));
  let content, filterControl;
  const rail = () => document.getElementById('studio-rail');
  function expand(open) {
    rail().classList.toggle('expanded',open);
    const toggle=rail().querySelector('[data-rail-toggle]');
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Réduire le menu':'Déployer le menu');
  }
  function draw(items,active,operation='') {
    const side=rail(),expanded=side.classList.contains('expanded');
    const rows=items.map(({key,label,href,group})=>{
      const link='<a data-space href="'+escape(href)+'" title="'+escape(label)+'" aria-label="'+escape(label)+'"'+(key===active?' aria-current="page"':'')+'>'+icon(key)+'<span>'+escape(label)+'</span></a>';
      if(!group)return link;
      const toggle='<button class="rail-group" type="button" data-group="'+group.index+'" aria-label="Rubriques de '+escape(label)+'" aria-controls="group-'+group.index+'" aria-expanded="'+group.open+'"><span aria-hidden="true">'+(group.open?'⌄':'›')+'</span></button>';
      const children=group.items.map(([page,name])=>'<a href="#'+escape(page)+'" class="navpage"'+(page===group.current?' aria-current="page"':'')+'>'+escape(name)+'</a>').join('');
      return '<div class="rail-space">'+link+toggle+'</div><div class="rail-children" role="group" aria-label="'+escape(label)+'" id="group-'+group.index+'"'+(group.open?'':' hidden')+'>'+children+'</div>';
    }).join('');
    side.innerHTML='<button class="rail-toggle" data-rail-toggle type="button" aria-controls="rail-links">'+icon('menu')+'<span>Menu Studio</span></button>'+
      (operation?'<p class="rail-dossier">'+escape(operation)+'</p>':'')+'<nav id="rail-links" aria-label="Navigation principale">'+rows+'</nav>'+
      '<button type="button" class="rail-filter" aria-label="Filtres" data-rail-filters hidden>'+icon('filtres')+'<span>Filtres</span></button><div class="rail-context"></div>';
    expand(expanded);
  }
  function simpleSearch(page,spec) {
    const [selector,label]=spec;
    const entries=[...page.querySelectorAll(selector)];
    const anchor=entries[0]?.closest('table,.list,.kit-gallery,.kit-response fieldset,.inset,.sheet') || entries[0];
    if(!anchor)return;
    const box=document.createElement('div');
    box.className='studio-local-filter';
    box.innerHTML='<label>'+escape(label)+'<input type="search" data-local-search></label><span role="status"></span>';
    (anchor.closest('.listwrap,.scroll')||anchor).before(box);
    const input=box.querySelector('input'),status=box.querySelector('[role=status]');
    const normalize=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
    const indexed=entries.map(node=>[node,normalize(node.textContent)]);
    const apply=()=>{
      const term=normalize(input.value.trim());
      let count=0;
      for(const [node,source] of indexed){node.hidden=!source.includes(term);if(!node.hidden)count++;}
      status.textContent=term?(count?count+' résultat(s)':'Aucun résultat'):'';
    };
    const [path,search]=location.hash.split('?'),q=new URLSearchParams(search);
    input.value=q.get('recherche')||'';
    apply();
    input.addEventListener('input',()=>{
      apply();
      const params=new URLSearchParams(location.hash.split('?')[1]);
      if(input.value)params.set('recherche',input.value);else params.delete('recherche');
      history.replaceState(null,'',path+(params.size?'?'+params:''));
    });
  }
  function filters(page,spec) {
    if(spec && !page.querySelector('[data-local-search]'))simpleSearch(page,spec);
    content=page;
    const selector='[data-screen-filter],.list-filters select,input[type=search],select[data-filter],.filters .chip,.filters select:not([name^="flow-"]),.filters input[type=date],#dates select[name=taskfilter],.kit-stats a';
    const candidates=[...new Set([...page.querySelectorAll('[data-screen-filter],.list-filters select,[data-filter=rayon],[data-filter=notes]'),...page.querySelectorAll(selector)])];
    filterControl=candidates.find(el=>el.getClientRects().length)||candidates[0];
    if(!filterControl){
      const links=[...rail().querySelectorAll('#rail-links a,.rail-context .navpage')];
      if(links.length>1){
        const field=document.createElement('label');
        field.className='rail-lookup';
        field.innerHTML='Filtrer les rubriques<input type="search" aria-label="Filtrer les rubriques">';
        rail().querySelector('.rail-context').append(field);
        const input=field.querySelector('input');
        const results=document.createElement('div');
        results.className='rail-matches';
        field.after(results);
        input.oninput=()=>{
          const term=input.value.trim().toLocaleLowerCase('fr');
          const matches=term?links.filter(a=>a.textContent.toLocaleLowerCase('fr').includes(term)):[];
          results.replaceChildren(...matches.map(a=>{
            const match=document.createElement('a');
            match.href=a.href;match.textContent=a.textContent;return match;
          }));
          if(term&&!matches.length)results.textContent='Aucune rubrique trouvée';
        };
        filterControl=input;
      }
    }
    rail().querySelector('[data-rail-filters]').hidden=!filterControl;
  }
  function focusFilters() {
    if(!filterControl?.isConnected)filters(content);
    if(!filterControl)return;
    expand(rail().contains(filterControl));
    for(let el=filterControl.parentElement;el;el=el.parentElement)if(el.tagName==='DETAILS')el.open=true;
    filterControl.focus({preventScroll:true});
    filterControl.scrollIntoView({block:'center',inline:'nearest'});
  }
  function focusMode(on) {
    document.body.classList.toggle('studio-focus',on);
    document.querySelectorAll('[data-studio-focus]').forEach(b=>{
      b.setAttribute('aria-pressed',String(on));
      b.textContent=on?'Quitter le plein écran':'Plein écran';
    });
  }
  function focusButton() {
    const on=document.body.classList.contains('studio-focus');
    return '<button type="button" class="ed-btn" data-studio-focus aria-pressed="'+on+'">'+(on?'Quitter le plein écran':'Plein écran')+'</button>';
  }
  document.addEventListener('click',e=>{
    const button=e.target.closest('[data-studio-focus]');
    if(button){focusMode(!document.body.classList.contains('studio-focus'));button.focus();return;}
    if(e.target.closest('[data-rail-toggle]'))return expand(!rail().classList.contains('expanded'));
    if(e.target.closest('[data-rail-filters]'))return focusFilters();
    if(rail()?.classList.contains('expanded')&&(!rail().contains(e.target)||e.target.closest('a,[data-jump]')))expand(false);
  });
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape'||document.querySelector('dialog[open]'))return;
    if(rail()?.classList.contains('expanded')){expand(false);rail().querySelector('[data-rail-toggle]').focus();}
    else if(document.body.classList.contains('studio-focus')){focusMode(false);document.querySelector('[data-studio-focus]')?.focus();}
  });
  return {spaces,draw,filters,focusMode,focusButton};
})();
