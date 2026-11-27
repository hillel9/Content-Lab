/* ============================================
   ds.js - Design System behavior
   Classic script (no modules, no build). Works over file://.
   All behavior is event-delegated on `document`, so components
   added to the page later work with no init call.

   Public API:   window.DS  { version, setTheme, getTheme, showToast, openModal, closeModal, setProcessing }
   Custom events (bubble):
     ds-change        select / autocomplete / tabs / segmented / switch / pagination / slider /
                      date picker / time picker / rich text                                detail: { value, label }
     ds-open          modal opened                                       detail: { id }
     ds-close         modal closed                                       detail: { id, reason: 'button' | 'api' | 'escape' | 'backdrop' }
     ds-theme-change  fired on document                                  detail: { theme }
   Web component:  <ds-icon name="settings" size="16|24"></ds-icon>  (needs ds-icons.js)
   ============================================ */
(function () {
  'use strict';

  if (window.DS && window.DS.version) return; // already loaded

  var doc = document;
  var root = doc.documentElement;

  /* ---------- helpers ---------- */

  function emit(el, name, detail) {
    el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: detail }));
  }

  function textOf(el) {
    return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }

  function toArray(list) {
    return Array.prototype.slice.call(list);
  }

  // value = data-value if present, otherwise the visible label
  function valueOf(el, label) {
    return el.hasAttribute('data-value') ? el.getAttribute('data-value') : label;
  }

  function isDisabled(el) {
    return el.disabled || el.getAttribute('aria-disabled') === 'true';
  }

  function isVisible(el) {
    return el.getClientRects().length > 0;
  }

  // Move focus along a list. key: ArrowDown/Right = next, ArrowUp/Left = previous, Home, End.
  function stepIndex(key, index, length) {
    if (key === 'Home') return 0;
    if (key === 'End') return length - 1;
    if (key === 'ArrowDown' || key === 'ArrowRight') return (index + 1) % length;
    return (index - 1 + length) % length;
  }

  /* ---------- theme ---------- */

  function getTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      console.warn('[DS] setTheme expects "light" or "dark", got:', theme);
      return;
    }
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    emit(doc, 'ds-theme-change', { theme: theme });
  }

  /* ---------- <ds-icon> ---------- */

  var warned = {};

  function renderIcon(el) {
    var size = el.getAttribute('size') === '16' ? 16 : 24;
    var name = el.getAttribute('name');
    var registry = window.DS_ICONS;
    if (!registry || !name) { el.innerHTML = ''; return; }

    var svg = (registry[size] && registry[size][name]) || (registry[24] && registry[24][name]);
    if (!svg) {
      if (!warned[name]) {
        warned[name] = true;
        console.warn('[DS] <ds-icon>: unknown icon "' + name + '"');
      }
      el.innerHTML = '';
      return;
    }
    var attrs = ' width="' + size + '" height="' + size + '"' +
      (el.hasAttribute('aria-label') ? ' role="img"' : ' aria-hidden="true"');
    el.innerHTML = svg.replace('<svg', '<svg' + attrs);
  }

  if (window.customElements && !customElements.get('ds-icon')) {
    customElements.define('ds-icon', class extends HTMLElement {
      static get observedAttributes() { return ['name', 'size']; }
      connectedCallback() { renderIcon(this); }
      attributeChangedCallback() { if (this.isConnected) renderIcon(this); }
    });
  }

  // ds-icons.js may load after ds.js
  doc.addEventListener('ds-icons-ready', function () {
    toArray(doc.querySelectorAll('ds-icon')).forEach(renderIcon);
  });

  /* ---------- select ---------- */

  var OPEN = 'ds-select-open';
  var ITEM_SELECTOR = 'button.ds-select-item, .ds-switch-track, input.ds-checkbox-input';

  function selectItems(wrapper) {
    var menu = wrapper.querySelector('.ds-select-menu');
    if (!menu) return [];
    return toArray(menu.querySelectorAll(ITEM_SELECTOR)).filter(function (el) {
      return !isDisabled(el) && !el.closest('[aria-disabled="true"]');
    });
  }

  function closeSelect(wrapper, returnFocus) {
    var trigger = wrapper.querySelector('.ds-select');
    wrapper.classList.remove(OPEN);
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      if (returnFocus) trigger.focus();
    }
  }

  function closeSelects(except) {
    toArray(doc.querySelectorAll('.' + OPEN)).forEach(function (w) {
      if (w !== except) closeSelect(w);
    });
  }

  function openSelect(wrapper, focusItem) {
    var trigger = wrapper.querySelector('.ds-select');
    if (!trigger || isDisabled(trigger)) return;
    closeSelects(wrapper);
    wrapper.classList.add(OPEN);
    trigger.setAttribute('aria-expanded', 'true');
    if (focusItem) {
      var items = selectItems(wrapper);
      var el = focusItem === 'last' ? items[items.length - 1] : items[0];
      if (el) el.focus();
    }
  }

  function pickOption(item, viaKeyboard) {
    var wrapper = item.closest('.ds-select-wrapper');
    if (!wrapper) return;
    var trigger = wrapper.querySelector('.ds-select');
    var menu = wrapper.querySelector('.ds-select-menu');
    var label = textOf(item.querySelector('.ds-select-item-label'));

    var triggerLabel = trigger.querySelector('span');
    if (triggerLabel) triggerLabel.textContent = label;

    // move the check mark to the picked item
    toArray(menu.querySelectorAll('.ds-select-item-trailing')).forEach(function (n) { n.remove(); });
    toArray(menu.querySelectorAll('[role="option"]')).forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
    item.setAttribute('aria-selected', 'true');
    var check = doc.createElement('ds-icon');
    check.setAttribute('name', 'check');
    check.setAttribute('size', '16');
    check.className = 'ds-select-item-trailing';
    item.appendChild(check);

    closeSelect(wrapper, viaKeyboard);
    emit(wrapper, 'ds-change', { value: valueOf(item, label), label: label });
  }

  doc.addEventListener('click', function (e) {
    var target = e.target;
    if (!target.closest) return;

    // close every open select except the one we clicked inside
    closeSelects(target.closest('.ds-select-wrapper'));

    var trigger = target.closest('.ds-select-wrapper > .ds-select');
    if (trigger && !isDisabled(trigger)) {
      var wrapper = trigger.parentElement;
      if (wrapper.classList.contains(OPEN)) closeSelect(wrapper);
      else openSelect(wrapper, e.detail === 0 ? 'first' : null); // detail 0 = keyboard activation
      return;
    }

    var item = target.closest('.ds-select-item[role="option"]');
    if (item && !isDisabled(item)) pickOption(item, e.detail === 0);
  });

  // keyboard: Escape / arrows / Home / End / Enter
  doc.addEventListener('keydown', function (e) {
    var key = e.key;
    var wrapper = e.target.closest ? e.target.closest('.ds-select-wrapper') : null;

    if (key === 'Escape') {
      var open = (wrapper && wrapper.classList.contains(OPEN)) ? wrapper : doc.querySelector('.' + OPEN);
      if (open) {
        closeSelect(open, true);
        e.preventDefault(); // tells the modal handler this Escape was already used
      }
      return;
    }
    if (!wrapper) return;

    if (e.target.matches('.ds-select')) {
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        e.preventDefault();
        openSelect(wrapper, key === 'ArrowUp' ? 'last' : 'first');
      }
      return;
    }

    if (!wrapper.classList.contains(OPEN)) return;

    if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
      var items = selectItems(wrapper);
      if (!items.length) return;
      e.preventDefault();
      var i = items.indexOf(doc.activeElement);
      if (i < 0) i = key === 'ArrowUp' ? 0 : -1;
      items[stepIndex(key, i, items.length)].focus();
    } else if (key === 'Enter' && e.target.matches('.ds-checkbox-input')) {
      e.preventDefault();
      e.target.click(); // checkboxes only toggle on Space natively
    }
  });

  // Tabbing out of an open select closes it
  doc.addEventListener('focusout', function (e) {
    var wrapper = e.target.closest ? e.target.closest('.ds-select-wrapper.' + OPEN) : null;
    if (wrapper && e.relatedTarget && !wrapper.contains(e.relatedTarget)) closeSelect(wrapper);
  });

  // multi-select: checkboxes inside a menu report the full checked set
  doc.addEventListener('change', function (e) {
    var cb = e.target;
    if (!cb.matches || !cb.matches('.ds-select-menu .ds-checkbox-input')) return;
    var wrapper = cb.closest('.ds-select-wrapper');
    if (!wrapper) return;
    var picked = toArray(wrapper.querySelectorAll('.ds-select-menu .ds-checkbox-input:checked')).map(function (c) {
      var item = c.closest('.ds-select-item');
      var label = textOf(item && item.querySelector('.ds-select-item-label'));
      return { value: item ? valueOf(item, label) : label, label: label };
    });
    emit(wrapper, 'ds-change', {
      value: picked.map(function (p) { return p.value; }),
      label: picked.map(function (p) { return p.label; }).join(', ')
    });
  });

  /* ---------- autocomplete ----------
     .ds-autocomplete > .ds-autocomplete-field (chips, input.ds-autocomplete-input, clear, chevron)
                      + .ds-autocomplete-menu (button.ds-select-item[role=option] ..., .ds-autocomplete-empty)
     Single value: picking fills the input. Multiple (.ds-autocomplete-multiple): picking toggles a
     chip; the menu stays open. Typing filters options by label, unless the wrapper has
     data-filter="none" (then the page fills the menu itself, listening to the input's `input` event).
     Fires ds-change on the wrapper: single { value, label }, multiple { value: [..], label: 'a, b' }. */

  var AC = '.ds-autocomplete';
  var AC_OPEN = 'ds-autocomplete-open';
  var acCount = 0;

  function acParts(w) {
    return {
      field: w.querySelector('.ds-autocomplete-field'),
      input: w.querySelector('.ds-autocomplete-input'),
      menu: w.querySelector('.ds-autocomplete-menu'),
      clear: w.querySelector('.ds-autocomplete-clear'),
      more: w.querySelector('.ds-autocomplete-more')
    };
  }

  function acMultiple(w) { return w.classList.contains('ds-autocomplete-multiple'); }

  function acOptions(w, visibleOnly) {
    var menu = w.querySelector('.ds-autocomplete-menu');
    if (!menu) return [];
    return toArray(menu.querySelectorAll('.ds-select-item[role="option"]')).filter(function (o) {
      return !isDisabled(o) && (!visibleOnly || !o.hidden);
    });
  }

  function acChips(w) {
    return toArray(w.querySelectorAll('.ds-autocomplete-field > .ds-chip:not(.ds-autocomplete-more)'));
  }

  function acLabelOf(opt) { return textOf(opt.querySelector('.ds-select-item-label')); }

  // give the input, menu and options the ids and ARIA a combobox needs (idempotent)
  function acSetup(w) {
    if (w._dsAc) return;
    w._dsAc = true;
    var p = acParts(w);
    if (!p.input || !p.menu) return;
    acCount += 1;
    if (!p.menu.id) p.menu.id = 'ds-ac-menu-' + acCount;
    p.menu.setAttribute('role', 'listbox');
    if (acMultiple(w)) p.menu.setAttribute('aria-multiselectable', 'true');
    p.input.setAttribute('role', 'combobox');
    p.input.setAttribute('aria-autocomplete', 'list');
    p.input.setAttribute('aria-controls', p.menu.id);
    p.input.setAttribute('aria-expanded', 'false');
    p.input.setAttribute('autocomplete', 'off');
    acSyncSelected(w);
  }

  // multiple: options whose value has a chip are aria-selected
  function acSyncSelected(w) {
    if (!acMultiple(w)) return;
    var values = acChips(w).map(function (c) { return c.getAttribute('data-value') || textOf(c); });
    acOptions(w).forEach(function (o) {
      var label = acLabelOf(o);
      o.setAttribute('aria-selected', values.indexOf(valueOf(o, label)) >= 0 ? 'true' : 'false');
    });
  }

  function acSetActive(w, opt) {
    var p = acParts(w);
    acOptions(w).forEach(function (o) { o.classList.remove('ds-autocomplete-active'); });
    if (opt) {
      acCount += 1;
      if (!opt.id) opt.id = 'ds-ac-opt-' + acCount;
      opt.classList.add('ds-autocomplete-active');
      p.input.setAttribute('aria-activedescendant', opt.id);
      opt.scrollIntoView({ block: 'nearest' });
    } else {
      p.input.removeAttribute('aria-activedescendant');
    }
  }

  function acUpdateClear(w) {
    var p = acParts(w);
    if (!p.clear) return;
    var hasValue = p.input.value !== '' || acChips(w).length > 0;
    p.clear.hidden = !(hasValue && w.classList.contains(AC_OPEN));
  }

  function acFilter(w) {
    var p = acParts(w);
    if (!p.menu) return;
    var q = p.input.value.trim().toLowerCase();
    if (w.getAttribute('data-filter') !== 'none') {
      acOptions(w).forEach(function (o) {
        o.hidden = q !== '' && acLabelOf(o).toLowerCase().indexOf(q) < 0;
      });
    }
    acSetActive(w, null);
  }

  function acOpen(w) {
    var p = acParts(w);
    if (!p.input || p.input.disabled || w.classList.contains(AC_OPEN)) return;
    acSetup(w);
    toArray(doc.querySelectorAll(AC + '.' + AC_OPEN)).forEach(function (o) { if (o !== w) acClose(o); });
    w.classList.add(AC_OPEN);
    p.input.setAttribute('aria-expanded', 'true');
    acExpand(w);
    // show every option when opening; typing narrows it down
    if (w.getAttribute('data-filter') !== 'none') acOptions(w).forEach(function (o) { o.hidden = false; });
    acUpdateClear(w);
  }

  // freeSolo (KEP): the typed text is a value too, even if no option matches
  function acFreeSolo(w) { return w.classList.contains('ds-autocomplete-free-solo'); }

  function acCommitFree(w) {
    var p = acParts(w);
    var text = p.input.value.trim();
    if (acMultiple(w)) {
      var match = acOptions(w).filter(function (o) { return acLabelOf(o).toLowerCase() === text.toLowerCase(); })[0];
      if (match) { acPick(w, match); return; }
      var exists = acChips(w).some(function (c) { return (c.getAttribute('data-value') || textOf(c)) === text; });
      if (!exists) p.field.insertBefore(acMakeChip(p.input, text, text), p.more || p.input);
      p.input.value = '';
      acFilter(w);
      acSyncSelected(w);
      acUpdateClear(w);
      acEmitMulti(w);
      return;
    }
    w._dsFreeValue = text;
    acClose(w);
    emit(w, 'ds-change', { value: text, label: text });
  }

  function acClose(w) {
    var p = acParts(w);
    // single freeSolo: leaving the field keeps what was typed as the value
    if (acFreeSolo(w) && !acMultiple(w) && p.input && w.classList.contains(AC_OPEN)) {
      var typed = p.input.value.trim();
      var picked = acOptions(w).filter(function (o) { return o.getAttribute('aria-selected') === 'true'; })[0];
      var current = picked ? acLabelOf(picked) : (w._dsFreeValue || '');
      if (typed !== current && typed !== '') {
        w._dsFreeValue = typed;
        acOptions(w).forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
        emit(w, 'ds-change', { value: typed, label: typed });
      }
    }
    w.classList.remove(AC_OPEN);
    if (p.input) p.input.setAttribute('aria-expanded', 'false');
    acSetActive(w, null);
    acUpdateClear(w);
    if (acMultiple(w) && p.input) p.input.value = '';
    acCollapse(w);
  }

  function acEmitMulti(w) {
    var chips = acChips(w);
    emit(w, 'ds-change', {
      value: chips.map(function (c) { return c.getAttribute('data-value') || textOf(c); }),
      label: chips.map(function (c) { return textOf(c); }).join(', ')
    });
  }

  function acMakeChip(opt, label, value) {
    var chip = doc.createElement('span');
    chip.className = 'ds-chip';
    chip.setAttribute('data-value', value);
    var pic = opt.querySelector('.ds-autocomplete-picture');
    if (pic) {
      var img = doc.createElement('img');
      img.className = 'ds-chip-picture';
      img.src = pic.getAttribute('src');
      img.alt = '';
      chip.appendChild(img);
    }
    var content = doc.createElement('span');
    content.className = 'ds-chip-content';
    content.appendChild(doc.createTextNode(label));
    var close = doc.createElement('button');
    close.type = 'button';
    close.className = 'ds-chip-close';
    close.setAttribute('aria-label', 'Remove ' + label);
    close.tabIndex = -1;
    var icon = doc.createElement('ds-icon');
    icon.setAttribute('name', 'close');
    icon.setAttribute('size', '16');
    close.appendChild(icon);
    content.appendChild(close);
    chip.appendChild(content);
    return chip;
  }

  function acPick(w, opt) {
    var p = acParts(w);
    var label = acLabelOf(opt);
    var value = valueOf(opt, label);
    if (!acMultiple(w)) {
      p.input.value = label;
      acOptions(w).forEach(function (o) { o.setAttribute('aria-selected', o === opt ? 'true' : 'false'); });
      acClose(w);
      emit(w, 'ds-change', { value: value, label: label });
      return;
    }
    var existing = acChips(w).filter(function (c) { return (c.getAttribute('data-value') || textOf(c)) === value; })[0];
    if (existing) existing.remove();
    else p.field.insertBefore(acMakeChip(opt, label, value), p.more || p.input);
    acSyncSelected(w);
    if (p.input.value !== '') {
      // ready to type the next value: clear the text and show every option again
      p.input.value = '';
      acFilter(w);
    }
    acUpdateClear(w);
    p.input.focus();
    acEmitMulti(w);
  }

  function acRemoveChip(w, chip) {
    chip.remove();
    acSyncSelected(w);
    acUpdateClear(w);
    acCollapse(w);
    acEmitMulti(w);
  }

  function acClear(w) {
    var p = acParts(w);
    p.input.value = '';
    if (acMultiple(w)) {
      acChips(w).forEach(function (c) { c.remove(); });
      acSyncSelected(w);
      acEmitMulti(w);
    } else {
      acOptions(w).forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
      emit(w, 'ds-change', { value: '', label: '' });
    }
    acFilter(w);
    acUpdateClear(w);
    p.input.focus();
  }

  // While in use the field wraps and shows every chip.
  function acExpand(w) {
    acChips(w).forEach(function (c) { c.classList.remove('ds-autocomplete-chip-hidden'); });
    var more = acParts(w).more;
    if (more) more.classList.remove('ds-autocomplete-more-shown');
  }

  // Not in use: one row; chips that don't fit are hidden behind a "+N" counter with a hint listing them.
  function acCollapse(w) {
    if (!acMultiple(w) || w.classList.contains(AC_OPEN)) return;
    var p = acParts(w);
    var chips = acChips(w);
    acExpand(w);
    if (!p.field || !chips.length || !isVisible(p.field)) return;
    var more = p.more;
    if (!more) {
      more = doc.createElement('span');
      more.className = 'ds-chip ds-autocomplete-more ds-tooltip-trigger';
      more.innerHTML = '<span class="ds-chip-content"></span>' +
        '<div class="ds-tooltip ds-tooltip-top"><div class="ds-tooltip-body"></div>' +
        '<div class="ds-tooltip-arrow"><svg width="14" height="9" viewBox="0 0 14 9" fill="none"><path d="M0 0L5.4 7Q7 9 8.6 7L14 0Z" fill="currentColor"/></svg></div></div>';
      p.field.insertBefore(more, p.input);
    }
    // room on the first row = field width minus the input's minimum and the icons on the right
    var fieldBox = p.field.getBoundingClientRect();
    var styles = getComputedStyle(p.field);
    var gap = parseFloat(styles.columnGap) || 0;
    var limit = fieldBox.right - parseFloat(styles.paddingRight) - parseFloat(styles.borderRightWidth);
    toArray(p.field.children).forEach(function (el) {
      if (el.matches('.ds-autocomplete-clear, .ds-autocomplete-chevron') && !el.hidden) limit -= el.getBoundingClientRect().width + gap;
    });
    limit -= (parseFloat(getComputedStyle(p.input).minWidth) || 0) + gap;
    // measure the counter at its widest likely size, then keep as many chips as fit before it
    more.querySelector('.ds-chip-content').textContent = '+' + chips.length;
    more.classList.add('ds-autocomplete-more-shown');
    var counterRoom = more.getBoundingClientRect().width + gap;
    var hidden = [];
    if (chips[chips.length - 1].getBoundingClientRect().right > limit) {
      var keep = 0;
      while (keep < chips.length && chips[keep].getBoundingClientRect().right <= limit - counterRoom) keep += 1;
      hidden = chips.slice(keep);
    }
    hidden.forEach(function (c) { c.classList.add('ds-autocomplete-chip-hidden'); });
    if (!hidden.length) { more.classList.remove('ds-autocomplete-more-shown'); return; }
    more.querySelector('.ds-chip-content').textContent = '+' + hidden.length;
    more.querySelector('.ds-tooltip-body').textContent = hidden.map(function (c) { return textOf(c); }).join('\n');
    more.setAttribute('aria-label', hidden.length + ' more: ' + hidden.map(function (c) { return textOf(c); }).join(', '));
  }

  function acCollapseAll() {
    toArray(doc.querySelectorAll(AC + '.ds-autocomplete-multiple')).forEach(function (w) { acSetup(w); acCollapse(w); });
  }

  // collapse existing ones when the page is ready, new ones as they are added, and all on resize
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', acCollapseAll);
  else setTimeout(acCollapseAll, 0);
  doc.addEventListener('ds-icons-ready', acCollapseAll);
  var acResizeQueued = false;
  window.addEventListener('resize', function () {
    if (acResizeQueued) return;
    acResizeQueued = true;
    requestAnimationFrame(function () { acResizeQueued = false; acCollapseAll(); });
  });
  if (window.MutationObserver) {
    new MutationObserver(function (records) {
      var found = false;
      records.forEach(function (r) {
        toArray(r.addedNodes).forEach(function (n) {
          if (n.nodeType === 1 && (n.matches(AC) || n.querySelector(AC))) found = true;
        });
      });
      if (found) acCollapseAll();
    }).observe(doc.documentElement, { childList: true, subtree: true });
  }

  doc.addEventListener('focusin', function (e) {
    var input = e.target;
    if (input.matches && input.matches('.ds-autocomplete-input')) acOpen(input.closest(AC));
  });

  doc.addEventListener('mousedown', function (e) {
    var t = e.target;
    if (!t.closest) return;
    var w = t.closest(AC);
    // keep focus in the input when using the menu, chips or icons
    if (w && !t.matches('.ds-autocomplete-input') && t.closest('.ds-autocomplete-field, .ds-autocomplete-menu')) {
      if (!t.closest('.ds-autocomplete-retry')) e.preventDefault();
    }
  });

  doc.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;
    var w = t.closest(AC);
    // close other open autocompletes
    toArray(doc.querySelectorAll(AC + '.' + AC_OPEN)).forEach(function (o) { if (o !== w) acClose(o); });
    if (!w) return;
    var p = acParts(w);
    if (!p.input || p.input.disabled) return;

    var chipClose = t.closest('.ds-chip-close');
    if (chipClose && p.field.contains(chipClose)) { acRemoveChip(w, chipClose.closest('.ds-chip')); return; }
    if (t.closest('.ds-autocomplete-clear')) { acClear(w); return; }

    var opt = t.closest('.ds-autocomplete-menu .ds-select-item[role="option"]');
    if (opt) { if (!isDisabled(opt)) acPick(w, opt); return; }

    if (t.closest('.ds-autocomplete-chevron')) {
      if (w.classList.contains(AC_OPEN)) acClose(w);
      else { acOpen(w); p.input.focus(); }
      return;
    }
    if (t.closest('.ds-autocomplete-field')) {
      p.input.focus();
      acOpen(w);
    }
  });

  doc.addEventListener('input', function (e) {
    var input = e.target;
    if (!input.matches || !input.matches('.ds-autocomplete-input')) return;
    var w = input.closest(AC);
    acOpen(w);
    acFilter(w);
    acUpdateClear(w);
  });

  doc.addEventListener('keydown', function (e) {
    var input = e.target;
    if (!input.matches || !input.matches('.ds-autocomplete-input')) return;
    var w = input.closest(AC);
    var key = e.key;
    var open = w.classList.contains(AC_OPEN);

    if (key === 'Escape') {
      if (open) {
        acClose(w);
        e.preventDefault(); // used here, so an enclosing modal ignores it
      }
      return;
    }
    if (key === 'ArrowDown' || key === 'ArrowUp' || ((key === 'Home' || key === 'End') && open)) {
      e.preventDefault();
      if (!open) acOpen(w);
      var items = acOptions(w, true);
      if (!items.length) return;
      var i = items.indexOf(w.querySelector('.ds-autocomplete-active'));
      if (i < 0) i = key === 'ArrowUp' ? 0 : -1;
      acSetActive(w, items[stepIndex(key, i, items.length)]);
      return;
    }
    if (key === 'Enter' && open) {
      var active = w.querySelector('.ds-autocomplete-active');
      if (active) { e.preventDefault(); acPick(w, active); }
      else if (acFreeSolo(w) && input.value.trim() !== '') { e.preventDefault(); acCommitFree(w); }
      return;
    }
    if (key === 'Enter' && acFreeSolo(w) && input.value.trim() !== '') { e.preventDefault(); acCommitFree(w); return; }
    if (key === 'Backspace' && acMultiple(w) && input.value === '' && input.selectionStart === 0) {
      var chips = acChips(w);
      if (chips.length) { e.preventDefault(); acRemoveChip(w, chips[chips.length - 1]); }
    }
  });

  doc.addEventListener('focusout', function (e) {
    var input = e.target;
    if (!input.matches || !input.matches('.ds-autocomplete-input')) return;
    var w = input.closest(AC);
    if (!e.relatedTarget || !w.contains(e.relatedTarget)) acClose(w);
  });

  /* ---------- tabs + segmented control (same pattern) ---------- */

  var GROUPS = [
    { item: '.ds-tab[role="tab"]',                   list: '[role="tablist"]',   attr: 'aria-selected' },
    // segmented buttons; .ds-segmented-item is the old name, kept so older prototypes keep working
    { item: '.ds-segmented-item[role="radio"], .ds-segmented-button[role="radio"]', list: '[role="radiogroup"]', attr: 'aria-checked' }
  ];

  function selectInGroup(cfg, item, focus) {
    var list = item.closest(cfg.list);
    if (!list) return;
    var wasSelected = item.getAttribute(cfg.attr) === 'true';
    toArray(list.querySelectorAll(cfg.item)).forEach(function (i) { i.setAttribute(cfg.attr, 'false'); });
    item.setAttribute(cfg.attr, 'true');
    if (focus) item.focus();
    if (wasSelected) return; // no change, no event
    var label = textOf(item.querySelector('span')) || item.getAttribute('aria-label') || textOf(item);
    emit(list, 'ds-change', { value: valueOf(item, label), label: label });
  }

  GROUPS.forEach(function (cfg) {
    doc.addEventListener('click', function (e) {
      var item = e.target.closest && e.target.closest(cfg.item);
      if (item && !isDisabled(item) && !item.closest(cfg.list + '[aria-disabled="true"]')) selectInGroup(cfg, item, false);
    });

    doc.addEventListener('keydown', function (e) {
      var item = e.target.closest && e.target.closest(cfg.item);
      if (!item) return;
      var k = e.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].indexOf(k) < 0) return;
      var list = item.closest(cfg.list);
      if (list.getAttribute('aria-disabled') === 'true') return; // whole group disabled (KEP SegmentedContainer disabled)
      var items = toArray(list.querySelectorAll(cfg.item)).filter(function (i) { return !isDisabled(i); });
      if (!items.length) return;
      e.preventDefault();
      var key = k === 'ArrowUp' ? 'ArrowLeft' : k === 'ArrowDown' ? 'ArrowRight' : k;
      var next = items[stepIndex(key, items.indexOf(item), items.length)];
      selectInGroup(cfg, next, true);
    });
  });

  /* ---------- switch ----------
     button.ds-switch-track[role=switch][aria-checked] > span.ds-switch-thumb (KEP UI: track, thumb, checked).
     The old ds-switch-handle and ds-switch-on / ds-switch-off classes still work; ds.js updates on/off only on
     markup that already has them. */

  function setSwitch(btn, on) {
    btn.setAttribute('aria-checked', String(on));
    // old markup carries ds-switch-on / ds-switch-off: keep it in step, but never add them to new markup
    if (btn.classList.contains('ds-switch-on') || btn.classList.contains('ds-switch-off')) {
      btn.classList.toggle('ds-switch-on', on);
      btn.classList.toggle('ds-switch-off', !on);
    }
  }

  doc.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.ds-switch-track[role="switch"]');
    if (!btn || isDisabled(btn)) return;
    // state = aria-checked (KEP "checked"); older markup may only have the ds-switch-on class
    var was = btn.hasAttribute('aria-checked') ? btn.getAttribute('aria-checked') === 'true' : btn.classList.contains('ds-switch-on');
    var on = !was;
    setSwitch(btn, on);
    var content = btn.closest('.ds-switch, .ds-select-item');
    var label = textOf(content && content.querySelector('.ds-switch-label, .ds-select-item-label'));
    emit(btn, 'ds-change', { value: on, label: label });
  });

  /* ---------- data table ---------- */

  function setRowSelected(cb) {
    var row = cb.closest('tr');
    if (row) row.classList.toggle('ds-table-row-selected', cb.checked);
  }

  doc.addEventListener('change', function (e) {
    var cb = e.target;
    if (!cb.matches) return;

    if (cb.matches('.ds-table-row-cb')) {
      setRowSelected(cb);
      return;
    }
    // select-all: a checkbox in the table header
    if (cb.matches('.ds-table thead .ds-checkbox-input')) {
      var table = cb.closest('.ds-table');
      toArray(table.querySelectorAll('.ds-table-row-cb')).forEach(function (r) {
        r.checked = cb.checked;
        setRowSelected(r);
      });
    }
  });

  /* ---------- pagination ---------- */

  doc.addEventListener('click', function (e) {
    var page = e.target.closest && e.target.closest('.ds-table-page');
    if (!page || page.disabled || !/^\d+$/.test(page.textContent.trim())) return;
    var bar = page.closest('.ds-table-pagination');
    if (!bar || bar.hasAttribute('data-count') || page.getAttribute('aria-current') === 'page') return;
    toArray(bar.querySelectorAll('.ds-table-page')).forEach(function (p) { p.removeAttribute('aria-current'); });
    page.setAttribute('aria-current', 'page');
    var n = page.textContent.trim();
    emit(bar, 'ds-change', { value: Number(n), label: n });
  });

  /* ---------- toast ----------
     DS.showToast(element)   clone a .ds-alert-floating and show it fixed at the top (stays until dismissed)
     DS.showToast({ type: 'info'|'error'|'success'|'warning', message, linkText, linkHref, duration })
                             build one from options; duration in ms (default 5000, 0 = stay)
     Markup trigger: <div class="ds-alert ds-alert-floating ds-alert-info" data-ds-toast>…</div>
     (old ds-ack… class names are still accepted, for older prototypes)  */

  var toastTimer = null;

  function dismissToast(toast) {
    if (!toast || !toast.parentNode || toast.getAttribute('data-leaving')) return;
    toast.setAttribute('data-leaving', 'true');
    clearTimeout(toastTimer);
    toast.style.animation = 'ds-toast-out var(--ds-duration-exit) var(--ds-ease-out) forwards';
    var removed = false;
    function remove() { if (!removed) { removed = true; toast.remove(); } }
    toast.addEventListener('animationend', remove);
    setTimeout(remove, 600); // fallback when animations are disabled
  }

  function buildToast(opts) {
    var type = ['info', 'error', 'success', 'warning'].indexOf(opts.type) >= 0 ? opts.type : 'info';
    var toast = doc.createElement('div');
    toast.className = 'ds-alert ds-alert-floating ds-alert-' + type;

    var text = doc.createElement('span');
    text.className = 'ds-alert-text';
    text.textContent = opts.message || '';
    toast.appendChild(text);

    if (opts.linkText) {
      var link = doc.createElement('a');
      link.className = 'ds-alert-link';
      link.href = opts.linkHref || '#';
      link.textContent = opts.linkText;
      toast.appendChild(link);
    }

    var dismiss = doc.createElement('button');
    dismiss.className = 'ds-alert-dismiss';
    dismiss.setAttribute('aria-label', 'Dismiss');
    var x = doc.createElement('ds-icon');
    x.setAttribute('name', 'clear');
    dismiss.appendChild(x);
    toast.appendChild(dismiss);
    return toast;
  }

  function showToast(arg) {
    var fromElement = arg instanceof Element;
    if (fromElement && arg.classList.contains('ds-toast-active')) return;

    var existing = doc.querySelector('.ds-toast-active');
    if (existing) existing.remove();
    clearTimeout(toastTimer);

    var toast;
    if (fromElement) {
      toast = arg.cloneNode(true);
      toast.style.cursor = '';
      toast.removeAttribute('data-ds-toast');
      toast.removeAttribute('onclick');
    } else {
      toast = buildToast(arg || {});
    }
    toast.classList.add('ds-toast-active');
    toast.setAttribute('role', 'status');
    doc.body.appendChild(toast);

    var duration = fromElement ? 0 : (arg && typeof arg.duration === 'number' ? arg.duration : 5000);
    if (duration > 0) toastTimer = setTimeout(function () { dismissToast(toast); }, duration);
    return toast;
  }

  doc.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;
    var dismiss = t.closest('.ds-toast-active .ds-ack-dismiss, .ds-toast-active .ds-alert-dismiss');
    if (dismiss) {
      e.stopPropagation();
      dismissToast(dismiss.closest('.ds-toast-active'));
      return;
    }
    var trigger = t.closest('[data-ds-toast]');
    if (trigger) showToast(trigger);
  });

  // theme toggle button: <button data-ds-theme-toggle>
  doc.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-ds-theme-toggle]')) {
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    }
  });

  /* ---------- modal ----------
     Open:   DS.openModal('my-modal')   or   <button data-ds-open="my-modal">
     Close:  DS.closeModal()            or   any element with [data-ds-close] inside the dialog
             (the Cancel button, or the optional corner X).
     Task modals (the default) are STATIC on purpose: they hold forms and tasks, so clicking the
     backdrop or pressing Escape never closes them (the user would lose what they typed).
     Content modals (.ds-modal-variant-content, KEP variant="content") show content and DO close
     on a backdrop click (reason 'backdrop') or Escape (reason 'escape').
     Focus is trapped inside while open and returned to the opener on close. */

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var modalStack = []; // { el, opener }

  function focusableIn(el) {
    return toArray(el.querySelectorAll(FOCUSABLE)).filter(function (n) {
      return isVisible(n) && !n.closest('[aria-disabled="true"]');
    });
  }

  function topModal() {
    return modalStack.length ? modalStack[modalStack.length - 1] : null;
  }

  function openModal(id, opener) {
    var el = typeof id === 'string' ? doc.getElementById(id) : id;
    if (!el || !el.classList.contains('ds-modal')) {
      console.warn('[DS] openModal: no .ds-modal with id "' + id + '"');
      return;
    }
    if (!el.hasAttribute('hidden')) return; // already open

    el.removeAttribute('hidden');
    modalStack.push({ el: el, opener: opener || doc.activeElement });
    root.classList.add('ds-modal-open');

    var dialog = el.querySelector('.ds-modal-dialog');
    if (dialog && !dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
    var first = el.querySelector('[autofocus]') || focusableIn(dialog || el)[0] || dialog;
    if (first) first.focus();

    emit(el, 'ds-open', { id: el.id });
    return el;
  }

  function closeModal(id, reason) {
    var entry = null;
    if (id) {
      var target = typeof id === 'string' ? doc.getElementById(id) : id;
      for (var i = modalStack.length - 1; i >= 0; i--) {
        if (modalStack[i].el === target) { entry = modalStack.splice(i, 1)[0]; break; }
      }
    } else {
      entry = modalStack.pop();
    }
    if (!entry) return;

    entry.el.setAttribute('hidden', '');
    if (!modalStack.length) root.classList.remove('ds-modal-open');
    if (entry.opener && entry.opener.focus && doc.contains(entry.opener)) entry.opener.focus();
    emit(entry.el, 'ds-close', { id: entry.el.id, reason: reason || 'api' });
  }

  doc.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;

    var opener = t.closest('[data-ds-open]');
    if (opener) {
      e.preventDefault();
      openModal(opener.getAttribute('data-ds-open'), opener);
      return;
    }
    // content modal: a click on the backdrop (or the empty area around the dialog) closes it
    var shade = t.matches('.ds-modal-variant-content, .ds-modal-variant-content > .ds-modal-backdrop') ? t.closest('.ds-modal') : null;
    if (shade && topModal() && topModal().el === shade) {
      closeModal(shade, 'backdrop');
      return;
    }
    var closer = t.closest('[data-ds-close]');
    if (closer) {
      // the backdrop never closes a modal, even if older markup still has data-ds-close on it
      if (closer.classList.contains('ds-modal-backdrop')) return;
      var modal = closer.closest('.ds-modal');
      if (modal) closeModal(modal, 'button');
    }
  });

  doc.addEventListener('keydown', function (e) {
    var top = topModal();
    if (!top) return;

    // Escape does nothing on a task modal (the default). A content modal closes on Escape:
    // that listener is at the end of this file, so open menus, selects and pickers inside
    // the modal use the Escape first.

    if (e.key === 'Tab') {
      var dialog = top.el.querySelector('.ds-modal-dialog') || top.el;
      var items = focusableIn(dialog);
      if (!items.length) { e.preventDefault(); dialog.focus(); return; }
      var firstEl = items[0];
      var lastEl = items[items.length - 1];
      var active = doc.activeElement;
      if (e.shiftKey && (active === firstEl || active === dialog)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      } else if (!dialog.contains(active)) {
        e.preventDefault();
        firstEl.focus();
      }
    }
  });

  // If focus escapes the dialog (click on the page, script), pull it back. Toasts are allowed.
  doc.addEventListener('focusin', function (e) {
    var top = topModal();
    if (!top || top.el.contains(e.target)) return;
    if (e.target.closest && e.target.closest('.ds-toast-active')) return;
    var dialog = top.el.querySelector('.ds-modal-dialog') || top.el;
    var items = focusableIn(dialog);
    (items[0] || dialog).focus();
  });

  /* ---------- slider ----------
     .ds-slider (+ .ds-slider-continuous | .ds-slider-discrete) > .ds-slider-control >
       output.ds-slider-value-label + input.ds-slider-input[type=range]; then .ds-slider-marks > .ds-slider-mark.
     Names follow KEP UI's Slider (rail, track, thumb, valueLabel, mark, markActive). The native range input
     gives keyboard and screen-reader support; ds.js sets --ds-slider-p (0..1) for the filled track and the
     value label position, writes the value label, and marks the active step (.ds-slider-mark-active).
     Fires ds-change on .ds-slider when the user lets go: detail { value: <number>, label }. */
  var SL = '.ds-slider';

  function slSync(w) {
    var input = w.querySelector('.ds-slider-input');
    if (!input) return;
    var min = parseFloat(input.min || 0), max = parseFloat(input.max || 100), v = parseFloat(input.value);
    var p = max > min ? (v - min) / (max - min) : 0;
    w.style.setProperty('--ds-slider-p', String(Math.min(1, Math.max(0, p))));
    var out = w.querySelector('.ds-slider-value-label');
    if (out) out.textContent = (w.getAttribute('data-prefix') || '') + input.value + (w.getAttribute('data-suffix') || '');
    var marks = toArray(w.querySelectorAll('.ds-slider-mark'));
    if (marks.length && w.classList.contains('ds-slider-discrete')) {
      var step = parseFloat(input.step || 1);
      var idx = Math.round((v - min) / step);
      marks.forEach(function (m, i) {
        var active = m.hasAttribute('data-value') ? parseFloat(m.getAttribute('data-value')) === v : i === idx;
        m.classList.toggle('ds-slider-mark-active', active);
      });
    }
  }

  function slSyncAll() { toArray(doc.querySelectorAll(SL)).forEach(slSync); }

  doc.addEventListener('input', function (e) {
    var w = e.target.closest ? e.target.closest(SL) : null;
    if (w && e.target.matches('.ds-slider-input')) slSync(w);
  });
  doc.addEventListener('change', function (e) {
    var w = e.target.closest ? e.target.closest(SL) : null;
    if (!w || !e.target.matches('.ds-slider-input')) return;
    slSync(w);
    var active = w.querySelector('.ds-slider-mark-active');
    var out = w.querySelector('.ds-slider-value-label');
    var label = active ? textOf(active) : out ? textOf(out) : e.target.value;
    emit(w, 'ds-change', { value: Number(e.target.value), label: label });
  });

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', slSyncAll);
  else slSyncAll();
  if (window.MutationObserver) {
    new MutationObserver(function (records) {
      records.forEach(function (r) {
        toArray(r.addedNodes).forEach(function (n) {
          if (n.nodeType !== 1) return;
          if (n.matches(SL)) slSync(n);
          toArray(n.querySelectorAll(SL)).forEach(slSync);
        });
      });
    }).observe(doc.documentElement, { childList: true, subtree: true });
  }

  /* ---------- breadcrumbs ----------
     nav.ds-breadcrumbs > ol.ds-breadcrumbs-ol > li.ds-breadcrumbs-li (.ds-breadcrumb-item)
                                               + li.ds-breadcrumbs-separator (chevron) ...
     Like KEP UI: when the trail is wider than the nav, the first item stays, the middle
     items collapse into a "..." button (Show more) and as many of the last items as fit
     stay. Clicking "..." shows every item (the trail then wraps). Refits on resize and
     when items change. Opt out with data-collapse="none" on the nav. */
  var BC = '.ds-breadcrumbs';
  var BC_GEN = 'data-ds-generated';

  function bcFit(nav) {
    var ol = nav.querySelector('.ds-breadcrumbs-ol');
    if (!ol) return;
    // undo the last fit
    toArray(ol.querySelectorAll('[' + BC_GEN + ']')).forEach(function (n) { n.remove(); });
    toArray(ol.children).forEach(function (n) { n.hidden = false; });
    if (nav.classList.contains('ds-breadcrumbs-expanded') || nav.getAttribute('data-collapse') === 'none') return;
    nav.classList.add('ds-breadcrumbs-measuring'); // nothing shrinks while measuring
    bcCollapse(nav, ol);
    nav.classList.remove('ds-breadcrumbs-measuring');
  }

  function bcCollapse(nav, ol) {
    if (ol.scrollWidth <= ol.clientWidth + 1) return;

    var items = toArray(ol.children).filter(function (n) { return n.matches('.ds-breadcrumbs-li'); });
    if (items.length < 3) return;

    // "..." after the first item, with its own separator in front
    var sepSrc = ol.querySelector('.ds-breadcrumbs-separator');
    var sep = sepSrc ? sepSrc.cloneNode(true) : doc.createElement('li');
    sep.setAttribute(BC_GEN, '');
    if (!sepSrc) { sep.className = 'ds-breadcrumbs-separator'; sep.setAttribute('aria-hidden', 'true'); }
    var li = doc.createElement('li');
    li.className = 'ds-breadcrumbs-li';
    li.setAttribute(BC_GEN, '');
    var more = doc.createElement('button');
    more.type = 'button';
    more.className = 'ds-breadcrumb-item ds-breadcrumbs-truncated';
    more.setAttribute('aria-label', nav.getAttribute('data-expand-text') || 'Show more');
    more.textContent = '...';
    li.appendChild(more);
    items[0].after(sep, li);

    // hide middle items (each with the separator before it) until the rest fits
    for (var i = 1; i < items.length - 1 && ol.scrollWidth > ol.clientWidth + 1; i++) {
      items[i].hidden = true;
      var prev = items[i].previousElementSibling;
      if (prev && prev.matches('.ds-breadcrumbs-separator')) prev.hidden = true;
    }
  }

  function bcFitAll() {
    toArray(doc.querySelectorAll(BC)).forEach(bcFit);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', bcFitAll);
  else setTimeout(bcFitAll, 0);
  doc.addEventListener('ds-icons-ready', bcFitAll);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(bcFitAll);
  var bcResizeQueued = false;
  window.addEventListener('resize', function () {
    if (bcResizeQueued) return;
    bcResizeQueued = true;
    requestAnimationFrame(function () { bcResizeQueued = false; bcFitAll(); });
  });
  if (window.MutationObserver) {
    new MutationObserver(function (records) {
      var navs = [];
      records.forEach(function (r) {
        var changed = toArray(r.addedNodes).concat(toArray(r.removedNodes)).filter(function (n) {
          return n.nodeType === 1 && !n.hasAttribute(BC_GEN);
        });
        if (!changed.length) return;
        changed.forEach(function (n) {
          if (n.isConnected && n.matches(BC)) navs.push(n);
          else if (n.isConnected) toArray(n.querySelectorAll(BC)).forEach(function (x) { navs.push(x); });
        });
        // items added to or removed from an existing trail (not icons rendering inside it)
        if (r.target.matches && r.target.matches('.ds-breadcrumbs-ol')) navs.push(r.target.closest(BC));
      });
      navs.filter(function (n, i) { return navs.indexOf(n) === i; }).forEach(bcFit);
    }).observe(doc.documentElement, { childList: true, subtree: true });
  }

  // "..." shows every item and moves focus to the first one it revealed
  doc.addEventListener('click', function (e) {
    var more = e.target.closest ? e.target.closest('.ds-breadcrumbs-truncated') : null;
    if (!more) return;
    var nav = more.closest(BC);
    var revealed = toArray(nav.querySelectorAll('.ds-breadcrumbs-li[hidden] .ds-breadcrumb-item'))[0];
    nav.classList.add('ds-breadcrumbs-expanded');
    bcFit(nav);
    if (revealed && e.detail === 0) revealed.focus();
  });

  /* ---------- split button ----------
     .ds-split-button > button.ds-split-button-action + button.ds-split-button-menu-toggle
                      + div.ds-split-button-menu (button.ds-select-item[role=menuitem] ...)
     Names follow KEP UI's SplitButton. The action button and the menu items are plain
     buttons: the page listens for their click. ds.js only opens and closes the menu.
     The menu can't open while the toggle is disabled or the action button is processing. */
  var SB = '.ds-split-button';
  var SB_OPEN = 'ds-split-button-open';

  function sbParts(w) {
    return {
      action: w.querySelector('.ds-split-button-action'),
      toggle: w.querySelector('.ds-split-button-menu-toggle'),
      menu: w.querySelector('.ds-split-button-menu')
    };
  }

  function sbItems(w) {
    var menu = sbParts(w).menu;
    if (!menu) return [];
    return toArray(menu.querySelectorAll('[role="menuitem"]')).filter(function (el) {
      return !isDisabled(el) && isVisible(el);
    });
  }

  function sbClose(w, returnFocus) {
    var toggle = sbParts(w).toggle;
    w.classList.remove(SB_OPEN);
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      if (returnFocus) toggle.focus();
    }
  }

  function sbCloseAll(except) {
    toArray(doc.querySelectorAll(SB + '.' + SB_OPEN)).forEach(function (w) {
      if (w !== except) sbClose(w);
    });
  }

  function sbOpen(w, focusItem) {
    var p = sbParts(w);
    if (!p.toggle || !p.menu || isDisabled(p.toggle)) return;
    if (p.action && p.action.matches('.ds-btn-processing, [aria-busy="true"]')) return;
    sbCloseAll(w);
    w.classList.add(SB_OPEN);
    p.toggle.setAttribute('aria-expanded', 'true');
    if (focusItem) {
      var items = sbItems(w);
      var el = focusItem === 'last' ? items[items.length - 1] : items[0];
      if (el) el.focus();
    }
  }

  doc.addEventListener('click', function (e) {
    var target = e.target;
    if (!target.closest) return;
    var w = target.closest(SB);
    sbCloseAll(w);
    if (!w) return;

    if (target.closest('.ds-split-button-menu-toggle')) {
      if (w.classList.contains(SB_OPEN)) sbClose(w);
      else sbOpen(w, e.detail === 0 ? 'first' : null); // detail 0 = keyboard activation
      return;
    }
    var item = target.closest('.ds-split-button-menu [role="menuitem"]');
    if (item && !isDisabled(item)) sbClose(w, e.detail === 0);
  });

  doc.addEventListener('keydown', function (e) {
    var key = e.key;
    var w = e.target.closest ? e.target.closest(SB) : null;

    if (key === 'Escape') {
      if (e.defaultPrevented) return; // an open select already used it
      var open = (w && w.classList.contains(SB_OPEN)) ? w : doc.querySelector(SB + '.' + SB_OPEN);
      if (open) {
        sbClose(open, true);
        e.preventDefault(); // tells the modal handler this Escape was already used
      }
      return;
    }
    if (!w) return;

    // ArrowDown / ArrowUp on either button opens the menu (like KEP)
    if (e.target.matches('.ds-split-button-action, .ds-split-button-menu-toggle')) {
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        e.preventDefault();
        sbOpen(w, key === 'ArrowUp' ? 'last' : 'first');
      }
      return;
    }

    if (!w.classList.contains(SB_OPEN)) return;
    if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
      var items = sbItems(w);
      if (!items.length) return;
      e.preventDefault();
      var i = items.indexOf(doc.activeElement);
      if (i < 0) i = key === 'ArrowUp' ? 0 : -1;
      items[stepIndex(key, i, items.length)].focus();
    }
  });

  // Tabbing out of an open split button closes its menu
  doc.addEventListener('focusout', function (e) {
    var w = e.target.closest ? e.target.closest(SB + '.' + SB_OPEN) : null;
    if (w && e.relatedTarget && !w.contains(e.relatedTarget)) sbClose(w);
  });

  /* ---------- button processing ----------
     A .ds-btn with .ds-btn-processing or aria-busy="true" shows a spinner
     (CSS). Block its clicks here too, so Enter/Space and page listeners
     don't run while it works. Capture phase runs before the page's own. */
  var PROCESSING = '.ds-btn.ds-btn-processing, .ds-btn[aria-busy="true"]';
  doc.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest(PROCESSING)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  function setProcessing(btn, on) {
    if (typeof btn === 'string') btn = doc.getElementById(btn);
    if (!btn) return;
    on = on !== false;
    btn.classList.toggle('ds-btn-processing', on);
    if (on) btn.setAttribute('aria-busy', 'true');
    else btn.removeAttribute('aria-busy');
  }

  /* ---------- popups: menu, popover, date picker, time picker ----------
     One wrapper holds a trigger and a panel. ds.js toggles the open class on the
     wrapper and aria-expanded on the trigger, closes on outside click, Escape or
     Tab-out, returns focus to the trigger, and flips the panel above / to the end
     when there is no room (.ds-popup-above, .ds-popup-end on the wrapper).

     Menu (KEP Menu / MenuItem / NestedMenuItem):
       .ds-menu-wrapper > button[aria-haspopup="menu"] + .ds-select-menu.ds-menu[role=menu]
         > button.ds-select-item.ds-menu-item[role=menuitem] ...
         > .ds-nested-menu-item > button.ds-menu-item[aria-haspopup="menu"] + .ds-select-menu.ds-menu.ds-nested-menu
       Items are plain buttons: the page listens for their click; the menu then closes.
       Keyboard: Enter/Space/ArrowDown on the trigger opens; arrows, Home, End move;
       ArrowRight/Enter/Space opens a sub-menu, ArrowLeft or Escape closes it; Escape closes the menu.
     Popover (KEP Popover): .ds-popover-wrapper > [aria-haspopup="dialog"] + .ds-popover[role=dialog]
     Date / time picker: see below. */

  var POPUPS = [
    { wrap: '.ds-menu-wrapper', trigger: '.ds-menu-wrapper > [aria-haspopup]', panel: '.ds-menu', open: 'ds-menu-open' },
    { wrap: '.ds-popover-wrapper', trigger: '.ds-popover-wrapper > [aria-haspopup]', panel: '.ds-popover', open: 'ds-popover-open' },
    { wrap: '.ds-date-picker', trigger: '.ds-date-picker-open-button', panel: '.ds-date-picker-popper', open: 'ds-date-picker-open',
      onOpen: function (w) { dpOpen(w); }, onFocus: function (w) { dpFocus(w); } },
    { wrap: '.ds-time-picker', trigger: '.ds-time-picker-open-button', panel: '.ds-time-picker-popper', open: 'ds-time-picker-open',
      onOpen: function (w) { tpOpen(w); }, onFocus: function (w) { tpFocus(w); } }
  ];
  var popCount = 0;

  function popCfgOf(w) {
    for (var i = 0; i < POPUPS.length; i++) if (w.matches(POPUPS[i].wrap)) return POPUPS[i];
    return null;
  }
  function popParts(cfg, w) {
    var trigger = null, panel = null;
    toArray(w.children).forEach(function (c) {
      if (!panel && c.matches(cfg.panel)) panel = c;
    });
    trigger = toArray(w.querySelectorAll(cfg.trigger)).filter(function (t) { return t.closest(cfg.wrap) === w; })[0] || null;
    return { trigger: trigger, panel: panel };
  }
  function popIsOpen(w) { var c = popCfgOf(w); return !!c && w.classList.contains(c.open); }

  function popPlace(w, panel) {
    w.classList.remove('ds-popup-above', 'ds-popup-end');
    var r = panel.getBoundingClientRect();
    var wr = w.getBoundingClientRect();
    if (r.bottom > window.innerHeight && wr.top - r.height > 0) w.classList.add('ds-popup-above');
    if (r.right > window.innerWidth && wr.right - r.width > 0) w.classList.add('ds-popup-end');
  }

  function popOpen(w, focus) {
    var cfg = popCfgOf(w);
    if (!cfg || w.classList.contains(cfg.open)) return;
    var p = popParts(cfg, w);
    if (!p.panel || (p.trigger && isDisabled(p.trigger))) return;
    popCloseAll(w);
    popCount += 1;
    if (!p.panel.id) p.panel.id = 'ds-popup-' + popCount;
    if (p.trigger) {
      p.trigger.setAttribute('aria-expanded', 'true');
      p.trigger.setAttribute('aria-controls', p.panel.id);
    }
    w.classList.add(cfg.open);
    if (cfg.onOpen) cfg.onOpen(w);
    popPlace(w, p.panel);
    if (cfg.onFocus) cfg.onFocus(w);
    if (focus === 'first' || focus === 'last') {
      if (cfg.open === 'ds-menu-open') {
        var items = menuItems(p.panel);
        var el = focus === 'last' ? items[items.length - 1] : items[0];
        if (el) el.focus();
      } else if (cfg.open === 'ds-popover-open') {
        var f = focusableIn(p.panel)[0];
        if (!p.panel.hasAttribute('tabindex')) p.panel.setAttribute('tabindex', '-1');
        (f || p.panel).focus();
      }
    }
  }

  function popClose(w, returnFocus) {
    var cfg = popCfgOf(w);
    if (!cfg || !w.classList.contains(cfg.open)) return;
    var p = popParts(cfg, w);
    w.classList.remove(cfg.open);
    toArray(w.querySelectorAll('.ds-nested-menu-open')).forEach(function (n) { nestedClose(n); });
    if (p.trigger) {
      p.trigger.setAttribute('aria-expanded', 'false');
      if (returnFocus) p.trigger.focus();
    }
  }

  function popCloseAll(except) {
    popOpenWrappers().forEach(function (w) {
      if (w !== except && !(except && w.contains(except))) popClose(w);
    });
  }

  function popOpenWrappers() {
    var list = [];
    POPUPS.forEach(function (cfg) { list = list.concat(toArray(doc.querySelectorAll(cfg.wrap + '.' + cfg.open))); });
    return list;
  }

  /* menu items: the direct items of one menu (not those of its sub-menus) */
  function menuItems(menu) {
    return toArray(menu.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]')).filter(function (el) {
      return el.closest('.ds-menu') === menu && !isDisabled(el) && isVisible(el);
    });
  }

  function nestedOpen(n, focusFirst) {
    var btn = n.querySelector(':scope > [aria-haspopup]');
    var sub = n.querySelector(':scope > .ds-nested-menu');
    if (!btn || !sub || isDisabled(btn)) return;
    // close sibling sub-menus
    var menu = n.closest('.ds-menu');
    toArray(menu.querySelectorAll('.ds-nested-menu-open')).forEach(function (o) {
      if (o !== n && !o.contains(n)) nestedClose(o);
    });
    n.classList.add('ds-nested-menu-open');
    btn.setAttribute('aria-expanded', 'true');
    n.classList.remove('ds-nested-menu-left');
    if (sub.getBoundingClientRect().right > window.innerWidth) n.classList.add('ds-nested-menu-left');
    if (focusFirst) { var items = menuItems(sub); if (items[0]) items[0].focus(); }
  }

  function nestedClose(n, returnFocus) {
    n.classList.remove('ds-nested-menu-open');
    toArray(n.querySelectorAll('.ds-nested-menu-open')).forEach(function (o) { o.classList.remove('ds-nested-menu-open'); });
    var btn = n.querySelector(':scope > [aria-haspopup]');
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      if (returnFocus) btn.focus();
    }
  }

  doc.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;
    var inside = null;
    popOpenWrappers().forEach(function (w) { if (w.contains(t)) inside = w; });
    // close every open popup the click is not inside (a picker inside a popover keeps both open)
    popOpenWrappers().forEach(function (w) { if (!w.contains(t)) popClose(w); });

    // trigger?
    for (var i = 0; i < POPUPS.length; i++) {
      var cfg = POPUPS[i];
      var trig = t.closest(cfg.trigger);
      if (trig && !isDisabled(trig)) {
        var w = trig.closest(cfg.wrap);
        if (w.classList.contains(cfg.open)) popClose(w);
        else popOpen(w, e.detail === 0 ? 'first' : null); // detail 0 = keyboard activation
        return;
      }
    }

    // menu items
    var item = t.closest('.ds-menu [role^="menuitem"]');
    if (item && !isDisabled(item)) {
      var nested = item.parentElement && item.parentElement.matches('.ds-nested-menu-item') ? item.parentElement : null;
      if (nested && item.matches('[aria-haspopup]')) {
        if (nested.classList.contains('ds-nested-menu-open') && e.detail !== 0) nestedClose(nested);
        else nestedOpen(nested, e.detail === 0);
        return;
      }
      var mw = item.closest('.ds-menu-wrapper');
      if (mw) popClose(mw, e.detail === 0);
    }
  });

  // hover opens a sub-menu and closes the other ones (KEP NestedMenuItem)
  doc.addEventListener('mouseover', function (e) {
    var t = e.target;
    if (!t.closest) return;
    var item = t.closest('.ds-menu [role^="menuitem"]');
    if (!item) return;
    var menu = item.closest('.ds-menu');
    toArray(menu.querySelectorAll(':scope > .ds-nested-menu-item.ds-nested-menu-open, :scope .ds-nested-menu-item.ds-nested-menu-open')).forEach(function (o) {
      if (o.closest('.ds-menu') === menu && !o.contains(item)) nestedClose(o);
    });
    var n = item.parentElement;
    if (n && n.matches('.ds-nested-menu-item') && item.matches('[aria-haspopup]') && !isDisabled(item)) nestedOpen(n, false);
  });

  doc.addEventListener('keydown', function (e) {
    var key = e.key;
    var t = e.target;
    if (!t.closest) return;

    if (key === 'Escape') {
      if (e.defaultPrevented) return;
      // innermost sub-menu first
      var sub = t.closest('.ds-nested-menu');
      if (sub) {
        e.preventDefault();
        nestedClose(sub.parentElement, true);
        return;
      }
      var open = popOpenWrappers().filter(function (w) { return w.contains(t); }).pop() || popOpenWrappers().pop();
      if (open) {
        e.preventDefault(); // tells the modal handler this Escape was already used
        popClose(open, true);
      }
      return;
    }

    // trigger: ArrowDown / ArrowUp open a menu
    var trig = t.closest('.ds-menu-wrapper > [aria-haspopup]');
    if (trig && t === trig) {
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        e.preventDefault();
        popOpen(trig.parentElement, key === 'ArrowUp' ? 'last' : 'first');
      }
      return;
    }

    var item = t.closest('.ds-menu [role^="menuitem"]');
    if (!item) return;
    var menu = item.closest('.ds-menu');
    if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
      var items = menuItems(menu);
      if (!items.length) return;
      e.preventDefault();
      var i = items.indexOf(item);
      items[stepIndex(key, i, items.length)].focus();
      return;
    }
    var nested = item.parentElement && item.parentElement.matches('.ds-nested-menu-item') && item.matches('[aria-haspopup]') ? item.parentElement : null;
    if (nested && (key === 'ArrowRight' || key === 'Enter' || key === ' ')) {
      e.preventDefault();
      nestedOpen(nested, true);
      return;
    }
    if (key === 'ArrowLeft' && menu.matches('.ds-nested-menu')) {
      e.preventDefault();
      nestedClose(menu.parentElement, true);
    }
  });

  // Tabbing out of an open popup closes it
  doc.addEventListener('focusout', function (e) {
    if (!e.relatedTarget) return;
    popOpenWrappers().forEach(function (w) {
      if (w.contains(e.target) && !w.contains(e.relatedTarget)) popClose(w);
    });
  });

  window.addEventListener('resize', function () {
    popOpenWrappers().forEach(function (w) {
      var cfg = popCfgOf(w);
      var p = popParts(cfg, w);
      if (p.panel) popPlace(w, p.panel);
    });
  });

  /* ---------- date picker ----------
     .ds-date-picker > .ds-date-picker-field (button.ds-date-picker-open-button + input.ds-date-picker-input)
                     + div.ds-date-picker-popper[role=dialog] (empty: ds.js builds the calendar)
     Value format MM/DD/YYYY (KEP / MUI default). Optional data-min / data-max (YYYY-MM-DD) on the wrapper.
     Typing a date and leaving the field (or Enter) also sets it.
     Fires ds-change on .ds-date-picker: { value: 'YYYY-MM-DD' (or ''), label: 'MM/DD/YYYY' }.
     Calendar keyboard: arrows move a day / week, PageUp / PageDown a month, Home / End the week,
     Enter / Space pick, Escape closes. */

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  var WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function isoOf(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function usOf(d) { return pad2(d.getMonth() + 1) + '/' + pad2(d.getDate()) + '/' + d.getFullYear(); }
  function sameDay(a, b) { return a && b && isoOf(a) === isoOf(b); }
  function parseIso(s) {
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s || '');
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getMonth() === +m[2] - 1 ? d : null;
  }
  function parseUs(s) {
    var m = /^\s*(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})\s*$/.exec(s || '');
    if (!m) return parseIso((s || '').trim());
    var d = new Date(+m[3], +m[1] - 1, +m[2]);
    return d.getMonth() === +m[1] - 1 ? d : null;
  }

  function dpParts(w) {
    return {
      input: w.querySelector('.ds-date-picker-input'),
      button: w.querySelector('.ds-date-picker-open-button'),
      popper: w.querySelector('.ds-date-picker-popper')
    };
  }
  function dpLimits(w) { return { min: parseIso(w.getAttribute('data-min')), max: parseIso(w.getAttribute('data-max')) }; }
  function dpAllowed(w, d) {
    var l = dpLimits(w);
    return !(l.min && isoOf(d) < isoOf(l.min)) && !(l.max && isoOf(d) > isoOf(l.max));
  }

  function dpOpen(w) {
    var p = dpParts(w);
    var picked = parseUs(p.input && p.input.value);
    w._dsFocusDate = picked || (function () { var t = new Date(); t.setHours(0, 0, 0, 0); return t; })();
    if (!dpAllowed(w, w._dsFocusDate)) { var l = dpLimits(w); w._dsFocusDate = new Date((l.min || l.max).getTime()); }
    p.popper.setAttribute('role', 'dialog');
    if (!p.popper.hasAttribute('aria-label')) p.popper.setAttribute('aria-label', 'Choose date');
    dpRender(w);
  }

  function dpFocus(w) {
    var day = w.querySelector('.ds-date-picker-day[tabindex="0"]');
    if (day) day.focus();
  }

  function dpRender(w) {
    var p = dpParts(w);
    var f = w._dsFocusDate;
    var picked = parseUs(p.input && p.input.value);
    var today = new Date();
    var first = new Date(f.getFullYear(), f.getMonth(), 1);
    var days = new Date(f.getFullYear(), f.getMonth() + 1, 0).getDate();
    var l = dpLimits(w);
    var prevOk = !l.min || isoOf(new Date(f.getFullYear(), f.getMonth(), 0)) >= isoOf(l.min);
    var nextOk = !l.max || isoOf(new Date(f.getFullYear(), f.getMonth() + 1, 1)) <= isoOf(l.max);
    var html = '<div class="ds-date-picker-header">' +
      '<span class="ds-date-picker-month-label" aria-live="polite">' + MONTHS[f.getMonth()] + ' ' + f.getFullYear() + '</span>' +
      '<button type="button" class="ds-date-picker-nav" data-step="-1" aria-label="Previous month"' + (prevOk ? '' : ' disabled') + '><ds-icon name="chevron-left" size="24"></ds-icon></button>' +
      '<button type="button" class="ds-date-picker-nav" data-step="1" aria-label="Next month"' + (nextOk ? '' : ' disabled') + '><ds-icon name="chevron-right" size="24"></ds-icon></button>' +
      '</div><div class="ds-date-picker-calendar" role="grid" aria-label="' + MONTHS[f.getMonth()] + ' ' + f.getFullYear() + '">';
    WEEKDAYS.forEach(function (d, i) { html += '<span class="ds-date-picker-weekday" role="columnheader" aria-label="' + WEEKDAY_NAMES[i] + '">' + d + '</span>'; });
    for (var i = 0; i < first.getDay(); i++) html += '<span class="ds-date-picker-day ds-date-picker-day-outside" aria-hidden="true"></span>';
    for (var n = 1; n <= days; n++) {
      var d = new Date(f.getFullYear(), f.getMonth(), n);
      var cls = 'ds-date-picker-day' + (sameDay(d, today) ? ' ds-date-picker-day-today' : '');
      html += '<button type="button" role="gridcell" class="' + cls + '" data-date="' + isoOf(d) + '"' +
        ' tabindex="' + (sameDay(d, f) ? '0' : '-1') + '"' +
        ' aria-selected="' + (sameDay(d, picked) ? 'true' : 'false') + '"' +
        (sameDay(d, today) ? ' aria-current="date"' : '') +
        ' aria-label="' + WEEKDAY_NAMES[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + n + ', ' + d.getFullYear() + '"' +
        (dpAllowed(w, d) ? '' : ' disabled') + '>' + n + '</button>';
    }
    html += '</div>';
    p.popper.innerHTML = html;
  }

  function dpMove(w, d) {
    if (!dpAllowed(w, d)) return;
    w._dsFocusDate = d;
    dpRender(w);
    var el = w.querySelector('.ds-date-picker-day[tabindex="0"]');
    if (el) el.focus();
  }

  function dpSet(w, d, fromInput) {
    var p = dpParts(w);
    var old = w._dsValue;
    var value = d ? isoOf(d) : '';
    if (p.input) p.input.value = d ? usOf(d) : (fromInput ? p.input.value : '');
    w._dsValue = value;
    if (value !== old) emit(w, 'ds-change', { value: value, label: d ? usOf(d) : '' });
  }

  doc.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;
    var nav = t.closest('.ds-date-picker-nav');
    if (nav) {
      var w = nav.closest('.ds-date-picker');
      var f = w._dsFocusDate;
      var d = new Date(f.getFullYear(), f.getMonth() + Number(nav.getAttribute('data-step')), 1);
      var lim = dpLimits(w);
      if (lim.min && isoOf(d) < isoOf(lim.min)) d = new Date(lim.min.getTime());
      if (lim.max && isoOf(d) > isoOf(lim.max)) d = new Date(lim.max.getTime());
      w._dsFocusDate = d;
      dpRender(w);
      var again = w.querySelector('.ds-date-picker-nav[data-step="' + nav.getAttribute('data-step') + '"]');
      if (again && !again.disabled) again.focus();
      else { var day = w.querySelector('.ds-date-picker-day[tabindex="0"]'); if (day) day.focus(); }
      return;
    }
    var dayBtn = t.closest('.ds-date-picker-day[data-date]');
    if (dayBtn && !dayBtn.disabled) {
      var dw = dayBtn.closest('.ds-date-picker');
      dpSet(dw, parseIso(dayBtn.getAttribute('data-date')));
      popClose(dw, true);
    }
  });

  doc.addEventListener('keydown', function (e) {
    var t = e.target;
    if (!t.matches) return;
    if (t.matches('.ds-date-picker-input')) {
      if (e.key === 'Enter') { e.preventDefault(); dpCommitInput(t); }
      else if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); popOpen(t.closest('.ds-date-picker')); }
      return;
    }
    if (!t.matches('.ds-date-picker-day[data-date]')) return;
    var w = t.closest('.ds-date-picker');
    var f = w._dsFocusDate;
    var k = e.key;
    var d = null;
    if (k === 'ArrowLeft') d = new Date(f.getFullYear(), f.getMonth(), f.getDate() - 1);
    else if (k === 'ArrowRight') d = new Date(f.getFullYear(), f.getMonth(), f.getDate() + 1);
    else if (k === 'ArrowUp') d = new Date(f.getFullYear(), f.getMonth(), f.getDate() - 7);
    else if (k === 'ArrowDown') d = new Date(f.getFullYear(), f.getMonth(), f.getDate() + 7);
    else if (k === 'Home') d = new Date(f.getFullYear(), f.getMonth(), f.getDate() - f.getDay());
    else if (k === 'End') d = new Date(f.getFullYear(), f.getMonth(), f.getDate() + 6 - f.getDay());
    else if (k === 'PageUp' || k === 'PageDown') {
      var step = k === 'PageUp' ? -1 : 1;
      var last = new Date(f.getFullYear(), f.getMonth() + step + 1, 0).getDate();
      d = new Date(f.getFullYear(), f.getMonth() + step, Math.min(f.getDate(), last));
    }
    if (d) { e.preventDefault(); dpMove(w, d); }
  });

  function dpCommitInput(input) {
    var w = input.closest('.ds-date-picker');
    var v = input.value.trim();
    if (v === '') { dpSet(w, null); return; }
    var d = parseUs(v);
    if (d && dpAllowed(w, d)) dpSet(w, d);
  }

  doc.addEventListener('change', function (e) {
    if (e.target.matches && e.target.matches('.ds-date-picker-input')) dpCommitInput(e.target);
  });

  /* ---------- time picker ----------
     .ds-time-picker > .ds-time-picker-field (button.ds-time-picker-open-button + input.ds-time-picker-input)
                     + div.ds-time-picker-popper[role=dialog] (empty: ds.js builds the lists)
     Like KEP's TimePicker on desktop: three lists of menu items (hours, minutes, AM/PM) and an OK
     button. data-minutes-step (default 5) and data-ampm="false" (24-hour lists) on the wrapper.
     Value shown as "hh:mm AM" (or "HH:mm"); typing a time also sets it.
     Fires ds-change on .ds-time-picker: { value: 'HH:mm' (24h, or ''), label: what the field shows }.
     Keyboard: Up / Down move in a list (and pick), Left / Right switch list, Enter closes, Escape closes. */

  function tpAmPm(w) { return w.getAttribute('data-ampm') !== 'false'; }
  function tpParse(s) {
    var m = /^\s*(\d{1,2})(?::(\d{1,2}))?\s*([ap])?\.?\s*m?\.?\s*$/i.exec(s || '');
    if (!m) return null;
    var h = +m[1], min = m[2] ? +m[2] : 0, ap = m[3] ? m[3].toLowerCase() : null;
    if (min > 59) return null;
    if (ap) { if (h < 1 || h > 12) return null; h = (h % 12) + (ap === 'p' ? 12 : 0); }
    else if (h > 23) return null;
    return { h: h, m: min };
  }
  function tpLabel(w, t) {
    if (!t) return '';
    if (!tpAmPm(w)) return pad2(t.h) + ':' + pad2(t.m);
    var h12 = t.h % 12 === 0 ? 12 : t.h % 12;
    return pad2(h12) + ':' + pad2(t.m) + ' ' + (t.h < 12 ? 'AM' : 'PM');
  }
  function tpParts(w) {
    return {
      input: w.querySelector('.ds-time-picker-input'),
      button: w.querySelector('.ds-time-picker-open-button'),
      popper: w.querySelector('.ds-time-picker-popper')
    };
  }

  function tpOpen(w) {
    var p = tpParts(w);
    var t = tpParse(p.input && p.input.value);
    w._dsTime = t;
    var ampm = tpAmPm(w);
    var step = Math.max(1, parseInt(w.getAttribute('data-minutes-step'), 10) || 5);
    p.popper.setAttribute('role', 'dialog');
    if (!p.popper.hasAttribute('aria-label')) p.popper.setAttribute('aria-label', 'Choose time');
    function item(sec, val, text, sel) {
      return '<button type="button" class="ds-select-item ds-time-picker-item" role="option" tabindex="-1" data-section="' + sec +
        '" data-value="' + val + '" aria-selected="' + (sel ? 'true' : 'false') + '"><span class="ds-select-item-label">' + text + '</span></button>';
    }
    var hours = '', mins = '', mer = '';
    if (ampm) {
      for (var h = 1; h <= 12; h++) hours += item('hours', h, pad2(h), t && (t.h % 12 === 0 ? 12 : t.h % 12) === h);
      mer = item('meridiem', 'AM', 'AM', t && t.h < 12) + item('meridiem', 'PM', 'PM', t && t.h >= 12);
    } else {
      for (var h2 = 0; h2 < 24; h2++) hours += item('hours', h2, pad2(h2), t && t.h === h2);
    }
    for (var m = 0; m < 60; m += step) mins += item('minutes', m, pad2(m), t && t.m === m);
    p.popper.innerHTML = '<div class="ds-time-picker-sections">' +
      '<div class="ds-time-picker-section" role="listbox" aria-label="Hours">' + hours + '</div>' +
      '<div class="ds-time-picker-section" role="listbox" aria-label="Minutes">' + mins + '</div>' +
      (ampm ? '<div class="ds-time-picker-section" role="listbox" aria-label="AM or PM">' + mer + '</div>' : '') +
      '</div><div class="ds-time-picker-actions"><button type="button" class="ds-btn ds-btn-sm ds-btn-secondary ds-btn-borderless ds-time-picker-ok">OK</button></div>';
    toArray(p.popper.querySelectorAll('.ds-time-picker-section')).forEach(function (sec) {
      var sel = sec.querySelector('[aria-selected="true"]') || sec.querySelector('.ds-time-picker-item');
      sel.tabIndex = 0;
    });
  }

  function tpFocus(w) {
    toArray(w.querySelectorAll('.ds-time-picker-section')).forEach(function (sec) {
      var sel = sec.querySelector('[tabindex="0"]');
      if (sel) sec.scrollTop = sel.offsetTop - sec.offsetTop - sec.clientHeight / 2 + sel.offsetHeight / 2;
    });
    var first = w.querySelector('.ds-time-picker-item[tabindex="0"]');
    if (first) first.focus({ preventScroll: true });
  }

  function tpPick(item) {
    var w = item.closest('.ds-time-picker');
    var sec = item.getAttribute('data-section');
    var t = w._dsTime ? { h: w._dsTime.h, m: w._dsTime.m } : { h: tpAmPm(w) ? 0 : 0, m: 0 };
    var v = item.getAttribute('data-value');
    var pm = t.h >= 12;
    if (sec === 'hours') t.h = tpAmPm(w) ? (+v % 12) + (pm ? 12 : 0) : +v;
    else if (sec === 'minutes') t.m = +v;
    else t.h = (t.h % 12) + (v === 'PM' ? 12 : 0);
    toArray(item.parentElement.children).forEach(function (o) {
      o.setAttribute('aria-selected', o === item ? 'true' : 'false');
      o.tabIndex = o === item ? 0 : -1;
    });
    // the other lists show the time they now stand for
    if (!w._dsTime) {
      toArray(w.querySelectorAll('.ds-time-picker-section')).forEach(function (s) {
        if (s === item.parentElement || s.querySelector('[aria-selected="true"]')) return;
        var first = s.querySelector('.ds-time-picker-item');
        first.setAttribute('aria-selected', 'true');
        first.tabIndex = 0;
      });
    }
    tpSet(w, t);
  }

  function tpSet(w, t) {
    var p = tpParts(w);
    w._dsTime = t;
    var label = tpLabel(w, t);
    if (p.input) p.input.value = label;
    var value = t ? pad2(t.h) + ':' + pad2(t.m) : '';
    if (value !== w._dsValue) {
      w._dsValue = value;
      emit(w, 'ds-change', { value: value, label: label });
    }
  }

  doc.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;
    var item = t.closest('.ds-time-picker-item');
    if (item) { tpPick(item); item.focus(); return; }
    var ok = t.closest('.ds-time-picker-ok');
    if (ok) popClose(ok.closest('.ds-time-picker'), true);
  });

  doc.addEventListener('keydown', function (e) {
    var t = e.target;
    if (!t.matches) return;
    if (t.matches('.ds-time-picker-input')) {
      if (e.key === 'Enter') { e.preventDefault(); tpCommitInput(t); }
      else if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); popOpen(t.closest('.ds-time-picker')); }
      return;
    }
    if (!t.matches('.ds-time-picker-item')) return;
    var k = e.key;
    var sec = t.parentElement;
    if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Home' || k === 'End') {
      e.preventDefault();
      var items = toArray(sec.children);
      var next = items[stepIndex(k, items.indexOf(t), items.length)];
      tpPick(next);
      next.focus();
      next.scrollIntoView({ block: 'nearest' });
    } else if (k === 'ArrowLeft' || k === 'ArrowRight') {
      e.preventDefault();
      var secs = toArray(t.closest('.ds-time-picker-sections').children);
      var to = secs[stepIndex(k, secs.indexOf(sec), secs.length)];
      var focus = to.querySelector('[tabindex="0"]') || to.firstElementChild;
      focus.focus();
    } else if (k === 'Enter') {
      e.preventDefault();
      if (t.getAttribute('aria-selected') !== 'true') tpPick(t);
      popClose(t.closest('.ds-time-picker'), true);
    }
  });

  function tpCommitInput(input) {
    var w = input.closest('.ds-time-picker');
    var v = input.value.trim();
    if (v === '') { tpSet(w, null); return; }
    var t = tpParse(v);
    if (t) tpSet(w, t);
  }

  doc.addEventListener('change', function (e) {
    if (e.target.matches && e.target.matches('.ds-time-picker-input')) tpCommitInput(e.target);
  });

  // remember the starting value, so ds-change fires only on a real change
  doc.addEventListener('focusin', function (e) {
    var t = e.target;
    if (!t.closest) return;
    var dw = t.closest('.ds-date-picker');
    if (dw && dw._dsValue === undefined) {
      var d = parseUs((dw.querySelector('.ds-date-picker-input') || {}).value);
      dw._dsValue = d ? isoOf(d) : '';
    }
    var tw = t.closest('.ds-time-picker');
    if (tw && tw._dsValue === undefined) {
      var tt = tpParse((tw.querySelector('.ds-time-picker-input') || {}).value);
      tw._dsValue = tt ? pad2(tt.h) + ':' + pad2(tt.m) : '';
    }
  });

  /* ---------- tooltip ----------
     .ds-tooltip-trigger > (trigger element) + .ds-tooltip.ds-tooltip-top|bottom|left|right (CSS shows it on
     hover after a short delay, and on keyboard focus). Like KEP UI Tooltip, ds.js:
     - flips it to the other side when it has no room (top <-> bottom, place-left <-> place-right);
     - hides it on Escape until the pointer or focus leaves;
     - links it to the trigger for screen readers (role="tooltip", aria-describedby). */
  var ttCount = 0;
  var TT_SWAP = { 'ds-tooltip-top': 'ds-tooltip-bottom', 'ds-tooltip-bottom': 'ds-tooltip-top',
    'ds-tooltip-place-left': 'ds-tooltip-place-right', 'ds-tooltip-place-right': 'ds-tooltip-place-left',
    'ds-tooltip-left': 'ds-tooltip-right', 'ds-tooltip-right': 'ds-tooltip-left' };

  function ttSwap(tip) {
    var horizontal = tip.classList.contains('ds-tooltip-place-left') || tip.classList.contains('ds-tooltip-place-right');
    var names = horizontal ? ['ds-tooltip-place-left', 'ds-tooltip-place-right', 'ds-tooltip-left', 'ds-tooltip-right']
                           : ['ds-tooltip-top', 'ds-tooltip-bottom'];
    var swap = names.filter(function (n) { return tip.classList.contains(n); });
    swap.forEach(function (n) { tip.classList.remove(n); });
    swap.forEach(function (n) { tip.classList.add(TT_SWAP[n]); });
    tip.classList.toggle('ds-tooltip-flipped');
  }

  function ttPrepare(trigger) {
    var tip = toArray(trigger.children).filter(function (c) { return c.matches('.ds-tooltip'); })[0];
    if (!tip) return;
    trigger.classList.remove('ds-tooltip-dismissed');
    if (!tip.id) { ttCount += 1; tip.id = 'ds-tooltip-' + ttCount; }
    tip.setAttribute('role', 'tooltip');
    var target = toArray(trigger.children).filter(function (c) { return c !== tip; })[0];
    var focusable = target && (target.matches(FOCUSABLE) ? target : target.querySelector(FOCUSABLE));
    if (focusable && !focusable.hasAttribute('aria-describedby') && !focusable.hasAttribute('aria-label')) {
      focusable.setAttribute('aria-describedby', tip.id);
    }
    // put it back on its own side, then flip if it does not fit there but fits on the other
    if (tip.classList.contains('ds-tooltip-flipped')) ttSwap(tip);
    var r = tip.getBoundingClientRect();
    var out = r.top < 0 || r.bottom > window.innerHeight || r.left < 0 || r.right > window.innerWidth;
    if (!out) return;
    ttSwap(tip);
    var r2 = tip.getBoundingClientRect();
    var out2 = r2.top < 0 || r2.bottom > window.innerHeight || r2.left < 0 || r2.right > window.innerWidth;
    if (out2) ttSwap(tip); // no better on the other side either: keep the one the page asked for
  }

  doc.addEventListener('mouseover', function (e) {
    var trig = e.target.closest ? e.target.closest('.ds-tooltip-trigger') : null;
    if (!trig || (e.relatedTarget && trig.contains(e.relatedTarget))) return;
    ttPrepare(trig);
  });
  doc.addEventListener('focusin', function (e) {
    var trig = e.target.closest ? e.target.closest('.ds-tooltip-trigger') : null;
    if (trig) ttPrepare(trig);
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    toArray(doc.querySelectorAll('.ds-tooltip-trigger:hover, .ds-tooltip-trigger:focus-within')).forEach(function (t) {
      t.classList.add('ds-tooltip-dismissed');
    });
  });

  /* ---------- pagination (generated) ----------
     <div class="ds-table-pagination" data-count="11" data-page="6"></div> and ds.js renders the page
     buttons like KEP UI Pagination (MUI): data-sibling-count (default 1), data-boundary-count (default 1),
     data-show-first-button, data-show-last-button, data-hide-prev-button, data-hide-next-button.
     Clicking re-renders; ds-change on the bar: { value: <page>, label: '<page>' }.
     Static markup (no data-count) keeps working as before. */
  var PG = '.ds-table-pagination[data-count]';

  function pgRange(a, b) { var r = []; for (var i = a; i <= b; i++) r.push(i); return r; }

  function pgItems(count, page, sib, bound) {
    var start = pgRange(1, Math.min(bound, count));
    var end = pgRange(Math.max(count - bound + 1, bound + 1), count);
    var sStart = Math.max(Math.min(page - sib, count - bound - sib * 2 - 1), bound + 2);
    var sEnd = Math.min(Math.max(page + sib, bound + sib * 2 + 2), end.length ? end[0] - 2 : count - 1);
    var items = start.slice();
    if (sStart > bound + 2) items.push('...');
    else if (bound + 1 < count - bound) items.push(bound + 1);
    items = items.concat(pgRange(sStart, sEnd));
    if (sEnd < count - bound - 1) items.push('...');
    else if (count - bound > bound) items.push(count - bound);
    return items.concat(end);
  }

  function pgRender(bar) {
    var count = Math.max(1, parseInt(bar.getAttribute('data-count'), 10) || 1);
    var page = Math.min(count, Math.max(1, parseInt(bar.getAttribute('data-page'), 10) || 1));
    var sib = parseInt(bar.getAttribute('data-sibling-count'), 10); if (isNaN(sib)) sib = 1;
    var bound = parseInt(bar.getAttribute('data-boundary-count'), 10); if (isNaN(bound)) bound = 1;
    function btn(to, label, icon, cls, disabled) {
      return '<button type="button" class="ds-table-page' + (cls ? ' ' + cls : '') + '" data-page="' + to + '" aria-label="' + label + '"' +
        (disabled ? ' disabled' : '') + '><ds-icon name="' + icon + '" size="16"></ds-icon></button>';
    }
    var html = '';
    if (bar.hasAttribute('data-show-first-button')) html += btn(1, 'Go to first page', 'double-chevron-down', 'ds-table-page-first', page === 1);
    if (!bar.hasAttribute('data-hide-prev-button')) html += btn(page - 1, 'Go to previous page', 'chevron-left', '', page === 1);
    pgItems(count, page, sib, bound).forEach(function (it) {
      if (it === '...') html += '<span class="ds-table-page-ellipsis" aria-hidden="true">...</span>';
      else html += '<button type="button" class="ds-table-page" data-page="' + it + '"' +
        (it === page ? ' aria-current="page" aria-label="page ' + it + '"' : ' aria-label="Go to page ' + it + '"') + '>' + it + '</button>';
    });
    if (!bar.hasAttribute('data-hide-next-button')) html += btn(page + 1, 'Go to next page', 'chevron-right', '', page === count);
    if (bar.hasAttribute('data-show-last-button')) html += btn(count, 'Go to last page', 'double-chevron-down', 'ds-table-page-last', page === count);
    bar.innerHTML = html;
    bar.setAttribute('data-page', String(page));
    if (!bar.getAttribute('role')) bar.setAttribute('role', 'navigation');
    if (!bar.hasAttribute('aria-label')) bar.setAttribute('aria-label', 'pagination');
  }

  function pgRenderAll() { toArray(doc.querySelectorAll(PG)).forEach(pgRender); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', pgRenderAll);
  else pgRenderAll();
  if (window.MutationObserver) {
    new MutationObserver(function (records) {
      records.forEach(function (r) {
        toArray(r.addedNodes).forEach(function (n) {
          if (n.nodeType !== 1) return;
          if (n.matches(PG)) pgRender(n);
          toArray(n.querySelectorAll(PG)).forEach(pgRender);
        });
      });
    }).observe(doc.documentElement, { childList: true, subtree: true });
  }

  doc.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest(PG + ' .ds-table-page[data-page]') : null;
    if (!b || b.disabled) return;
    var bar = b.closest(PG);
    var to = b.getAttribute('data-page');
    if (to === bar.getAttribute('data-page')) return;
    var cls = b.classList.contains('ds-table-page-first') ? '.ds-table-page-first'
      : b.classList.contains('ds-table-page-last') ? '.ds-table-page-last'
      : /previous/i.test(b.getAttribute('aria-label') || '') ? '[aria-label="Go to previous page"]'
      : /next page/i.test(b.getAttribute('aria-label') || '') ? '[aria-label="Go to next page"]' : null;
    bar.setAttribute('data-page', to);
    pgRender(bar);
    // keep keyboard focus on the same control
    var again = cls ? bar.querySelector(cls) : bar.querySelector('[aria-current="page"]');
    if (again && !again.disabled) again.focus();
    else { var cur = bar.querySelector('[aria-current="page"]'); if (cur) cur.focus(); }
    emit(bar, 'ds-change', { value: Number(to), label: to });
  });

  /* ---------- rich text ----------
     .ds-rich-text > .ds-rich-text-toolbar[role=toolbar] > button.ds-rich-text-action[data-action] ...
                   + .ds-rich-text-editor[contenteditable="true"][data-placeholder]
     data-action: bold | italic | underline | ordered-list | bullet-list | align-left | align-center | align-right
     (KEP Richtext actions). Buttons show aria-pressed for the formatting at the caret.
     Read only: add ds-rich-text-read-only and contenteditable="false" (ds.js disables the toolbar).
     Fires ds-change on .ds-rich-text as the text changes: { value: <html>, label: <plain text> }.
     Keyboard: Ctrl/Cmd+B / I / U in the text; Left / Right move between toolbar buttons. */
  var RT_COMMANDS = {
    'bold': 'bold', 'italic': 'italic', 'underline': 'underline',
    'ordered-list': 'insertOrderedList', 'bullet-list': 'insertUnorderedList',
    'align-left': 'justifyLeft', 'align-center': 'justifyCenter', 'align-right': 'justifyRight'
  };

  function rtSync(w) {
    var editor = w.querySelector('.ds-rich-text-editor');
    var readOnly = w.classList.contains('ds-rich-text-read-only');
    var sel = doc.getSelection();
    var inside = editor && sel && sel.rangeCount && editor.contains(sel.anchorNode);
    toArray(w.querySelectorAll('.ds-rich-text-action[data-action]')).forEach(function (b) {
      b.disabled = readOnly;
      var cmd = RT_COMMANDS[b.getAttribute('data-action')];
      var on = false;
      if (inside && cmd) { try { on = doc.queryCommandState(cmd); } catch (err) { on = false; } }
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function rtEmit(w) {
    var editor = w.querySelector('.ds-rich-text-editor');
    if (!editor) return;
    // an emptied editor keeps a stray <br>: clear it so the placeholder shows
    if (textOf(editor) === '' && !editor.querySelector('li, img')) editor.innerHTML = '';
    emit(w, 'ds-change', { value: editor.innerHTML, label: (editor.innerText || '').trim() });
  }

  // keep the text selection while clicking toolbar buttons
  doc.addEventListener('mousedown', function (e) {
    if (e.target.closest && e.target.closest('.ds-rich-text-action')) e.preventDefault();
  });

  doc.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.ds-rich-text-action[data-action]') : null;
    if (!b || b.disabled) return;
    var w = b.closest('.ds-rich-text');
    var editor = w.querySelector('.ds-rich-text-editor');
    var cmd = RT_COMMANDS[b.getAttribute('data-action')];
    if (!editor || !cmd) return;
    var sel = doc.getSelection();
    if (!(sel && sel.rangeCount && editor.contains(sel.anchorNode))) {
      editor.focus();
      var r = doc.createRange();
      r.selectNodeContents(editor);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
    }
    doc.execCommand(cmd, false, null);
    if (e.detail !== 0) editor.focus();
    rtSync(w);
    rtEmit(w);
  });

  doc.addEventListener('input', function (e) {
    var editor = e.target.closest ? e.target.closest('.ds-rich-text-editor') : null;
    if (editor) rtEmit(editor.closest('.ds-rich-text'));
  });

  doc.addEventListener('selectionchange', function () {
    var sel = doc.getSelection();
    var node = sel && sel.anchorNode;
    var el = node && (node.nodeType === 1 ? node : node.parentElement);
    var w = el && el.closest ? el.closest('.ds-rich-text') : null;
    if (w) rtSync(w);
  });

  doc.addEventListener('keydown', function (e) {
    var b = e.target.closest ? e.target.closest('.ds-rich-text-action') : null;
    if (!b || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End')) return;
    var bar = b.closest('.ds-rich-text-toolbar');
    var items = toArray(bar.querySelectorAll('.ds-rich-text-action')).filter(function (x) { return !x.disabled; });
    e.preventDefault();
    items[stepIndex(e.key, items.indexOf(b), items.length)].focus();
  });

  function rtSyncAll() { toArray(doc.querySelectorAll('.ds-rich-text')).forEach(rtSync); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', rtSyncAll);
  else rtSyncAll();

  /* ---------- content modal: Escape closes it ----------
     Registered last, so an open select, menu, popover, picker or autocomplete inside the
     modal closes first (they call preventDefault on the Escape they use). */
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    var top = topModal();
    if (top && top.el.classList.contains('ds-modal-variant-content')) {
      e.preventDefault();
      closeModal(top.el, 'escape');
    }
  });

  /* ---------- public API ---------- */

  window.DS = {
    version: '1.4.0',
    setTheme: setTheme,
    getTheme: getTheme,
    showToast: showToast,
    openModal: openModal,
    closeModal: closeModal,
    setProcessing: setProcessing
  };
})();
