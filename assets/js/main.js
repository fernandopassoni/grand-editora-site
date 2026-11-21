/* =========================================================
   Grand Editora — interações
   ========================================================= */
(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  /* ---------- Header, progress, scrollspy, floating CTA ---------- */
  const header = $('#siteHead');
  const progress = $('#scrollProgress');
  const floatCta = $('#floatCta');
  const navLinks = $$('.nav-link');
  const contactSection = $('#contato');
  let ticking = false;

  const spySections = [
    ['inicio', $('#inicio')],
    ['areas', $('#areas')],
    ['solucoes', $('#solucoes')],
    ['lousa', $('#lousa')],
    ['portal', $('#portal')],
    ['clientes', $('#clientes')],
    ['faq', $('#faq')],
    ['contato', $('#contato')]
  ];

  function updateScrollUI() {
    const y = window.scrollY || document.documentElement.scrollTop;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (header) header.classList.toggle('is-scrolled', y > 24);

    const marker = y + 140;
    let current = '';
    spySections.forEach(([id, el]) => {
      if (el && el.offsetTop <= marker) current = id;
    });
    const navMap = { inicio: 'inicio', areas: 'areas', solucoes: 'solucoes', lousa: 'lousa', portal: 'solucoes', clientes: 'clientes', faq: 'contato', contato: 'contato' };
    const navTarget = navMap[current] || current;
    navLinks.forEach(a => {
      const on = a.getAttribute('href') === '#' + navTarget;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });

    if (floatCta) {
      let show = y > 760;
      if (contactSection) {
        const r = contactSection.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.78 && r.bottom > 0) show = false;
      }
      floatCta.classList.toggle('is-visible', show);
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateScrollUI);
    }
  }, { passive: true });
  window.addEventListener('resize', updateScrollUI);
  updateScrollUI();

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('#menuBtn');
  const mobileMenu = $('#mobileMenu');
  const mmLinks = $$('[data-mm-link]');
  let lastFocus = null;

  function menuIsOpen() {
    return mobileMenu.classList.contains('is-open');
  }

  function setMenu(open) {
    if (!mobileMenu) return;
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('is-locked', open);
    document.body.classList.toggle('menu-open', open);
    if (open) {
      lastFocus = document.activeElement;
      mobileMenu.inert = false;
      setTimeout(() => mobileMenu.focus({ preventScroll: true }), 120);
    } else {
      mobileMenu.inert = true;
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }
  }

  if (menuBtn && mobileMenu) {
    mobileMenu.inert = true;
    menuBtn.addEventListener('click', () => setMenu(!menuIsOpen()));
    mmLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));

    document.addEventListener('keydown', e => {
      if (!menuIsOpen()) return;
      if (e.key === 'Escape') {
        setMenu(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = $$('a[href], button:not([disabled])', mobileMenu).filter(el => el.getClientRects().length > 0);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-in'));
  } else {
    const revealIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => revealIO.observe(el));
  }

  /* ---------- Count-up stats ---------- */
  const counters = $$('.count');
  function runCounter(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    if (reduced) {
      el.textContent = String(target);
      return;
    }
    const duration = target > 100 ? 1500 : 1100;
    const start = performance.now();
    function step(now) {
      const p = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      counters.forEach(runCounter);
    } else {
      const countIO = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            countIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(el => countIO.observe(el));
    }
  }

  /* ---------- Tilt ---------- */
  if (canHover && !reduced) {
    $$('[data-tilt]').forEach(el => {
      let frame = null;
      const isHero = el.classList.contains('hero-frame');
      const maxTilt = isHero ? 7 : 3.2;
      el.addEventListener('pointermove', (e) => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          const rotY = px * maxTilt * 2;
          const rotX = -py * maxTilt * 2;
          el.style.transform = isHero
            ? `rotateY(${rotY}deg) rotateX(${rotX}deg)`
            : `perspective(900px) rotateY(${rotY}deg) rotateX(${rotX}deg) translateY(-6px)`;
          frame = null;
        });
      });
      el.addEventListener('pointerleave', () => {
        if (frame) cancelAnimationFrame(frame);
        frame = null;
        el.style.transform = '';
      });
    });
  }

  /* ---------- Áreas: painéis expansíveis ---------- */
  const areasWrap = $('#areasTrack');
  const areaCards = $$('.area', areasWrap || document);
  const areasDots = $$('#areasDots button');
  const mobileAreas = window.matchMedia('(max-width: 900px)');

  function openArea(index) {
    areaCards.forEach((card, i) => card.classList.toggle('is-open', i === index));
  }
  if (areaCards.length) {
    openArea(0);
    areaCards.forEach((card, index) => {
      card.addEventListener('mouseenter', () => {
        if (!mobileAreas.matches) openArea(index);
      });
      card.addEventListener('focusin', () => {
        if (!mobileAreas.matches) openArea(index);
      });
    });
  }

  if (areasWrap && areasDots.length) {
    let areaTicking = false;
    areasWrap.addEventListener('scroll', () => {
      if (!areaTicking) {
        areaTicking = true;
        requestAnimationFrame(() => {
          const card = areasWrap.firstElementChild;
          if (card) {
            const step = card.offsetWidth + 12;
            const i = clamp(Math.round(areasWrap.scrollLeft / step), 0, areasDots.length - 1);
            areasDots.forEach((d, k) => d.classList.toggle('is-active', k === i));
          }
          areaTicking = false;
        });
      }
    }, { passive: true });

    areasDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const card = areaCards[i];
        if (card) areasWrap.scrollTo({ left: card.offsetLeft - areasWrap.offsetLeft - 20, behavior: reduced ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------- Soluções: filtros ---------- */
  const filterButtons = $$('.filter-btn');
  const solCards = $$('.sol-card');
  const filterEmpty = $('#filterEmpty');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      filterButtons.forEach(b => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      let visible = 0;
      solCards.forEach(card => {
        const cats = (card.dataset.cats || '').split(' ');
        const show = filter === 'todos' || cats.includes(filter);
        card.hidden = !show;
        card.classList.remove('is-filtered');
        if (show) {
          visible++;
          void card.offsetWidth;
          card.classList.add('is-filtered');
        }
      });
      if (filterEmpty) filterEmpty.hidden = visible > 0;
    });
  });

  /* pointer glow for solution cards */
  if (canHover) {
    solCards.forEach(card => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
      });
    });
  }

  /* ---------- Soluções: modal de detalhes ---------- */
  const solutions = {
    anima: {
      cat: 'Conteúdo · Imersivo', icon: 'i-cube', interest: 'Conteúdos educacionais',
      title: 'Animações e simulações em 2D e 3D',
      desc: 'Transformamos conceitos abstratos em imagens em movimento. Animações e simulações 2D e 3D ajudam o aluno a ver, manipular e compreender aquilo que, no quadro, seria apenas uma explicação.',
      bullets: ['Roteirização alinhada ao currículo da instituição', 'Produção em 2D e 3D com linguagem visual consistente', 'Uso em aula, portal educacional ou AVA']
    },
    rv: {
      cat: 'Imersivo', icon: 'i-vr', interest: 'Conteúdos educacionais',
      title: 'Criação de realidade aumentada e virtual',
      desc: 'Camadas digitais sobre o mundo real ou experiências totalmente imersivas: a realidade aumentada e a virtual aproximam o conteúdo do aluno e ampliam a compreensão de temas complexos.',
      bullets: ['Realidade aumentada em tablets e celulares', 'Experiências imersivas em 3D', 'Integração com aulas, projetos e feiras de ciências']
    },
    interativas: {
      cat: 'Conteúdo', icon: 'i-hand', interest: 'Conteúdos educacionais',
      title: 'Aulas interativas',
      desc: 'Aulas que pedem a participação do aluno: exercícios, quizzes, exploração e feedback imediato. O conteúdo deixa de ser passivo e passa a ser experiência.',
      bullets: ['Atividades guiadas por objetivo de aprendizagem', 'Feedback imediato para o aluno', 'Prontas para projetor, tablet ou AVA']
    },
    videoaulas: {
      cat: 'Conteúdo', icon: 'i-play', interest: 'Conteúdos educacionais',
      title: 'Videoaulas e apostilas digitais',
      desc: 'Produção de videoaulas e apostilas digitais com linguagem clara e a identidade da instituição, para que o aluno estude no seu ritmo e revise quando precisar.',
      bullets: ['Videoaulas com roteiro e produção profissional', 'Apostilas digitais organizadas por aula', 'Acesso pelo portal educacional ou AVA']
    },
    games: {
      cat: 'Conteúdo · Imersivo', icon: 'i-game', interest: 'Conteúdos educacionais',
      title: 'Games educacionais',
      desc: 'Desafios, fases e recompensas que mantêm o aluno engajado enquanto consolida o aprendizado. O jogo entra como ferramenta pedagógica, não como pausa na aula.',
      bullets: ['Mecânicas de jogo aplicadas ao conteúdo', 'Progressão por desafios e conquistas', 'Uso individual ou em grupo']
    },
    apps: {
      cat: 'Plataforma', icon: 'i-mobile', interest: 'Portal / AVA',
      title: 'Aplicativos para tablets e celulares',
      desc: 'Aplicativos sob medida para levar o conteúdo da instituição a qualquer tela, com uma experiência pensada para o toque e para a rotina do aluno.',
      bullets: ['Interface desenhada para toque', 'Acesso por aluno', 'Integração com o portal e o AVA']
    },
    formacao: {
      cat: 'Formação', icon: 'i-teacher', interest: 'Treinamento de professores',
      title: 'Treinamento e capacitação de professores',
      desc: 'Tecnologia só funciona com gente preparada. Capacitamos professores e equipes para usar cada recurso com segurança e intenção pedagógica.',
      bullets: ['Formação prática, com apoio de materiais', 'Capacitação do staff da instituição', 'Acompanhamento da implantação']
    },
    maker: {
      cat: 'Conteúdo · Projeto', icon: 'i-wrench', interest: 'Conteúdos educacionais',
      title: 'Projeto de Espaço Maker',
      desc: 'Planejamos o espaço, os equipamentos e as atividades para transformar a escola em um laboratório de criação, onde o aluno aprende fazendo.',
      bullets: ['Layout e infraestrutura do espaço', 'Definição de equipamentos', 'Trilhas de projetos para os alunos']
    },
    portal: {
      cat: 'Plataforma', icon: 'i-globe', interest: 'Portal / AVA',
      title: 'Portal Educacional',
      desc: 'Um portal com a identidade da instituição para organizar conteúdos, cursos e comunicados em um só lugar, com navegação simples para alunos e equipes.',
      bullets: ['Identidade visual da instituição', 'Organização por segmento e curso', 'Acesso web em qualquer dispositivo']
    },
    ava: {
      cat: 'Plataforma', icon: 'i-laptop', interest: 'Portal / AVA',
      title: 'AVA — Ambiente Virtual de Aprendizagem',
      desc: 'Ambiente completo para hospedar cursos, acompanhar turmas e enxergar a evolução dos alunos, Integrado aos conteúdos e à formação da sua equipe.',
      bullets: ['Gestão de turmas e cursos', 'Trilhas de aulas e atividades', 'Acompanhamento do progresso dos alunos']
    }
  };

  const dialog = $('#solDialog');
  const sdTitle = $('#sdTitle');
  const sdCat = $('#sdCat');
  const sdDesc = $('#sdDesc');
  const sdList = $('#sdList');
  const sdIconUse = $('#sdIcon use');
  const sdCta = $('#sdCta');
  let currentSolution = null;

  function openSolution(key, trigger) {
    const data = solutions[key];
    if (!data || !dialog) return;
    currentSolution = data;
    if (sdTitle) sdTitle.textContent = data.title;
    if (sdCat) sdCat.textContent = data.cat;
    if (sdDesc) sdDesc.textContent = data.desc;
    if (sdIconUse) sdIconUse.setAttribute('href', '#' + data.icon);
    if (sdList) {
      sdList.innerHTML = '';
      data.bullets.forEach(text => {
        const li = document.createElement('li');
        li.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-check"/></svg><span></span>';
        li.querySelector('span').textContent = text;
        sdList.appendChild(li);
      });
    }
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    document.body.classList.add('is-locked');
    dialog.dataset.trigger = trigger ? trigger.id || 'sol-trigger' : '';
    setTimeout(() => dialog.focus(), 40);
  }

  function closeSolution() {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    document.body.classList.remove('is-locked');
  }

  $$('.sol-card').forEach(card => {
    const btn = card.querySelector('.sol-open');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openSolution(btn.dataset.sol, btn);
    });
    card.addEventListener('click', (e) => {
      if (e.target.closest('.sol-open')) return;
      if (window.getSelection && String(window.getSelection()).length > 0) return;
      openSolution(btn.dataset.sol, btn);
    });
  });
  const sdClose = $('#sdClose');
  if (sdClose) sdClose.addEventListener('click', closeSolution);
  if (dialog) {
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) closeSolution();
    });
    dialog.addEventListener('close', () => document.body.classList.remove('is-locked'));
  }
  if (sdCta) {
    sdCta.addEventListener('click', () => {
      const interest = currentSolution ? currentSolution.interest : null;
      closeSolution();
      if (interest) prefillInterest(interest);
      const target = $('#contato');
      if (target) setTimeout(() => target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }), 80);
    });
  }

  /* ---------- Lousa: diferenciais + hotspots ---------- */
  const features = [
    { icon: 'i-hand', title: 'É touch, é digital e é convencional', text: 'Você prefere o touch do seu celular ou escrever numa lousa branca com pincel? Aqui você terá tudo ao mesmo tempo.' },
    { icon: 'i-chip', title: 'Módulo processador', text: 'Integrado e dedicado Intel: é isso mesmo, tudo que você precisa, numa só solução.' },
    { icon: 'i-lock', title: 'Segurança', text: 'Design moderno com as famosas quinas abauladas e painel deslizante com fechadura, duas das clássicas assinaturas do desenho exclusivo QuadriLine.' },
    { icon: 'i-volume', title: 'Sistema de som Audio System', text: 'Já vem com entrada pronta para microfone e com equalizador: perfeita para ampliar a potência vocal do seu professor.' },
    { icon: 'i-pen', title: 'Design', text: 'Leve um pai numa sala com Lousa interativa e veja o que acontece. É só elogios.' },
    { icon: 'i-ruler', title: 'Múltiplas medidas', text: 'Nós somos fábrica e por isso temos vários tamanhos para você escolher.' },
    { icon: 'i-arrows', title: 'É retrátil e pronta para o futuro', text: 'Para integrar a lousa digital ou a tela de projeção na convencional ou até mesmo uma televisão, desenvolvemos uma tecnologia exclusiva de painel deslizante sem angulação e sem quebra de escrita.' },
    { icon: 'i-display', title: 'Lousa Digital QuadriLine', text: 'Não é qualquer lousa digital integrada. É a Lousa Digital QuadriLine, com todos os seus diferenciais tecnológicos. Elas nasceram para viver juntas.' },
    { icon: 'i-gears', title: 'Instalação, Configuração e Treinamento', text: 'Mais do que vender, é capacitar: ajudamos a calcular todas as variáveis do seu projeto, instalando, configurando e treinando seu staff para a correta utilização das soluções e produtos.' },
    { icon: 'i-marker', title: 'Porta pincel', text: 'Sim, ele também está lá.' }
  ];
  const featureButtons = $$('.feature-btn');
  const hotspots = $$('.hotspot');
  const fdIndex = $('#fdIndex');
  const fdTitle = $('#fdTitle');
  const fdText = $('#fdText');
  const fdIconUse = $('#fdIcon use');
  const featProgress = $('#featProgress');
  const featureDetail = $('.feature-detail');
  let currentFeature = 0;

  function setFeature(index, announce) {
    if (!features[index]) return;
    currentFeature = index;
    const data = features[index];
    if (fdIndex) fdIndex.textContent = String(index + 1).padStart(2, '0');
    if (fdTitle) fdTitle.textContent = data.title;
    if (fdText) fdText.textContent = data.text;
    if (fdIconUse) fdIconUse.setAttribute('href', '#' + data.icon);
    if (featProgress) featProgress.style.width = ((index + 1) / features.length) * 100 + '%';
    featureButtons.forEach((b, i) => b.classList.toggle('is-active', i === index));
    hotspots.forEach(h => {
      const idx = parseInt(h.dataset.feature, 10);
      h.classList.toggle('is-active', idx === index);
      h.setAttribute('aria-pressed', String(idx === index));
    });
    if (announce && featureDetail) {
      featureDetail.classList.remove('is-flash');
      void featureDetail.offsetWidth;
      featureDetail.classList.add('is-flash');
    }
  }

  featureButtons.forEach((btn, i) => {
    btn.addEventListener('click', () => setFeature(i, true));
  });
  hotspots.forEach(h => {
    h.addEventListener('click', () => {
      const i = parseInt(h.dataset.feature, 10);
      setFeature(i, true);
      if (window.innerWidth < 1080) {
        const panel = $('.lousa-panel');
        if (panel) panel.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      }
    });
  });
  const featPrev = $('#featPrev');
  const featNext = $('#featNext');
  if (featPrev) featPrev.addEventListener('click', () => setFeature((currentFeature - 1 + features.length) % features.length, true));
  if (featNext) featNext.addEventListener('click', () => setFeature((currentFeature + 1) % features.length, true));
  setFeature(0, false);

  /* ---------- Portal: tabs ---------- */
  const portalTabs = $$('.portal-tab');
  const screens = {
    video: $('#panel-video'),
    quiz: $('#panel-quiz'),
    game: $('#panel-game')
  };
  const sideItems = $$('.b-side .b-item');

  function selectTab(key, focus) {
    portalTabs.forEach(tab => {
      const on = tab.id === 'tab-' + key;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
    });
    Object.keys(screens).forEach(k => {
      const screen = screens[k];
      if (!screen) return;
      const on = k === key;
      screen.classList.toggle('is-active', on);
      screen.hidden = !on;
    });
    sideItems.forEach((item, i) => {
      const map = { video: 0, quiz: 1, game: 2 };
      item.classList.toggle('is-on', i === map[key]);
    });
    if (key !== 'video') pauseVideo();
  }

  portalTabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab.id.replace('tab-', '')));
    tab.addEventListener('keydown', (e) => {
      const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      let next = i;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % portalTabs.length;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + portalTabs.length) % portalTabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = portalTabs.length - 1;
      selectTab(portalTabs[next].id.replace('tab-', ''), true);
    });
  });

  /* ---------- Portal: video demo ---------- */
  const videoPlay = $('#videoPlay');
  const videoIconUse = $('#videoPlayIcon use');
  const videoFill = $('#videoFill');
  const videoTime = $('#videoTime');
  let videoPlaying = false;
  let videoRaf = null;
  let videoStart = 0;
  let videoProgress = 0;
  const VIDEO_DURATION = 768; // 12:48 in seconds
  const DEMO_SECONDS = 16;

  function fmt(seconds) {
    const s = Math.floor(seconds);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function paintVideo() {
    if (videoFill) videoFill.style.width = (videoProgress * 100) + '%';
    if (videoTime) videoTime.textContent = fmt(videoProgress * VIDEO_DURATION);
  }

  function videoLoop(now) {
    if (!videoPlaying) return;
    const elapsed = (now - videoStart) / 1000;
    videoProgress = clamp(elapsed / DEMO_SECONDS, 0, 1);
    paintVideo();
    if (videoProgress >= 1) {
      pauseVideo(true);
      return;
    }
    videoRaf = requestAnimationFrame(videoLoop);
  }

  function playVideo() {
    if (!videoPlay) return;
    if (videoProgress >= 1) {
      videoProgress = 0;
      paintVideo();
    }
    videoPlaying = true;
    videoStart = performance.now() - videoProgress * DEMO_SECONDS * 1000;
    videoPlay.classList.add('is-playing');
    videoPlay.setAttribute('aria-label', 'Pausar videoaula de demonstração');
    if (videoIconUse) videoIconUse.setAttribute('href', '#i-pause');
    videoRaf = requestAnimationFrame(videoLoop);
  }

  function pauseVideo(ended) {
    if (!videoPlay) return;
    videoPlaying = false;
    if (videoRaf) cancelAnimationFrame(videoRaf);
    videoRaf = null;
    videoPlay.classList.remove('is-playing');
    videoPlay.setAttribute('aria-label', 'Reproduzir videoaula de demonstração');
    if (videoIconUse) videoIconUse.setAttribute('href', '#i-play');
    if (ended && videoProgress >= 1) videoProgress = 1;
    paintVideo();
  }

  if (videoPlay) {
    videoPlay.addEventListener('click', () => {
      if (videoPlaying) pauseVideo();
      else playVideo();
    });
    paintVideo();
  }

  /* ---------- Portal: quiz demo ---------- */
  const quizOptions = $$('.quiz-opt');
  const quizFeedback = $('#quizFeedback');
  const quizReset = $('#quizReset');
  let quizAnswered = false;

  function resetQuiz() {
    quizAnswered = false;
    quizOptions.forEach(opt => {
      opt.disabled = false;
      opt.classList.remove('is-correct', 'is-wrong');
    });
    if (quizFeedback) {
      quizFeedback.className = 'quiz-feedback';
      quizFeedback.innerHTML = '<p>Escolha uma alternativa para testar.</p>';
    }
  }

  quizOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      if (quizAnswered) return;
      quizAnswered = true;
      const correct = opt.dataset.correct === 'true';
      quizOptions.forEach(o => {
        o.disabled = true;
        if (o.dataset.correct === 'true') o.classList.add('is-correct');
      });
      if (!correct) opt.classList.add('is-wrong');
      if (quizFeedback) {
        quizFeedback.className = 'quiz-feedback ' + (correct ? 'is-good' : 'is-bad');
        quizFeedback.innerHTML = correct
          ? '<p><b>Isso mesmo!</b> 2/4 é equivalente a 1/2 — os dois representam a metade de um todo.</p>'
          : '<p><b>Quase!</b> A resposta certa é <b>2/4</b>: simplificando, 2/4 também representa 1/2.</p>';
      }
    });
  });
  if (quizReset) quizReset.addEventListener('click', resetQuiz);

  /* ---------- Portal: memory game ---------- */
  const memoryGame = $('#memoryGame');
  const memCards = $$('.mem-card');
  const gameMoves = $('#gameMoves');
  const gameMsg = $('#gameMsg');
  const gameReset = $('#gameReset');
  let flipped = [];
  let matched = 0;
  let moves = 0;
  let lockBoard = false;

  function resetGame() {
    flipped = [];
    matched = 0;
    moves = 0;
    lockBoard = false;
    if (gameMoves) gameMoves.textContent = '0';
    if (gameMsg) {
      gameMsg.textContent = 'Encontre os três pares.';
      gameMsg.classList.remove('is-win');
    }
    memCards.forEach(card => {
      card.classList.remove('is-flipped', 'is-matched');
      card.disabled = false;
      card.setAttribute('aria-label', 'Carta virada');
    });
    // shuffle
    const shuffled = memCards.slice().sort(() => Math.random() - 0.5);
    shuffled.forEach(card => memoryGame && memoryGame.appendChild(card));
  }

  function checkMatch() {
    const [a, b] = flipped;
    if (a.dataset.key === b.dataset.key) {
      a.classList.add('is-matched');
      b.classList.add('is-matched');
      a.disabled = true;
      b.disabled = true;
      a.setAttribute('aria-label', 'Par encontrado');
      b.setAttribute('aria-label', 'Par encontrado');
      flipped = [];
      matched++;
      if (matched === 3) {
        if (gameMsg) {
          gameMsg.textContent = 'Parabéns! Você encontrou todos os pares em ' + moves + ' jogadas.';
          gameMsg.classList.add('is-win');
        }
      }
    } else {
      lockBoard = true;
      setTimeout(() => {
        a.classList.remove('is-flipped');
        b.classList.remove('is-flipped');
        a.setAttribute('aria-label', 'Carta virada');
        b.setAttribute('aria-label', 'Carta virada');
        flipped = [];
        lockBoard = false;
      }, 750);
    }
  }

  memCards.forEach(card => {
    card.addEventListener('click', () => {
      if (lockBoard || card.classList.contains('is-flipped') || card.classList.contains('is-matched')) return;
      card.classList.add('is-flipped');
      card.setAttribute('aria-label', 'Carta revelada');
      flipped.push(card);
      if (flipped.length === 2) {
        moves++;
        if (gameMoves) gameMoves.textContent = String(moves);
        checkMatch();
      }
    });
  });
  if (gameReset) gameReset.addEventListener('click', resetGame);

  /* ---------- FAQ ---------- */
  const faqItems = $$('.faq-item');
  faqItems.forEach(item => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      faqItems.forEach(other => {
        if (other !== item && other.open) other.open = false;
      });
    });
  });

  /* ---------- Form ---------- */
  const form = $('#contactForm');
  const formBody = $('#formBody');
  const formSuccess = $('#formSuccess');
  const fNome = $('#fNome');
  const fEmail = $('#fEmail');
  const fTel = $('#fTel');
  const fInst = $('#fInst');
  const fMsg = $('#fMsg');
  const fOk = $('#fOk');
  const fStatus = $('#fStatus');
  const chips = $$('#chips .chip');
  const MAIL_USER = 'fernandopassoni';
  const MAIL_DOMAIN = 'gmail.com';

  function chipValues() {
    return chips.filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.interest);
  }

  function prefillInterest(value) {
    if (!value) return;
    const chip = chips.find(c => c.dataset.interest === value);
    if (!chip) return;
    chips.forEach(c => {
      const on = c === chip ? true : c.getAttribute('aria-pressed') === 'true';
      c.setAttribute('aria-pressed', String(on));
    });
    chip.classList.add('is-prefilled');
    setTimeout(() => chip.classList.remove('is-prefilled'), 1600);
  }

  $$('[data-fill]').forEach(link => {
    link.addEventListener('click', () => prefillInterest(link.dataset.fill));
  });

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const on = chip.getAttribute('aria-pressed') !== 'true';
      chip.setAttribute('aria-pressed', String(on));
    });
  });

  function fieldWrap(input) {
    return input ? input.closest('.field') : null;
  }

  function setError(input, hasError) {
    if (!input) return;
    input.classList.toggle('has-error', hasError);
    input.setAttribute('aria-invalid', String(hasError));
    const wrap = fieldWrap(input);
    if (wrap) wrap.classList.toggle('is-invalid', hasError);
  }

  function validate() {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((fEmail.value || '').trim());
    const checks = [
      [fNome, (fNome.value || '').trim().length >= 2],
      [fEmail, emailOk],
      [fMsg, (fMsg.value || '').trim().length >= 3]
    ];
    let firstBad = null;
    checks.forEach(([input, ok]) => {
      setError(input, !ok);
      if (!ok && !firstBad) firstBad = input;
    });
    return { valid: checks.every(([, ok]) => ok) && fOk.checked, firstBad, consent: fOk.checked };
  }

  function buildMessage() {
    const interests = chipValues();
    const lines = [
      'Nome: ' + fNome.value.trim(),
      'E-mail: ' + fEmail.value.trim(),
      'Telefone / WhatsApp: ' + (fTel.value.trim() || '-'),
      'Instituição: ' + (fInst.value.trim() || '-'),
      'Interesses: ' + (interests.length ? interests.join(', ') : '-'),
      '',
      'Mensagem:',
      fMsg.value.trim()
    ];
    return lines.join('\n');
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (fStatus) {
        fStatus.className = 'form-status';
        fStatus.textContent = '';
      }
      const result = validate();
      if (!result.valid) {
        if (!result.consent) {
          if (fStatus) {
            fStatus.className = 'form-status is-error';
            fStatus.textContent = 'Marque a concordância de contato para enviar sua mensagem.';
          }
          fOk.focus();
          return;
        }
        if (fStatus) {
          fStatus.className = 'form-status is-error';
          fStatus.textContent = 'Preencha os campos obrigatórios destacados para continuar.';
        }
        if (result.firstBad) result.firstBad.focus();
        return;
      }

      const body = buildMessage();
      const subject = 'Contato pelo site — ' + fNome.value.trim();
      if (formSuccess && formBody) {
        const preview = $('#fsPreview');
        if (preview) preview.textContent = body;
        formBody.hidden = true;
        formSuccess.hidden = false;
        formSuccess.setAttribute('tabindex', '-1');
        formSuccess.focus({ preventScroll: true });
        const note = $('#fsNote');
        if (note) note.textContent = '';
      }

      const mailto = 'mailto:' + MAIL_USER + '@' + MAIL_DOMAIN +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
      // small delay so the success state renders before the mail client opens
      setTimeout(() => { window.location.href = mailto; }, 220);
    });
  }

  if (fTel) {
    fTel.addEventListener('input', () => {
      const digits = fTel.value.replace(/\D/g, '').slice(0, 11);
      if (!digits) { fTel.value = ''; return; }
      if (digits.length <= 2) {
        fTel.value = '(' + digits;
      } else {
        const cut = digits.length > 10 ? 7 : 6;
        fTel.value = '(' + digits.slice(0, 2) + ') ' + digits.slice(2, cut) + (digits.length > cut ? '-' + digits.slice(cut) : '');
      }
    });
  }

  [fNome, fEmail, fMsg].forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
      setError(input, false);
      if (fStatus && fStatus.classList.contains('is-error')) {
        fStatus.className = 'form-status';
        fStatus.textContent = '';
      }
    });
  });

  const fsCopy = $('#fsCopy');
  if (fsCopy) {
    fsCopy.addEventListener('click', async () => {
      const text = ($('#fsPreview') || {}).textContent || '';
      const note = $('#fsNote');
      try {
        await navigator.clipboard.writeText(text);
        if (note) note.textContent = 'Mensagem copiada para a área de transferência.';
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); if (note) note.textContent = 'Mensagem copiada para a área de transferência.'; }
        catch (e2) { if (note) note.textContent = 'Selecione o texto acima e copie manualmente.'; }
        document.body.removeChild(ta);
      }
    });
  }

  const fsAgain = $('#fsAgain');
  if (fsAgain) {
    fsAgain.addEventListener('click', () => {
      if (formSuccess && formBody) {
        formSuccess.hidden = true;
        formBody.hidden = false;
      }
      if (fStatus) { fStatus.className = 'form-status'; fStatus.textContent = ''; }
      [fNome, fEmail, fTel, fInst, fMsg].forEach(i => { if (i) setError(i, false); });
      if (fNome) fNome.focus();
    });
  }

  /* ---------- Footer year + back to top ---------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  const toTop = $('#toTop');
  if (toTop) {
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Anchor links: let CSS smooth scroll handle offset ---------- */
  // Close dialogs on hash navigation for a tidy state
  window.addEventListener('hashchange', () => {
    if (menuIsOpen()) setMenu(false);
  });

})();
