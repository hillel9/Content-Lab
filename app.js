/* app.js - shared behavior for the Content Lab prototype.
   The DS (ds/ds.js) already handles selects, tabs, modals, toasts and theme. */

(function () {
  var data = window.APP_DATA;
  var drawer = document.getElementById('content-lab-drawer');

  // ----- Render the Content Lab feature cards from data.js -----
  var sectionsEl = document.getElementById('content-lab-sections');
  data.contentLab.forEach(function (section) {
    var html = '<p class="app-cl-section-title">' + section.title + '</p><div class="app-cl-grid">';
    section.items.forEach(function (item) {
      html +=
        '<button class="app-cl-card"' + (item.view ? ' data-go-view="' + item.view + '"' : '') + '>' +
          '<img class="app-cl-card-icon" src="' + item.icon + '" alt="">' +
          '<span class="app-cl-card-text">' +
            '<span class="app-cl-card-label">' + item.label.replace('&', '&amp;') + '</span>' +
            (item.meta ? '<span class="app-cl-card-meta">' + item.meta + '</span>' : '') +
          '</span>' +
          (item.badge ? '<span class="app-cl-card-badge" aria-label="New"></span>' : '') +
        '</button>';
    });
    sectionsEl.insertAdjacentHTML('beforeend', html + '</div>');
  });

  // ----- Render summary drafts -----
  document.getElementById('summary-list').innerHTML = data.summaryDrafts.map(function (d, i) {
    return '<button class="app-view-item" data-preview="' + i + '">' +
      '<span class="app-view-item-meta">' + d.meta + '</span>' +
      '<span class="app-view-item-title">' + d.title + '</span>' +
    '</button>';
  }).join('');

  // ----- Summary preview (left of the drawer) -----
  var preview = document.getElementById('summary-preview');

  var playingIdx = 0;
  function renderChapters(draft, openIndex) {
    document.getElementById('pv-chapters').innerHTML = draft.chapters.map(function (c, i) {
      var open = i === openIndex;
      var eyebrow = i === playingIdx ? '<span class="app-chapter-now">Playing now</span>' : '<span>Chapter ' + (i + 1) + '</span>';
      return '<div class="app-chapter">' +
        '<button class="app-chapter-head" data-chapter="' + i + '" aria-expanded="' + open + '">' +
          '<span class="app-chapter-heading">' +
            '<span class="app-chapter-eyebrow">' + eyebrow + '<span>&bull;</span><span>' + c.time + '</span></span>' +
            '<span class="app-chapter-title">' + c.title + '</span>' +
          '</span>' +
          '<span class="app-chapter-toggle"><ds-icon name="' + (open ? 'chevron-down' : 'chevron-right') + '" size="16"></ds-icon></span>' +
        '</button>' +
        (open ? '<p class="app-chapter-text">' + c.text + '</p>' : '') +
      '</div>';
    }).join('');
  }

  // DS has no pause icon; assets/pause.svg is the Figma pause glyph, sized like a DS 24px icon.
  var PLAY_ICON = '<ds-icon name="play"></ds-icon>';
  var PAUSE_ICON = '<img src="assets/pause.svg" alt="" width="24" height="24">';

  function renderClipList(draft) {
    document.getElementById('pv-clip-list').innerHTML = draft.chapters.map(function (c, i) {
      return '<div class="app-clip-row">' +
        '<span class="app-clip-num">' + (i + 1) + '</span>' +
        '<button class="app-icon-btn-on-dark" data-play-chapter="' + i + '" aria-label="Play chapter">' + PLAY_ICON + '</button>' +
        '<img class="app-clip-thumb" src="' + thumbUrl(toSec(c.time) + 5, 160) + '" alt="">' +
        '<span class="app-clip-name">' + c.title + '</span>' +
        '<span class="app-clip-views">' + c.views + ' Views</span>' +
        '<button class="app-pv-btn-dark app-pv-btn-dark-md" data-create-clip="' + i + '">Create clip</button>' +
      '</div>';
    }).join('');
  }

  // Preview modes: "summary" (player + chapters panel), "clips" (chapter list), "trim" (trimmer)
  function setPreviewMode(mode) {
    preview.querySelectorAll('[data-pv-mode]').forEach(function (el) {
      el.hidden = el.getAttribute('data-pv-mode') !== mode;
    });
    if (mode === 'summary' && currentDraft) document.getElementById('pv-title').textContent = currentDraft.videoTitle;
    if (mode === 'clips') document.getElementById('pv-title').textContent = 'Create clips from chapters';
    if (mode !== 'summary' && kPlayer) kPlayer.pause();
    if (mode === 'clips' && !kClips) {
      kClips = makePlayer('kaltura-player-clips');
      if (kClips) ['timeupdate', 'play', 'pause'].forEach(function (ev) { kClips.addEventListener(ev, updateClipButtons); });
    }
    if (mode !== 'clips' && kClips) kClips.pause();
  }

  // ----- Kaltura player + thumbnails -----
  var k = data.kaltura;
  var kPlayer = null;  // summary mode
  var kClips = null;   // clips mode

  function makePlayer(targetId) {
    try {
      var p = KalturaPlayer.setup({ targetId: targetId, provider: { partnerId: k.partnerId, uiConfId: k.uiConfId } });
      p.loadMedia({ entryId: k.entryId });
      return p;
    } catch (e) {
      console.error(e.message);
      return null;
    }
  }

  function thumbUrl(sec, width) {
    return 'https://cdnapisec.kaltura.com/p/' + k.partnerId + '/thumbnail/entry_id/' + k.entryId +
      '/width/' + width + '/vid_sec/' + Math.round(sec);
  }

  function ensurePlayer() {
    if (kPlayer) return;
    kPlayer = makePlayer('kaltura-player');
    if (!kPlayer) return;
    // Keep "Playing now" on the chapter the player is in
    kPlayer.addEventListener('timeupdate', function () {
      var t = kPlayer.currentTime, idx = 0;
      currentDraft.chapters.forEach(function (c, i) { if (t >= toSec(c.time)) idx = i; });
      if (idx !== playingIdx) { playingIdx = idx; renderChapters(currentDraft, idx); }
    });
  }

  // Clips mode: the row of the chapter being played shows a pause button
  var clipsIdx = -1;
  function updateClipButtons() {
    var t = kClips.currentTime;
    clipsIdx = -1;
    currentDraft.chapters.forEach(function (c, i) { if (t >= toSec(c.time)) clipsIdx = i; });
    document.querySelectorAll('[data-play-chapter]').forEach(function (btn) {
      var playing = !kClips.paused && Number(btn.getAttribute('data-play-chapter')) === clipsIdx;
      btn.closest('.app-clip-row').classList.toggle('app-clip-row-playing', playing);
      if ((btn.getAttribute('aria-label') === 'Pause chapter') === playing) return;
      btn.innerHTML = playing ? PAUSE_ICON : PLAY_ICON;
      btn.setAttribute('aria-label', playing ? 'Pause chapter' : 'Play chapter');
    });
  }

  function seekTo(player, sec) {
    if (!player) return;
    player.currentTime = sec;
    player.play();
  }

  // ----- Trimmer -----
  // Times are in seconds, relative to the chapter start (offset). work = chapter length.
  var trim = { work: 56, start: 0, end: 0, cti: 0, offset: 0, chapter: null };

  // Show the real video frame at the playhead
  function updateTrimFrame() {
    document.getElementById('trim-still').src = thumbUrl(trim.offset + trim.cti, 800);
  }
  var trimmerEl = document.getElementById('trimmer');

  function toSec(t) { var p = t.split(':'); return Number(p[0]) * 60 + Number(p[1]); }
  function fmt(s) { s = Math.round(s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
  function fmtLen(s) { return s < 60 ? Math.round(s) + ' s' : fmt(s); }
  function pct(s) { return (s / trim.work * 100) + '%'; }

  function renderTrim() {
    var range = document.getElementById('trim-range');
    range.style.left = pct(trim.start);
    range.style.width = pct(trim.end - trim.start);
    trimmerEl.querySelector('[data-trim="start"]').style.left = pct(trim.start);
    trimmerEl.querySelector('[data-trim="end"]').style.left = pct(trim.end);
    trimmerEl.querySelector('[data-trim="cti"]').style.left = pct(trim.cti);
    document.getElementById('trim-progress').style.width = pct(trim.cti);
    document.getElementById('trim-len').textContent = fmtLen(trim.end - trim.start);
    var time = fmt(trim.cti) + ' / ' + fmt(trim.work);
    document.getElementById('trim-time').textContent = time;
    document.getElementById('trim-player-time').textContent = time;
  }

  function openTrimmer(i) {
    var chapters = currentDraft.chapters;
    var next = chapters[i + 1];
    trim.offset = toSec(chapters[i].time);
    trim.chapter = chapters[i];
    trim.work = (next ? toSec(next.time) : k.duration) - trim.offset;
    trim.start = 0;
    trim.end = trim.work;
    trim.cti = 0;
    updateTrimFrame();
    document.getElementById('pv-title').textContent = chapters[i].title;
    setPreviewMode('trim');
    renderTrim();
  }

  // Drag the handles or the playhead; clicking the track moves the playhead.
  var dragging = null;
  function secAt(e) {
    var r = trimmerEl.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * trim.work;
  }
  function moveTo(what, s) {
    if (what === 'start') trim.start = Math.min(s, trim.end - 1);
    if (what === 'end') trim.end = Math.max(s, trim.start + 1);
    if (what === 'cti') trim.cti = s;
    renderTrim();
  }
  trimmerEl.addEventListener('pointerdown', function (e) {
    var h = e.target.closest('[data-trim]');
    dragging = h ? h.getAttribute('data-trim') : 'cti';
    trimmerEl.setPointerCapture(e.pointerId);
    moveTo(dragging, secAt(e));
  });
  trimmerEl.addEventListener('pointermove', function (e) { if (dragging) moveTo(dragging, secAt(e)); });
  trimmerEl.addEventListener('pointerup', function () { dragging = null; updateTrimFrame(); });

  var currentDraft = null;
  function openPreview(i) {
    currentDraft = data.summaryDrafts[i];
    document.getElementById('pv-title').textContent = currentDraft.videoTitle;
    document.getElementById('pv-summary').textContent = currentDraft.summary;
    renderChapters(currentDraft, 0);
    renderClipList(currentDraft);
    setPreviewMode('summary');
    preview.hidden = false;
    ensurePlayer();
    drawer.classList.add('app-drawer-previewing');
  }

  function closePreview() {
    if (kPlayer) kPlayer.pause();
    preview.hidden = true;
    drawer.classList.remove('app-drawer-previewing');
  }

  // ----- Drawer views (menu, summary, ...) -----
  function showView(name) {
    drawer.querySelectorAll('[data-view]').forEach(function (v) {
      v.hidden = v.getAttribute('data-view') !== name;
    });
  }

  // ----- Drawer open / close -----
  function setOpen(open) {
    if (open) showView('menu');
    closePreview();
    drawer.classList.toggle('app-drawer-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
  }

  document.getElementById('open-content-lab').addEventListener('click', function () { setOpen(true); });
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-drawer-close]')) setOpen(false);
    var go = e.target.closest('[data-go-view]');
    if (go) {
      closePreview();
      showView(go.getAttribute('data-go-view'));
      // Opening Summary & chapters selects the first summary by default
      if (go.getAttribute('data-go-view') === 'summary') openPreview(0);
    }

    var item = e.target.closest('[data-preview]');
    if (item) openPreview(Number(item.getAttribute('data-preview')));
    if (e.target.closest('[data-preview-close]')) closePreview();

    var pvGo = e.target.closest('[data-pv-go]');
    if (pvGo) setPreviewMode(pvGo.getAttribute('data-pv-go'));

    // Play a chapter in the clips-mode player
    var playCh = e.target.closest('[data-play-chapter]');
    if (playCh && kClips) {
      var ci = Number(playCh.getAttribute('data-play-chapter'));
      if (ci !== clipsIdx) seekTo(kClips, toSec(currentDraft.chapters[ci].time));
      else if (kClips.paused) kClips.play();
      else kClips.pause();
    }

    var clip = e.target.closest('[data-create-clip]');
    if (clip) openTrimmer(Number(clip.getAttribute('data-create-clip')));

    // Trim to current time: move the nearer handle to the playhead
    if (e.target.closest('[data-trim-to-cti]')) {
      var nearStart = Math.abs(trim.cti - trim.start) < Math.abs(trim.cti - trim.end);
      moveTo(nearStart ? 'start' : 'end', trim.cti);
    }

    if (e.target.closest('[data-trim-create]')) {
      DS.showToast({ type: 'success', message: 'Your clip is processing and will be saved in My Media' });
      setPreviewMode('clips');
    }

    // Expand / collapse a chapter (one open at a time)
    var head = e.target.closest('[data-chapter]');
    if (head) {
      var i = Number(head.getAttribute('data-chapter'));
      if (e.target.closest('.app-chapter-toggle')) {
        renderChapters(currentDraft, head.getAttribute('aria-expanded') === 'true' ? -1 : i);
      } else {
        seekTo(kPlayer, toSec(currentDraft.chapters[i].time));
      }
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!preview.hidden) closePreview();
    else setOpen(false);
  });
})();
