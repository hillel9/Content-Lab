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

  // Prototype: 3 chapters, spread through the video, are tagged as popular moments
  var POPULAR_CHAPTERS = [0, 3, 4];
  function renderClipList(draft) {
    document.getElementById('pv-clip-list').innerHTML = draft.chapters.map(function (c, i) {
      return '<div class="app-clip-row">' +
        '<span class="app-clip-num">' + (i + 1) + '</span>' +
        '<button class="app-icon-btn-on-dark" data-play-chapter="' + i + '" aria-label="Play chapter">' + PLAY_ICON + '</button>' +
        '<img class="app-clip-thumb" src="' + thumbUrl(toSec(c.time) + 5, 160) + '" alt="">' +
        '<span class="app-clip-name">' + c.title + '</span>' +
        '<span class="app-clip-views">' + (POPULAR_CHAPTERS.indexOf(i) > -1 ? '<span class="app-popular"><ds-icon name="bolt" size="16"></ds-icon>Popular moment</span>' : '') + '</span>' +
        // DS button processing state (ds-btn-processing): keeps width, shows a spinner, ignores clicks
        '<span data-theme="dark"><button class="ds-btn ds-btn-md ds-btn-secondary' + (c.processing ? ' ds-btn-processing" aria-busy="true"' : '"') +
          ' data-create-clip="' + i + '">Create clip</button></span>' +
      '</div>';
    }).join('');
    if (kClips) updateClipButtons();
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
    if (mode !== 'clip' && kClip) kClip.pause();
    if (mode !== 'clip') preview.classList.remove('app-pv-saved', 'app-pv-processing');
    syncUrl();
  }

  // ----- Kaltura player + thumbnails -----
  var k = data.kaltura;
  var kPlayer = null;  // summary mode
  var kClips = null;   // clips mode
  var kClip = null;    // single generated clip preview

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

  // Trim a generated clip: the work window is its chapter, handles start at the clip range
  function openClipTrimmer(c) {
    var chapters = data.summaryDrafts[0].chapters;
    var next = chapters[c.chapter + 1];
    trim.offset = toSec(chapters[c.chapter].time);
    trim.work = (next ? toSec(next.time) : k.duration) - trim.offset;
    trim.start = c.start - trim.offset;
    trim.end = Math.min(trim.work, trim.start + c.length);
    trim.cti = trim.start;
    trim.clip = c;
    updateTrimFrame();
    document.getElementById('pv-title').textContent = c.title;
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
    syncUrl();
  }

  function closePreview() {
    if (kPlayer) kPlayer.pause();
    if (kClip) kClip.pause();
    selectClipRow(-1);
    data.generatedClips = data.generatedClips.filter(function (c) { return !c.pending; });
    preview.hidden = true;
    drawer.classList.remove('app-drawer-previewing');
    syncUrl();
  }

  // ----- Drawer views (menu, summary, ...) -----
  function showView(name) {
    drawer.querySelectorAll('[data-view]').forEach(function (v) {
      v.hidden = v.getAttribute('data-view') !== name;
    });
    syncUrl();
  }

  // ----- Drawer open / close -----
  function setOpen(open) {
    if (open) showView('menu');
    closePreview();
    drawer.classList.toggle('app-drawer-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    syncUrl();
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
    if (clip) {
      createClipFromChapter(Number(clip.getAttribute('data-create-clip')));
    }

    // Trim to current time: move the nearer handle to the playhead
    if (e.target.closest('[data-trim-to-cti]')) {
      var nearStart = Math.abs(trim.cti - trim.start) < Math.abs(trim.cti - trim.end);
      moveTo(nearStart ? 'start' : 'end', trim.cti);
    }

    if (e.target.closest('[data-trim-back]')) openClip(data.generatedClips.indexOf(trim.clip));

    if (e.target.closest('[data-trim-create]') && trim.clip) {
      trim.clip.start = Math.round(trim.offset + trim.start);
      trim.clip.length = Math.round(trim.end - trim.start);
      renderGeneratedClips();
      openClip(data.generatedClips.indexOf(trim.clip));
      DS.showToast({ type: 'success', message: 'Clip trimmed to ' + fmt(trim.clip.length) });
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
  // ----- Create clips form -----
  var ccText = document.getElementById('cc-instructions');
  var ccCounter = document.getElementById('cc-counter');
  function updateCcCounter() { ccCounter.textContent = ccText.value.length + '/500'; }
  ccText.addEventListener('input', updateCcCounter);
  document.addEventListener('click', function (e) {
    var opt = e.target.closest('.app-cc-option');
    if (opt) {
      opt.parentElement.querySelectorAll('.app-cc-option').forEach(function (o) {
        o.setAttribute('aria-checked', String(o === opt));
      });
    }
    // Reuse prompt: reopen the form filled with the settings these clips were made with
    var reuse = e.target.closest('[data-cc-reuse]');
    if (reuse) {
      applyPrompt(data.generatedClips[Number(reuse.closest('[data-cc-clip]').getAttribute('data-cc-clip'))].prompt);
      showView('clips-create');
      ccText.focus();
    }
    // Suggested prompt tags append their text to the instructions
    var prompt = e.target.closest('[data-cc-prompt]');
    if (prompt) {
      var text = prompt.textContent.trim();
      ccText.value = (ccText.value ? ccText.value.replace(/\s*$/, ' ') : '') + text + (text.slice(-1) === ':' ? ' ' : '');
      ccText.value = ccText.value.slice(0, 500);
      updateCcCounter();
      ccText.focus();
    }
  });
  // Submit -> "Creating clips" loading view -> generated clips list.
  // Once clips exist, the Clips card on the menu opens the list instead of the form.
  var CLIPS_GENERATE_MS = 5000;
  var clipsCard = document.querySelector('[data-go-view="clips-create"].app-cl-card');

  // data.generatedClips is the mock AI result; the list starts empty and fills from
  // the form (AI clips, each remembering its prompt) or from a chapter (no prompt).
  var aiClips = data.generatedClips;
  data.generatedClips = [];

  // Once any clip exists, the Clips card opens the list and shows a count
  function onClipsChanged() {
    renderGeneratedClips();
    if (clipsCard.getAttribute('data-go-view') !== 'clips') {
      clipsCard.setAttribute('data-go-view', 'clips');
      clipsCard.querySelector('.app-cl-card-text').insertAdjacentHTML('beforeend', '<span class="app-cl-card-meta"></span>');
      // "Back to clips" on the form now returns to the list
      document.querySelector('#clips-create-form [data-go-view="menu"]').setAttribute('data-go-view', 'clips');
    }
    updateClipsCardCount();
  }

  document.getElementById('clips-create-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var prompt = readPrompt();
    showView('clips-loading');
    setTimeout(function () {
      var fresh = generateClips(prompt);
      if (!drawer.querySelector('[data-view="clips-loading"]').hidden) showView('clips');
      DS.showToast({ type: 'success', message: fresh.length + ' clips are ready' });
    }, CLIPS_GENERATE_MS);
  });

  // The AI result: one clip per chapter, each remembering the prompt. Replaces earlier AI clips, keeps chapter clips.
  function generateClips(prompt) {
    var fresh = aiClips.map(function (c) { return Object.assign({}, c, { prompt: prompt }); });
    data.generatedClips = data.generatedClips.filter(function (c) { return !c.prompt; }).concat(fresh);
    onClipsChanged();
    return fresh;
  }

  // Chapter -> clip: the button shows processing, then the whole chapter opens as a clip in the preview panel.
  // Dev limitation: it isn't saved in the backend, so it stays out of the clips list (pending) until the user saves it;
  // closing the panel drops it.
  // and the Clips list opens with that clip in the preview panel.
  var CLIP_PROCESS_MS = 2500;
  function createClipFromChapter(i) {
    var draft = currentDraft, ch = draft.chapters[i], next = draft.chapters[i + 1];
    var existing = data.generatedClips.filter(function (c) { return c.fromChapter && c.chapter === i && !c.pending; })[0];
    if (existing) return showCreatedClip(existing);
    if (ch.processing) return;
    ch.processing = true;
    renderClipList(draft);
    setTimeout(function () {
      ch.processing = false;
      renderClipList(draft);
      var start = toSec(ch.time);
      var clip = { chapter: i, fromChapter: true, pending: true, start: start,
        length: (next ? toSec(next.time) : k.duration) - start, title: ch.title };
      data.generatedClips.unshift(clip);
      // Only jump if the user is still on the chapter list
      var main = preview.hidden ? null : preview.querySelector('.app-pv-main:not([hidden])');
      if (main && main.getAttribute('data-pv-mode') === 'clips') showCreatedClip(clip);
    }, CLIP_PROCESS_MS);
  }
  function showCreatedClip(clip) {
    showView('clips');
    openClip(data.generatedClips.indexOf(clip));
  }

  // The prompt (form settings) the clips were generated with, so a clip can reuse it
  var ccForm = document.getElementById('clips-create-form');
  var ccLang = ccForm.querySelector('.app-cc-select');
  function readPrompt() {
    return {
      duration: ccForm.querySelector('.app-cc-option[aria-checked="true"]').textContent,
      instructions: ccText.value.trim(),
      language: ccLang.querySelector('.ds-select > span').textContent
    };
  }
  function applyPrompt(p) {
    ccForm.querySelectorAll('.app-cc-option').forEach(function (o) {
      o.setAttribute('aria-checked', String(o.textContent === p.duration));
    });
    ccText.value = p.instructions;
    updateCcCounter();
    ccLang.querySelector('.ds-select > span').textContent = p.language;
    ccLang.querySelectorAll('.ds-select-item').forEach(function (item) {
      var on = item.textContent.trim() === p.language;
      item.setAttribute('aria-selected', String(on));
      var check = item.querySelector('.ds-select-item-trailing');
      if (on && !check) item.insertAdjacentHTML('beforeend', '<ds-icon class="ds-select-item-trailing" name="check" size="16"></ds-icon>');
      if (!on && check) check.remove();
    });
  }
  function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function reuseButton(p) {
    var hint = 'Duration: ' + esc(p.duration) + '<br>Topic: ' + (p.instructions ? esc(p.instructions) : 'Top moments');
    return '<span class="ds-hint-trigger app-cc-reuse">' +
      '<button class="ds-tag" data-cc-reuse><ds-icon name="refresh" size="16"></ds-icon>Reuse prompt</button>' +
      '<span class="ds-hint ds-hint-top"><span class="ds-hint-body">' + hint + '</span>' +
        '<span class="ds-hint-arrow"><svg width="14" height="9" viewBox="0 0 14 9" fill="none"><path d="M0 0L5.4 7Q7 9 8.6 7L14 0Z" fill="currentColor"/></svg></span></span>' +
    '</span>';
  }

  function renderGeneratedClips() {
    // Drafts first, then a "Saved clips" separator with the saved ones (indices stay those of data.generatedClips)
    var drafts = [], saved = [];
    data.generatedClips.forEach(function (c, i) { if (!c.pending) (c.saved ? saved : drafts).push(i); });
    var html = drafts.map(clipRow).join('');
    if (saved.length) html += '<p class="app-sv-separator">Saved clips</p>' + saved.map(clipRow).join('');
    document.getElementById('clips-list').innerHTML = html;
  }
  function clipRow(i) {
    var c = data.generatedClips[i];
      return '<div class="app-cc-clip' + (i === selectedClip ? ' app-cc-clip-selected' : '') + '" tabindex="0" role="button" data-cc-clip="' + i + '">' +
        '<span class="app-cc-clip-player">' +
          '<img src="' + thumbUrl(c.start + c.length / 2, 400) + '" alt="">' +
          // Highlight = where the clip sits in the full entry (min width 24px so short clips stay visible)
          '<span class="app-cc-clip-timeline" title="' + fmt(c.start) + ' – ' + fmt(c.start + c.length) + ' of ' + fmt(k.duration) + '">' +
            '<span style="left:calc((100% - var(--ds-space-6)) * ' + (c.start / k.duration).toFixed(4) + ');' +
              'width:max(var(--ds-space-6), ' + (c.length / k.duration * 100).toFixed(2) + '%)"></span></span>' +
        '</span>' +
        '<span class="app-cc-clip-text">' +
          '<span class="app-cc-clip-meta">' + fmt(c.length) + '<span>&bull;</span>' + (c.saved ? 'Video' : 'Draft') + '</span>' +
          '<span class="app-cc-clip-title">' + c.title + '</span>' +
          // Only AI-generated clips have a prompt to reuse; clips made from a chapter don't
          (c.prompt ? reuseButton(c.prompt) : '') +
        '</span>' +
      '</div>';
  }

  // ----- Generated clip preview (left panel) -----
  var selectedClip = -1;
  function selectClipRow(i) {
    selectedClip = i;
    document.querySelectorAll('[data-cc-clip]').forEach(function (r) {
      r.classList.toggle('app-cc-clip-selected', Number(r.getAttribute('data-cc-clip')) === i);
    });
  }
  function openClip(i) {
    var c = data.generatedClips[i];
    currentDraft = data.summaryDrafts[0];
    selectClipRow(i);
    document.getElementById('pv-title').textContent = c.title;
    setPreviewMode('clip');
    preview.classList.toggle('app-pv-saved', !!c.saved);
    document.querySelector('[data-clip-delete]').textContent = c.pending ? 'Discard' : 'Delete draft';
    preview.classList.toggle('app-pv-processing', !!c.processing);
    preview.hidden = false;
    drawer.classList.add('app-drawer-previewing');
    syncUrl();
    var media = { entryId: k.entryId, seekFrom: c.start, clipTo: c.start + c.length };
    if (!kClip) {
      try {
        kClip = KalturaPlayer.setup({ targetId: 'kaltura-player-clip', provider: { partnerId: k.partnerId, uiConfId: k.uiConfId } });
      } catch (err) { console.error(err.message); return; }
    }
    if (kClip.__clip !== c.start + ':' + c.length) {
      kClip.__clip = c.start + ':' + c.length;
      var poster = thumbUrl(c.start + c.length / 2, 800);
      kClip.loadMedia(media);
      // Cover frame from inside the clip, not the entry's first frame (prototype: paint the player's poster element)
      var tries = 0, paint = setInterval(function () {
        var el = document.querySelector('#kaltura-player-clip .playkit-poster');
        if (el) el.style.backgroundImage = 'url("' + poster + '")';
        if (++tries > 20) clearInterval(paint);
      }, 250);
    }
  }
  function updateClipsCardCount() {
    var meta = clipsCard.querySelector('.app-cl-card-meta');
    if (meta) meta.textContent = data.generatedClips.filter(function (c) { return !c.pending; }).length + ' Clips';
  }

  // ===== Save clip modal: "Preparing your video" for 2s, then the details form =====
  var scTimer;
  function openSaveClipModal(clip) {
    var modal = document.getElementById('save-clip-modal');
    var dots = modal.querySelector('.app-sc-dots');
    if (!dots.children.length) dots.innerHTML = new Array(73).join('<span></span>');
    Array.prototype.forEach.call(dots.children, function (d, i) { d.style.animationDelay = (i % 24) * 0.05 + 's'; });
    modal.querySelector('[data-sc-step="preparing"]').hidden = false;
    modal.querySelector('[data-sc-step="form"]').hidden = true;
    document.getElementById('sc-save').disabled = true;
    document.getElementById('sc-title').value = clip.title;
    document.getElementById('sc-desc').value = 'A short clip from the session: ' + clip.title + '. Learn how AI-driven content workflows help teams create, enrich and reuse video at scale.';
    document.getElementById('sc-burn-captions').checked = false;
    document.getElementById('sc-tags').innerHTML = ['Generative AI', 'Content strategy', 'Video workflows'].map(function (t) {
      return '<span class="ds-tag">' + t + ' <button class="ds-tag-close" aria-label="Remove ' + t + '"><ds-icon name="close" size="16"></ds-icon></button></span>';
    }).join('');
    DS.openModal('save-clip-modal');
    clearTimeout(scTimer);
    scTimer = setTimeout(function () {
      modal.querySelector('[data-sc-step="preparing"]').hidden = true;
      modal.querySelector('[data-sc-step="form"]').hidden = false;
      document.getElementById('sc-save').disabled = false;
    }, 2000);
  }
  document.getElementById('save-clip-modal').addEventListener('ds-close', function () { clearTimeout(scTimer); });
  document.getElementById('sc-tags').addEventListener('click', function (e) {
    var x = e.target.closest('.ds-tag-close');
    if (x) x.parentNode.remove();
  });

  document.addEventListener('click', function (e) {
    var row = e.target.closest('[data-cc-clip]');
    if (row && !e.target.closest('[data-cc-reuse]')) openClip(Number(row.getAttribute('data-cc-clip')));

    if (e.target.closest('[data-clip-trim]')) openClipTrimmer(data.generatedClips[selectedClip]);

    if (e.target.closest('[data-clip-save]')) openSaveClipModal(data.generatedClips[selectedClip]);

    if (e.target.closest('#sc-save')) {
      var saved = data.generatedClips[selectedClip];
      saved.title = document.getElementById('sc-title').value || saved.title;
      saved.saved = true;
      saved.processing = true;
      if (saved.pending) { saved.pending = false; onClipsChanged(); }
      DS.closeModal('save-clip-modal');
      renderGeneratedClips();
      openClip(selectedClip);
      if (kClip) kClip.pause();
      // Prototype: processing finishes after a few seconds, then all clip options are available
      setTimeout(function () {
        saved.processing = false;
        var i = data.generatedClips.indexOf(saved);
        if (i === selectedClip && !preview.hidden) preview.classList.remove('app-pv-processing');
        syncUrl();
        DS.showToast({ type: 'success', message: 'Clip \u201c' + saved.title + '\u201d is ready' });
      }, 6000);
      DS.showToast({ type: 'success', message: 'Clip \u201c' + saved.title + '\u201d saved in My Media' });
    }

    if (e.target.closest('[data-clip-delete]')) {
      var gone = data.generatedClips.splice(selectedClip, 1)[0];
      closePreview();
      renderGeneratedClips();
      updateClipsCardCount();
      if (!gone.pending) DS.showToast({ type: 'success', message: 'Draft \u201c' + gone.title + '\u201d deleted' });
    }
  });
  document.getElementById('clips-list').addEventListener('keydown', function (e) {
    var row = e.target.closest('[data-cc-clip]');
    if (row && e.target === row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); row.click(); }
  });

  // Loading animation: a grid of dots
  document.querySelector('.app-cc-dots').innerHTML = new Array(26 * 6 + 1).join('<span></span>');

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!preview.hidden) closePreview();
    else setOpen(false);
  });

  // ===== Prototype-only: page in the URL, so each screen can be opened directly =====
  // ?page=menu | clips-create | clips-loading | clips | clip&clip=N | trim&clip=N | summary | chapters
  // No param = the page with Content Lab closed. Clip numbers start at 1.
  var urlReady = false, urlTimer = null;
  function currentPage() {
    if (!drawer.classList.contains('app-drawer-open')) return null;
    var main = preview.hidden ? null : preview.querySelector('.app-pv-main:not([hidden])');
    var mode = main && main.getAttribute('data-pv-mode');
    if (mode === 'summary') return { page: 'summary' };
    if (mode === 'clips') return { page: 'chapters' };
    if (mode === 'clip') {
      var sc = data.generatedClips[selectedClip];
      return { page: 'clip', clip: selectedClip + 1, saved: sc && sc.saved ? (sc.processing ? 'processing' : '1') : '' };
    }
    if (mode === 'trim') return { page: 'trim', clip: data.generatedClips.indexOf(trim.clip) + 1 };
    var view = drawer.querySelector('[data-view]:not([hidden])');
    return { page: view ? view.getAttribute('data-view') : 'menu' };
  }
  function syncUrl() {
    if (!urlReady) return;
    clearTimeout(urlTimer);  // wait for the whole click to settle, then write the URL once
    urlTimer = setTimeout(function () {
      var p = currentPage(), q = new URLSearchParams();
      if (p) { q.set('page', p.page); if (p.clip) q.set('clip', p.clip); if (p.saved) q.set('saved', p.saved); }
      var url = location.pathname + (p ? '?' + q.toString() : '');
      try { history.replaceState(null, '', url); } catch (err) { /* some browsers block this on file:// */ }
    }, 0);
  }
  function applyUrl() {
    var q = new URLSearchParams(location.search), page = q.get('page');
    var n = Math.max(0, (Number(q.get('clip')) || 1) - 1);
    if (!page) return;
    setOpen(true);
    // Pages that need clips get the AI result straight away, with the form's default prompt
    if (/^(clips|clip|trim)$/.test(page) && !data.generatedClips.length) generateClips(readPrompt());
    n = Math.min(n, data.generatedClips.length - 1);
    // ?saved=1 opens the clip as saved and ready; ?saved=processing as saved and still processing
    var savedQ = q.get('saved');
    if (savedQ && page === 'clip' && data.generatedClips[n]) {
      data.generatedClips[n].saved = true;
      data.generatedClips[n].processing = savedQ === 'processing';
      renderGeneratedClips();
    }
    if (page === 'clips-create' || page === 'clips') showView(page);
    else if (page === 'clips-loading') { showView('clips-create'); ccForm.requestSubmit(); }
    else if (page === 'summary' || page === 'chapters') {
      showView('summary'); openPreview(0);
      if (page === 'chapters') setPreviewMode('clips');
    } else if (page === 'clip' || page === 'trim') {
      showView('clips'); openClip(n);
      if (page === 'trim') openClipTrimmer(data.generatedClips[n]);
    }
  }
  applyUrl();
  urlReady = true;
  syncUrl();
})();
