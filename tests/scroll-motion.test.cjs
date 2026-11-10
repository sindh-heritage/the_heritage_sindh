// Browser-independent regression checks for reversible state and motion cleanup.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const math = require('../js/scroll-math.js');
const animationSource = fs.readFileSync(path.join(__dirname, '../js/animations.js'), 'utf8');

function fixture({ mobile = false, height = 900, gsap = false } = {}) {
  const all = [], triggers = [];
  let context, reverts = 0;
  class Element {
    constructor(top = 0, size = 100) {
      this.top = top; this.height = size; this.offsetHeight = mobile ? 280 : 600;
      this.style = {}; this.dataset = {}; this.queries = {}; this.textContent = '';
      const classes = new Set();
      this.classList = { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x), toggle: (x, flag) => flag ? classes.add(x) : classes.delete(x) };
      all.push(this);
    }
    querySelector(s) { const result = this.queries[s]; return Array.isArray(result) ? result[0] : result || null; }
    querySelectorAll(s) { return this.queries[s] || []; }
    getBoundingClientRect() { return { top: this.top - context.scrollY, bottom: this.top + this.height - context.scrollY, height: this.height }; }
    contains() { return false; }
  }
  const scenes = ['city','river','cloth'].map((kind, i) => {
    const scene = new Element(1000 + i * 2000, 1600); scene.dataset.scene = kind;
    scene.queries['.story-beat'] = [0,1,2].map(j => new Element(scene.top + j*400, 400));
    for (const name of ['scene-sticky','scene-count','scene-meter i','city-drain','city-bath','city-sun','city-streets','journey-boat','journey-hills','journey-fields','journey-village','journey-foreground','journey-ripples','journey-sun','cloth-unfold','printing-block','topi-reveal']) scene.queries['.' + name] = new Element();
    scene.queries['.city-building'] = kind === 'city' ? Array.from({length:16},() => new Element()) : [];
    scene.queries['.cloth-motif'] = kind === 'cloth' ? Array.from({length:24},() => new Element()) : [];
    return scene;
  });
  const body = new Element(), hero = new Element(0,800);
  const globals = Object.fromEntries(['hero-intro','skyline-layer','landscape-layer','birds','poetry-manuscript','poetry-instrument','poetry-lettering'].map(x => ['.'+x,new Element()]));
  const document = { body, activeElement:null, head:{append:script => script.onerror()}, createElement:() => ({}),
    querySelector: s => s === '#welcome' ? hero : globals[s], querySelectorAll:s => s === '[data-scene]' ? scenes : [] };
  const window = { SindhScrollMath:math, matchMedia:query => ({matches:query.includes('max-width') ? mobile : false,addEventListener(){}}), addEventListener(){} };
  if (gsap) {
    window.gsap = { registerPlugin(){}, context:fn => { fn(); return {revert(){reverts++;triggers.length=0;}}; }, to:(state,options) => triggers.push({state,options}) };
    window.ScrollTrigger = {refresh(){}};
  }
  context = { window, document, innerHeight:height, scrollY:0, requestAnimationFrame:fn => fn(), cancelAnimationFrame(){} };
  vm.runInNewContext(animationSource, context);
  const motion = window.SindhMotion;
  const snapshot = () => all.map(el => ({style:{...el.style},text:el.textContent}));
  return {context,motion,scenes,body,all,triggers,snapshot,reverts:() => reverts};
}

test('boat stays within the scene, with exact route endpoints', () => {
  assert.deepEqual(math.boatAt(0), {x:100,y:485});
  assert.deepEqual(math.boatAt(1), {x:850,y:450});
  let lastX = 0;
  for(let i=0;i<=1000;i++) {
    const point = math.boatAt(i/1000);
    assert.ok(point.x >= lastX && point.x <= 850);
    assert.ok(point.y >= 350 && point.y <= 575);
    lastX=point.x;
  }
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.ok(html.includes('M100 485C350 575 600 350 850 450'), 'Drawn route must match the boat geometry');
});

test('fast scroll, reverse scroll, and return produce identical states', () => {
  for (const options of [{}, {mobile:true,height:844}, {mobile:true,height:480}]) {
    const f=fixture(options); f.motion.refresh();
    const before=f.snapshot();
    f.context.scrollY=10000; f.motion.tick();
    const completed=f.snapshot();
    assert.equal(f.scenes[0].queries['.city-building'][0].style.opacity,'1.0000');
    assert.equal(f.scenes[0].queries['.city-drain'].style.strokeDashoffset,'0');
    assert.equal(f.scenes[2].queries['.cloth-motif'][23].style.opacity,'1');
    assert.equal(f.scenes[2].queries['.printing-block'].style.opacity,'0.0000');
    assert.equal(f.scenes[2].queries['.topi-reveal'].style.opacity,'1.0000');
    f.context.scrollY=2600;f.motion.tick();
    f.context.scrollY=0;f.motion.tick();assert.deepEqual(f.snapshot(),before);
    f.context.scrollY=10000;f.motion.tick();assert.deepEqual(f.snapshot(),completed);
  }
});

test('reduced motion removes all animated inline states and sticky layout', () => {
  const f=fixture();f.motion.refresh();f.context.scrollY=5400;f.motion.tick();
  f.body.classList.add('reduce-motion');f.motion.refresh();
  assert.equal(f.body.classList.contains('story-motion'),false);
  for(const el of f.all)for(const value of Object.values(el.style))assert.equal(value,'');
  const reduced=f.snapshot();f.context.scrollY=0;f.motion.tick();assert.deepEqual(f.snapshot(),reduced);
  f.body.classList.remove('reduce-motion');f.motion.refresh();
  assert.equal(f.body.classList.contains('story-motion'),true);
  assert.equal(f.scenes[2].queries['.cloth-motif'][0].style.opacity,'0');
});

test('GSAP playheads use the same renderer and are cleaned up on repeated toggles', () => {
  const f=fixture({gsap:true});f.motion.refresh();assert.equal(f.triggers.length,3);
  for(const t of f.triggers){assert.ok(t.options.scrollTrigger.end()>t.options.scrollTrigger.start());t.state.progress=1;t.options.onUpdate();}
  assert.equal(f.scenes[2].queries['.cloth-motif'][23].style.opacity,'1');
  for(let i=0;i<4;i++) {
    f.body.classList.add('reduce-motion');f.motion.refresh();assert.equal(f.triggers.length,0);
    for(const el of f.all)for(const value of Object.values(el.style))assert.equal(value,'');
    f.body.classList.remove('reduce-motion');f.motion.refresh();assert.equal(f.triggers.length,3);
  }
  assert.equal(f.reverts(),4);
});

test('phase boundaries clamp safely and printing finishes all motifs', () => {
  assert.equal(math.progressAt(-10,0,100),0);assert.equal(math.progressAt(200,0,100),1);
  assert.equal(math.progressAt(20,20,20),1);assert.equal(math.clamp(NaN),0);
  assert.equal(math.beatAt(1),2);assert.equal(math.beatAt(0),0);
  assert.equal(math.printingAt(0).amount,0);assert.equal(math.printingAt(1).amount,24);
  assert.equal(math.printingAt(1).index,23);
});
