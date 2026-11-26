/* ============================================
   ds.js - Design System behavior
   Classic script (no modules, no build). Works over file://.
   All behavior is event-delegated on `document`, so components
   added to the page later work with no init call.

   Public API:   window.DS  { version, setTheme, getTheme, showToast, openModal, closeModal, setProcessing }
   Custom events (bubble):
     ds-change        select / autocomplete / tabs / segmented / switch / pagination   detail: { value, label }
     ds-open          modal opened                                       detail: { id }
     ds-close         modal closed                                       detail: { id, reason: 'button' or 'api' }
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

  function acClose(w) {
    var p = acParts(w);
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
      more.className = 'ds-chip ds-autocomplete-more ds-hint-trigger';
      more.innerHTML = '<span class="ds-chip-content"></span>' +
        '<div class="ds-hint ds-hint-top"><div class="ds-hint-body"></div>' +
        '<div class="ds-hint-arrow"><svg width="14" height="9" viewBox="0 0 14 9" fill="none"><path d="M0 0L5.4 7Q7 9 8.6 7L14 0Z" fill="currentColor"/></svg></div></div>';
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
    more.querySelector('.ds-hint-body').textContent = hidden.map(function (c) { return textOf(c); }).join('\n');
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
      return;
    }
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
    { item: '.ds-segmented-item[role="radio"]',      list: '[role="radiogroup"]', attr: 'aria-checked' }
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
      if (item && !isDisabled(item)) selectInGroup(cfg, item, false);
    });

    doc.addEventListener('keydown', function (e) {
      var item = e.target.closest && e.target.closest(cfg.item);
      if (!item) return;
      var k = e.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].indexOf(k) < 0) return;
      var list = item.closest(cfg.list);
      var items = toArray(list.querySelectorAll(cfg.item)).filter(function (i) { return !isDisabled(i); });
      if (!items.length) return;
      e.preventDefault();
      var key = k === 'ArrowUp' ? 'ArrowLeft' : k === 'ArrowDown' ? 'ArrowRight' : k;
      var next = items[stepIndex(key, items.indexOf(item), items.length)];
      selectInGroup(cfg, next, true);
    });
  });

  /* ---------- switch ---------- */

  function setSwitch(btn, on) {
    btn.classList.toggle('ds-switch-on', on);
    btn.classList.toggle('ds-switch-off', !on);
    btn.setAttribute('aria-checked', String(on));
  }

  doc.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.ds-switch-track[role="switch"]');
    if (!btn || btn.disabled) return;
    var on = !btn.classList.contains('ds-switch-on');
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
    if (!bar || page.getAttribute('aria-current') === 'page') return;
    toArray(bar.querySelectorAll('.ds-table-page')).forEach(function (p) { p.removeAttribute('aria-current'); });
    page.setAttribute('aria-current', 'page');
    var n = page.textContent.trim();
    emit(bar, 'ds-change', { value: Number(n), label: n });
  });

  /* ---------- toast ----------
     DS.showToast(element)   clone a .ds-ack-floating and show it fixed at the top (stays until dismissed)
     DS.showToast({ type: 'info'|'error'|'success'|'warning', message, linkText, linkHref, duration })
                             build one from options; duration in ms (default 5000, 0 = stay)
     Markup trigger: <div class="ds-ack ds-ack-floating ds-ack-info" data-ds-toast>…</div>  */

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
    toast.className = 'ds-ack ds-ack-floating ds-ack-' + type;

    var text = doc.createElement('span');
    text.className = 'ds-ack-text';
    text.textContent = opts.message || '';
    toast.appendChild(text);

    if (opts.linkText) {
      var link = doc.createElement('a');
      link.className = 'ds-ack-link';
      link.href = opts.linkHref || '#';
      link.textContent = opts.linkText;
      toast.appendChild(link);
    }

    var dismiss = doc.createElement('button');
    dismiss.className = 'ds-ack-dismiss';
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
    var dismiss = t.closest('.ds-toast-active .ds-ack-dismiss');
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
     Modals are STATIC on purpose: they hold forms and tasks, so clicking the backdrop or
     pressing Escape never closes them (the user would lose what they typed).
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

    // Escape intentionally does nothing here. (An open select inside the modal still closes
    // on Escape: that is handled in the select code above.)

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

  /* ---------- public API ---------- */

  window.DS = {
    version: '1.2.0',
    setTheme: setTheme,
    getTheme: getTheme,
    showToast: showToast,
    openModal: openModal,
    closeModal: closeModal,
    setProcessing: setProcessing
  };
})();
