/* IG užuolaidų salonas — judesys: užuolaidos atsiveria (GSAP laiko juosta), roletas leidžiasi pagal slinkimą
   (ScrollTrigger scrub su išlyginimu), paslaugų langas keičia būsenas be trūkčiojimų (tween iš esamos padėties).
   Be GSAP arba su prefers-reduced-motion viskas lieka CSS: perėjimai arba iškart galutinė būsena. */
(function () {
  'use strict';
  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = window.gsap, ST = window.ScrollTrigger;
  var useG = !!G && !reduce;
  if (useG && ST) G.registerPlugin(ST);
  if (useG) html.classList.add('gs');
  var q = function (s, r) { return (r || document).querySelector(s); };
  var qa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 1. Užuolaidos atsiveria ---------- */
  var hero = q('.hero');
  var gather = parseFloat(getComputedStyle(html).getPropertyValue('--gather')) || 0.09;
  var opened = false;

  function heroRingX(side, s) {           /* žiedo poslinkis, kai skydas suspaustas iki s */
    var hw = hero.clientWidth, dir = side === 'l' ? 1 : -1;
    return function (i) { return dir * i * hw * 0.0625 * (s - 1); };
  }

  function openCurtains() {
    if (opened) return;
    opened = true;
    if (!html.classList.contains('veil')) return;
    if (!useG) { html.classList.remove('veil'); return; }   /* CSS perėjimai */
    var panels = qa('.panel'), rl = qa('.rings-l i'), rr = qa('.rings-r i');
    G.set(panels, { scaleX: 1 });
    G.set(rl.concat(rr), { x: 0 });
    G.set('.shade', { opacity: 0.45, visibility: 'visible' });
    G.set('.sunpatch', { opacity: 0 });
    G.set('.hero-copy', { y: 14, opacity: 0 });
    G.set('.hero .glow', { scale: 0.7, opacity: 0.5, transformOrigin: '70% 30%' });
    html.classList.remove('veil');                          /* inline reikšmės laiko uždarytą būseną */
    var mid = gather * 0.82;
    var tl = G.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: function () {
      G.set(panels, { clearProps: 'transform' });                 /* skydai toliau pagal CSS (--gather) */
      G.to('.hero .glow', { x: '-8%', y: '10%', duration: 16, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      var lastW = hero.clientWidth;
      window.addEventListener('resize', function () {              /* žiedai laikomi px – perskaičiuojame keičiant plotį */
        if (hero.clientWidth === lastW) return;
        lastW = hero.clientWidth;
        G.set(rl, { x: heroRingX('l', gather) });
        G.set(rr, { x: heroRingX('r', gather) });
      });
    } });
    tl.to('.rod .glint', { xPercent: 240, duration: 1.3, ease: 'power2.inOut' }, 0)
      .to('.shade', { opacity: 0, duration: 0.7, ease: 'power2.out' }, 0.05)
      .set('.shade', { visibility: 'hidden' })
      .to(panels, { scaleX: mid, duration: 1.35 }, 0.15)
      .to(rl, { x: heroRingX('l', mid), duration: 1.35, stagger: { each: 0.02, from: 'end' } }, 0.15)
      .to(rr, { x: heroRingX('r', mid), duration: 1.35, stagger: { each: 0.02, from: 'end' } }, 0.15)
      .to(panels, { scaleX: gather, duration: 0.45, ease: 'power2.out' }, 1.5)
      .to(rl, { x: heroRingX('l', gather), duration: 0.45, ease: 'power2.out' }, 1.5)
      .to(rr, { x: heroRingX('r', gather), duration: 0.45, ease: 'power2.out' }, 1.5)
      .to('.hero .glow', { scale: 1, opacity: 1, duration: 1.4, ease: 'power2.out' }, 0.4)
      .to('.hero-copy', { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.75)
      .to('.sunpatch', { opacity: 0.8, duration: 1, ease: 'power2.out' }, 0.9);
  }

  if (html.classList.contains('veil')) {
    var t0 = Date.now(), armed = false;
    var go = function () { if (armed) return; armed = true; setTimeout(openCurtains, Math.max(0, 260 - (Date.now() - t0))); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
    setTimeout(go, 900);                                     /* šriftams neatėjus – vis tiek atidarome */
  }

  /* ---------- 2. Roletas pirmame lange ---------- */
  var heroWindow = q('.hero-window');
  var heroCloth = q('.hero-window .cloth');
  if (hero && heroWindow && !reduce) {
    if (useG && ST) {
      G.set(heroCloth, { y: 0, yPercent: -100 });
      G.to(heroCloth, { yPercent: -14, ease: 'none', scrollTrigger: { trigger: hero, start: 'top 64px', end: '70% top', scrub: 0.8 } });
      window.addEventListener('load', function () { ST.refresh(); });
    } else {
      var ticking = false;
      var updateBlind = function () {
        ticking = false;
        var h = hero.offsetHeight || 1;
        heroWindow.style.setProperty('--blind', Math.min(1, Math.max(0, window.scrollY / (h * 0.75))).toFixed(3));
      };
      window.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(updateBlind); } }, { passive: true });
      updateBlind();
    }
  }

  /* ---------- 3. Paslaugų langas ---------- */
  var demo = q('#demo');
  var tabs = qa('.demo-tabs [role="tab"]');
  var cap = q('#demo-cap');
  var marker = q('.tab-marker');
  var current = 0;
  var DS = { 1: 1, 2: 0.55, 3: 0.8, 4: 0.72, 5: 0.2, 6: 0.3 };
  var CLIP = {
    l: 'polygon(0% 0%,100% 0%,100% 15%,100% 30%,100% 45%,100% 58%,100% 63%,100% 72%,100% 85%,100% 100%,0% 100%)',
    lTie: 'polygon(0% 0%,100% 0%,96% 15%,86% 30%,74% 45%,62% 58%,58% 63%,66% 72%,82% 85%,100% 100%,0% 100%)',
    r: 'polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% 85%,0% 72%,0% 63%,0% 58%,0% 45%,0% 30%,0% 15%)',
    rTie: 'polygon(0% 0%,100% 0%,100% 100%,0% 100%,18% 85%,34% 72%,42% 63%,38% 58%,26% 45%,14% 30%,4% 15%)'
  };
  var E = null, cycle = null, stateTl = null;

  function collect() {
    var stage = q('.demo-stage', demo);
    E = {
      stage: stage,
      dl: q('.drape-l', stage), dr: q('.drape-r', stage), drapes: qa('.drape', stage),
      rl: qa('.drings-l i', stage), rr: qa('.drings-r i', stage),
      cloth: q('.dwin .cloth', stage), mesh: q('.mesh', stage), ties: qa('.tie', stage),
      fabs: [qa('.fab1', stage), qa('.fab2', stage), qa('.fab3', stage), qa('.fab4', stage)],
      swBox: q('.swatches', stage), sw: qa('.swatches i', stage),
      mosq: q('.mosquito', stage), mosqSvg: q('.mosquito svg', stage),
      rod: q('.drod', stage), brackets: qa('.bracket', stage), glint: q('.drod .glint', stage),
      fv: [qa('.fv1', stage), qa('.fv2', stage), qa('.fv3', stage)]
    };
    E.rings = E.rl.concat(E.rr);
    E.all = [].concat(E.drapes, E.rings, [E.cloth, E.mesh, E.swBox, E.mosq, E.mosqSvg, E.rod, E.glint], E.ties, E.brackets, E.sw, E.fabs[0], E.fabs[1], E.fabs[2], E.fabs[3], E.fv[0], E.fv[1], E.fv[2]);
    G.set(E.dl, { transformOrigin: '0% 0%' });
    G.set(E.dr, { transformOrigin: '100% 0%' });
    G.set(E.cloth, { y: 0, yPercent: -100 });
    G.set(E.mosq, { x: 70, y: -46, rotation: -20, autoAlpha: 0 });
  }

  function demoRingX(side, s) {
    var w = E.stage.clientWidth, dir = side === 'l' ? 1 : -1;
    return function (i) { return dir * i * w * 0.0792 * (s - 1); };
  }

  function applyState(s) {
    if (!E) collect();
    if (cycle) { cycle.kill(); cycle = null; }
    if (stateTl) stateTl.kill();
    G.killTweensOf(E.all);
    var ds = DS[s], d = 1.1, ease = 'power3.inOut';
    var tl = G.timeline({ defaults: { ease: ease } });
    stateTl = tl;
    var rest = function (t) {                                 /* bendra dalis visoms būsenoms */
      tl.to(E.dl, { clipPath: s === 3 ? CLIP.lTie : CLIP.l, duration: d * 0.85 }, t);
      tl.to(E.dr, { clipPath: s === 3 ? CLIP.rTie : CLIP.r, duration: d * 0.85 }, t);
      tl.to(E.ties, { autoAlpha: s === 3 ? 1 : 0, duration: 0.5, ease: 'power2.out' }, s === 3 ? t + 0.5 : t);
      tl.to(E.cloth, { yPercent: s === 5 ? -38 : -100, duration: d * 1.15 }, t);
      tl.to(E.mesh, { autoAlpha: s === 5 ? 1 : 0, duration: 0.8, ease: 'power2.out' }, s === 5 ? t + 0.4 : t);
      tl.to(E.swBox, { autoAlpha: s === 2 ? 1 : 0, duration: 0.5, ease: 'power2.out' }, t);
      if (s === 5) {
        tl.to(E.mosq, { x: 0, y: 0, rotation: 0, autoAlpha: 1, duration: 1.3, ease: 'power3.out' }, t + 0.9);
      } else {
        tl.to(E.mosq, { x: 70, y: -46, rotation: -20, autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, t);
      }
      if (s !== 2) {
        tl.to(E.fabs[0], { autoAlpha: 1, duration: 0.8, ease: 'power2.out' }, t);
        tl.to([].concat(E.fabs[1], E.fabs[2], E.fabs[3]), { autoAlpha: 0, duration: 0.8, ease: 'power2.out' }, t);
        tl.to(E.sw, { scale: 0.9, opacity: 0.75, duration: 0.4 }, t);
      }
      if (s !== 6) {
        tl.to(E.fv[0], { autoAlpha: 1, duration: 0.5 }, t);
        tl.to([].concat(E.fv[1], E.fv[2]), { autoAlpha: 0, duration: 0.5 }, t);
        tl.set(E.glint, { xPercent: -110 }, t);
      }
    };
    if (s === 4) {
      /* kabinimo seka: karnizas įvažiuoja, laikikliai, žiedai nukrenta, užuolaidos nusileidžia nuo karnizo */
      tl.to(E.drapes, { scaleY: 0, scaleX: 0.72, duration: 0.45, ease: 'power2.in' }, 0);
      tl.to(E.rings, { autoAlpha: 0, y: -40, duration: 0.35, ease: 'power2.in' }, 0);
      tl.to(E.rod, { xPercent: -125, duration: 0.5, ease: 'power2.in' }, 0);
      tl.to(E.brackets, { autoAlpha: 0, duration: 0.3 }, 0);
      tl.set(E.rl, { x: demoRingX('l', 0.72) }, 0.5);
      tl.set(E.rr, { x: demoRingX('r', 0.72) }, 0.5);
      tl.to(E.rod, { xPercent: 0, duration: 0.95, ease: 'power3.inOut' }, 0.55);
      tl.to(E.brackets, { autoAlpha: 1, duration: 0.4, ease: 'power2.out' }, 1.35);
      tl.to(E.rings, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'back.out(1.7)', stagger: 0.05 }, 1.45);
      tl.to(E.drapes, { scaleY: 1, autoAlpha: 1, duration: 1.05, ease: 'power2.out' }, 2.15);
      rest(0);
    } else {
      tl.to(E.drapes, { scaleX: ds, scaleY: 1, autoAlpha: 1, duration: d }, 0);
      tl.to(E.rl, { x: demoRingX('l', ds), y: 0, autoAlpha: 1, duration: d }, 0);
      tl.to(E.rr, { x: demoRingX('r', ds), y: 0, autoAlpha: 1, duration: d }, 0);
      tl.to(E.rod, { xPercent: 0, duration: 0.6 }, 0);
      tl.to(E.brackets, { autoAlpha: 1, duration: 0.3 }, 0);
      rest(0);
    }
    if (s === 2) {                                             /* audinių ciklas: 4 audiniai po 2,5 s */
      cycle = G.timeline({ repeat: -1, delay: 1.2 });
      for (var k = 0; k < 4; k++) {
        var nxt = (k + 1) % 4, at = k * 2.5;
        cycle.to(E.fabs[nxt], { autoAlpha: 1, duration: 0.8, ease: 'power2.inOut' }, at);
        cycle.to(E.fabs[k], { autoAlpha: 0, duration: 0.8, ease: 'power2.inOut' }, at);
        cycle.to(E.sw[nxt], { scale: 1.15, opacity: 1, duration: 0.4 }, at);
        cycle.to(E.sw[k], { scale: 0.9, opacity: 0.75, duration: 0.4 }, at);
      }
      tl.to(E.sw[0], { scale: 1.15, opacity: 1, duration: 0.4 }, 0);
    }
    if (s === 5) {                                             /* uodas zirzia už tinklelio */
      cycle = G.timeline({ repeat: -1, yoyo: true, delay: 2.2 });
      cycle.to(E.mosqSvg, { x: 2, y: -2, rotation: 6, duration: 0.35, ease: 'sine.inOut' });
    }
    if (s === 6) {                                             /* antgaliai keičiasi, karnizas blyksi */
      cycle = G.timeline({ repeat: -1, delay: 1.2 });
      for (var m = 0; m < 3; m++) {
        var n2 = (m + 1) % 3, at2 = m * 1.5;
        cycle.to(E.fv[n2], { autoAlpha: 1, duration: 0.45 }, at2);
        cycle.to(E.fv[m], { autoAlpha: 0, duration: 0.45 }, at2);
      }
      cycle.fromTo(E.glint, { xPercent: -110 }, { xPercent: 110, duration: 1.4, ease: 'power2.inOut' }, 0.2);
      cycle.fromTo(E.glint, { xPercent: -110 }, { xPercent: 110, duration: 1.4, ease: 'power2.inOut' }, 2.5);
    }
  }

  function moveMarker(btn) {
    if (!marker || !btn) return;
    marker.style.transform = 'translateY(' + Math.round(btn.offsetTop + btn.offsetHeight / 2 - 9) + 'px)';
  }

  function select(i, focus) {
    if (!demo || !tabs.length) return;
    current = i;
    tabs.forEach(function (b, k) {
      var on = k === i;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    var s = tabs[i].getAttribute('data-s');
    if (useG) {
      demo.className = 'demo g' + s;        /* «g»: būsenos CSS taisyklės netaikomos, viską rašo GSAP */
      applyState(+s);
    } else {
      if (s === '4' && !reduce) { demo.className = 'demo pre4'; void demo.offsetWidth; }
      demo.className = 'demo s' + s;
    }
    if (cap) cap.textContent = tabs[i].getAttribute('data-cap') || '';
    moveMarker(tabs[i]);
  }

  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { select(i, false); });
    b.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); select((i + 1) % tabs.length, true); }
      else if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
      else if (k === 'Home') { e.preventDefault(); select(0, true); }
      else if (k === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
    });
  });
  if (tabs.length) {
    moveMarker(tabs[0]);
    if (useG && demo) collect();
    var rt = null, lastStageW = E ? E.stage.clientWidth : 0;
    window.addEventListener('resize', function () {
      moveMarker(tabs[current]);
      if (!useG || !E || E.stage.clientWidth === lastStageW) return;   /* tik keičiant plotį (ne adreso juostai) */
      lastStageW = E.stage.clientWidth;
      clearTimeout(rt);
      rt = setTimeout(function () {
        var ds = DS[+tabs[current].getAttribute('data-s')];
        G.set(E.rl, { x: demoRingX('l', ds) });
        G.set(E.rr, { x: demoRingX('r', ds) });
      }, 150);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveMarker(tabs[current]); });
  }

  /* API tikrinimui */
  window.IG = { select: select, gsap: useG, state: function () { return demo ? demo.className : ''; } };
})();
