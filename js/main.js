/* Panedodo – kleine Interaktionen: Tabs, Quiz, Nach-oben-Button */
(() => {
  /* ---------- Tabs (Panedodo-Weg) ---------- */
  const tabs = document.querySelector('.tabs');
  const links = [...document.querySelectorAll('.tabs__link')];
  const indicator = document.querySelector('.tabs__indicator');

  function moveIndicator(link) {
    if (!tabs || !link) return;
    const navBox = tabs.getBoundingClientRect();
    const box = link.getBoundingClientRect();
    const width = Math.max(box.width, Math.min(170, navBox.width / links.length));
    const left = Math.min(box.left - navBox.left, navBox.width - width);
    indicator.style.width = `${width}px`;
    indicator.style.transform = `translateX(${left}px)`;
  }
  function setActive(link) {
    links.forEach(l => {
      const active = l === link;
      l.classList.toggle('is-active', active);
      if (active) l.setAttribute('aria-current', 'step'); else l.removeAttribute('aria-current');
    });
    moveIndicator(link);
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
  window.addEventListener('resize', () => moveIndicator(document.querySelector('.tabs__link.is-active')));
  requestAnimationFrame(() => moveIndicator(links[0]));

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
