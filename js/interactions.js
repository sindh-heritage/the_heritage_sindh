(() => {
  const facts = {
    bath: { title: 'You found the Great Bath.', kicker: 'A DISCOVERY IN MOHENJO-DARO', text: 'The Great Bath is a large brick-lined tank reached by steps. Its construction shows remarkable care in managing water. Archaeologists continue to discuss how it was used, so we should not claim to know its purpose for certain. This illustration helps you spot its shape; it is not an exact site plan.', question: 'What can the design of a building tell us about the people who made it?' },
    ralli: { title: 'Ralli quilts', kicker: 'A PATCHWORK OF MEMORIES', text: 'Made by joining colorful pieces of fabric, Ralli quilts turn small scraps into striking geometric designs. Patchwork, appliqué, and stitching reflect the skill of their makers. Used in homes and given as gifts, they carry the warmth of everyday life.', question: 'Look closely: how many different shapes can you find?' },
    pottery: { title: 'Earth, made extraordinary.', kicker: 'POTTERY & HANDICRAFTS', text: 'From useful water pots to decorative vessels, clay connects Sindh’s craft traditions to the earth itself. Potters shape, dry, decorate, and fire their work. Each handmade piece carries small differences that reveal the maker’s touch.', question: 'What everyday object would you like to make from clay?' },
    embroidery: { title: 'A story in every stitch.', kicker: 'TRADITIONAL EMBROIDERY', text: 'Colorful threads, repeating motifs, and sometimes tiny mirrors bring clothing and household textiles to life. Styles differ across communities and regions. These skills are learned through practice and shared across generations.', question: 'Ask someone at home: who taught you a traditional craft?' },
    food: { title: 'A taste of togetherness.', kicker: 'SINDHI CUISINE', text: 'Sai Bhaji is a beloved dish made with leafy greens and lentils, often served with rice. Recipes vary from family to family. Preparing a meal, welcoming a guest, and eating together are everyday ways of keeping heritage alive.', question: 'Which family dish would you pass on to the next generation?' }
  };
  const symbols = {
    ajrak: ['A welcome, woven in color.', 'Ajrak’s repeating patterns are traditionally created through a careful process of block printing and dyeing. Its deep reds and indigo blues are instantly recognizable.'],
    topi: ['A small cap. A proud identity.', 'The Sindhi Topi is known for its distinctive shape and decorative embroidery, sometimes including tiny mirrors. Worn for daily life and celebrations, it expresses cultural pride and the skill of its makers.']
  };
  let toastTimeout;
  let audioContext;
  let audioTimer;
  let playing = false;
  let noteIndex = 0;
  const activeSounds = new Set();

  function toast(message) {
    const el = document.querySelector('#toast');
    el.textContent = message;
    el.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.classList.remove('visible'), 4200);
  }

  function playNote() {
    if (!playing || !audioContext) return;
    // An original, sparse pentatonic interlude. It is not labelled folk music.
    const notes = [146.83, 220, 261.63, 293.66, 220, 174.61, 196, 146.83];
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.value = notes[noteIndex++ % notes.length];
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(.055, now + .08);
    gain.gain.exponentialRampToValueAtTime(.0001, now + 2.7);
    oscillator.connect(gain).connect(audioContext.destination);
    activeSounds.add(oscillator);
    oscillator.onended = () => { activeSounds.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(now);
    oscillator.stop(now + 2.8);
  }

  function stopSound() {
    playing = false;
    clearInterval(audioTimer);
    activeSounds.forEach(sound => { try { sound.stop(); } catch {} });
    activeSounds.clear();
    document.querySelector('#sound-toggle').setAttribute('aria-pressed', 'false');
    document.querySelector('#sound-label').textContent = 'Play a quiet interlude';
  }

  function init() {
    const chapters = document.querySelector('#chapters-dialog');
    document.querySelectorAll('[data-open-chapters]').forEach(button => button.addEventListener('click', () => chapters.showModal()));
    document.querySelectorAll('dialog').forEach(dialog => {
      dialog.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => dialog.close()));
      dialog.addEventListener('click', event => {
        const bounds = dialog.getBoundingClientRect();
        if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
      });
    });
    chapters.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      chapters.close();
      const target = document.querySelector(link.getAttribute('href'));
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }));
    document.querySelector('[data-open-about]').addEventListener('click', () => document.querySelector('#about-dialog').showModal());
    document.querySelectorAll('[data-craft], [data-discovery]').forEach(button => button.addEventListener('click', () => {
      const key = button.dataset.craft || button.dataset.discovery;
      const fact = facts[key];
      document.querySelector('#fact-image').src = `./assets/illustrations/${key}.svg`;
      document.querySelector('#fact-image').alt = key === 'bath' ? 'An artistic illustration of the stepped Great Bath' : button.querySelector('img').alt;
      document.querySelector('#fact-title').textContent = fact.title;
      document.querySelector('#fact-kicker').textContent = fact.kicker;
      document.querySelector('#fact-text').textContent = fact.text;
      document.querySelector('#fact-question').textContent = fact.question;
      document.querySelector('#fact-dialog').showModal();
    }));
    const tabs = [...document.querySelectorAll('[data-symbol]')];
    function selectTab(tab) {
      tabs.forEach(button => { const active = button === tab; button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; });
      const [heading, text] = symbols[tab.dataset.symbol];
      const panel = document.querySelector('#symbol-detail');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.querySelector('h3').textContent = heading;
      panel.querySelector('p').textContent = text;
    }
    tabs.forEach(tab => {
      tab.addEventListener('click', () => selectTab(tab));
      tab.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[tabs.length - 1] : tabs[(tabs.indexOf(tab) + 1) % tabs.length];
        selectTab(next); next.focus();
      });
    });
    document.querySelector('#sound-toggle').addEventListener('click', async () => {
      if (playing) { stopSound(); return; }
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) { toast('Audio is not supported by this browser.'); return; }
      try {
        audioContext ||= new Audio();
        await audioContext.resume();
        playing = true;
        document.querySelector('#sound-toggle').setAttribute('aria-pressed', 'true');
        document.querySelector('#sound-label').textContent = 'Pause the interlude';
        playNote(); audioTimer = setInterval(playNote, 1400);
      } catch { stopSound(); toast('Sound could not start. Please try again.'); }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopSound(); });
    window.addEventListener('pagehide', stopSound);
    document.querySelector('#share-button').addEventListener('click', async () => {
      const url = new URL(location.href); url.hash = '';
      if (location.protocol === 'file:' || ['localhost', '127.0.0.1'].includes(url.hostname)) { toast('Publish the site first to share a link that others can open.'); return; }
      if (navigator.share) {
        try { await navigator.share({ title: 'Muan Jo Daro — A Journey Through Ancient Sindh', text: 'Discover the city, its people, and the mysteries of Muan Jo Daro.', url: url.href }); return; }
        catch (error) { if (error.name === 'AbortError') return; }
      }
      try { await navigator.clipboard.writeText(url.href); toast('Journey link copied. Pass the story on!'); }
      catch { window.prompt('Copy this link to share the journey:', url.href); }
    });
  }
  window.SindhInteractions = { init, toast };
})();
