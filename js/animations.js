/* CSS provides sticky scenes; both scroll engines share one reversible renderer.
   Narrative text and buttons remain available throughout the journey. */
(() => {
  const { clamp, phase, smooth, progressAt, beatAt, boatAt, printingAt } = window.SindhScrollMath;
  const systemMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 760px)');
  const reduced = () => systemMotion.matches || document.body.classList.contains('reduce-motion');
  const scenes = [...document.querySelectorAll('[data-scene]')].map(element => ({
    element, kind: element.dataset.scene,
    beats: [...element.querySelectorAll('.story-beat')], stage: element.querySelector('.scene-sticky'),
    count: element.querySelector('.scene-count'), meter: element.querySelector('.scene-meter i'),
    buildings: [...element.querySelectorAll('.city-building')], motifs: [...element.querySelectorAll('.cloth-motif')],
    layers: Object.fromEntries(['city-drain','city-bath','city-sun','city-streets','journey-boat','journey-hills','journey-fields','journey-village','journey-foreground','journey-ripples','journey-sun','cloth-unfold','printing-block','topi-reveal'].map(name => [name, element.querySelector(`.${name}`)])),
    active: -1, progress: -1
  }));
  const ownedStyles = new Map();
  let gsapContext, motionObserver, resizeFrame;
  let usingGSAP = false, enabled = false;
  const visibleFlows = new Set();
  function style(element, property, value) {
    if (!element) return;
    if (!ownedStyles.has(element)) ownedStyles.set(element, new Set());
    ownedStyles.get(element).add(property);
    element.style[property] = value;
  }
  function layer(element, x = 0, y = 0, scale = 1, opacity = 1, rotate = 0) {
    style(element, 'transform', `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(4)})`);
    style(element, 'opacity', opacity.toFixed(4));
  }
  function bounds(scene) {
    const first = scene.beats[0].getBoundingClientRect();
    const last = scene.beats[2].getBoundingClientRect();
    const stickyHeight = scene.stage.offsetHeight;
    const checkpoint = mobile.matches && innerHeight > 540
      ? stickyHeight + Math.max(0, innerHeight - stickyHeight) * .42 : innerHeight * .5;
    const start = first.top + first.height / 2 + scrollY - checkpoint;
    return { start: start - first.height * .35, end: last.top + last.height / 2 + scrollY - checkpoint + last.height * .2 };
  }
  function render(scene, value) {
    const p = clamp(value);
    if (scene.progress === p) return;
    scene.progress = p;
    style(scene.meter, 'transform', `scaleX(${p})`);
    const active = beatAt(p);
    if (active !== scene.active) {
      scene.active = active;
      scene.count.textContent = `0${active + 1} / 03`;
      scene.beats.forEach((beat, i) => beat.classList.toggle('is-current', i === active));
    }
    const l = scene.layers;
    if (scene.kind === 'city') {
      scene.buildings.forEach((building, i) => {
        const v = smooth(phase(p, i * .017, .16 + i * .017));
        layer(building, 0, (1 - v) * 75, .92 + v * .08, v);
      });
      style(l['city-streets'], 'opacity', String(.15 + phase(p, .23, .5) * .85));
      style(l['city-drain'], 'strokeDashoffset', String(1 - phase(p, .36, .68)));
      const bath = smooth(phase(p, .64, .94));
      layer(l['city-bath'], 0, (1 - bath) * 20, .93 + bath * .07, .22 + bath * .78);
      layer(l['city-sun'], 0, (1 - p) * 12);
    } else if (scene.kind === 'river') {
      const boat = boatAt(p);
      layer(l['journey-boat'], boat.x, boat.y, 1, 1, Math.sin(p * Math.PI * 3) * 2);
      layer(l['journey-hills'], -30 * p);
      layer(l['journey-fields'], -50 * p);
      layer(l['journey-village'], -70 * p, 0, 1, .7 + phase(p, .15, .5) * .3);
      layer(l['journey-foreground'], -90 * p);
      layer(l['journey-ripples'], p * 35);
      layer(l['journey-sun'], 0, -25 * p);
    } else if (scene.kind === 'cloth') {
      style(l['cloth-unfold'], 'transform', `scaleY(${.2 + smooth(phase(p, 0, .14)) * .8})`);
      const stamp = printingAt(p);
      scene.motifs.forEach((motif, i) => {
        const v = smooth(clamp(stamp.amount - i));
        style(motif, 'opacity', String(v));
        style(motif, 'transform', `scale(${.88 + .12 * v})`);
      });
      const x = 300 + (stamp.index % 6) * 80;
      const y = 190 + Math.floor(stamp.index / 6) * 80;
      layer(l['printing-block'], x, y - (1 - stamp.contact) * 22, 1.05 - stamp.contact * .05,
        phase(p, .06, .12) * (1 - phase(p, .78, .85)));
      const topi = smooth(phase(p, .8, 1));
      layer(l['topi-reveal'], 0, (1 - topi) * 55, .8 + topi * .2, topi, (1 - topi) * 8);
    }
  }
  const flows = [
    { element: document.querySelector('#welcome'), kind: 'hero' },
    ...[...document.querySelectorAll('[data-flow]')].map(element => ({ element, kind: element.dataset.flow })),
    ...[...document.querySelectorAll('.chapter-bridge')].map(element => ({ element, kind: 'bridge' }))
  ];
  const hero = Object.fromEntries(['hero-intro','skyline-layer','landscape-layer','birds'].map(name => [name, document.querySelector(`.${name}`)]));
  const poetry = ['poetry-manuscript','poetry-instrument','poetry-lettering','poetry-strings'].map(name => document.querySelector(`.${name}`));
  const crafts = [...document.querySelectorAll('.craft')];
  const memories = [...document.querySelectorAll('.memory-piece')];
  function renderFlow(flow, p) {
    if (flow.kind === 'hero') {
      layer(hero['hero-intro'], 0, -p * 45, 1, 1 - p * .55);
      layer(hero['skyline-layer'], 0, -p * 30, 1 + p * .06);
      layer(hero['landscape-layer'], 0, p * 10, 1 + p * .035);
      layer(hero.birds, p * 110, -p * 28, 1, 1, -8);
    } else if (flow.kind === 'poetry') {
      const open = smooth(phase(p, 0, .62));
      style(poetry[0], 'transform', `translateY(${(1-open)*25}px) scaleX(${.12+.88*open})`);
      layer(poetry[1], 0, (1-open)*25, 1, 1, (1-open)*-8);
      style(poetry[2], 'opacity', String(phase(p, .46, .75)));
      layer(poetry[3], Math.sin(p * Math.PI * 14) * .8);
    } else if (flow.kind === 'history') {
      flow.element.querySelectorAll('.history-layer').forEach((item, i) => {
        const v = smooth(phase(p, i * .07, .3 + i * .07));
        layer(item, 0, (1 - v) * 35, .96 + v * .04, .35 + .65 * v);
      });
    } else if (flow.kind === 'crafts') {
      crafts.forEach((craft, i) => {
        const v = smooth(phase(p, i*.055, .18+i*.055));
        const focused = craft.contains(document.activeElement);
        layer(craft, 0, focused ? 0 : (1-v)*45, 1, focused ? 1 : .55 + v*.45);
      });
    } else if (flow.kind === 'finale') {
      memories.forEach((piece,i) => {
        const v = smooth(phase(p, i*.035, .25+i*.035));
        layer(piece, (i-2.5)*(1-v)*18, (1-v)*25, .75+.25*v, .2+.8*v, (i-2.5)*(1-v)*5);
      });
    } else {
      style(flow.element.querySelector('.bridge-pattern'), 'opacity', String(phase(p, .1, .8) * .65));
      style(flow.element.querySelector('.bridge-ripples'), 'opacity', String(1 - p * .8));
      flow.element.querySelectorAll('.bridge-symbol').forEach((symbol,i) => layer(symbol, 0, 0, .8+p*.2, 1, (i ? 1 : -1)*p*35));
    }
  }
  function tick() {
    if (!enabled) return;
    if (!usingGSAP) scenes.forEach(scene => {
      const rect = scene.element.getBoundingClientRect();
      if (rect.top > innerHeight) { render(scene, 0); return; }
      if (rect.bottom < 0) { render(scene, 1); return; }
      const range = bounds(scene);
      render(scene, progressAt(scrollY, range.start, range.end));
    });
    flows.forEach(flow => {
      if (motionObserver && !visibleFlows.has(flow.element)) return;
      const rect = flow.element.getBoundingClientRect();
      const p = flow.kind === 'hero' ? clamp(-rect.top / rect.height)
        : progressAt(innerHeight * .94 - rect.top, 0, innerHeight * .68 + rect.height * .25);
      renderFlow(flow, p);
    });
  }
  function teardown() {
    gsapContext?.revert(); gsapContext = null; usingGSAP = false;
    motionObserver?.disconnect(); motionObserver = null; visibleFlows.clear();
    ownedStyles.forEach((properties, element) => properties.forEach(property => { element.style[property] = ''; }));
    ownedStyles.clear(); document.body.classList.remove('story-motion');
    scenes.forEach(scene => {
      scene.progress = -1; scene.active = -1;
      scene.beats.forEach(beat => beat.classList.remove('is-current'));
      scene.count.textContent = '03 / 03';
    });
  }
  function setup() {
    teardown(); enabled = !reduced();
    if (!enabled) return;
    document.body.classList.add('story-motion');
    tick();
    if ('IntersectionObserver' in window) {
      motionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => entry.isIntersecting ? visibleFlows.add(entry.target) : visibleFlows.delete(entry.target));
        tick();
      }, { rootMargin: '100px' });
      flows.forEach(flow => motionObserver.observe(flow.element));
    }
    if (!window.gsap || !window.ScrollTrigger) return;
    try {
      window.gsap.registerPlugin(window.ScrollTrigger);
      gsapContext = window.gsap.context(() => {
        scenes.forEach(scene => {
          const state = { progress: 0 };
          window.gsap.to(state, {
            progress: 1, ease: 'none', onUpdate: () => render(scene, state.progress),
            scrollTrigger: { trigger: scene.element, start: () => bounds(scene).start,
              end: () => bounds(scene).end, scrub: .25, invalidateOnRefresh: true }
          });
        });
      });
      usingGSAP = true; window.ScrollTrigger.refresh();
    } catch { gsapContext?.revert(); gsapContext = null; usingGSAP = false; tick(); }
  }
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url; script.async = true; script.onload = resolve; script.onerror = reject;
      document.head.append(script);
    });
  }
  window.SindhMotion = {
    init() {
      setup();
      loadScript('https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js')
        .then(() => loadScript('https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js'))
        .then(setup).catch(() => {});
      mobile.addEventListener('change', setup);
      window.addEventListener('resize', () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(tick); }, { passive: true });
      document.fonts?.ready.then(() => { if (usingGSAP) window.ScrollTrigger.refresh(); tick(); });
    },
    refresh: setup,
    reflow() {
      if (usingGSAP) window.ScrollTrigger.refresh();
      tick();
    },
    tick
  };
})();
