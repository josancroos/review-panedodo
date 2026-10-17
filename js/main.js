/* Panedodo – kleine Interaktionen: Tabs, Quiz, Nach-oben-Button */
(() => {
  /* ---------- Tabs (Panedodo-Weg) ---------- */
  const tabs = document.querySelector('.tabs');
  const track = document.querySelector('.tabs__track');
  const links = [...document.querySelectorAll('.tabs__link')];
  const indicator = document.querySelector('.tabs__indicator');
  const VARIANTS = { '0': 'Alt', a: 'A Pille', b: 'B Editorial', c: 'C Punkte', d: 'D Kompakt', e: 'E Bütten' };
  const pad2 = n => String(n).padStart(2, '0');
  let current = links[0];

  // Variante D: kompakte Leiste mit Pfeilen und Segment-Fortschritt
  let compactLabel;
  const bars = [];
  if (tabs && links.length) {
    const compact = document.createElement('div');
    compact.className = 'tabs__compact';
    compact.innerHTML = '<button type="button" aria-label="Voriges Kapitel">←</button>' +
      '<span class="tabs__compact-label" aria-live="polite"></span>' +
      '<button type="button" aria-label="Nächstes Kapitel">→</button>';
    const barWrap = document.createElement('div');
    barWrap.className = 'tabs__bars';
    links.forEach(() => { const i = document.createElement('i'); bars.push(i); barWrap.appendChild(i); });
    track.prepend(compact);
    track.appendChild(barWrap);
    compactLabel = compact.querySelector('.tabs__compact-label');
    const [prev, next] = compact.querySelectorAll('button');
    const go = d => { const i = links.indexOf(current) + d; if (links[i]) links[i].click(); };
    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
  }

  function moveIndicator(link) {
    if (!tabs || !link || !indicator) return;
    const tr = track.getBoundingClientRect();
    const box = link.getBoundingClientRect();
    const x = box.left - tr.left + track.scrollLeft;
    let width = box.width, left = x;
    if (tabs.dataset.nav === '0') {
      width = Math.max(box.width, Math.min(170, tr.width / links.length));
      left = Math.min(x, track.scrollWidth - width);
    }
    indicator.style.width = `${width}px`;
    indicator.style.transform = `translateX(${left}px)`;
    const CLIPS = [
      'polygon(0 16%, 100% 0, 96% 100%, 4% 84%)', 'polygon(3% 0, 100% 10%, 97% 90%, 0 100%)',
      'polygon(0 6%, 96% 0, 100% 94%, 5% 100%)', 'polygon(4% 10%, 100% 0, 95% 100%, 0 90%)',
      'polygon(0 0, 97% 12%, 100% 100%, 3% 88%)', 'polygon(2% 12%, 100% 0, 98% 88%, 0 100%)'];
    indicator.style.setProperty('--ind-clip', CLIPS[links.indexOf(link) % CLIPS.length]);
    indicator.style.setProperty('--ind-c', getComputedStyle(link.parentElement).getPropertyValue('--tab-c'));
    tabs.style.setProperty('--tab-c', getComputedStyle(link.parentElement).getPropertyValue('--tab-c'));
    // aktiven Eintrag in der scrollbaren Leiste zentrieren (Mobile)
    if (track.scrollWidth > track.clientWidth) {
      track.scrollTo({ left: Math.max(0, x - (tr.width - box.width) / 2), behavior: 'smooth' });
    }
  }
  function setActive(link) {
    current = link;
    links.forEach((l, i) => {
      const active = l === link;
      l.classList.toggle('is-active', active);
      if (active) l.setAttribute('aria-current', 'step'); else l.removeAttribute('aria-current');
      if (bars[i]) bars[i].classList.toggle('is-done', i <= links.indexOf(link));
    });
    if (compactLabel) compactLabel.innerHTML = `<b>${pad2(links.indexOf(link) + 1)} / ${pad2(links.length)}</b>${link.querySelector('.tabs__label').textContent}`;
    moveIndicator(link);
    setTimeout(() => { if (current === link) moveIndicator(link); }, 450);
  }
  links.forEach(l => l.addEventListener('click', () => setActive(l)));

  // Aktiven Schritt beim Scrollen mitführen
  const steps = links.map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && steps.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const link = links.find(l => l.getAttribute('href') === `#${e.target.id}`);
          if (link) setActive(link);
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => io.observe(s));
  }
  window.addEventListener('resize', () => moveIndicator(current));

  // Varianten-Umschalter (zum Testen; ?nav=a|b|c|d|0 oder Klick unten links)
  function setVariant(v) {
    if (!VARIANTS[v] || !tabs) return;
    tabs.dataset.nav = v;
    try { localStorage.setItem('panedodo-nav', v); } catch (e) {}
    document.querySelectorAll('.navpick button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    requestAnimationFrame(() => moveIndicator(current));
    setTimeout(() => moveIndicator(current), 450);
  }
  if (tabs) {
    const pick = document.createElement('div');
    pick.className = 'navpick';
    pick.innerHTML = '<span style="padding:0 6px 0 4px;opacity:.6">Nav</span>' +
      Object.entries(VARIANTS).map(([k, n]) => `<button type="button" data-v="${k}" aria-pressed="false">${n}</button>`).join('');
    pick.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setVariant(b.dataset.v); });
    document.body.appendChild(pick);
    let v = new URLSearchParams(location.search).get('nav');
    if (!VARIANTS[v]) { try { v = localStorage.getItem('panedodo-nav'); } catch (e) {} }
    setVariant(VARIANTS[v] ? v : 'a');
    setActive(links[0]);
  }

  /* ---------- Quiz ---------- */
  const QUESTIONS = [
    { q: '«Harte Schale, weicher Kern», trifft das auf dich zu?', a: [
      ['Nö', ['Butterzopf', 'Party-Brötchen']],
      ['Yep', ['Nusstorte', 'Weihnachtsguetsli']],
    ] },
    { q: 'Alles ist besser, wenn es süss ist.', a: [
      ['Agree', ['Nusstorte', 'Weihnachtsguetsli']],
      ['Disagree', ['Butterzopf', 'Party-Brötchen']],
    ] },
    { q: 'Wie gehst du an Aufgaben ran? Immer mal wieder ein bisschen oder einmal, aber dann richtig.', a: [
      ['Mit Babyschritten ist alles zu meistern.', ['Weihnachtsguetsli', 'Party-Brötchen']],
      ['Alles zusammen, und dann ist es durch.', ['Nusstorte', 'Butterzopf']],
    ] },
    { q: 'Was ist deine Meinung zu Weihnachtsliedern?', a: [
      ['Konstant ab November.', ['Weihnachtsguetsli', 'Party-Brötchen']],
      ['Am 24. Dez. und keinen Tag früher oder später.', ['Nusstorte', 'Butterzopf']],
    ] },
    { q: 'Was sind deine Wochenendpläne?', a: [
      ['Ausschlafen und dann vielleicht ein Brunch.', ['Butterzopf']],
      ['Ich habe bereits mit 10 Personen in 4 Städten abgemacht.', ['Party-Brötchen']],
    ] },
    { q: 'Was bist du eher?', a: [
      ['Einzelgänger', ['Weihnachtsguetsli', 'Party-Brötchen']],
      ['Team-Player', ['Nusstorte', 'Butterzopf']],
    ] },
    { q: 'Was ist deine Geschirrspül-Herangehensweise?', a: [
      ['Vorspülen und rein damit.', ['Butterzopf', 'Party-Brötchen']],
      ['Zuerst lassen wir’s mal einweichen.', ['Nusstorte', 'Weihnachtsguetsli']],
    ] },
    { q: 'Wie wichtig ist es dir, ein gutes Outfit zu haben?', a: [
      ['Sehr!', ['Butterzopf', 'Party-Brötchen']],
      ['Eh… Auf die inneren Werte kommt es an.', ['Nusstorte', 'Weihnachtsguetsli']],
    ] },
    { q: 'Welche Getränke entsprechen dir?', a: [
      ['Ein Macchiato oder eine warme Schoggi', ['Weihnachtsguetsli']],
      ['Schwarztee oder ein guter Espresso', ['Nusstorte']],
    ] },
  ];
  const RESULTS = {
    Nusstorte: 'Du bist eine Nusstorte! Du hast vielleicht eine etwas harte Schale, aber dein Kern ist unglaublich süss und gehaltvoll. Du bist bodenständig und hast ordentlich Substanz. Auf dich kann man sich lange verlassen – du gehst so schnell nicht kaputt!',
    Butterzopf: 'Du bist ein Butterzopf! Du bist der Inbegriff von Gemütlichkeit und Harmonie. Ohne dich ist ein entspanntes Wochenende kein echtes Wochenende. Alle lieben dich, du bringst die Menschen am Tisch zusammen.',
    'Party-Brötchen': 'Du bist ein Party-Brötchen! Gesellig, vielseitig und immer da, wo was los ist! Du brauchst keine stundenlange Vorbereitung, um der Star des Abends zu sein. Du bist der perfekte Begleiter für spontane Aktionen.',
    Weihnachtsguetsli: 'Du bist ein Weihnachtsguetsli! Du bist voller Freude und Energie! Du verbreitest gute Laune und machst den Alltag ein bisschen bunter und süsser. Du bist ein echter Geniesser mit einer knusprigen Schale und einem weichen Kern. Stress lässt du gar nicht erst an dich ran.',
  };

  const form = document.querySelector('[data-quiz]');
  if (form) {
    const qEl = form.querySelector('[data-question]');
    const aEl = form.querySelector('[data-answers]');
    const next = form.querySelector('[data-next]');
    const result = form.querySelector('[data-result]');
    const step = form.querySelector('.quiz__step');
    const bar = form.querySelector('.progress__bar');
    const progress = form.querySelector('.progress');
    let i = 0;
    const picks = [];

    function render() {
      const { q, a } = QUESTIONS[i];
      qEl.textContent = q;
      aEl.innerHTML = a.map(([label], answerIndex) =>
        `<label class="answer"><input type="radio" name="q${i}" value="${answerIndex}" required>${label}</label>`
      ).join('');
      next.disabled = true;
      next.textContent = i === QUESTIONS.length - 1 ? 'Resultat' : 'Next';
      bar.style.width = `${((i + 1) / QUESTIONS.length) * 100}%`;
      progress.setAttribute('aria-valuenow', i + 1);
    }
    aEl.addEventListener('change', () => { next.disabled = false; });

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (step.hidden) { // Neustart
        i = 0; picks.length = 0; step.hidden = false; result.hidden = true; render(); return;
      }
      const checked = form.querySelector(`input[name="q${i}"]:checked`);
      if (!checked) return;
      picks.push(checked.value);
      if (++i < QUESTIONS.length) { render(); aEl.querySelector('input')?.focus(); return; }
      const scores = Object.fromEntries(Object.keys(RESULTS).map(product => [product, 0]));
      picks.forEach((answerIndex, questionIndex) => {
        QUESTIONS[questionIndex].a[answerIndex][1].forEach(product => { scores[product] += 1; });
      });
      const product = Object.keys(scores).sort((a, b) => scores[b] - scores[a])[0];
      step.hidden = true;
      result.hidden = false;
      const resultText = RESULTS[product];
      const headlineEnd = resultText.indexOf('!') + 1;
      const headline = document.createElement('strong');
      headline.textContent = resultText.slice(0, headlineEnd);
      result.replaceChildren(headline, document.createTextNode(resultText.slice(headlineEnd)));
      next.textContent = 'Nochmals';
      next.disabled = false;
    });
    render();
  }

  /* ---------- Nach oben ---------- */
  const toTop = document.querySelector('.to-top');
  if (toTop) {
    const onScroll = () => toTop.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();

/* Kapitel-Bilder sanft einblenden */
(() => {
  const frames = document.querySelectorAll('.frame.reveal');
  if (!frames.length || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('js');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  frames.forEach((f) => io.observe(f));
})();

/* Kontakt: Brief öffnet sich beim Scrollen (Klappe → Brief steigt auf → Formular erscheint) */
(() => {
  const section = document.querySelector('.kontakt');
  const env = document.querySelector('[data-env]');
  if (!section || !env || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const flap = env.querySelector('.env__flap');
  const letter = env.querySelector('.env__letter');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const range = (p, a, b) => clamp((p - a) / (b - a));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let ticking = false;

  function update() {
    ticking = false;
    const r = section.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - window.innerHeight));
    const f = ease(range(p, .05, .30));
    const rise = ease(range(p, .28, .58));
    const form = ease(range(p, .56, .78));
    const drop = ease(range(p, .55, .85));
    section.style.setProperty('--flap', f.toFixed(4));
    section.style.setProperty('--rise', rise.toFixed(4));
    section.style.setProperty('--form', form.toFixed(4));
    section.style.setProperty('--drop', drop.toFixed(4));
    flap.dataset.side = f > .5 ? 'back' : 'front';
    // Formular erst bedienbar, wenn der Brief offen ist
    if (form > .85) letter.removeAttribute('inert'); else letter.setAttribute('inert', '');
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
