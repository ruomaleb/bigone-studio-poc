import {
  esc,
  btn,
  tag
} from './views.mjs?v=4';
const paths = {
  history: 'M20 12a8 8 0 1 1-2-5M12 7v5l3 2',
  new: 'M12 5v14M5 12h14',
  wide: 'M14 4h6v6M20 4l-9 9M10 5H5v14h14v-5',
  close: 'M5 5l14 14M19 5L5 19',
  send: 'm3 10 18-7-7 18-3-8-8-3zM11 13l10-10',
  copy: 'M8 8h12v12H8zM5 16H3V3h13v2',
  up: 'M7 10h-4v10h4zM8 10l5-7 2 1-1 6h5l1 2-2 8H8z',
  down: 'M7 14H3V4h4zM8 14l5 7 2-1-1-6h5l1-2-2-8H8z'
};
const icon = (k, label, attrs = '') => '<button type="button" class="iconbtn" data-chat="' + k + '" title="' + esc(label) + '" aria-label="' + esc(label) + '" ' +
  attrs + '><svg aria-hidden="true" viewBox="0 0 24 24"><path d="' + paths[k] + '"/></svg></button>';
const qs = ['Quels magasins doivent confirmer leurs choix pour l’affiche A1 ?', 'Quels produits sont éligibles à chaque version de l’offre ?',
  'Que faut-il vérifier avant de valider le BAT du prospectus ?'
];
export function setupChat(get, api, notify) {
  const pane = document.querySelector('#ai'),
    opener = document.querySelector('#open-ai');
  let wide = false,
    past = false,
    busy = false,
    draft = '',
    threads = [],
    active = '',
    storage = '';
  const remember = () => {
    try {
      localStorage.setItem(storage, JSON.stringify({
        threads: threads.slice(-20),
        active
      }))
    } catch {}
  };
  const current = () => threads.find(t => t.id === active);

  function fresh() {
    const t = {
      id: crypto.randomUUID(),
      messages: []
    };
    threads.push(t);
    active = t.id;
    draft = '';
    past = false;
    remember()
  }

  function context() {
    const ctx = get(),
      id = 'studio.chat.' + ctx.workspace + '.' + (ctx.role === 'magasin' ? ctx.state.stores[0].id : 'enseigne');
    if (storage !== id) {
      storage = id;
      let data;
      try {
        data = JSON.parse(localStorage.getItem(id) || 'null')
      } catch {}
      threads = data?.threads || [];
      active = data?.active || '';
      if (!current()) fresh()
    }
    return ctx
  }

  function render() {
    if (pane.hidden) return;
    const ctx = context(),
      t = current(),
      s = ctx.state,
      shop = ctx.role === 'magasin',
      questions = shop ? ['Quelle version est affectée à mon magasin ?', 'Quels produits puis-je retenir ?', 'Quels choix ai-je confirmés ?'] : qs;
    pane.classList.toggle('wide', wide);
    let body;
    if (past) body = '<h3>Historique des conversations</h3>' + threads.slice().reverse().map(x => '<button class="suggest" data-thread="' + esc(x.id) + '">' + esc(x
      .messages[0]?.text || 'Nouvelle conversation') + '</button>').join('');
    else if (!t.messages.length) body =
      '<div class="welcome"><div class="ai-icon"><svg aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="m12 4 1.8 5.2L19 11l-5.2 1.9L12 18l-1.8-5.1L5 11l5.2-1.8zM19 2l.9 2.5 2.5.8-2.5.9L19 9l-.8-2.8-2.6-.9 2.6-.8zM5 15l.9 2.4L8 18.2l-2.1.8L5 21.5 4.2 19 2 18.2l2.2-.8z"/></svg></div><h2>Comment puis-je vous aider ?</h2><p>' +
      esc(shop ? 'Interrogez l’Assistant sur votre participation, votre offre et vos choix de supports.' :
        'Interrogez l’Assistant sur les engagements des participants, l’offre commerciale et la production des supports de cette opération.') +
      '</p></div><span class="ey">Questions suggérées</span>' + questions.map((q, i) => '<button class="suggest" data-question="' + i +
        '"><span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 17 3 21l5-2a9 8 0 1 0-3-2Z"/><path d="M7 10h10M7 13h7"/></svg></span>' +
        esc(q) + '</button>').join('');
    else body = t.messages.map((m, i) => m.role === 'user' ? '<div class="message bubble">' + esc(m.text) + '</div>' :
      '<div><span class="ai-icon"><svg aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="m12 4 1.8 5.2L19 11l-5.2 1.9L12 18l-1.8-5.1L5 11l5.2-1.8zM19 2l.9 2.5 2.5.8-2.5.9L19 9l-.8-2.8-2.6-.9 2.6-.8zM5 15l.9 2.4L8 18.2l-2.1.8L5 21.5 4.2 19 2 18.2l2.2-.8z"/></svg></span> <strong>Assistant</strong> ' +
      tag('Studio', 'violet') + '<div class="ans"><div class="message">' + esc(m.text) + '</div>' + (m.links || []).map(l => '<a href="#' + esc(l.link) + '">' +
        esc(l.label) + '</a>').join('') + (m.proposal ? btn('propose-device', 'Relire la proposition de dispositif') : '') + '</div><div>' + icon('copy',
        'Copier la réponse', 'data-index="' + i + '"') + icon('up', 'Utile', 'data-index="' + i + '" aria-pressed="' + (m.vote === 'up') + '"') + icon('down',
        'Inutile', 'data-index="' + i + '" aria-pressed="' + (m.vote === 'down') + '"') + ' <small>' + esc(m.engine || '') + '</small></div></div>').join('');
    pane.innerHTML =
      '<div class="aibar"><span class="ai-icon"><svg aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="m12 4 1.8 5.2L19 11l-5.2 1.9L12 18l-1.8-5.1L5 11l5.2-1.8zM19 2l.9 2.5 2.5.8-2.5.9L19 9l-.8-2.8-2.6-.9 2.6-.8zM5 15l.9 2.4L8 18.2l-2.1.8L5 21.5 4.2 19 2 18.2l2.2-.8z"/></svg></span><strong>Assistant</strong>' +
      icon('history', 'Historique') + icon('new', 'Nouvelle conversation') + icon('wide', wide ? 'Réduire' : 'Agrandir') + icon('close', 'Fermer l’assistant') +
      '</div><div class="aititle">' + esc(t.messages[0]?.text || 'Nouvelle conversation') + '</div><div class="aibody">' + body + (busy ?
        '<p role="status">Lecture du dossier…</p>' : '') + '</div><div class="aifoot"><div class="small">Contexte · ' + tag(shop ? s.stores[0].name : s.op
      .network) + ' ' + tag(s.op.id === 'u-2649-pbs' ? 'S49' : s.op.title) +
      '</div><form class="compose"><textarea rows="1" maxlength="600" aria-label="Question à l’assistant" placeholder="Posez une question sur cette opération">' +
      esc(draft) + '</textarea>' + icon('send', 'Envoyer', busy ? 'disabled' : '') +
      '</form><div class="small">Entrée pour envoyer · Maj + Entrée pour un retour à la ligne</div><small>Les réponses s’appuient sur les données enregistrées du dossier.</small> <button data-chat="help" class="quiet help">Aide</button></div>';
    if (t.messages.length && !past) pane.querySelector('.aibody').scrollTop = pane.querySelector('.aibody').scrollHeight;
  }
  async function ask(q) {
    q = q.trim();
    if (!q || busy) return;
    const t = current();
    const history = t.messages.slice(-4).map(m => ({
      role: m.role,
      content: m.text
    }));
    t.messages.push({
      role: 'user',
      text: q
    });
    busy = true;
    past = false;
    draft = '';
    remember();
    render();
    try {
      const r = await api('/ask', {
        question: q,
        history
      });
      t.messages.push({
        role: 'assistant',
        ...r
      })
    } catch (e) {
      t.messages.push({
        role: 'assistant',
        text: e.message,
        engine: 'Question à réessayer'
      })
    } finally {
      busy = false;
      remember();
      render();
      pane.querySelector('textarea')?.focus()
    }
  }

  function close() {
    pane.hidden = true;
    opener.setAttribute('aria-expanded', 'false');
    opener.focus()
  }
  opener.onclick = () => {
    if (!pane.hidden) {
      close();
      return
    }
    pane.hidden = false;
    opener.setAttribute('aria-expanded', 'true');
    render();
    pane.querySelector('textarea')?.focus()
  };
  pane.addEventListener('input', e => {
    if (e.target.matches('textarea')) draft = e.target.value
  });
  pane.addEventListener('submit', e => {
    e.preventDefault();
    ask(draft)
  });
  pane.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
    if (e.target.matches('textarea') && e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      ask(draft)
    }
  });
  pane.addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b) {
      if (e.target.closest('a') && innerWidth < 900) close();
      return
    }
    const ctx = context();
    if (b.dataset.question != null) {
      await ask(b.textContent.trim());
      return
    }
    if (b.dataset.thread) {
      active = b.dataset.thread;
      past = false;
      remember();
      render();
      return
    }
    const k = b.dataset.chat;
    if (k === 'close') return close();
    if (k === 'send') return ask(draft);
    if (k === 'new') {
      fresh()
    }
    if (k === 'wide') wide = !wide;
    if (k === 'history') past = !past;
    if (k === 'help') notify('Posez une question sur le dossier. Les liens des réponses ouvrent la fiche correspondante.');
    if (k === 'copy') {
      try {
        await navigator.clipboard.writeText(current().messages[+b.dataset.index].text);
        notify('Réponse copiée.')
      } catch {
        notify('Sélectionnez le texte à copier.')
      }
    }
    if (k === 'up' || k === 'down') {
      current().messages[+b.dataset.index].vote = k;
      remember();
      notify('Avis enregistré.')
    }
    render()
  });
  return {
    render,
    open: () => {
      if (pane.hidden) opener.click()
    }
  };
}
