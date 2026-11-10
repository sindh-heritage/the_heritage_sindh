/* Shared, pure geometry for native scrolling and GSAP playheads. */
(() => {
  const clamp = value => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const phase = (progress, start, end) => clamp((progress - start) / (end - start));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const progressAt = (position, start, end) => end > start ? clamp((position - start) / (end - start)) : 1;
  const beatAt = progress => Math.min(2, Math.floor(clamp(progress) * 3));
  const boatAt = progress => {
    const t = clamp(progress), u = 1 - t;
    return { x: u*u*u*100 + 3*u*u*t*350 + 3*u*t*t*600 + t*t*t*850,
      y: u*u*u*485 + 3*u*u*t*575 + 3*u*t*t*350 + t*t*t*450 };
  };
  const printingAt = progress => {
    const amount = phase(progress, .12, .78) * 24;
    return { index: Math.min(23, Math.floor(amount)), amount, contact: Math.sin((amount % 1) * Math.PI) };
  };
  const api = { clamp, phase, smooth, progressAt, beatAt, boatAt, printingAt };
  if (typeof window !== 'undefined') window.SindhScrollMath = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
