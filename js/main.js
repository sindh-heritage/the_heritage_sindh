(() => {
  const chapters = [...document.querySelectorAll('main > .chapter')];
  const motionButton = document.querySelector('#motion-toggle');
  const systemMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userReduced = false;
  try { userReduced = localStorage.getItem('sindh-reduce-motion') === 'true'; } catch {}
  let currentChapter = '';
  let scheduled = false;

  function syncMotion() {
    const reduced = userReduced || systemMotion.matches;
    document.body.classList.toggle('reduce-motion', reduced);
    motionButton.setAttribute('aria-pressed', String(reduced));
    motionButton.setAttribute('aria-label', reduced ? 'Reduced animation is on; toggle motion preference' : 'Reduce animation');
    document.querySelector('#motion-label').textContent = reduced ? 'Motion reduced' : 'Motion on';
  }
  function updateProgress() {
    scheduled = false;
    const checkpoint = window.innerHeight * .4;
    let active = chapters[0];
    for (const chapter of chapters) {
      if (chapter.getBoundingClientRect().top <= checkpoint) active = chapter;
    }
    if (active.id !== currentChapter) {
      currentChapter = active.id;
      document.querySelector('#current-chapter').textContent = active.dataset.chapter;
      document.querySelector('#current-name').textContent = active.dataset.name;
      document.querySelectorAll('#chapters-dialog nav a').forEach(link => {
        if (link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    document.querySelector('#progress-fill').style.transform = `scaleX(${scrollRange > 0 ? Math.max(0, Math.min(1, window.scrollY / scrollRange)) : 0})`;
    window.SindhMotion.tick();
  }
  function queueUpdate() { if (!scheduled) { scheduled = true; requestAnimationFrame(updateProgress); } }
  function refreshMotionAtReadingPosition() {
    // Collapsing sticky scenes should not send the reader to another chapter.
    const active = chapters.find(chapter => chapter.id === currentChapter) || chapters[0];
    const beats = [...active.querySelectorAll('.story-beat')];
    const reference = beats.length ? beats.reduce((nearest, beat) =>
      Math.abs(beat.getBoundingClientRect().top - innerHeight * .55) < Math.abs(nearest.getBoundingClientRect().top - innerHeight * .55) ? beat : nearest
    ) : active;
    const before = reference.getBoundingClientRect().top;
    syncMotion();
    window.SindhMotion.refresh();
    const difference = reference.getBoundingClientRect().top - before;
    if (Math.abs(difference) > 1) window.scrollBy({ top: difference, behavior: 'instant' });
    queueUpdate();
  }
  syncMotion();
  window.SindhInteractions.init();
  window.SindhMotion.init();
  motionButton.addEventListener('click', () => {
    if (systemMotion.matches) { window.SindhInteractions.toast('Your device has reduced motion enabled. We respect that setting.'); return; }
    userReduced = !userReduced;
    try { localStorage.setItem('sindh-reduce-motion', String(userReduced)); } catch {}
    refreshMotionAtReadingPosition();
  });
  systemMotion.addEventListener('change', refreshMotionAtReadingPosition);
  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', queueUpdate, { passive: true });
  window.addEventListener('load', queueUpdate);
  updateProgress();
})();
