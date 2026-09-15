/* IG užuolaidų salonas — užuolaidos atsiveria, roletas leidžiasi slenkant, langas rodo paslaugas */
(function () {
  'use strict';
  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Užuolaidos atsiveria, kai puslapis paruoštas (šriftai arba ne vėliau kaip po 1,5 s) */
  if (html.classList.contains('veil')) {
    var released = false;
    var release = function () {
      if (released) return;
      released = true;
      setTimeout(function () { html.classList.remove('veil'); }, 320);
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(release);
    window.addEventListener('load', release);
    setTimeout(release, 1500);
  }

  /* 2. Roletas pirmame lange leidžiasi pagal slinkimą */
  var hero = document.querySelector('.hero');
  var heroWindow = document.querySelector('.hero-window');
  if (hero && heroWindow && !reduce) {
    var ticking = false;
    var updateBlind = function () {
      ticking = false;
      var h = hero.offsetHeight || 1;
      var p = Math.min(1, Math.max(0, window.scrollY / (h * 0.75)));
      heroWindow.style.setProperty('--blind', p.toFixed(3));
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(updateBlind); }
    }, { passive: true });
    updateBlind();
  }

  /* 3. Paslaugų langas: kortelė -> lango būsena */
  var demo = document.getElementById('demo');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.demo-tabs [role="tab"]'));
  var cap = document.getElementById('demo-cap');
  var marker = document.querySelector('.tab-marker');
  var current = 0;

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
    if (s === '4' && !reduce) {
      /* kabinimo seka: karnizas įvažiuoja, žiedai nusileidžia, užuolaidos pakimba */
      demo.className = 'demo pre4';
      void demo.offsetWidth;
    }
    demo.className = 'demo s' + s;
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
    window.addEventListener('resize', function () { moveMarker(tabs[current]); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveMarker(tabs[current]); });
  }

  /* API tikrinimui */
  window.IG = { select: select, state: function () { return demo ? demo.className : ''; } };
})();
