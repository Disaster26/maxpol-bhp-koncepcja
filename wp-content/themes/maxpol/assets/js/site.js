(function () {
  'use strict';
  var d = document;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || d).querySelectorAll(s)); }

  /* ---------- menu mobilne + rozwijana oferta ---------- */
  var burger = $('#burger'), menu = $('#menu');
  function zamknij() { if (!menu) return; menu.classList.remove('otw'); burger.setAttribute('aria-expanded', 'false'); d.body.style.overflow = ''; }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var otw = !menu.classList.contains('otw');
      menu.classList.toggle('otw', otw); burger.setAttribute('aria-expanded', String(otw)); d.body.style.overflow = otw ? 'hidden' : '';
    });
    menu.addEventListener('click', function (e) { var a = e.target.closest('a'); if (a && a.hash && a.pathname === location.pathname) zamknij(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') zamknij(); });
    addEventListener('resize', function () { if (innerWidth > 1149) zamknij(); });
  }
  $$('.m-strz').forEach(function (b) {
    var li = b.parentNode;
    if (li.querySelector('[aria-current]')) { li.classList.add('otw'); b.setAttribute('aria-expanded', 'true'); }
    b.addEventListener('click', function () { var o = !li.classList.contains('otw'); li.classList.toggle('otw', o); b.setAttribute('aria-expanded', String(o)); });
  });

  /* ---------- paski kart i galerii: palec natywnie, mysz przeciąganiem, strzałki i klawiatura ---------- */
  var ostatniRuch = 0;
  function krokW(pas) { var el = pas.firstElementChild; return el ? el.getBoundingClientRect().width + 18 : 320; }
  function krok(pas, k) { pas.scrollBy({ left: k * krokW(pas), behavior: 'smooth' }); }
  $$('.pas').forEach(function (pas) {
    var x0 = 0, s0 = 0, ciag = false, ruch = false;
    pas.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button !== 0) return; ciag = true; ruch = false; x0 = e.clientX; s0 = pas.scrollLeft; });
    addEventListener('pointermove', function (e) {
      if (!ciag) return; var dx = e.clientX - x0;
      if (!ruch && Math.abs(dx) > 5) { ruch = true; pas.classList.add('ciag'); }
      if (ruch) { pas.scrollLeft = s0 - dx; e.preventDefault(); }
    });
    addEventListener('pointerup', function () {
      if (!ciag) return; ciag = false;
      if (ruch) { var w = krokW(pas); var cel = Math.round(pas.scrollLeft / w) * w; pas.classList.remove('ciag'); pas.scrollTo({ left: cel, behavior: 'smooth' }); ostatniRuch = Date.now(); }
      setTimeout(function () { ruch = false; }, 0);
    });
    pas.addEventListener('click', function (e) { if (ruch || Date.now() - ostatniRuch < 80) { e.preventDefault(); e.stopPropagation(); } }, true);
    pas.addEventListener('dragstart', function (e) { e.preventDefault(); });
    pas.addEventListener('keydown', function (e) {
      if (e.target !== pas) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); krok(pas, 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); krok(pas, -1); }
    });
    // strzałki nieaktywne na końcach
    var przyciski = $$('[data-pas="' + pas.id + '"]');
    function stan() {
      var max = pas.scrollWidth - pas.clientWidth - 2;
      przyciski.forEach(function (b) { b.disabled = (+b.dataset.kier < 0 && pas.scrollLeft <= 2) || (+b.dataset.kier > 0 && pas.scrollLeft >= max); });
      var para = przyciski[0] && przyciski[0].parentNode; if (para) para.style.visibility = max <= 2 ? 'hidden' : '';
    }
    pas.addEventListener('scroll', function () { requestAnimationFrame(stan); }, { passive: true });
    addEventListener('resize', stan); stan();
  });
  $$('[data-pas]').forEach(function (b) { b.addEventListener('click', function () { var p = d.getElementById(b.dataset.pas); if (p) krok(p, +b.dataset.kier); }); });

  /* ---------- powiększanie zdjęć: przesuwanie palcem, klawiatura, zoom (dwuklik / szczypanie / przycisk) ---------- */
  var lb = $('#lb');
  if (lb) {
    var img = $('#lbImg'), scena = $('#lbScena'), pod = $('#lbPodpis'), licz = $('#lbLicz'), lista = [], nr = 0, wrocDo = null;
    var sk = 1, tx = 0, ty = 0, pt = {}, start = null, pinch0 = 0, sk0 = 1, ostTap = 0;
    function ustaw(anim) { img.style.transition = anim ? 'transform .22s ease' : 'none'; img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + sk + ')'; lb.classList.toggle('zoom', sk > 1); }
    function reset() { sk = 1; tx = 0; ty = 0; ustaw(false); }
    function ogranicz() {
      if (sk <= 1) { sk = 1; tx = 0; ty = 0; return; }
      var r = scena.getBoundingClientRect(), w = img.offsetWidth * sk, h = img.offsetHeight * sk;
      var mx = Math.max(0, (w - r.width) / 2), my = Math.max(0, (h - r.height) / 2);
      tx = Math.max(-mx, Math.min(mx, tx)); ty = Math.max(-my, Math.min(my, ty));
    }
    function pokaz(i) {
      nr = (i + lista.length) % lista.length; var a = lista[nr];
      reset(); img.src = a.href; img.alt = (a.querySelector('img') || {}).alt || '';
      pod.textContent = a.dataset.podpis || ''; licz.textContent = lista.length > 1 ? (nr + 1) + ' / ' + lista.length : '';
      $('#lbPop').hidden = $('#lbNast').hidden = lista.length < 2;
      var n = lista[(nr + 1) % lista.length]; if (n) { var pre = new Image(); pre.src = n.href; }
    }
    function otworz(a) {
      lista = $$('[data-lb="' + a.dataset.lb + '"]'); wrocDo = a;
      lb.hidden = false; d.body.style.overflow = 'hidden'; pokaz(lista.indexOf(a)); $('#lbZamknij').focus();
    }
    function zamknijLb() { lb.hidden = true; d.body.style.overflow = ''; img.removeAttribute('src'); if (wrocDo) wrocDo.focus(); }
    function zoomDo(s, cx, cy) {
      var r = scena.getBoundingClientRect(), ox = (cx === undefined ? r.width / 2 : cx - r.left) - r.width / 2, oy = (cy === undefined ? r.height / 2 : cy - r.top) - r.height / 2;
      var f = s / sk; tx = ox - (ox - tx) * f; ty = oy - (oy - ty) * f; sk = s; ogranicz(); ustaw(true);
    }
    d.addEventListener('click', function (e) {
      var a = e.target.closest('[data-lb]'); if (!a || e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault(); otworz(a);
    });
    $('#lbZamknij').addEventListener('click', zamknijLb);
    $('#lbPop').addEventListener('click', function () { pokaz(nr - 1); });
    $('#lbNast').addEventListener('click', function () { pokaz(nr + 1); });
    $('#lbZoom').addEventListener('click', function () { zoomDo(sk > 1 ? 1 : 2.4); });
    scena.addEventListener('click', function (e) { if (e.target === scena && sk === 1) zamknijLb(); });
    img.addEventListener('dblclick', function (e) { zoomDo(sk > 1 ? 1 : 2.4, e.clientX, e.clientY); });
    scena.addEventListener('wheel', function (e) { e.preventDefault(); zoomDo(Math.max(1, Math.min(4, sk * (e.deltaY < 0 ? 1.18 : 1 / 1.18))), e.clientX, e.clientY); }, { passive: false });
    d.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') zamknijLb();
      else if (e.key === 'ArrowRight') pokaz(nr + 1);
      else if (e.key === 'ArrowLeft') pokaz(nr - 1);
      else if (e.key === 'Tab') { var f = $$('.lb-b:not([hidden])', lb); var i = f.indexOf(d.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
    });
    scena.addEventListener('pointerdown', function (e) {
      try { scena.setPointerCapture(e.pointerId); } catch (err) {} pt[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pt);
      if (ids.length === 1) {
        start = { x: e.clientX, y: e.clientY, tx: tx, ty: ty, t: Date.now() };
        if (e.pointerType !== 'mouse' && Date.now() - ostTap < 300) { zoomDo(sk > 1 ? 1 : 2.4, e.clientX, e.clientY); start = null; }
        ostTap = Date.now();
      } else if (ids.length === 2) {
        var a = pt[ids[0]], b = pt[ids[1]]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); sk0 = sk; start = null;
      }
    });
    scena.addEventListener('pointermove', function (e) {
      if (!pt[e.pointerId]) return; pt[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pt);
      if (ids.length === 2 && pinch0) {
        var a = pt[ids[0]], b = pt[ids[1]], s = Math.max(1, Math.min(4, sk0 * Math.hypot(a.x - b.x, a.y - b.y) / pinch0));
        sk = s; ogranicz(); ustaw(false); return;
      }
      if (!start) return;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (sk > 1) { tx = start.tx + dx; ty = start.ty + dy; ogranicz(); ustaw(false); }
      else { img.style.transition = 'none'; img.style.transform = 'translateX(' + dx + 'px)'; img.style.opacity = String(1 - Math.min(.5, Math.abs(dx) / 600)); }
    });
    function koniec(e) {
      if (!pt[e.pointerId]) return; delete pt[e.pointerId];
      if (Object.keys(pt).length < 2) pinch0 = 0;
      if (!start || sk > 1) { if (!Object.keys(pt).length) start = null; return; }
      var dx = e.clientX - start.x, dy = e.clientY - start.y; img.style.opacity = '';
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) && lista.length > 1) pokaz(nr + (dx < 0 ? 1 : -1));
      else if (dy > 110 && Math.abs(dy) > Math.abs(dx)) zamknijLb();
      else ustaw(true);
      start = null;
    }
    scena.addEventListener('pointerup', koniec);
    scena.addEventListener('pointercancel', koniec);
  }

  /* ---------- zgoda na cookies (12 miesięcy) i mapa Google ---------- */
  var ZG = 'mx_zgoda', ck = $('#ck');
  function zgCzytaj() {
    try { var z = JSON.parse(localStorage.getItem(ZG) || 'null'); if (z && z.t && Date.now() - z.t < 365 * 864e5) return z; } catch (err) {}
    var m = d.cookie.match(/(?:^|; )mx_zgoda=([^;]+)/); if (m) { var a = decodeURIComponent(m[1]).split('|'); return { mapy: a[0] === '1', stat: a[1] === '1', t: +a[2] || Date.now() }; }
    return null;
  }
  var ZGODA = zgCzytaj();
  function zgZapisz(z) {
    z.t = Date.now();
    try { localStorage.setItem(ZG, JSON.stringify(z)); } catch (err) {}
    d.cookie = 'mx_zgoda=' + encodeURIComponent((z.mapy ? '1' : '0') + '|' + (z.stat ? '1' : '0') + '|' + z.t) + '; max-age=31536000; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    ZGODA = z; zastosuj();
  }
  function mapaWczytaj(el) {
    if (el.querySelector('iframe')) return;
    var f = d.createElement('iframe'); f.title = 'Mapa dojazdu: ' + el.dataset.q; f.loading = 'lazy'; f.setAttribute('referrerpolicy', 'no-referrer-when-downgrade'); f.setAttribute('allowfullscreen', '');
    f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(el.dataset.q) + '&z=15&hl=pl&output=embed';
    el.dataset.zaslepka = el.innerHTML; el.innerHTML = ''; el.appendChild(f);
  }
  function mapaZaslepka(el) { if (el.querySelector('iframe') && el.dataset.zaslepka) { el.innerHTML = el.dataset.zaslepka; podepnij(el); } }
  function podepnij(el) { var b = $('.mz-pokaz', el); if (b) b.addEventListener('click', function () { var z = ZGODA || { stat: false }; z.mapy = true; zgZapisz(z); banerZamknij(); }); }
  function zastosuj() {
    $$('[data-mapa]').forEach(function (el) { if (ZGODA && ZGODA.mapy) mapaWczytaj(el); else mapaZaslepka(el); });
    if (ZGODA && ZGODA.stat && ck && ck.dataset.ga4 && !window.gtag) {
      var g = ck.dataset.ga4, s = d.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(g); d.head.appendChild(s);
      window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); }; window.gtag('js', new Date()); window.gtag('config', g, { anonymize_ip: true });
    }
  }
  function banerPokaz(ust) {
    if (!ck) return; ck.hidden = false;
    var m = $('#ckMapy'), st = $('#ckStat'); if (m) m.checked = !!(ZGODA && ZGODA.mapy); if (st) st.checked = !!(ZGODA && ZGODA.stat);
    $('#ckUst').hidden = !ust; $('[data-ck="zapisz"]', ck).hidden = !ust; $('[data-ck="ustawienia"]', ck).hidden = !!ust;
    $('[data-ck="ustawienia"]', ck).setAttribute('aria-expanded', String(!!ust));
  }
  function banerZamknij() { if (ck) ck.hidden = true; }
  if (ck) {
    ck.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ck]'); if (!b) return; var a = b.dataset.ck;
      if (a === 'wszystkie') { zgZapisz({ mapy: true, stat: true }); banerZamknij(); }
      else if (a === 'niezbedne') { zgZapisz({ mapy: false, stat: false }); banerZamknij(); }
      else if (a === 'ustawienia') banerPokaz(true);
      else if (a === 'zapisz') { var st = $('#ckStat'); zgZapisz({ mapy: $('#ckMapy').checked, stat: st ? st.checked : false }); banerZamknij(); }
    });
    if (!ZGODA) banerPokaz(false);
  }
  $$('[data-cookies-ustaw]').forEach(function (b) { b.addEventListener('click', function () { banerPokaz(true); }); });
  $$('[data-mapa]').forEach(podepnij);
  zastosuj();

  /* ---------- karta zgłoszenia: uczestnicy ---------- */
  var ucz = $('#uczestnicy'), dodaj = $('#uczDodaj');
  function numeruj() {
    var w = $$('.ucz', ucz);
    w.forEach(function (x, i) { $('.ucz-nr', x).textContent = (i + 1) + '.'; $('.ucz-usun', x).hidden = w.length < 2; });
    if (dodaj) dodaj.hidden = w.length >= 40;
  }
  if (ucz && dodaj) {
    dodaj.addEventListener('click', function () {
      var n = $('.ucz', ucz).cloneNode(true);
      $$('input', n).forEach(function (i) { i.value = ''; i.removeAttribute('aria-invalid'); });
      ucz.appendChild(n); numeruj(); $('input', n).focus();
    });
    ucz.addEventListener('click', function (e) { var b = e.target.closest('.ucz-usun'); if (b) { b.closest('.ucz').remove(); numeruj(); } });
    numeruj();
  }

  /* ---------- formularze: walidacja, bilet antyspamowy, wysyłka ---------- */
  $$('form[data-typ]').forEach(function (f) {
    var info = $('.form-info', f), ep = f.dataset.endpoint, tk = '', btn = $('button[type="submit"]', f);
    function bilet() { if (!ep) return; fetch(ep, { credentials: 'same-origin', cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) { tk = j.tk || ''; }).catch(function () {}); }
    bilet();
    function komunikat(t, zle) { info.hidden = false; info.textContent = t; info.classList.toggle('zle', !!zle); info.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    f.addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid'); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var zle = [];
      $$('[required]', f).forEach(function (el) {
        var ok = el.type === 'checkbox' ? el.checked : el.value.trim() !== '' && (el.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
        if (el.type === 'tel' && ok) ok = el.value.replace(/\D/g, '').length >= 9;
        el.setAttribute('aria-invalid', ok ? 'false' : 'true'); if (!ok) zle.push(el);
      });
      if (f.dataset.typ === 'kontakt') {
        var t = $('[name="tel"]', f), m = $('[name="email"]', f);
        if (t.value.replace(/\D/g, '').length < 9 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.value.trim())) { t.setAttribute('aria-invalid', 'true'); m.setAttribute('aria-invalid', 'true'); zle.push(t); }
      }
      if (zle.length) { komunikat('Uzupełnij zaznaczone pola.', true); zle[0].focus(); return; }
      if (!ep) {
        komunikat('Wersja testowa strony: formularz działa i sprawdza dane, ale niczego nie wysyła. Po uruchomieniu strony ' + (f.dataset.typ === 'zgloszenie' ? 'zgłoszenie' : 'wiadomość') + ' trafi na ' + (f.dataset.email || 'adres firmy') + '.');
        return;
      }
      var dane = new FormData(f); dane.append('tk', tk);
      btn.disabled = true;
      fetch(ep, { method: 'POST', body: dane, credentials: 'same-origin' }).then(function (r) { return r.json().catch(function () { return { ok: false, msg: 'Błąd serwera.' }; }); })
        .then(function (j) { komunikat(j.msg || (j.ok ? 'Wysłano.' : 'Nie udało się wysłać.'), !j.ok); if (j.ok && !j.demo) { f.reset(); if (ucz) { $$('.ucz', ucz).slice(1).forEach(function (x) { x.remove(); }); numeruj(); } } tk = ''; bilet(); })
        .catch(function () { komunikat('Brak połączenia. Spróbuj ponownie albo zadzwoń.', true); })
        .then(function () { btn.disabled = false; });
    });
  });
})();
