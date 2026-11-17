// SA Keys mockup v2 - renders the home page and the property page from data.js
(function () {
  var HOMES = window.SAK_HOMES || [];
  var WILD = window.SAK_WILD || {};

  var TAGS = [
    { key: '', label: 'All homes' },
    { key: 'pool', label: 'Private pool' },
    { key: 'hottub', label: 'Hot tub or spa' },
    { key: 'games', label: 'Game room' },
    { key: 'groups', label: 'Groups of 12+' },
    { key: 'sixflags', label: 'Near Six Flags' },
    { key: 'seaworld', label: 'Near SeaWorld' },
    { key: 'apt', label: 'Apartments' }
  ];
  var AREAS = [
    { name: 'Six Flags & Hill Country', text: 'Tree-covered streets near Six Flags Fiesta Texas, La Cantera and The RIM.' },
    { name: 'Alamo Heights', text: 'Apartments by the Botanical Garden, close to the Zoo and the Pearl.' },
    { name: 'North Central & Airport', text: 'Pools, golf-course views and an easy drive to the airport.' },
    { name: 'SeaWorld & Lackland', text: 'Big houses with pools and game rooms on the west side.' }
  ];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // "6BR Retreat | Huge Pool & Game Room" -> "6BR Retreat, Huge Pool & Game Room"
  function cleanTitle(t) { return t.replace(/\s*\(#\d+\)\s*/, ' ').replace(/\s*[|•]\s*/g, ', ').replace(/\s+/g, ' ').trim(); }
  function unit(h) { var m = h.title.match(/\(#(\d+)\)/); return m ? ' (unit ' + m[1] + ')' : ''; }
  function facts(h) { return h.beds + (h.beds === 1 ? ' bedroom' : ' bedrooms') + ', sleeps ' + h.guests; }
  function rating(h) { return h.rating ? '<span class="star">&#9733;</span> ' + h.rating.toFixed(2) : 'New on SA Keys'; }
  function badge(h) {
    if (h.rating && h.rating >= 4.85) return 'Top rated';
    if (h.tags.indexOf('pool') > -1) return 'Private pool';
    if (h.tags.indexOf('hottub') > -1) return 'Hot tub';
    if (!h.rating) return 'New';
    return '';
  }
  function link(h) { return 'property.html?id=' + h.id; }
  function matches(h, tag) {
    if (!tag) return true;
    if (tag === 'apt') return h.type === 'Apartment';
    return h.tags.indexOf(tag) > -1;
  }
  function card(h) {
    var b = badge(h);
    return '<a class="card" href="' + link(h) + '">' +
      '<div class="ph">' + (h.img[0] ? '<img loading="lazy" src="' + esc(h.img[0]) + '" alt="' + esc(cleanTitle(h.title)) + '">' : '') +
      (b ? '<span class="badge">' + b + '</span>' : '') + '</div>' +
      '<h3>' + esc(cleanTitle(h.title)) + esc(unit(h)) + '</h3>' +
      '<div class="row"><span>' + esc(h.area) + '</span><span>' + rating(h) + '</span></div>' +
      '<div class="row"><span>' + facts(h) + '</span><span><span class="price">$' + h.price + '</span> a night</span></div>' +
      '<div class="direct">Booked direct, no service fee</div></a>';
  }

  /* ---------- home page ---------- */
  function home() {
    var rated = HOMES.filter(function (h) { return h.rating; });
    var avg = rated.reduce(function (a, h) { return a + h.rating; }, 0) / rated.length;
    document.getElementById('avg').textContent = avg.toFixed(1);

    // search: area list
    var sel = document.getElementById('s-area');
    AREAS.forEach(function (a) { sel.insertAdjacentHTML('beforeend', '<option>' + esc(a.name) + '</option>'); });

    // favorites: one per building, best rated first (skip repeated Andrews units)
    var seen = {}, favs = [];
    rated.slice().sort(function (a, b) { return b.rating - a.rating; }).forEach(function (h) {
      var k = h.type === 'Apartment' ? 'apt' : h.id;
      if (!seen[k] && favs.length < 6) { seen[k] = 1; favs.push(h); }
    });
    document.getElementById('favs').innerHTML = favs.map(function (h) {
      return '<a class="arch-card" href="' + link(h) + '"><div class="arch"><img loading="lazy" src="' + esc(h.img[0]) + '" alt=""></div>' +
        '<h3>' + esc(cleanTitle(h.title)) + '</h3>' +
        '<p class="meta">' + esc(h.area) + ', ' + facts(h) + '</p>' +
        '<p class="meta"><span class="star">&#9733;</span> ' + h.rating.toFixed(2) + ' &nbsp; <span class="price">$' + h.price + '</span> a night</p></a>';
    }).join('');

    // filters
    var state = { tag: '', area: '', guests: 1, all: false };
    var chips = document.getElementById('chips');
    chips.innerHTML = TAGS.map(function (t) {
      var n = HOMES.filter(function (h) { return matches(h, t.key); }).length;
      return '<button class="chip" type="button" data-tag="' + t.key + '" aria-pressed="' + (t.key === '' ? 'true' : 'false') + '">' + t.label + '<small>' + n + '</small></button>';
    }).join('');
    chips.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      state.tag = b.getAttribute('data-tag'); state.area = ''; state.guests = 1;
      render();
    });
    document.getElementById('more').addEventListener('click', function () { state.all = true; render(); });

    function render() {
      [].forEach.call(chips.children, function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-tag') === state.tag)); });
      var list = HOMES.filter(function (h) {
        return matches(h, state.tag) && (!state.area || h.area === state.area) && h.guests >= state.guests;
      }).sort(function (a, b) { return (b.rating || 4.8) - (a.rating || 4.8); });
      var shown = state.all ? list : list.slice(0, 9);
      var where = state.area ? ' in ' + state.area : '';
      var who = state.guests > 1 ? ' for ' + state.guests + '+ guests' : '';
      document.getElementById('count').textContent = list.length ? list.length + (list.length === 1 ? ' home' : ' homes') + where + who : '';
      document.getElementById('grid').innerHTML = list.length ? shown.map(card).join('') :
        '<p>No home matches all of that. Try fewer guests or another area, or call the host at 1 (800) 570-7046.</p>';
      document.getElementById('more').parentNode.style.display = list.length > shown.length ? '' : 'none';
    }
    render();

    // hero search
    document.getElementById('search').addEventListener('submit', function (e) {
      e.preventDefault();
      state.tag = ''; state.area = sel.value; state.guests = +document.getElementById('s-guests').value; state.all = true;
      render();
      document.getElementById('homes').scrollIntoView();
    });

    // neighborhoods
    document.getElementById('hoods').innerHTML = AREAS.map(function (a) {
      var inArea = HOMES.filter(function (h) { return h.area === a.name; });
      var pic = inArea.filter(function (h) { return h.rating; }).sort(function (x, y) { return y.rating - x.rating; })[0] || inArea[0];
      return '<button class="hood" type="button" data-area="' + esc(a.name) + '"><div class="arch"><img loading="lazy" src="' + esc(pic.img[1] || pic.img[0]) + '" alt=""></div>' +
        '<h3>' + esc(a.name) + '</h3><p>' + inArea.length + ' homes. ' + esc(a.text) + '</p></button>';
    }).join('');
    document.getElementById('hoods').addEventListener('click', function (e) {
      var b = e.target.closest('.hood'); if (!b) return;
      state.tag = ''; state.area = b.getAttribute('data-area'); state.guests = 1; state.all = true;
      render();
      document.getElementById('homes').scrollIntoView();
    });
  }

  /* ---------- property page ---------- */
  var AMEN = {
    HAS_POOL: 'Private pool', HAS_FENCED_POOL: 'Fenced pool', HAS_POOL_TABLE: 'Pool table', HAS_GAME_CONSOLE: 'Game console',
    HAS_BOARD_GAMES: 'Board games', HAS_FIRE_PIT: 'Fire pit', HAS_BARBECUE: 'BBQ grill', HAS_DECK_PATIO: 'Covered patio and deck',
    HAS_HAMMOCK: 'Hammock', HAS_INDOOR_FIREPLACE: 'Indoor fireplace', HAS_KITCHEN: 'Full kitchen', HAS_DISHWASHER: 'Dishwasher',
    HAS_COFFEE_MAKER: 'Coffee maker', HAS_WASHER: 'Washer', HAS_DRYER: 'Dryer', HAS_AIR_CONDITIONING: 'Air conditioning',
    HAS_INTERNET_WIFI: 'Wi-Fi', HAS_SMART_TV: 'Smart TV', HAS_OFFICE: 'Workspace', HAS_FREE_PARKING: 'Free parking',
    HAS_PACK_N_PLAY_TRAVEL_CRIB: 'Pack n play', HAS_BABY_HIGH_CHAIR: 'High chair', HAS_CHILDRENS_BOOKS_AND_TOYS: 'Kids books and toys',
    HAS_OUTDOOR_PLAY_AREA: 'Outdoor play area', HAS_CONTACTLESS_CHECKIN: 'Self check-in', HAS_FENCED_YARD: 'Fenced yard',
    HAS_BATHTUB: 'Bathtub', HAS_TOWELS: 'Towels and linens', HAS_SMOKE_DETECTOR: 'Smoke detector', HAS_CARBON_MONOXIDE_DETECTOR: 'Carbon monoxide detector',
    HAS_FIRST_AID_KIT: 'First aid kit', HAS_FIRE_EXTINGUISHER: 'Fire extinguisher'
  };
  var ICON = {
    pool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 18c2 0 2-1.5 4-1.5S8 18 10 18s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/><path d="M8 15V5a2 2 0 0 1 4 0M14 15V5a2 2 0 0 1 4 0M8 9h6M8 12h6"/></svg>',
    tree: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21v-6M7 15a5 5 0 1 1 1.5-9.8A4.5 4.5 0 0 1 17 7a4 4 0 0 1 0 8z"/></svg>',
    game: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r="1"/><circle cx="18" cy="13.5" r="1"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
  };

  function bullets(text) {
    return (text || '').split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l.indexOf('•') === 0; }).map(function (l) { return l.replace(/^•\s*/, ''); });
  }

  function property() {
    var id = new URLSearchParams(location.search).get('id') || WILD.id;
    var h = HOMES.filter(function (x) { return x.id === id; })[0] || HOMES.filter(function (x) { return x.id === WILD.id; })[0];
    var full = h.id === WILD.id;
    var photos = full ? WILD.photos : h.img.map(function (s) { return { src: s, thumb: s, cap: '' }; });
    document.title = cleanTitle(h.title) + ' | SA Keys';

    // gallery
    var g = document.getElementById('gallery');
    g.innerHTML = photos.slice(0, 5).map(function (p, i) {
      return '<button type="button" class="' + (i === 0 ? 'main' : '') + '" data-i="' + i + '" aria-label="Open photo ' + (i + 1) + '"><img src="' + esc(i === 0 ? p.src : p.thumb) + '" alt="' + esc(p.cap) + '"' + (i ? ' loading="lazy"' : '') + '></button>';
    }).join('') + '<button type="button" class="all" data-i="0">Show all ' + photos.length + ' photos</button>';

    document.getElementById('p-title').textContent = cleanTitle(h.title) + unit(h);
    document.getElementById('p-facts').innerHTML =
      '<span>' + rating(h) + '</span><span>' + esc(h.area) + '</span>' +
      '<span><b>' + h.beds + '</b> bedrooms</span><span><b>' + h.baths + '</b> baths</span><span>Sleeps <b>' + h.guests + '</b></span>';
    [].forEach.call(document.querySelectorAll('.p-price'), function (el) { el.textContent = '$' + h.price; });

    var body = document.getElementById('p-body');
    if (full) {
      var drive = bullets(WILD.neighbourhood).map(function (l) {
        var parts = l.split(/\s+[—-]\s+/);
        return '<li><span>' + esc(parts[0]) + '</span><span>' + esc(parts[1] || '') + '</span></li>';
      }).join('');
      var know = bullets(WILD.notes).map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('');
      var amen = WILD.amenities.filter(function (a) { return AMEN[a]; }).map(function (a) { return AMEN[a]; });
      body.innerHTML =
        '<div class="highlights">' +
        '<div>' + ICON.pool + '<p style="margin:0"><b>Huge private pool</b><span>Fenced, with a diving board and lounge chairs. Not heated.</span></p></div>' +
        '<div>' + ICON.tree + '<p style="margin:0"><b>A private 1-acre lot</b><span>Mature Texas oak and pecan trees, fire pit and covered patio.</span></p></div>' +
        '<div>' + ICON.game + '<p style="margin:0"><b>Game room</b><span>Full-size pool table, Skee-Ball and board games.</span></p></div>' +
        '<div>' + ICON.pin + '<p style="margin:0"><b>5 to 8 minutes to Six Flags</b><span>Also 5 minutes to La Cantera and The RIM.</span></p></div>' +
        '</div>' +
        '<p style="font-size:19px;line-height:1.6;max-width:62ch">' + esc(WILD.summary) + '</p>' +
        '<h2>The space</h2><div class="prose clamp" id="space">' + esc(WILD.space) + '</div>' +
        '<button class="linkbtn" type="button" id="space-more" aria-expanded="false">Read the full description</button>' +
        '<h2>What this home has</h2><ul class="amen" id="amen">' + amen.slice(0, 12).map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>' +
        '<button class="linkbtn" type="button" id="amen-more">Show all ' + amen.length + ' amenities</button>' +
        '<h2>Where you\'ll be</h2><p>A quiet street in Northwest San Antonio. Drive times from the house:</p><ul class="drive">' + drive + '</ul>' +
        '<h2>Things to know</h2><ul class="know">' + know + '</ul>' +
        '<h2>Cancellation</h2><p>' + esc(WILD.cancel.split('\n')[0]) + '</p>';
      document.getElementById('space-more').addEventListener('click', function () {
        var s = document.getElementById('space'), open = s.classList.toggle('clamp');
        this.textContent = open ? 'Read the full description' : 'Show less';
        this.setAttribute('aria-expanded', String(!open));
      });
      document.getElementById('amen-more').addEventListener('click', function () {
        document.getElementById('amen').innerHTML = amen.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('');
        this.remove();
      });
    } else {
      body.innerHTML = '<p style="margin-top:40px;font-size:19px">' + esc(cleanTitle(h.title)) + '. ' + facts(h) + '.</p>' +
        '<p class="toast">In this mockup only the Wild Eagle page has the full description. On the real site every home gets its full text, amenities and photos from Hostfully automatically.</p>' +
        '<p><a class="btn btn-dark" href="property.html">Open the Wild Eagle example</a></p>';
    }

    // similar homes
    var sim = HOMES.filter(function (x) { return x.id !== h.id && x.area === h.area && x.type === h.type; }).slice(0, 3);
    if (sim.length < 3) sim = sim.concat(HOMES.filter(function (x) { return x.id !== h.id && sim.indexOf(x) < 0 && x.tags.indexOf('pool') > -1; }).slice(0, 3 - sim.length));
    document.getElementById('similar').innerHTML = sim.map(card).join('');

    // booking card (mockup only)
    function check(e) {
      e.preventDefault();
      var t = document.getElementById('book-msg');
      t.hidden = false;
      t.textContent = 'On the real site this opens the live Hostfully calendar and price for your dates. The mockup does not book.';
    }
    document.getElementById('book').addEventListener('submit', check);
    document.getElementById('mbook-btn').addEventListener('click', function () {
      document.getElementById('book-msg-m').hidden = false;
    });

    // lightbox
    var lb = document.getElementById('lb'), img = document.getElementById('lb-img'), cap = document.getElementById('lb-cap'), cnt = document.getElementById('lb-count'), cur = 0, last = null;
    function show(i) {
      cur = (i + photos.length) % photos.length;
      img.src = photos[cur].src; img.alt = photos[cur].cap;
      cap.textContent = photos[cur].cap; cnt.textContent = (cur + 1) + ' / ' + photos.length;
    }
    function open(i) { last = document.activeElement; show(i); lb.classList.add('open'); document.body.style.overflow = 'hidden'; document.getElementById('lb-close').focus(); }
    function close() { lb.classList.remove('open'); document.body.style.overflow = ''; if (last) last.focus(); }
    g.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) open(+b.getAttribute('data-i')); });
    document.getElementById('lb-close').addEventListener('click', close);
    document.getElementById('lb-prev').addEventListener('click', function () { show(cur - 1); });
    document.getElementById('lb-next').addEventListener('click', function () { show(cur + 1); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
  }

  if (document.body.id === 'property') property(); else home();
})();
