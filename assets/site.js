/* SPOILS V2 — shared behaviour. No framework, progressive enhancement. */
(function () {
  document.documentElement.classList.remove('no-js');

  /* ---- always open a new page at the top ----
     Some in-app viewers (and back/forward caches) keep the previous page's
     scroll position. Start every page at the top unless the link targets a #section. */
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  function toTop() {
    if (location.hash && document.getElementById(location.hash.slice(1))) return;
    try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); }
    var first = document.querySelector('.toprule') || document.body;
    try { first.scrollIntoView({ block: 'start', behavior: 'instant' }); } catch (e) { first.scrollIntoView(true); }
  }
  toTop();
  window.addEventListener('load', toTop);
  window.addEventListener('pageshow', function (e) { if (e.persisted) toTop(); });
  var D = window.SPOILS_DATA || { nextHunt: {}, pastHunts: [], links: {} };
  var H = D.nextHunt || {};
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function ph() { return 'Announced soon'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---- hunt data → page ---- */
  var labels = { teaser: 'ONE DETAIL THAT DOESN\'T ADD UP', name: 'HUNT NAME', dateLabel: 'DATE', timeLabel: 'TIME', reward: 'REWARD', entry: 'FEE or Free', winners: 'WINNERS' };
  document.querySelectorAll('[data-hunt]').forEach(function (el) {
    var k = el.getAttribute('data-hunt'); el.innerHTML = H[k] ? esc(H[k]) : ph(labels[k] || k.toUpperCase());
  });
  document.querySelectorAll('[data-register]').forEach(function (a) { a.href = H.registerUrl || D.links.app; });
  document.querySelectorAll('[data-status]').forEach(function (el) {
    var s = H.status || 'next'; el.textContent = s === 'live' ? '● Live now' : s === 'claimed' ? 'SPOILS claimed' : 'Next hunt';
  });
  var known = !!(H.name && H.dateLabel && H.timeLabel);
  document.querySelectorAll('[data-if-hunt]').forEach(function (el) { el.hidden = !known; });
  document.querySelectorAll('[data-if-nohunt]').forEach(function (el) { el.hidden = known; });
  if (H.name) document.title = document.title.replace('[HUNT NAME]', H.name);
  else document.title = document.title.replace('[HUNT NAME]', 'The next hunt');

  var past = D.pastHunts || [];
  document.querySelectorAll('[data-past="posters"]').forEach(function (box) {
    var n = parseInt(box.getAttribute('data-limit') || '99', 10);
    box.innerHTML = past.slice(0, n).map(function (h) {
      return '<div class="claimed rv"><span class="tag">' + esc(h.date || '') + '</span><h3>' + esc(h.name) + '</h3><p class="rw">Reward: ' + esc(h.reward || '') + '</p>' + (h.note ? '<p class="nt">' + esc(h.note) + '</p>' : '') + '<span class="stamp">' + esc(h.status || 'SPOILS claimed') + '</span></div>';
    }).join('');
  });
  document.querySelectorAll('[data-past="table"]').forEach(function (tb) {
    tb.innerHTML = past.map(function (h) {
      return '<tr><td>' + esc(h.name) + (h.note ? '<small>' + esc(h.note) + '</small>' : '') + '</td><td data-th="Date">' + esc(h.date || '') + '</td><td data-th="Reward">' + esc(h.reward || '') + '</td><td data-th="Result"><span class="stamp">' + esc(h.status || 'SPOILS claimed') + '</span></td></tr>';
    }).join('');
  });

  /* ---- toasts (guide component) ---- */
  var region = document.createElement('div');
  region.className = 'toasts'; region.setAttribute('role', 'status'); region.setAttribute('aria-live', 'polite');
  document.body.appendChild(region);
  function toast(kind, msg) {
    var t = document.createElement('div'); t.className = 'toast toast-' + kind; t.textContent = msg; region.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 200); }, 4200);
  }
  document.querySelectorAll('[data-club]').forEach(function (a) {
    if (D.links.huntersClub) { a.href = D.links.huntersClub; return; }
    a.href = '#'; a.setAttribute('aria-disabled', 'true');
    a.addEventListener('click', function (e) { e.preventDefault(); toast('info', 'Hunters Club link coming soon. Follow @spoilsapp.'); });
  });

  /* ---- countdown ---- */
  document.querySelectorAll('[data-countdown]').forEach(function (el) {
    var t = H.opensAt ? Date.parse(H.opensAt) : NaN, cells = el.querySelectorAll('b');
    if (isNaN(t)) { el.classList.add('idle'); cells.forEach(function (c) { c.textContent = '--'; }); el.setAttribute('aria-label', 'Start time to be announced'); return; }
    function tick() {
      var s = Math.max(0, Math.floor((t - Date.now()) / 1000));
      var v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
      cells.forEach(function (c, i) { c.textContent = String(v[i]).padStart(2, '0'); });
      el.setAttribute('aria-label', v[0] + ' days ' + v[1] + ' hours ' + v[2] + ' minutes until the first clue');
    }
    tick(); setInterval(tick, 1000);
  });

  /* ---- warm-up clue (site teaser, not a real hunt) ---- */
  document.querySelectorAll('form[data-warmup]').forEach(function (f) {
    var answer = f.getAttribute('data-warmup'), after = document.querySelector(f.getAttribute('data-after'));
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = f.querySelector('input'), v = (inp.value || '').trim().toLowerCase().replace(/[^a-z]/g, '');
      var msg = document.getElementById(inp.getAttribute('aria-describedby'));
      var note = f.closest('.note');
      function fail(text) {
        inp.setAttribute('aria-invalid', 'true'); if (msg) { msg.textContent = text; msg.className = 'msg err'; }
        f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); inp.focus(); inp.select();
      }
      if (!v) { fail('Type a stage code, then check in.'); return; }
      if (v === answer) {
        inp.removeAttribute('aria-invalid'); if (msg) { msg.textContent = 'Stage checked in. Next clue unlocked.'; msg.className = 'msg ok'; }
        toast('ok', 'Stage checked in. Next clue unlocked.');
        inp.disabled = true; var b = f.querySelector('button'); b.disabled = true; b.textContent = 'Checked in';
        if (note && !note.querySelector('.note-stamp')) { var st = document.createElement('span'); st.className = 'stamp note-stamp'; st.setAttribute('aria-hidden', 'true'); st.textContent = 'Checked in'; note.appendChild(st); }
        if (after) after.hidden = false;
      } else { fail('Incorrect stage code. Try again: the answer is one word from our footer.'); }
    });
  });

  /* ---- menu ---- */
  var menu = document.getElementById('menu'), openBtn = document.querySelector('.hd .mbtn');
  function setMenu(open) {
    menu.classList.toggle('open', open); menu.setAttribute('aria-hidden', String(!open));
    openBtn.setAttribute('aria-expanded', String(open)); document.body.style.overflow = open ? 'hidden' : '';
    (open ? menu.querySelector('.menu-close') : openBtn).focus();
  }
  if (menu && openBtn) {
    openBtn.addEventListener('click', function () { setMenu(true); });
    menu.querySelector('.menu-close').addEventListener('click', function () { setMenu(false); });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
      if (e.key === 'Tab') {
        var f = menu.querySelectorAll('a,button'), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---- floating join sticker: after the first screen, never over the footer ---- */
  var fl = document.querySelector('.float'), ft = document.querySelector('.ft');
  function floatCheck() {
    if (!fl) return;
    var past = window.scrollY > window.innerHeight * 0.9;
    var nearFoot = ft && ft.getBoundingClientRect().top < window.innerHeight;
    fl.classList.toggle('on', past && !nearFoot);
  }
  var fq = false; window.addEventListener('scroll', function () { if (fq) return; fq = true; requestAnimationFrame(function () { fq = false; floatCheck(); }); }, { passive: true }); floatCheck();

  /* ---- motion: split headings into words, index staggered children ---- */
  if (!reduce) document.documentElement.classList.add('motion');
  function splitWords(el) {
    var i = 0, nodes = Array.prototype.slice.call(el.childNodes);
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var w = document.createElement('span'); w.className = 'w'; w.style.setProperty('--i', i++); w.textContent = part; frag.appendChild(w);
        });
        el.replaceChild(frag, n);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') {
        var wrap = document.createElement('span'); wrap.className = 'w'; wrap.style.setProperty('--i', i++);
        el.replaceChild(wrap, n); wrap.appendChild(n);
      }
    });
    el.classList.add('split');
    return i;
  }
  if (!reduce) {
    document.querySelectorAll('.poster, .big').forEach(function (h) {
      if (h.closest('[hidden]') || h.closest('.menu')) return;
      var n = splitWords(h);
      if (h.closest('.hero')) h.style.setProperty('--words', n);
    });
  }
  /* ---- brand dots: a full stop in display type becomes the SPOILS. dot ----
     The real "." stays in the page (visually hidden) for copy/paste and screen readers. */
  function dotify(root) {
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [], n;
    while ((n = tw.nextNode())) {
      if (n.parentNode.closest('.dot,.ph,code,.post,script,style,svg')) continue;
      if (/\S[.,](?=\s|$)/.test(n.nodeValue)) list.push(n);
    }
    list.forEach(function (t) {
      var frag = document.createDocumentFragment(), re = /(\S+?)([.,])(?=\s|$)/g, last = 0, m, v = t.nodeValue;
      while ((m = re.exec(v))) {
        if (m.index > last) frag.appendChild(document.createTextNode(v.slice(last, m.index)));
        var w = document.createElement('span'); w.className = 'dw'; w.appendChild(document.createTextNode(m[1]));
        var d = document.createElement('span');
        if (m[2] === ',') { d.className = 'cm'; d.textContent = ','; } else { d.className = 'dot'; d.innerHTML = '<span>.</span>'; }
        w.appendChild(d);
        frag.appendChild(w); last = re.lastIndex;
      }
      if (last < v.length) frag.appendChild(document.createTextNode(v.slice(last)));
      t.parentNode.replaceChild(frag, t);
    });
  }
  document.querySelectorAll('.poster, .big, .mid, .say, h1, h2, h3').forEach(function (h) {
    if (h.closest('.menu') || h.closest('.post') || h.classList.contains('tag')) return;
    dotify(h);
  });

  ['.clues', '.tickets', '.posts', '.steps', '.hunter-list', '.people', '.stagger', '.posters', '.rules', '.brandlist', '.qa'].forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (box) {
      Array.prototype.forEach.call(box.children, function (c, i) { c.style.setProperty('--i', i); });
    });
  });
  var hero = document.querySelector('.hero');
  if (hero) requestAnimationFrame(function () { hero.classList.add('go'); });

  /* ---- reveal ---- */
  var els = document.querySelectorAll('.trailwrap,.partners,.rv,.rvx,.hunter-list li,.split,.rules li,.brandlist li,.qa details');
  if (reduce || !('IntersectionObserver' in window)) els.forEach(function (e) { e.classList.add('in'); });
  else {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
    els.forEach(function (e) { if (!e.closest('.hero')) io.observe(e); else e.classList.add('in'); });
  }

  /* ---- marquee pause control (WCAG 2.2.2: moving content can be paused) ---- */
  document.querySelectorAll('.marq').forEach(function (m) {
    if (reduce) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'marq-toggle'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', 'Pause the ticker');
    b.innerHTML = '<svg class="ic ic-pause" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M7 5h3.5v14H7zm6.5 0H17v14h-3.5z"/></svg><svg class="ic ic-play" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l10.5-6.5z"/></svg>';
    b.addEventListener('click', function () {
      var paused = m.classList.toggle('paused');
      b.setAttribute('aria-pressed', String(paused));
      b.setAttribute('aria-label', paused ? 'Play the ticker' : 'Pause the ticker');
    });
    m.appendChild(b);
  });

  /* ---- partners marquee: always drifting, speeds up and follows the direction you scroll,
     slows down under the cursor. Pausable (WCAG 2.2.2); still row with reduced motion. ---- */
  document.querySelectorAll('[data-pmarq]').forEach(function (m) {
    var sec = m.closest('.partners'), track = m.querySelector('.ptrack'), set = track.querySelector('.pset');
    track.querySelectorAll('.pset').forEach(function (ps) { Array.prototype.forEach.call(ps.children, function (c, i) { c.style.setProperty('--k', i); }); });
    if (reduce) return;
    sec.classList.add('running');
    var x = 0, base = -38, boost = 0, dir = 1, hoverK = 1, hoverT = 1, paused = false, visible = false, lastY = window.scrollY, lastT = 0, raf = 0;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'pmarq-toggle'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', 'Pause the partner logos');
    b.innerHTML = '<svg class="ic ic-pause" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M7 5h3.5v14H7zm6.5 0H17v14h-3.5z"/></svg><svg class="ic ic-play" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l10.5-6.5z"/></svg>';
    b.addEventListener('click', function () {
      paused = !paused; sec.classList.toggle('paused', paused);
      b.setAttribute('aria-pressed', String(paused)); b.setAttribute('aria-label', paused ? 'Play the partner logos' : 'Pause the partner logos');
      if (!paused) start();
    });
    sec.appendChild(b);
    m.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hoverT = .15; });
    m.addEventListener('pointerleave', function () { hoverT = 1; });
    /* touch: tapping a logo lights it up for a moment */
    m.addEventListener('pointerdown', function (e) {
      var li = e.target.closest('.pl'); if (!li || e.pointerType === 'mouse') return;
      li.classList.add('tap'); setTimeout(function () { li.classList.remove('tap'); }, 700);
    });
    window.addEventListener('scroll', function () {
      var y = window.scrollY, dy = y - lastY; lastY = y;
      if (!visible) return;
      if (dy) dir = dy > 0 ? 1 : -1;
      boost = Math.min(boost + Math.abs(dy) * 14, 2600);
    }, { passive: true });
    function frame(t) {
      raf = 0;
      var dt = lastT ? Math.min((t - lastT) / 1000, .05) : 0; lastT = t;
      hoverK += (hoverT - hoverK) * Math.min(dt * 6, 1);
      boost *= Math.pow(.04, dt);
      var w = set.offsetWidth;
      x += (base * hoverK - boost * .9) * dir * dt;
      if (w) { x = x % w; if (x > 0) x -= w; }
      var skew = Math.max(-8, Math.min(8, boost / 180)) * -dir;
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0) skewX(' + skew.toFixed(2) + 'deg)';
      if (visible && !paused) raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && visible && !paused) { lastT = 0; raf = requestAnimationFrame(frame); } }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }, { rootMargin: '100px 0px' }).observe(m);
    } else { visible = true; start(); }
  });

  /* ---- cookie notice ---- */
  var c = document.querySelector('.cookie');
  if (c && !store('spoils_v2_cookies')) {
    setTimeout(function () { c.classList.add('show'); }, 1400);
    c.querySelectorAll('[data-cookie]').forEach(function (b) {
      b.addEventListener('click', function () { store('spoils_v2_cookies', b.getAttribute('data-cookie')); c.classList.remove('show'); if (window.gtag) gtag('consent', 'update', { analytics_storage: b.getAttribute('data-cookie') === 'essential' ? 'denied' : 'granted' }); });
    });
  }
  document.querySelectorAll('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });
  /* =================================================================
     Round 7 · touch parity + brand-dot confetti
     ================================================================= */

  /* ---- touch: a tap gives cards and the sticker their hover moment ---- */
  var tapSel = '.tk,.post,.polaroid,.clue,.sticker';
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') return;
    var el = e.target.closest && e.target.closest(tapSel); if (!el) return;
    el.classList.add('tap'); clearTimeout(el._tapT);
    el._tapT = setTimeout(function () { el.classList.remove('tap'); }, 900);
    if (el.classList.contains('sticker')) {
      var sv = el.querySelector('svg'); el._rot = (el._rot || 0) + 180;
      if (sv) sv.style.rotate = el._rot + 'deg';
    }
  }, { passive: true });

  /* ---- confetti: touch a brand dot (or come close) and it pops,
     spraying confetti into the open space beside the headline ---- */
  (function () {
    if (reduce) return;
    /* only the hero headline's dots ("...SOMETHING." and "...OTHERS MISS.") burst; every other dot stays still */
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero .poster .dot'));
    if (!dots.length) return;
    var cv = document.createElement('canvas'); cv.className = 'confetti'; cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d'), W = 0, H = 0, parts = [], raf = 0, last = 0;
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2); W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size(); window.addEventListener('resize', size, { passive: true });
    /* SPOILS colours only; each burst skips the colour of the section it's in so every dot shows */
    var PALETTE = { em: '#00D4AA', or: '#FF6B35', pu: '#7B61FF', night: '#0D1B2A', white: '#FFFFFF' };
    function colorsFor(dot) {
      var f = dot.closest('.f'), bg = f && f.classList.contains('f-em') ? 'em' : f && f.classList.contains('f-or') ? 'or'
        : f && f.classList.contains('f-pu') ? 'pu' : f && f.classList.contains('f-night') ? 'night' : f && f.classList.contains('f-paper') ? 'white' : '';
      var list = [];
      ['or', 'or', 'em', 'em', 'pu', 'night', 'white'].forEach(function (k) { if (k !== bg) list.push(PALETTE[k]); });
      return list;
    }
    function rnd(a, b) { return a + Math.random() * (b - a); }

    function burst(dot) {
      var r = dot.getBoundingClientRect(); if (!r.width) return;
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      /* every dot closes a line of text, so the open space is to its right;
         only flip left if the dot sits hard against the right edge */
      var roomR = W - x, dir = roomR > 140 ? 1 : -1, room = dir > 0 ? roomR : x;
      var narrow = W < 700, n = narrow ? 110 : 190, COLORS = colorsFor(dot), sz = narrow ? 1 : 1.35;
      /* the dot pops */
      dot.classList.remove('boom'); void dot.offsetWidth; dot.classList.add('boom');
      clearTimeout(dot._boomT); dot._boomT = setTimeout(function () { dot.classList.remove('boom'); }, 800);
      for (var i = 0; i < n; i++) {
        /* wide screens: a fan aimed up-and-across into the empty side;
           phones: an upward fountain that leans toward the roomier side */
        var deg = narrow ? rnd(-150, -30) + dir * 22 : rnd(-62, 22);
        var a = deg * Math.PI / 180, reach = narrow ? Math.max(H * .45, 260) : room * .85;
        var sp = reach * .062 * rnd(.25, 1.05);
        var vx = Math.cos(a) * sp, vy = Math.sin(a) * sp;
        if (!narrow) vx *= dir;
        /* every piece is a dot, a nod to the SPOILS. dot: mostly small, a few big */
        var big = Math.random() < .12;
        parts.push({
          x: x + rnd(-4, 4), y: y + rnd(-4, 4), vx: vx, vy: vy,
          r: (big ? rnd(5, 7.5) : rnd(2, 4.5)) * sz, c: COLORS[(Math.random() * COLORS.length) | 0],
          flip: rnd(0, 6.28), vf: rnd(.06, .16),
          t: 0, ttl: rnd(95, 160), sway: rnd(.4, 1.2)
        });
      }
      if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
    }

    function frame(t) {
      var k = last ? Math.min((t - last) / 16.667, 3) : 1; last = t;
      ctx.clearRect(0, 0, W, H);
      var alive = [];
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.t += k; if (p.t > p.ttl || p.y > H + 40) continue;
        var drag = Math.pow(.915, k);
        p.vx *= drag; p.vy = p.vy * drag + .16 * k;
        p.x += (p.vx + Math.sin(p.t * .07 + p.flip) * p.sway * .35) * k; p.y += p.vy * k;
        p.flip += p.vf * k;
        var fade = p.t > p.ttl - 25 ? (p.ttl - p.t) / 25 : 1;
        ctx.globalAlpha = Math.max(0, fade);
        ctx.fillStyle = p.c;
        var sq = .55 + .45 * Math.abs(Math.cos(p.flip));
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * sq, 0, 0, 6.283); ctx.fill();
        alive.push(p);
      }
      ctx.globalAlpha = 1; parts = alive;
      raf = parts.length ? requestAnimationFrame(frame) : 0;
      if (!raf) ctx.clearRect(0, 0, W, H);
    }

    /* how close counts as "touching": a generous ring around each dot */
    function near(dot, px, py, extra) {
      if (dot.closest('.secret:not(.open)')) return false;
      var r = dot.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > H) return false;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2, rad = Math.max(r.width * 1.2, extra);
      return (px - cx) * (px - cx) + (py - cy) * (py - cy) <= rad * rad;
    }
    function fire(dot) {
      var now = Date.now(); if (dot._lastBoom && now - dot._lastBoom < 900) return;
      dot._lastBoom = now; burst(dot);
    }

    /* touch / pen: tap on or near a dot */
    var lastTouch = 0;
    document.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      lastTouch = Date.now();
      for (var i = 0; i < dots.length; i++) if (near(dots[i], e.clientX, e.clientY, 34)) { fire(dots[i]); break; }
    }, { passive: true });

    /* mouse: moving onto or near a dot fires once; it re-arms after the pointer moves away */
    var mx = 0, my = 0, pending = false;
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (pending) return; pending = true;
      requestAnimationFrame(function () {
        pending = false;
        for (var i = 0; i < dots.length; i++) {
          var d = dots[i];
          if (near(d, mx, my, 26)) { if (!d._inside) { d._inside = true; fire(d); } }
          else if (d._inside && !near(d, mx, my, 60)) d._inside = false;
        }
      });
    }, { passive: true });
    /* mouse click on a dot always fires */
    document.addEventListener('click', function (e) {
      if (Date.now() - lastTouch < 800) return;
      for (var i = 0; i < dots.length; i++) if (near(dots[i], e.clientX, e.clientY, 26)) { dots[i]._lastBoom = 0; fire(dots[i]); break; }
    });
  })();
  /* =================================================================
     Round 8 · stamp hits + "Look closer" reveal
     ================================================================= */

  /* ---- stamps: hover (mouse) or tap/click (any device) and it slams down ---- */
  function stampHit(st) {
    if (st._busy) return; st._busy = true;
    st._flip = !st._flip;
    st.classList.remove('hitA', 'hitB'); st.classList.add(st._flip ? 'hitA' : 'hitB');
    setTimeout(function () { st._busy = false; }, 560);
  }
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType !== 'mouse') return;
    var st = e.target.closest && e.target.closest('.stamp');
    if (st && !(e.relatedTarget && st.contains(e.relatedTarget))) stampHit(st);
  }, { passive: true });
  document.addEventListener('click', function (e) {
    var st = e.target.closest && e.target.closest('.stamp');
    if (!st) { var card = e.target.closest && e.target.closest('.claimed,.clue,.record,tr'); st = card && card.querySelector('.stamp'); }
    if (st) { st._busy = false; stampHit(st); }
  });

  /* ---- "Look closer": reveal the evidence hidden in the hero ---- */
  var secret = document.getElementById('secret'), looker = document.querySelector('.hero .sticker[aria-controls="secret"]');
  /* side mode only when the card fits in the empty space without touching the headline or the sticker */
  function placeSecret() {
    if (!secret || !looker) return;
    var hero = document.querySelector('.hero'), box = hero.querySelector('.max'), h1 = hero.querySelector('.poster');
    secret.classList.remove('side', 'compact'); secret.style.width = secret.style.right = secret.style.top = '';
    var hr = hero.getBoundingClientRect(), br = box.getBoundingClientRect(), hh = h1.getBoundingClientRect(), right = 0;
    hero.querySelectorAll('.poster .w, .poster .dw').forEach(function (e) { right = Math.max(right, e.getBoundingClientRect().right); });
    var avail = br.right - right - 48;
    if (avail < 250) return;                                   /* no real empty space: phones and narrow windows fold */
    secret.classList.add('side');
    secret.style.width = Math.min(400, avail) + 'px';
    secret.style.right = Math.round(hr.right - br.right) + 'px';
    secret.style.top = Math.round(hh.top - hr.top) + 'px';     /* line up with the top of the headline */
    function fits() {
      var c = secret.querySelector('.secret-card').getBoundingClientRect(), ok = c.bottom <= hr.bottom;
      /* stay clear of anything in the buttons row that sits under the card */
      hero.querySelectorAll('.hero-row > *').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.width && r.right > c.left - 16 && r.left < c.right + 16 && c.bottom + 28 > r.top) ok = false;
      });
      return ok;
    }
    if (fits()) return;
    secret.classList.add('compact'); if (fits()) return;
    secret.classList.remove('side', 'compact'); secret.style.width = secret.style.right = secret.style.top = '';
  }
  if (secret && looker) {
    placeSecret();
    var rz = 0; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(placeSecret, 150); }, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeSecret);
    looker.addEventListener('click', function () {
      var open = !secret.classList.contains('open');
      secret.classList.toggle('open', open);
      looker.setAttribute('aria-expanded', String(open));
      if (open) {
        secret.removeAttribute('inert');
        /* phones: bring the unfolded card into view once it has opened */
        if (!secret.classList.contains('side')) setTimeout(function () {
          var r = secret.getBoundingClientRect();
          if (r.bottom > window.innerHeight) secret.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        }, 450);
      } else secret.setAttribute('inert', '');
    });
  }
})();
