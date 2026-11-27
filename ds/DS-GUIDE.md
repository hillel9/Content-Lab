# Kaltura DS - guide for AI assistants

Read this before writing any UI in a prototype that has a `ds/` folder. It lists every component's exact markup, the JS API, all tokens and all icon names. Everything here is in `ds/styles.css`, `ds/ds.js`, `ds/ds-icons.js`.

<!-- BEGIN GENERATED: version -->
DS version: **1.4.0**
<!-- END GENERATED: version -->

## Rules

1. **Use tokens, never raw values.** Colors, spacing, font size/weight, radius, shadows, durations, z-index: write `var(--ds-*)` from the Tokens section. No hex colors, no `px` for spacing or type, no `font-weight` other than `--ds-font-weight-regular|bold`. Tokens follow dark mode; raw values do not.
2. **Icons: `<ds-icon name="..." size="16|24">` only.** Never paste SVG, never use emoji or icon fonts. Use only names from the Icons section. Default size is 24. Icons take `currentColor`, so color them via the parent's `color`.
3. **Never edit anything in `ds/`.** It is a copy of a frozen release. If a component or token is missing, build it in your own CSS from `--ds-*` tokens, and tell the user the DS lacks it.
4. **Only use classes listed here.** Do not invent `ds-` classes. Do not restyle DS components with overrides; pick a documented variant.
5. **Do not write JS for DS behavior.** Select, autocomplete, menu, popover, date and time pickers, rich text, tooltips, tabs, segmented control, switch, table selection, pagination, toast, modal and theme already work (event delegation, also for elements added later). React to them with the `ds-change` / `ds-open` / `ds-close` events or the `window.DS` API.
6. **No frameworks needed; must work from `file://`.** Classic `<script>` tags only (no `type="module"`, no `fetch`).
7. Copy markup exactly, including `role`, `aria-*` and the `hidden` attribute. The JS and CSS select on them.
8. **Write only current names; read old ones.** Names in the "was" column of the terminology index (`ds-ack…`, `ds-hint…`, `ds-user-picture…`, `ds-spinner…`, `ds-segmented` / `-item`, `ds-form-field` / `-desc` / `-error` / `-counter`, `ds-switch-handle`, `ds-switch-on` / `-off`, `--ds-accent`) are old kaltura-ds names that still work so older prototypes don't break. Never write them in new code. When you edit a component that was written with old names, convert that whole component to the current names (the index maps each one); never mix old and new classes in one component, which breaks its styling.

## Setup

```html
<link rel="stylesheet" href="ds/styles.css">
<script src="ds/ds-icons.js"></script>   <!-- before ds.js -->
<script src="ds/ds.js"></script>
```

Font is Lato, loaded by `styles.css` from `fonts.kaltura.com`, Kaltura's font proxy (same as KEP UI; it hides the user's IP from Google). It needs network; without it the text falls back to Helvetica Neue, Segoe UI, then sans-serif. Don't add a Google Fonts link. The DS does not reset page margins; set your own `body { margin: 0; }` if you want that.

## Dark theme

`<html data-theme="dark">` switches every token. `DS.setTheme('dark'|'light')`, `DS.getTheme()`, or any `<button data-ds-theme-toggle>`. Fires `ds-theme-change` on `document` with `detail: { theme }`.

## Tokens

All defined in `:root` in `styles.css`. `/* dark: x */` marks tokens that change in dark theme. Semantics used by the components: `tone-1` main text, `tone-2` secondary text, `tone-3` placeholder/field border, `tone-4` disabled text and strong borders, `tone-5` hover fills and dividers, `tone-6` secondary-button bg and light dividers, `tone-7` subtle bg and row hover, `tone-8` field/surface bg (white in light, black in dark). `--ds-background` page, `--ds-paper` cards/panels, `--ds-elevated` menus and modals, `--ds-protection` (#3d3d3d in both themes) a dark surface behind text over images or video. `--ds-backdrop` is the modal backdrop; `--ds-b-N` / `--ds-w-N` are black / white at N% (10 to 100). Spacing: `--ds-space-N` = N x 4px; a dash in the name is a decimal point (`1-5` = 1.5 x 4 = 6px). Always use `var(--ds-primary)` etc., never the hex values below.

Translating KEP UI (React/MUI) specs, which use the same values as Figma:
- **Spacing:** KEP counts in 8px units, this DS in 4px. `theme.spacing(n)` = `--ds-space-{2n}`: `spacing(0.5)` = `--ds-space-1`, `spacing(1)` = `--ds-space-2`, `spacing(1.5)` = `--ds-space-3`, `spacing(2)` = `--ds-space-4`, `spacing(3)` = `--ds-space-6`, `spacing(4)` = `--ds-space-8`.
- **Shade names:** `-darker` = MUI `.dark` (used for hover), `-brighter` = MUI `.light` (used for focus/pressed), `-text-contrast` = `.contrastText`. So `palette.primary.dark` is `--ds-primary-darker`.
- **Secondary:** `--ds-secondary` (#ffaa00, the selected-tab indicator) is KEP's and Figma's `palette.secondary`. The grey button is a different thing: `ds-btn-secondary` here, `<Button color="secondary">` in KEP. `--ds-accent` is the old name of `--ds-secondary` and still works.
- **Dark theme:** danger, warning and success (and their `-darker`/`-brighter`/`-text-contrast`, and the danger tints) switch to brighter values with black contrast text, like KEP's dark palette. Primary and secondary do not change. Put text on these colors with the matching `-text-contrast` token, never a fixed white.

<!-- BEGIN GENERATED: tokens -->
```css
/* Primary */
--ds-primary: #006efa;
--ds-primary-darker: #004cad;
--ds-primary-brighter: #4798ff;
--ds-primary-text-contrast: #ffffff;

/* Danger */
--ds-danger: #ca1c2d;   /* dark: #e95e6c */
--ds-danger-darker: #9d1523;   /* dark: #db1e32 */
--ds-danger-brighter: #e33547;   /* dark: #f2a1a9 */
--ds-danger-text-contrast: #ffffff;   /* dark: #000000 */

/* Acknowledgement (Figma "Acknowledgment" collection; dark values in the dark theme below) */
--ds-warning: #c2570a;   /* dark: #f26c0d */
--ds-warning-darker: #914108;   /* dark: #c2570a */
--ds-warning-brighter: #f26c0d;   /* dark: #f58a3d */
--ds-warning-text-contrast: #ffffff;   /* dark: #000000 */
--ds-success: #23803a;   /* dark: #31b551 */
--ds-success-darker: #13441f;   /* dark: #268c3f */
--ds-success-brighter: #33bc55;   /* dark: #4ace6b */
--ds-success-text-contrast: #ffffff;   /* dark: #000000 */

/* Brand */
--ds-stream-blue: #006EFA;
--ds-screen-green: #00A078;
--ds-secondary: #ffaa00;
--ds-secondary-darker: #b37700;
--ds-secondary-brighter: #ffbb33;
--ds-secondary-text-contrast: #ffffff;
--ds-accent: var(--ds-secondary);

/* Secondary text (menu item descriptions) */
--ds-text-subtle: #888888;
--ds-text-subtle-disabled: #cccccc;

/* Tints — translucent brand colors for hover / selected backgrounds */
--ds-primary-tint-6: rgba(0,110,250,0.06);
--ds-primary-tint-10: rgba(0,110,250,0.1);
--ds-primary-tint-20: rgba(0,110,250,0.2);
--ds-danger-tint-10: rgba(202,28,45,0.1);   /* dark: rgba(233,94,108,0.1) */
--ds-danger-tint-20: rgba(202,28,45,0.2);   /* dark: rgba(233,94,108,0.2) */
--ds-success-tint-20: rgba(35,128,58,0.2);   /* dark: rgba(49,181,81,0.2) */
--ds-warning-tint-20: rgba(242,108,13,0.2);   /* dark: rgba(245,138,61,0.2) */
--ds-tone-3-tint-20: rgba(135,135,135,0.2);   /* dark: rgba(153,153,153,0.2) */

/* Tones — Light Theme */
--ds-tone-1: #333333;   /* dark: #FFFFFF */
--ds-tone-2: #707070;   /* dark: #CCCCCC */
--ds-tone-3: #878787;   /* dark: #999999 */
--ds-tone-4: #bdbdbd;   /* dark: #666666 */
--ds-tone-5: #d9d9d9;   /* dark: #525252 */
--ds-tone-6: #ebebeb;   /* dark: #383838 */
--ds-tone-7: #f5f5f5;   /* dark: #212121 */
--ds-tone-8: #ffffff;   /* dark: #000000 */

/* Surfaces */
--ds-background: #ffffff;   /* dark: #121212 */
--ds-paper: #f5f5f5;   /* dark: #242424 */
--ds-elevated: #ffffff;   /* dark: #333333 */
--ds-protection: #3d3d3d;

/* Opacity — Black */
--ds-b-10: rgba(0,0,0,0.1);
--ds-b-20: rgba(0,0,0,0.2);
--ds-b-30: rgba(0,0,0,0.3);
--ds-b-40: rgba(0,0,0,0.4);
--ds-b-50: rgba(0,0,0,0.5);
--ds-b-60: rgba(0,0,0,0.6);
--ds-b-70: rgba(0,0,0,0.7);
--ds-b-80: rgba(0,0,0,0.8);
--ds-b-90: rgba(0,0,0,0.9);
--ds-b-100: #000000;

/* Opacity — White */
--ds-w-10: rgba(255,255,255,0.1);
--ds-w-20: rgba(255,255,255,0.2);
--ds-w-30: rgba(255,255,255,0.3);
--ds-w-40: rgba(255,255,255,0.4);
--ds-w-50: rgba(255,255,255,0.5);
--ds-w-60: rgba(255,255,255,0.6);
--ds-w-70: rgba(255,255,255,0.7);
--ds-w-80: rgba(255,255,255,0.8);
--ds-w-90: rgba(255,255,255,0.9);
--ds-w-100: #ffffff;

/* Backdrop behind modals (Figma "Backdrop", KEP palette.backdrop): #222222 at 60% */
--ds-backdrop: rgba(34,34,34,0.6);

/* Hover Mode */
--ds-hover-black: #000000;

/* Radius */
--ds-roundness-tiny: 3px;
--ds-roundness-1: 4px;
--ds-roundness-2: 8px;
--ds-roundness-3: 16px;
--ds-space-0-25: 1px;
--ds-space-0-5: 2px;
--ds-space-0-75: 3px;
--ds-space-1: 4px;
--ds-space-1-5: 6px;
--ds-space-2: 8px;
--ds-space-2-5: 10px;
--ds-space-3: 12px;
--ds-space-3-5: 14px;
--ds-space-4: 16px;
--ds-space-4-5: 18px;
--ds-space-5: 20px;
--ds-space-5-5: 22px;
--ds-space-6: 24px;
--ds-space-7: 28px;
--ds-space-8: 32px;
--ds-space-10: 40px;
--ds-space-16: 64px;

/* Typography */
--ds-font-family: Lato, 'Helvetica Neue', 'Segoe UI', sans-serif;
--ds-font-size-1: 11px;
--ds-font-size-2: 12px;
--ds-font-size-3: 13px;
--ds-font-size-4: 14px;
--ds-font-size-5: 16px;
--ds-font-size-6: 18px;
--ds-font-size-7: 48px;
--ds-font-size-h3: 24px;
--ds-font-weight-regular: 400;
--ds-font-weight-bold: 700;
--ds-line-height-solid: 1;
--ds-line-height-16: 16px;
--ds-line-height-18: 18px;
--ds-line-height-20: 20px;
--ds-line-height-21: 21px;
--ds-line-height-24: 24px;
--ds-line-height-h3: 1.2;

/* Shadows */
--ds-shadow-menu: 0 0 0 1px var(--ds-b-20), 0 4px 30px -8px var(--ds-b-20);
--ds-shadow-floating: 0 0 0 0 var(--ds-b-20), 0 4px 30px 0 var(--ds-b-20);

/* Motion */
--ds-duration-fast: 0.1s;
--ds-duration-base: 0.15s;
--ds-duration-slow: 0.2s;
--ds-duration-exit: 0.35s;
--ds-duration-enter: 0.5s;
--ds-duration-spin: 0.8s;
--ds-duration-pulse: 1.5s;
--ds-delay-tooltip: 0.1s;
--ds-ease-out: cubic-bezier(0.16, 1, 0.3, 1);

/* Opacity */
--ds-opacity-disabled: 0.5;

/* Layering */
--ds-z-dropdown: 100;
--ds-z-tooltip: 100;
--ds-z-modal: 1000;
--ds-z-toast: 9999;

/* Modal widths */
--ds-modal-width-sm: 400px;
--ds-modal-width-md: 560px;
--ds-modal-width-lg: 800px;
--ds-modal-width-xl: 960px;
```
<!-- END GENERATED: tokens -->

## Icons

`<ds-icon name="settings" size="16"></ds-icon>`. An unknown name renders nothing and logs a console warning. If a name has no 16px version, `size="16"` falls back to the 24px artwork scaled to 16. Inside a button, put the icon before or after the text; the button already has a gap.

<!-- BEGIN GENERATED: icons -->
**24px (190):**
add, align-center, align-left, align-right, analytics, arrow-down, arrow-left, arrow-right, arrow-up, banner, blur, bold, bolt, breakout, brush, bullet-list, calendar, camera, camera-off, captions, chat, check, chevron-down, chevron-left, chevron-right, chevron-up, chrome, clean, clear, clips, cloud, collapse-menu, color-palette, contrast, copy, create, credit-card, customize, delete, desktop, diamond, dislike, dislike-hollow, document, download, drag, edge, edit, embed, emoji, excel, executives, exit, exit-alt, expand, expert, external-link, facebook, feedback, file, filter, firefox, fit-frame, folder, folder-item, folder-item-alt, formal, gen-ai, github, globe, group, hand, heart, help, hidden, home, image, import, info, informative-gallery, instagram, instagram-2, integrations, interactive-room, internet, invisible, italic, key, levels, light, like, like-hollow, line, link, linkedin, live-broadcast, lock, mail, menu, metadata-enrichment, microphone, microphone-muted, minimize, minus, mobile, more-horizontal, more-vertical, multiple-video, mute-notification, neutral, no-access, notes, notification, online, ordered-list, pdf, phone, pin, pinterest, play, playlist, poll, pop-out, post, presenter, privacy, public, question-mark, quiz, redo, refresh, remove, remove-alt, remove-contact, resolved, sad, score, search, self-served-live, settings, share, share-screen, share-screen-close, shuffle, simulive, slack, slide, sound, speaker, speaker-muted, stack-overflow, star-full, star-hollow, style, subscribe, subscribed, switch, switch-camera, tablet, target, text, text-color, text-highlight, time, time-hollow, timeline, trim, twitch, twitter, twitter-new, underline, undo, unlock, unpin, upload, user, verified, video, visible, volume-mute, volume-on, warning-circle, warning-triangle, wave, webcast, webhook, youtube, zip-file, zoom-in, zoom-out

**16px (47):**
arrow-right, bookmark, bullet, business-card, chat, check, chevron-down, chevron-left, chevron-right, chevron-up, close, double-chevron-down, download, edit, expand, external-link, file, folder, general-spinner, globe, grip, info-circle, link, microphone, microphone-muted, more, more-horizontal, partial, plus, pop-out, progression, question-mark, redo, regression, score, settings, silent, sound-wave, speaker, speaker-muted, tag, verified, voice, warning, warning-circle, warning-triangle, wave

**16px-only icons (no 24px version, so ALWAYS write `size="16"` for them):** bookmark, bullet, business-card, close, double-chevron-down, general-spinner, grip, info-circle, more, partial, plus, progression, regression, silent, sound-wave, tag, voice, warning
<!-- END GENERATED: icons -->

## Components

### Terminology index (Figma, KEP UI, kaltura-ds)
kaltura-ds takes its look from the Figma Platform DS and its names from KEP UI (`@kaltura/ds-react-components`, the dev team's React library), so a prototype and its React build use the same words. When a request uses a Figma or KEP name, find the class here. Old class names ("was") still work, but follow rule 8: read them, never write them.

<!-- BEGIN GENERATED: terminology -->
**Components**

| Component | Figma (Platform DS) | KEP UI (ds-react-components) | kaltura-ds | Notes |
|---|---|---|---|---|
| Button | Buttons > Pill (Type Primary \| Secondary \| Danger \| Translucent), Borderless | Button (variant="pill" \| "borderless", color primary \| secondary \| danger \| translucent), IconButton | ds-btn + ds-btn-primary \| -secondary \| -danger \| -translucent, ds-btn-borderless, ds-btn-icon | Figma "Pill" = KEP variant="pill" = the default filled button here. The grey button is "secondary" in KEP and here. |
| Circular Button | Buttons > Circular | no exact match | ds-btn-circular | Dark translucent media-overlay button. |
| Split Button | Split Button | SplitButton (action button, menu toggle button, menu) | ds-split-button, ds-split-button-action, ds-split-button-menu-toggle, ds-split-button-menu |  |
| Input | Input Fields > Text Single Line | BaseInput | ds-input |  |
| Textarea | Input Fields > Textarea | BaseInput (multiline) | ds-textarea |  |
| Composed Input | Form Inputs > Form Input Template | ComposedInput (FormLabel, inputAdditionalInfo, FormHelperText, input counter) | ds-composed-input, ds-form-label, ds-form-additional-info, ds-form-helper-text-error, ds-input-counter (was ds-form-field, ds-form-desc, ds-form-error, ds-form-counter) |  |
| Checkbox | Checkers > Checkbox (Mode=Translucent) | Checkbox (color="translucent"), CheckboxFormControl (labelPlacement) | ds-checkbox, ds-checkbox-translucent, ds-checkbox-label-placement-start \| -top \| -bottom |  |
| Radio | Checkers > Radio (Mode=Translucent) | Radio (color="translucent"), RadioFormControlLabel (labelPlacement) | ds-radio, ds-radio-translucent, ds-radio-label-placement-start \| -top \| -bottom |  |
| Switch | Checkers > Switch (Status, State, Size, Mode) | Switch (checked, disabled, size; thumb, track) | ds-switch-track (track), ds-switch-thumb (thumb), aria-checked (checked), ds-switch-sm \| -lg, ds-switch-translucent (was ds-switch-handle, ds-switch-on / ds-switch-off) | Figma calls the thumb "Handle". State lives in aria-checked; ds.js also sets the old on/off classes. |
| Slider | Slider (Type Continuous \| Discrete; State Default, Hover / Focus, Disabled) | Slider (rail, track, thumb, valueLabel, mark, markActive) | ds-slider + ds-slider-continuous \| ds-slider-discrete, ds-slider-input, ds-slider-value-label, ds-slider-mark, ds-slider-mark-active | Built on a native range input. Figma calls the thumb "Picker" and the value label "Label". |
| Select | Select Menu > Select, Select borderless, Select Menu Item, Seperator | Select, SelectMenu, MenuItem | ds-select, ds-select-borderless, ds-select-menu, ds-select-item, ds-select-separator | KEP's other library (bits) calls it Dropdown. |
| Autocomplete | Autocomplete | AutoComplete (loading, hasError + errorMessage, freeSolo) | ds-autocomplete, ds-autocomplete-loading, ds-autocomplete-error, ds-autocomplete-free-solo |  |
| Menu | Select Menu, Select Menu Item, Seperator | Menu, MenuItem (icon), NestedMenuItem, MenuDividerItem, MenuSectionTitle (leadItem) | ds-menu-wrapper, ds-menu, ds-menu-item, ds-menu-item-start-icon, ds-menu-item-icon, ds-nested-menu-item, ds-nested-menu, ds-menu-divider-item, ds-menu-section-title, ds-menu-section-title-lead | Same look as the select menu (ds-select-menu, ds-select-item). KEP MenuItem `icon` is the right icon; KEP bits calls it rightIcon and its leading icon `icon` (ds-menu-item-start-icon here). MenuDividerItem and MenuSectionTitle are in KEP bits. |
| Popover | no match | Popover | ds-popover-wrapper, ds-popover | Look from KEP: elevated surface, 16px padding, medium elevation (--ds-shadow-menu). |
| Date Picker | no calendar design | DatePicker, ComposedDatePicker | ds-date-picker, ds-date-picker-field, ds-date-picker-open-button, ds-date-picker-input, ds-date-picker-popper, ds-date-picker-error | Calendar look from KEP (MUI DateCalendar). Composed = inside ds-composed-input. |
| Time Picker | Date and Time > Time Picker | TimePicker, ComposedTimePicker | ds-time-picker, ds-time-picker-field, ds-time-picker-open-button, ds-time-picker-input, ds-time-picker-popper, ds-time-picker-error | Figma shows a clock face; KEP (and here) use hour / minute / AM-PM lists. |
| Rich Text | no match | Richtext (@kaltura/ds-react-richtext: toolbar, richText, readOnly, error) | ds-rich-text, ds-rich-text-toolbar, ds-rich-text-action, ds-rich-text-editor, ds-rich-text-read-only, ds-rich-text-error | Bold, italic, underline, lists, alignment. KEP's image and link actions are not included. |
| Tabs | Navigation > Tabs, Tab Item | Tabs, Tab | ds-tabs, ds-tab |  |
| Segmented Buttons | Segmented control, Segmented control cells | SegmentedContainer (fullWidth, disabled), SegmentedButton (tooltipText) | ds-segmented-container, ds-segmented-container-full-width, ds-segmented-button; aria-disabled="true" on the container (was ds-segmented, ds-segmented-item) |  |
| Breadcrumbs | Navigation > Breadcrumb, Breadcrumb Item | Breadcrumbs, BreadcrumbItem | ds-breadcrumbs, ds-breadcrumb-item, ds-breadcrumbs-separator, ds-breadcrumbs-truncated |  |
| Data Table | Data Table, Skeleton | Table, TableContainer, TableActionBar, TableSortLabel, LoadingContent (bits) | ds-table, ds-table-action-bar, ds-table-sortable, ds-table-skeleton | Skeleton rows: KEP default 3 rows of tone-5 bars. |
| Pagination | Pagination, Pagination Page | Pagination (variant text \| outlined, shape rounded \| circular, showFirstButton, showLastButton, siblingCount, boundaryCount) | ds-table-pagination, ds-table-page, ds-table-pagination-outlined, ds-table-pagination-circular | With data-count, ds.js renders the page buttons and ranges. |
| Status | status (Tag=Success \| Pending \| Danger \| Default, Icon) | Status (variant filled \| borderless, color default \| success \| warning \| error \| primary) | ds-status, ds-status-borderless, ds-status-success, ds-status-warning, ds-status-error, ds-status-primary, ds-status-icon | Figma Pending = warning, Danger = error. The older ds-table-status (table dot and text) still works. |
| Initials | User Picture > Picture | Initials | ds-initials + -sm \| -md \| -lg \| -xl, ds-initials-round (was ds-user-picture) | KEP bits calls it Avatar. Sizes differ: ds-initials-lg is 48px, KEP size="large" is 96px. |
| Alert | Acknowledgement & Help > Acknowledgement | Alert (severity) | ds-alert + -info \| -error \| -success \| -warning (was ds-ack) |  |
| Toast | Acknowledgement (floating) | Toast, Snackbar | ds-alert-floating, DS.showToast(); ds.js adds ds-toast-active to the showing toast (was ds-ack-floating) |  |
| Tooltip | Acknowledgement & Help > Hint | Tooltip (placement, enter delay, shows on focus) | ds-tooltip, ds-tooltip-trigger, ds-tooltip-place-left, ds-tooltip-place-right (was ds-hint) | ds.js flips it when there is no room. ds-tooltip-top\|bottom\|left\|right name the arrow side. |
| Loader | Spinner | Loader | ds-loader + -white \| -black (was ds-spinner) | KEP bits calls it Spinner. |
| Modal | (not on the Components page) | Modal (variant task \| content), ModalTitle (onClose, closeButtonVariant), ModalContent, ModalActions, ModalCloseButton | ds-modal, ds-modal-variant-content, ds-modal-title, ds-modal-body, ds-modal-footer, ds-modal-close, ds-modal-close-pill, ds-modal-media | Task (the default) is static; content (ds-modal-variant-content) closes on Escape, backdrop click or the X, and scrolls as a whole. KEP ModalContent = ds-modal-body, ModalActions = ds-modal-footer. |
| Badge | Badges | Badge | ds-badge |  |
| Tag & Chip | Tags, Tag Delete Button, Chips | Tag | ds-tag, ds-chip |  |
| Link | Custom Links | Link (size, disabled, translucent) | ds-link, ds-link-sm, ds-link-lg, ds-link-translucent | Figma Custom Links are icon links without underline; KEP Link is underlined. |
| Icon | Icons (16/..., 24/...) | @kaltura/ds-react-icons (ChevronDown16Icon) | <ds-icon name="chevron-down" size="16"> | Same icon set; file names are kebab-case here. |

**Properties, states and tokens**

| Concept | Figma | KEP UI | kaltura-ds | Notes |
|---|---|---|---|---|
| Disabled | State=Disable | disabled | disabled attribute, or aria-disabled="true" |  |
| On / checked | Status=True | checked, selected | aria-checked="true" (switch, segmented), aria-selected="true" (tabs) |  |
| Current item | State=Active (Breadcrumb Item) | active | aria-current="page" |  |
| Busy | State=Processing | loading | ds-btn-processing + aria-busy="true", DS.setProcessing() |  |
| Over media | Mode=Translucent | color="translucent" | ds-switch-translucent, ds-checkbox-translucent, ds-radio-translucent |  |
| Hover, focus | State=Hover, Focus | :hover, focusVisible | :hover, :focus-visible |  |
| Sizes | Small, Medium, Large, XL | small, medium, large | -sm, -md, -lg, -xl | Same words, not always the same pixels: compare px, not names. |
| Color shades | Darker, Brighter, Text Contrast | palette.x.dark, .light, .contrastText | --ds-x-darker, --ds-x-brighter, --ds-x-text-contrast |  |
| Yellow-orange accent | Secondary | palette.secondary | --ds-secondary | Not the grey secondary button. Old name --ds-accent still works. |
| Messages | Acknowledgment colors (Success, Danger, Warning) | palette.success, .danger, .warning; Alert severity | --ds-success, --ds-danger, --ds-warning |  |
| Spacing | px values | theme.spacing(n) = n x 8px | --ds-space-N = N x 4px, so spacing(n) = --ds-space-{2n} |  |
| Corner radius | Roundness 1, 2, 3 | roundness1, roundness2, roundness3 | --ds-roundness-1, -2, -3 |  |
| Font | Lato (text styles, e.g. Body 2 Highlight) | defaultFontFamily: Lato, Helvetica Neue, Segoe UI, sans-serif; loaded from fonts.kaltura.com | --ds-font-family (same stack), loaded from fonts.kaltura.com | Kaltura's font proxy hides the user's IP from Google (GDPR). |
| Field border | Tone 3; Hover Tone 2; Focus Primary; Error Danger; Disable Tone 4 (Text Single Line, Textarea; Checkbox and Radio rest on Tone 3) | tone4 resting, tone3 hover, primary.main focus | --ds-tone-3 resting, --ds-tone-2 hover, --ds-primary focus (follows Figma) | KEP UI differs from Figma here: its resting border is one step lighter. |
| Surfaces | Neutrals: Background, Paper, Elevated, Protection | palette.surfaces.background, .paper, .elevated, .protection | --ds-background, --ds-paper, --ds-elevated, --ds-protection | Protection (#3D3D3D, both themes) is for text over media. KEP's code calls it possibly added by mistake; Figma defines it. |
| Translucent | Translucent: B 10-100, W 10-100, Backdrop | palette.translucent, palette.backdrop | --ds-b-10 ... --ds-b-100, --ds-w-10 ... --ds-w-100, --ds-backdrop | Backdrop = #222222 at 60%, behind modals. |

**In Figma or KEP UI, not in kaltura-ds yet** (build these yourself from tokens)

| Component | Figma | KEP UI |
|---|---|---|
| Card | Cards | Card |
| Color picker | Color Picker | ColorPicker (bits) |
| Tree view | Tree View | @kaltura/ds-react-tree |
| Sidebar, navigation | Main Navigation, Sidebar, Sidebar Navigation | @kaltura/ds-react-layouts |
| Upload | Upload | no match |
| Reactions | Reactions | no match |
| Toggle button | no match | ToggleButton |
| Typography | text styles | Typography |
<!-- END GENERATED: terminology -->

### Button
Base `ds-btn` + size (`ds-btn-sm` 24px | `-md` 32px | `-lg` 40px | `-xl` 48px) + variant (`ds-btn-primary` | `-secondary` | `-danger` | `-translucent`). `ds-btn-translucent` (KEP `color="translucent"`) is for buttons over images or video: black at 60% with white text in both themes, darker on hover. With `ds-btn-borderless` it has no fill (white text) and gets the dark fill on hover and focus. Optional `ds-btn-borderless` (transparent bg, colored text, tint on hover). Icon-only: add `ds-btn-icon` (square) and give it `aria-label`. States: hover, focus-visible ring, `disabled` / `aria-disabled="true"` (outline: empty background, `tone-4` border and text; borderless keeps no border; not clickable).
```html
<button class="ds-btn ds-btn-md ds-btn-primary">Save</button>
<button class="ds-btn ds-btn-md ds-btn-secondary ds-btn-borderless">Cancel</button>
<button class="ds-btn ds-btn-md ds-btn-primary"><ds-icon name="plus" size="16"></ds-icon> New</button>
<button class="ds-btn ds-btn-md ds-btn-secondary ds-btn-icon" aria-label="More"><ds-icon name="more-horizontal" size="24"></ds-icon></button>
<button class="ds-btn ds-btn-md ds-btn-danger" disabled>Delete</button>
```
Icon-only sizing: the CSS forces the icon to 24px in `-md` and `-lg` icon buttons; use `size="16"` in `-sm`.

Processing (an action is running): add `ds-btn-processing` and `aria-busy="true"`, or call `DS.setProcessing(btn, true)` / `DS.setProcessing(btn, false)`. The content is hidden but the button keeps its width and background; a centered spinner turns in its place (12px in `-sm`, 16px in `-md`, 20px in `-lg`/`-xl`; white on primary/danger/translucent, `tone-1` on secondary, primary/danger color when borderless). Clicks, Enter and Space are ignored while it is set. Do not also add `disabled` (that switches to the outline disabled look). Works with `ds-btn-icon` too.
```html
<button class="ds-btn ds-btn-md ds-btn-primary ds-btn-processing" aria-busy="true">Save</button>
```
```js
saveBtn.addEventListener('click', async () => {
  DS.setProcessing(saveBtn, true);
  await save();
  DS.setProcessing(saveBtn, false);
});
```

Circular (media overlay buttons, dark translucent bg): `ds-btn-circular` + `ds-btn-circular-sm` (32px, icon 24) | `-md` (48px, icon 36) | `-lg` (56px, icon 36). Supports `disabled` (outline: transparent background, `tone-4` border and icon).
```html
<button class="ds-btn-circular ds-btn-circular-sm" aria-label="Play"><ds-icon name="play"></ds-icon></button>
```

### Split Button (button + menu of related actions)
Names follow KEP UI's `SplitButton`. Wrapper `div.ds-split-button[role=group]` (give it `aria-label`) holds the **action button** `button.ds-btn.ds-split-button-action`, the **menu toggle button** `button.ds-btn.ds-split-button-menu-toggle` (`aria-haspopup="menu"`, `aria-expanded="false"`, `aria-label="More <label> actions"`, contains `<ds-icon name="chevron-down" size="16">`) and the **menu** `div.ds-select-menu.ds-split-button-menu[role=menu]` with items `button.ds-select-item[role=menuitem]` + `span.ds-select-item-label`. Give both buttons the same size (`ds-btn-md` 32px | `-lg` 40px | `-xl` 48px; no `-sm`) and color (`ds-btn-primary` is the design; `-secondary` and `-danger` also work). Optional start icon in the action button: `<ds-icon name="..." size="24">` before the label.

Behavior (`ds.js`): the toggle opens the menu below, right-aligned (`ds-split-button-open` on the wrapper, `aria-expanded` on the toggle); picking an item, clicking outside, Escape or tabbing out closes it. ArrowDown/ArrowUp on either button opens it and focuses the first/last item; arrows, Home, End move. The action button and the menu items are plain buttons and fire no DS event: add your own `click` listeners. States: hover and focus per half (focus = brighter fill, no ring), open, disabled (put `disabled` on BOTH buttons: one tone-4 outline), processing (`DS.setProcessing(actionBtn, true)`: spinner replaces the action label, the toggle keeps its color but the menu can't open). Disabled item: `aria-disabled="true"`.
```html
<div class="ds-split-button" role="group" aria-label="Publish">
  <button type="button" class="ds-btn ds-btn-md ds-btn-primary ds-split-button-action">Publish</button>
  <button type="button" class="ds-btn ds-btn-md ds-btn-primary ds-split-button-menu-toggle"
          aria-haspopup="menu" aria-expanded="false" aria-label="More Publish actions">
    <ds-icon name="chevron-down" size="16"></ds-icon>
  </button>
  <div class="ds-select-menu ds-split-button-menu" role="menu">
    <button type="button" class="ds-select-item" role="menuitem" data-action="schedule"><span class="ds-select-item-label">Schedule</span></button>
    <button type="button" class="ds-select-item" role="menuitem" aria-disabled="true"><span class="ds-select-item-label">Publish to channel</span></button>
  </div>
</div>
```

### Input and Textarea
`ds-input` + size `ds-input-md` (32px) | `-lg` (40px) | `-xl` (48px). Error: add `ds-input-error`. Both are `width: 100%`; set a width on a wrapper or inline. Textarea: `ds-textarea` (+ `ds-textarea-error`), min-height 88px, resizes vertically.
```html
<input class="ds-input ds-input-md" placeholder="Email">
<input class="ds-input ds-input-md ds-input-error" value="bad">
<input class="ds-input ds-input-md" disabled value="Locked">
<textarea class="ds-textarea" placeholder="Message..."></textarea>
```

### Slider
Look from the Figma Platform DS Slider, part names from KEP UI's Slider: **rail** (grey line), **track** (filled part), **thumb**, **value label**, **marks**. It wraps a native `<input type="range">`, so keyboard (arrows, Home, End, Page Up/Down) and screen readers work without extra code. Wrapper `div.ds-slider` + type `ds-slider-continuous` (value label above the thumb, min and max marks below in `tone-3`) or `ds-slider-discrete` (one `span.ds-slider-mark` per step under the rail, the selected one bold via `ds-slider-mark-active`, no value label). Inside: `label.ds-slider-title[for]`, then `div.ds-slider-control` holding (continuous only) `output.ds-slider-value-label` and `input.ds-slider-input[type=range][min][max][step][value]`, then `div.ds-slider-marks`. Optional `data-prefix` / `data-suffix` on `.ds-slider` format the value label. Look: 6px `tone-6` rail, `primary` track, 24px `primary` thumb with a 1.5px background-colored ring, `primary-darker` on hover/focus (plus the focus ring); disabled (`disabled` on the input): `tone-5` thumb and track, `tone-3` label and marks. `ds.js` keeps the track, value label and active mark in step (also for sliders added later); if you change `input.value` from JS, dispatch an `input` event so they update. Event: `ds-change` on `.ds-slider` when the user lets go, `detail: { value: <number>, label }`.
```html
<div class="ds-slider ds-slider-continuous" data-suffix="%">
  <label class="ds-slider-title" for="volume">Volume</label>
  <div class="ds-slider-control">
    <output class="ds-slider-value-label" for="volume">25%</output>
    <input class="ds-slider-input" type="range" id="volume" min="0" max="100" value="25">
  </div>
  <div class="ds-slider-marks"><span class="ds-slider-mark">0%</span><span class="ds-slider-mark">100%</span></div>
</div>
<div class="ds-slider ds-slider-discrete">
  <label class="ds-slider-title" for="rating">Rating</label>
  <div class="ds-slider-control"><input class="ds-slider-input" type="range" id="rating" min="1" max="5" step="1" value="3"></div>
  <div class="ds-slider-marks"><span class="ds-slider-mark">1</span><span class="ds-slider-mark">2</span><span class="ds-slider-mark">3</span><span class="ds-slider-mark">4</span><span class="ds-slider-mark">5</span></div>
</div>
```

### Composed Input (label + control + helper text) - was FormField
`ds-composed-input` has a 20px bottom margin. Inside: `ds-form-label` (optionally holding `ds-input-counter`, pushed right), then optional `ds-form-additional-info`, then the control, then optional `ds-form-helper-text-error` (red text).
```html
<div class="ds-composed-input">
  <label class="ds-form-label" for="email">Email <span class="ds-input-counter">0/100</span></label>
  <p class="ds-form-additional-info">We'll never share your email.</p>
  <input class="ds-input ds-input-md ds-input-error" id="email">
  <p class="ds-form-helper-text-error">Enter a valid email.</p>
</div>
```

### Checkbox
The check mark is an inline SVG inside `.ds-checkbox-indicator` (the CSS shows it when checked or indeterminate). This is the one place inline SVG is expected: copy it exactly. Checked = `checked`; indeterminate = set `input.indeterminate = true` in JS. Label span is `ds-checkbox-label`. States (Figma): border `tone-3`; hover unchecked `tone-6` fill and `tone-4` border; checked `primary`, hover `primary-darker`; disabled `tone-7` fill, `tone-4` border and mark. Hover follows the whole label. **Translucent** (over images or video; KEP `color="translucent"`): add `ds-checkbox-translucent` to the label: black 40% box with a white 80% border (white on hover), checked stays primary, disabled is black 20% with a white 60% border and mark, label text white. **Label placement** (KEP `labelPlacement`): add `ds-checkbox-label-placement-start` | `-top` | `-bottom` to the label; end is the default.
```html
<label class="ds-checkbox">
  <input type="checkbox" class="ds-checkbox-input">
  <span class="ds-checkbox-indicator"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
  <span class="ds-checkbox-label">Remember me</span>
</label>
```
Use the native `change` event on the input (the DS adds nothing except inside select menus and tables).

### Radio
Same structure, no SVG. Group radios with the same `name`. Translucent and label placement work as for the checkbox (`ds-radio-translucent`, `ds-radio-label-placement-…`). States (Figma): border `tone-3`; hover unchecked `primary` border; checked = `primary` with a 6px white dot, hover `primary-darker`; disabled unchecked `tone-6` fill and `tone-4` border, disabled checked `tone-4` with a light dot.
```html
<label class="ds-radio">
  <input type="radio" name="plan" class="ds-radio-input" checked>
  <span class="ds-radio-indicator"></span>
  <span class="ds-radio-label">Free</span>
</label>
```

### Switch
Parts use KEP UI's names: the **track** is `button.ds-switch-track[role=switch]`, the **thumb** is `span.ds-switch-thumb` inside it, and **checked** is `aria-checked="true"` / `"false"` on the track (no state class needed). Size `ds-switch-sm` (32x16) | `ds-switch-lg` (44x24). `ds.js` flips `aria-checked` on click. (Old markup used `ds-switch-handle` and `ds-switch-on` / `ds-switch-off`; they still work, and `ds.js` keeps an old on/off class in step only if the switch already had one.) Optional label block. Event: `ds-change` fires on the button, `detail: { value: true|false, label }`.
Colors (Figma Switch): off `tone-3`, on `primary`, white thumb (Figma calls it Handle). Disabled (`disabled`, or `aria-disabled="true"`): off `tone-4`, on `tone-3`, solid (no fade), not clickable. Translucent, for switches over images or video: add `ds-switch-translucent` (off black 40%, on primary; disabled off black 20% with a 40% white handle, disabled on white 40%). KEP translucent = `color="translucent"`. A switch with no visible label needs `aria-label`.
```html
<div class="ds-switch">
  <button class="ds-switch-track ds-switch-lg" role="switch" aria-checked="false"><span class="ds-switch-thumb"></span></button>
  <div class="ds-switch-content">
    <span class="ds-switch-label">Notifications</span>
    <span class="ds-switch-description">Receive email updates</span>
  </div>
</div>
```

### Select (dropdown)
Wrapper `ds-select-wrapper` holds the trigger `button.ds-select` and the menu `div.ds-select-menu[role=listbox]` (menu is hidden until `ds-select-open` is on the wrapper; `ds.js` manages it plus `aria-expanded`). Items are `button.ds-select-item[role=option]` with a `span.ds-select-item-label`. Picking an item sets the trigger's first `<span>` text to the label, moves the check mark (`ds-select-item-trailing`) and fires `ds-change` on the wrapper. `detail.value` = the item's `data-value` if present, else the label. The trigger text is only the placeholder until the user picks; to preselect, put the label in the trigger `<span>` yourself and add the check icon + `aria-selected="true"` to that item.

Variants: `ds-select-borderless` on the trigger; `ds-select-icon-only` on the trigger (no label span, padding 4px). Leading icon: `<ds-icon class="ds-select-icon" name="...">` in trigger or item. Trailing: `<ds-icon class="ds-select-item-trailing" name="check|chevron-right" size="16">`. Item description: `<span class="ds-select-item-desc">`. Disabled trigger: `disabled`. Disabled item: `aria-disabled="true"`. Divider with title: `div.ds-select-separator > hr.ds-select-separator-line + span.ds-select-separator-title`. Menu is 260px wide, max 320px tall (scrolls), opens below-left. Keyboard: ArrowDown/Up open and move, Home/End, Enter/Space pick, Escape closes, Tab out closes.
```html
<div class="ds-select-wrapper">
  <button class="ds-select" aria-haspopup="listbox">
    <span>Sort by</span>
    <ds-icon class="ds-select-chevron" name="chevron-down" size="16"></ds-icon>
  </button>
  <div class="ds-select-menu" role="listbox">
    <button class="ds-select-item" role="option" data-value="name"><span class="ds-select-item-label">Name</span></button>
    <button class="ds-select-item" role="option" data-value="date"><span class="ds-select-item-label">Date</span></button>
    <div class="ds-select-separator"><hr class="ds-select-separator-line"><span class="ds-select-separator-title">Archive</span></div>
    <button class="ds-select-item" role="option" aria-disabled="true"><span class="ds-select-item-label">Older</span></button>
  </div>
</div>
```
Switch rows inside a menu (menu has no `role`, trigger `aria-haspopup="true"`): items are `div.ds-select-item` containing a label span and a small switch (`ds-switch-track ds-switch-sm`). Each switch fires its own `ds-change`.
```html
<div class="ds-select-item"><span class="ds-select-item-label">Notifications</span>
  <button class="ds-switch-track ds-switch-sm" role="switch" aria-checked="false"><span class="ds-switch-thumb"></span></button></div>
```
Multi-select: menu gets `aria-multiselectable="true"`; each item is a `<label class="ds-select-item">` wrapping a checkbox (`<label class="ds-checkbox" style="pointer-events:none">` + the checkbox markup above) and the label span. The menu stays open; every change fires `ds-change` on the wrapper with `detail.value` = array of all checked values, `detail.label` = checked labels joined by ", ". The trigger text does NOT update; update it yourself in a `ds-change` listener.

### Autocomplete (text input with suggestions)
A text input with a menu of suggested options. Wrapper `div.ds-autocomplete` (full width of its container; set a width on it) > `div.ds-autocomplete-field` (looks like `ds-input`, 32px; tone-3 border, tone-2 on hover, primary while in use) holding `input.ds-autocomplete-input` (give it `placeholder` and `aria-label`), the clear button `button.ds-autocomplete-clear[hidden]` and the chevron `ds-icon.ds-autocomplete-chevron`; then `div.ds-autocomplete-menu.ds-select-menu` (as wide as the field) with options `button.ds-select-item[role=option][tabindex=-1]` + `span.ds-select-item-label`, and an optional no-results block `div.ds-autocomplete-empty`.

Behavior (`ds.js` adds the combobox ARIA itself): focusing or clicking the field opens the menu with every option; typing filters options whose label contains the text (case-insensitive); ArrowDown/Up highlight an option (focus stays in the input), Home/End, Enter picks, Escape closes, Tab or a click outside closes. With no matching option the `.ds-autocomplete-empty` block shows. The clear (x) shows while open and there is a value; it clears everything and fires `ds-change`. `detail.value` = the option's `data-value`, else its label.
- **Single value** (default): picking puts the label in the input, closes the menu, fires `ds-change` `{ value, label }`. Clearing fires `{ value: '', label: '' }`.
- **Multiple values**: add `ds-autocomplete-multiple`. Picked values are chips (`ds-chip`, see Badges, tags, chips) placed before the input; `ds.js` creates them, copying the option's `img.ds-autocomplete-picture` into the chip. Preselect by writing chips yourself with `data-value` matching the options. Each option starts with `span.ds-checkbox-indicator` (the checkbox SVG) that follows `aria-selected`. Picking toggles a chip, keeps the menu open and clears the typed text; a chip's x or Backspace in the empty input removes one. Every change fires `ds-change` `{ value: [values], label: "A, B" }`. While the field is in use it wraps to show every chip; otherwise it stays one row and chips that don't fit become a `+N` counter whose hover hint lists them.
- **Your own suggestions** (server search, recents, most used): add `data-filter="none"` on the wrapper. `ds.js` then never hides options; listen to the input's native `input` event and replace the menu's options yourself (keep `.ds-autocomplete-empty` in the menu; it shows when there are no options).
- **Disabled**: `disabled` on the input. "Try again" (`button.ds-autocomplete-retry`) does nothing by itself; handle its click.
- **Loading** (KEP `loading`): add `ds-autocomplete-loading` to the wrapper while you fetch; remove it when the options are in. Put `<span class="ds-loader ds-autocomplete-loader" role="status" aria-label="Loading"></span>` before the chevron (it replaces the chevron while loading) and `<div class="ds-autocomplete-loading-text">Loading...</div>` first in the menu (it is the only row shown while loading).
- **Error** (KEP `hasError` + `errorMessage`): add `ds-autocomplete-error` (red border), `aria-invalid="true"` and `aria-describedby` on the input, and a `<p class="ds-form-helper-text-error">` right after the wrapper.
- **Free solo** (KEP `freeSolo`, any text is allowed): add `ds-autocomplete-free-solo`. Options are only suggestions: Enter or leaving the field keeps the typed text and fires `ds-change` `{ value: text, label: text }`; with `ds-autocomplete-multiple`, Enter turns the typed text into a chip. There is no "no results" row; usually leave out the chevron.

```html
<div class="ds-autocomplete" style="width:300px">
  <div class="ds-autocomplete-field">
    <input class="ds-autocomplete-input" placeholder="Pick a fruit" aria-label="Fruit">
    <button type="button" class="ds-autocomplete-clear" aria-label="Clear" tabindex="-1" hidden><ds-icon name="close" size="16"></ds-icon></button>
    <ds-icon class="ds-autocomplete-chevron" name="chevron-down" size="16"></ds-icon>
  </div>
  <div class="ds-autocomplete-menu ds-select-menu">
    <button type="button" class="ds-select-item" role="option" tabindex="-1" data-value="apple"><span class="ds-select-item-label">Apple</span></button>
    <button type="button" class="ds-select-item" role="option" tabindex="-1" data-value="banana"><span class="ds-select-item-label">Banana</span></button>
    <div class="ds-autocomplete-empty">
      <ds-icon class="ds-autocomplete-empty-icon" name="warning-triangle"></ds-icon>
      We couldn't find results
      <button type="button" class="ds-autocomplete-retry">Try again</button>
    </div>
  </div>
</div>

<div class="ds-autocomplete ds-autocomplete-multiple" style="width:500px">
  <div class="ds-autocomplete-field">
    <span class="ds-chip" data-value="celine"><img class="ds-chip-picture" src="celine.jpg" alt=""><span class="ds-chip-content">Celine Garnier<button type="button" class="ds-chip-close" tabindex="-1" aria-label="Remove Celine Garnier"><ds-icon name="close" size="16"></ds-icon></button></span></span>
    <input class="ds-autocomplete-input" placeholder="Enter value" aria-label="People">
    <button type="button" class="ds-autocomplete-clear" aria-label="Clear" tabindex="-1" hidden><ds-icon name="close" size="16"></ds-icon></button>
    <ds-icon class="ds-autocomplete-chevron" name="chevron-down" size="16"></ds-icon>
  </div>
  <div class="ds-autocomplete-menu ds-select-menu">
    <button type="button" class="ds-select-item" role="option" tabindex="-1" data-value="celine">
      <span class="ds-checkbox-indicator"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <img class="ds-autocomplete-picture" src="celine.jpg" alt="">
      <span class="ds-select-item-label">Celine Garnier</span>
    </button>
  </div>
</div>
```

### Menu (action menu from a button)
KEP `Menu`. Same look as the select menu. `div.ds-menu-wrapper` > the trigger (any button with `aria-haspopup="menu" aria-expanded="false"`) + `div.ds-select-menu.ds-menu[role=menu][aria-label]` holding:
- items `button.ds-select-item.ds-menu-item[role=menuitem]` > optional `<ds-icon class="ds-menu-item-start-icon" size="16">`, `span.ds-select-item-label` (truncates), optional right icon `<ds-icon class="ds-menu-item-icon" size="16">` (KEP `icon`). Disabled: `aria-disabled="true"`.
- a sub-menu (KEP `NestedMenuItem`): `div.ds-nested-menu-item` > item button with `aria-haspopup="menu" aria-expanded="false"` and a `chevron-right` right icon, then `div.ds-select-menu.ds-menu.ds-nested-menu[role=menu]` with its items.
- divider `<hr class="ds-menu-divider-item">` (KEP `MenuDividerItem`) and section title `<div class="ds-menu-section-title" role="presentation">` (KEP `MenuSectionTitle`; add `ds-menu-section-title-lead` when it is the first row).
Items are plain buttons: handle their `click`; the menu closes by itself. `ds.js` opens / closes it (click, Enter, Space or ArrowDown on the trigger), moves with arrows / Home / End, opens a sub-menu on hover, ArrowRight, Enter or Space and closes it with ArrowLeft or Escape, closes on Escape, outside click or Tab, returns focus to the trigger, and opens it above / aligned right when there is no room.
```html
<div class="ds-menu-wrapper">
  <button type="button" class="ds-btn ds-btn-md ds-btn-secondary" aria-haspopup="menu" aria-expanded="false">Actions</button>
  <div class="ds-select-menu ds-menu" role="menu" aria-label="Actions">
    <button type="button" class="ds-select-item ds-menu-item" role="menuitem"><ds-icon class="ds-menu-item-start-icon" name="edit" size="16"></ds-icon><span class="ds-select-item-label">Edit</span></button>
    <div class="ds-nested-menu-item">
      <button type="button" class="ds-select-item ds-menu-item" role="menuitem" aria-haspopup="menu" aria-expanded="false"><span class="ds-select-item-label">Share</span><ds-icon class="ds-menu-item-icon" name="chevron-right" size="16"></ds-icon></button>
      <div class="ds-select-menu ds-menu ds-nested-menu" role="menu" aria-label="Share">
        <button type="button" class="ds-select-item ds-menu-item" role="menuitem"><span class="ds-select-item-label">Copy link</span></button>
      </div>
    </div>
    <hr class="ds-menu-divider-item">
    <div class="ds-menu-section-title" role="presentation">Danger zone</div>
    <button type="button" class="ds-select-item ds-menu-item" role="menuitem"><span class="ds-select-item-label">Delete</span></button>
  </div>
</div>
```

### Popover
KEP `Popover`: a floating panel (elevated surface, 16px padding, medium elevation) anchored to a button. `div.ds-popover-wrapper` > a button with `aria-haspopup="dialog" aria-expanded="false"` + `div.ds-popover[role=dialog][aria-label]` with any content (set its width yourself). `ds.js` opens it on click, closes it on a second click, outside click, Tab out or Escape (focus returns to the button), and opens it above / aligned right when there is no room. Keyboard opening focuses the first focusable element inside.
```html
<div class="ds-popover-wrapper">
  <button type="button" class="ds-btn ds-btn-md ds-btn-primary" aria-haspopup="dialog" aria-expanded="false">Show details</button>
  <div class="ds-popover" role="dialog" aria-label="Details" style="width:280px">…</div>
</div>
```

### Date Picker and Time Picker
KEP `DatePicker` / `TimePicker`. A 32px field with the open-picker button at the start, and an empty popper that `ds.js` fills. Date: `div.ds-date-picker` > `div.ds-date-picker-field` (`button.ds-date-picker-open-button[aria-label]` with `<ds-icon name="calendar" size="24">`, `input.ds-date-picker-input` with `placeholder="MM/DD/YYYY"` and a label) + `div.ds-date-picker-popper`. Time: the same with `ds-time-picker-*` and `<ds-icon name="time-hollow" size="24">`, placeholder `hh:mm aa`.
- Date: a month calendar (arrows move a day / week, PageUp / PageDown a month, Home / End the week, Enter or Space picks, Escape closes). Typing a date (MM/DD/YYYY) and leaving the field or pressing Enter also sets it. `data-min` / `data-max` (`YYYY-MM-DD`) on the wrapper limit it. `ds-change` on `.ds-date-picker`: `{ value: 'YYYY-MM-DD' or '', label: 'MM/DD/YYYY' }`.
- Time: three lists (hours, minutes, AM/PM) and an OK button. Up / Down pick in a list, Left / Right switch list, Enter or OK closes. `data-minutes-step` (default 5), `data-ampm="false"` for 24-hour. Typing ("2:30 pm", "14:30") also sets it. `ds-change` on `.ds-time-picker`: `{ value: 'HH:mm' (24h) or '', label: what the field shows }`.
- Width: fills its container up to 180px (date) / 120px (time); `ds-date-picker-full-width` / `ds-time-picker-full-width` for full width. Error: `ds-date-picker-error` / `ds-time-picker-error` plus a `ds-form-helper-text-error`. Disabled: `disabled` on both the input and the button.
- With a label (KEP `ComposedDatePicker` / `ComposedTimePicker`): put it in a `div.ds-composed-input` with `label.ds-form-label[for]`, optional `p.ds-form-additional-info`, and `p.ds-form-helper-text-error` (see Composed Input).
```html
<div class="ds-date-picker">
  <div class="ds-date-picker-field">
    <button type="button" class="ds-date-picker-open-button" aria-label="Choose date" aria-haspopup="dialog"><ds-icon name="calendar" size="24"></ds-icon></button>
    <input class="ds-date-picker-input" placeholder="MM/DD/YYYY" aria-label="Publish date">
  </div>
  <div class="ds-date-picker-popper"></div>
</div>
<div class="ds-time-picker">
  <div class="ds-time-picker-field">
    <button type="button" class="ds-time-picker-open-button" aria-label="Choose time" aria-haspopup="dialog"><ds-icon name="time-hollow" size="24"></ds-icon></button>
    <input class="ds-time-picker-input" placeholder="hh:mm aa" aria-label="Start time">
  </div>
  <div class="ds-time-picker-popper"></div>
</div>
```

### Rich Text
KEP `Richtext` (`@kaltura/ds-react-richtext`): `div.ds-rich-text` > `div.ds-rich-text-toolbar[role=toolbar][aria-label]` of `button.ds-rich-text-action[data-action][aria-label][aria-pressed="false"]` (24px `ds-icon`; group them with `span.ds-rich-text-separator`) + `div.ds-rich-text-editor[contenteditable="true"][role=textbox][aria-multiline="true"][aria-label][data-placeholder]`. `data-action` / icon: `bold` / `bold`, `italic` / `italic`, `underline` / `underline`, `ordered-list` / `ordered-list`, `bullet-list` / `bullet-list`, `align-left|center|right` / `align-left|center|right`. `ds.js` applies the formatting, sets `aria-pressed` for what is on at the caret, Left / Right move along the toolbar, and fires `ds-change` on `.ds-rich-text` as the text changes: `{ value: <html>, label: <plain text> }`. Error: `ds-rich-text-error` + a `ds-form-helper-text-error` below. Read only: `ds-rich-text-read-only` and `contenteditable="false"` (the toolbar is disabled). No image or link actions.
```html
<div class="ds-rich-text">
  <div class="ds-rich-text-toolbar" role="toolbar" aria-label="Formatting">
    <button type="button" class="ds-rich-text-action" data-action="bold" aria-label="Bold" aria-pressed="false"><ds-icon name="bold" size="24"></ds-icon></button>
    <button type="button" class="ds-rich-text-action" data-action="italic" aria-label="Italic" aria-pressed="false"><ds-icon name="italic" size="24"></ds-icon></button>
    <span class="ds-rich-text-separator" aria-hidden="true"></span>
    <button type="button" class="ds-rich-text-action" data-action="bullet-list" aria-label="Unordered list" aria-pressed="false"><ds-icon name="bullet-list" size="24"></ds-icon></button>
  </div>
  <div class="ds-rich-text-editor" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Description" data-placeholder="Write a description..."></div>
</div>
```

### Tabs
`div.ds-tabs[role=tablist]` > `button.ds-tab[role=tab][aria-selected]`. Exactly one `aria-selected="true"`. Optional icon `<ds-icon class="ds-tab-icon" name="...">` with the text in a `<span>`. Disabled: `disabled`. Tabs do not show/hide panels; do that in a `ds-change` listener. `ds-change` fires on the tablist, `detail: { value, label }` (value = `data-value` or the label), only when the selection actually changes. Arrow keys, Home and End move and select.
```html
<div class="ds-tabs" role="tablist">
  <button class="ds-tab" role="tab" aria-selected="true">Overview</button>
  <button class="ds-tab" role="tab" aria-selected="false" data-value="activity">Activity</button>
  <button class="ds-tab" role="tab" aria-selected="false" disabled>Locked</button>
</div>
```

### Segmented Buttons - was Segmented control
`div.ds-segmented-container[role=radiogroup][aria-label]` > `button.ds-segmented-button[role=radio][aria-checked]`. One `aria-checked="true"`. Text in a `<span>`; an icon-only item needs `aria-label` (its value/label come from it). Icon: `<ds-icon class="ds-segmented-icon" name="...">`. Disabled: `disabled`. `ds-change` fires on the radiogroup. Same keyboard as tabs.
- **Full width** (KEP `fullWidth`): add `ds-segmented-container-full-width`; the buttons share the width.
- **Whole group disabled** (KEP `disabled` on the container): `aria-disabled="true"` on the container and `tabindex="-1"` on each button.
- **Tooltip on a button** (KEP `tooltipText`): wrap that button in a `span.ds-tooltip-trigger` with a `ds-tooltip` after it (see Tooltip). Keyboard and `ds-change` work the same.
```html
<div class="ds-segmented-container" role="radiogroup" aria-label="Period">
  <button class="ds-segmented-button" role="radio" aria-checked="true"><span>Monthly</span></button>
  <button class="ds-segmented-button" role="radio" aria-checked="false"><span>Yearly</span></button>
</div>
```

### Breadcrumbs
Look from the Figma Platform DS, names from KEP UI's `Breadcrumbs`. `nav.ds-breadcrumbs[aria-label]` > `ol.ds-breadcrumbs-ol` > one `li.ds-breadcrumbs-li` per **breadcrumb item** (`.ds-breadcrumb-item`), with a **separator** `li.ds-breadcrumbs-separator[aria-hidden=true]` holding `<ds-icon name="chevron-right" size="16">` between items (mirrored under `dir="rtl"`). Item element: `<a href>` = link, `<button type="button">` = click action (hover turns primary), `<span>` = plain text (no hover). Text is 14px bold, line height 18, `tone-2`; separator `tone-2`; gap 8px.

States: **Default** `tone-2`; **Hover** (links and buttons) `primary`; **Active** = the current page, `aria-current="page"` (or class `ds-breadcrumb-item-active`), `primary-brighter`; **Disabled** `aria-disabled="true"` (or `disabled` on a button), `tone-4`, not clickable; **Truncated** `...` `tone-3`. Focus: 2px primary ring.

Truncation (`ds.js`, like KEP): when the trail is wider than the nav, the first item stays, as many last items as fit stay, and the middle ones are hidden behind a generated `button.ds-breadcrumb-item.ds-breadcrumbs-truncated` ("...", `aria-label` "Show more", or the nav's `data-expand-text`). Clicking it adds `ds-breadcrumbs-expanded` to the nav and shows every item (wrapping). Refits on resize and when items are added or removed. Turn it off with `data-collapse="none"` on the nav. If even the last item doesn't fit, it ends with an ellipsis. No DS event: listen for `click` on your buttons, or use links.
```html
<nav class="ds-breadcrumbs" aria-label="Breadcrumbs">
  <ol class="ds-breadcrumbs-ol">
    <li class="ds-breadcrumbs-li"><a class="ds-breadcrumb-item" href="/media">My Media</a></li>
    <li class="ds-breadcrumbs-separator" aria-hidden="true"><ds-icon name="chevron-right" size="16"></ds-icon></li>
    <li class="ds-breadcrumbs-li"><a class="ds-breadcrumb-item" aria-disabled="true">Archive</a></li>
    <li class="ds-breadcrumbs-separator" aria-hidden="true"><ds-icon name="chevron-right" size="16"></ds-icon></li>
    <li class="ds-breadcrumbs-li"><span class="ds-breadcrumb-item" aria-current="page">Onboarding</span></li>
  </ol>
</nav>
```

### Data Table
`div.ds-table` wraps an optional `ds-table-action-bar` (search input, `ds-table-action-bar-spacer`, buttons), a plain `<table>`, and an optional `ds-table-pagination`. Column helper classes on `th`/`td`: `ds-table-col-checkbox` (50px), `ds-table-col-icon` (40px, icon in `<ds-icon class="ds-table-icon">`), `ds-table-col-action` (56px, centered). Bold cell: `ds-table-cell-highlight`. Header `th` with `ds-table-sortable` is only styled (pointer + hover); **sorting is not implemented**, do it yourself. `ds-table-sorted` marks the active column; put a chevron icon in `<ds-icon class="ds-table-sort-icon" name="chevron-down|chevron-up" size="16">`.

Built-in behavior: a row checkbox must have the extra class `ds-table-row-cb`; checking it adds `ds-table-row-selected` to its `<tr>`. The checkbox in `<thead>` selects/clears all row checkboxes. No event is fired (use the native `change`). `ds-table-bulk-bar` (+ `ds-table-bulk-bar-count`) is styling only; show/hide it yourself.

Status dot+text: `ds-table-status` + `-green` | `-orange` | `-red` | `-grey`. States instead of the table: `ds-table-empty` (with `p.ds-table-empty-title`), `ds-table-loader` > `div.ds-table-spinner`, `ds-table-error` (with `p.ds-table-error-title`).
Loading as skeleton rows (KEP `LoadingContent`, Figma "Skeleton"; preferred while a list loads): `div.ds-table-skeleton[role=status][aria-label="Loading"]` > 3 x `div.ds-table-skeleton-row` (KEP default 3; repeat for more), each `span.ds-table-skeleton-thumb` (optional 76x46 thumbnail) + 4 x `span.ds-table-skeleton-bar` (55 / 15 / 15 / 15% wide). They pulse; reduced motion stops it.
```html
<div class="ds-table-skeleton" role="status" aria-label="Loading">
  <div class="ds-table-skeleton-row"><span class="ds-table-skeleton-thumb"></span><span class="ds-table-skeleton-bar"></span><span class="ds-table-skeleton-bar"></span><span class="ds-table-skeleton-bar"></span><span class="ds-table-skeleton-bar"></span></div>
</div>
```
```html
<div class="ds-table">
  <div class="ds-table-action-bar">
    <input class="ds-input ds-input-md" placeholder="Search" style="width:160px">
    <div class="ds-table-action-bar-spacer"></div>
    <button class="ds-btn ds-btn-md ds-btn-primary">Create</button>
  </div>
  <table>
    <thead><tr>
      <th class="ds-table-col-checkbox"><label class="ds-checkbox" style="margin:0"><input type="checkbox" class="ds-checkbox-input"><span class="ds-checkbox-indicator"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span></label></th>
      <th class="ds-table-col-icon"></th>
      <th style="width:auto">Name</th>
      <th class="ds-table-sortable ds-table-sorted">Date <ds-icon class="ds-table-sort-icon" name="chevron-down" size="16"></ds-icon></th>
      <th class="ds-table-col-action"></th>
    </tr></thead>
    <tbody><tr>
      <td class="ds-table-col-checkbox"><label class="ds-checkbox" style="margin:0"><input type="checkbox" class="ds-checkbox-input ds-table-row-cb"><span class="ds-checkbox-indicator"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span></label></td>
      <td class="ds-table-col-icon"><ds-icon class="ds-table-icon" name="file"></ds-icon></td>
      <td class="ds-table-cell-highlight">Document 1</td>
      <td>10/09/21</td>
      <td class="ds-table-col-action"><button class="ds-btn ds-btn-md ds-btn-secondary ds-btn-borderless ds-btn-icon" aria-label="More actions"><ds-icon name="more-horizontal" size="16"></ds-icon></button></td>
    </tr></tbody>
  </table>
  <div class="ds-table-pagination">
    <button class="ds-table-page" aria-label="Previous page"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    <button class="ds-table-page" aria-current="page">1</button>
    <button class="ds-table-page">2</button>
    <span class="ds-table-page-ellipsis">...</span>
    <button class="ds-table-page">14</button>
    <button class="ds-table-page" aria-label="Next page"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
  </div>
</div>
<span class="ds-table-status ds-table-status-green">Confirmed</span>
```
Pagination: clicking a numbered `ds-table-page` moves `aria-current="page"` and fires `ds-change` on the `ds-table-pagination` bar, `detail: { value: <number>, label: "<n>" }`. In hand-written markup the previous/next arrows and ellipsis are visual only: wire the arrows yourself (`disabled` greys an arrow).

**Generated pagination (preferred, KEP `Pagination`)**: leave the bar empty and give it `data-count` (pages) and `data-page` (current). `ds.js` renders the buttons with ranges and ellipses like KEP, wires previous / next, and re-renders on every click (`ds-change` as above; read or set `data-page`, re-rendered when the bar is added). Options: `data-sibling-count` (default 1), `data-boundary-count` (default 1), `data-show-first-button`, `data-show-last-button`, `data-hide-prev-button`, `data-hide-next-button`. Variants: `ds-table-pagination-outlined`, `ds-table-pagination-circular` (combine them); `ds-table-pagination-borderless` drops the top border (for a bar outside a table).
```html
<div class="ds-table-pagination ds-table-pagination-outlined" data-count="11" data-page="1" data-show-first-button data-show-last-button></div>
```

### Initials - was User Picture
`span.ds-initials` + size `-sm` (24) | `-md` (36) | `-lg` (48) | `-xl` (96). Content is an `<img>` or up to two initials (uppercased by CSS). Square with rounded corners; add `ds-initials-round` for a circle.
```html
<span class="ds-initials ds-initials-md ds-initials-round"><img src="avatar.png" alt="Jane Doe"></span>
<span class="ds-initials ds-initials-md">JD</span>
```

### Alert (inline message) and Toast - was Acknowledgement
`div.ds-alert` + severity `ds-alert-info` | `-error` | `-success` | `-warning`. Children, in order: `span.ds-alert-icon` > `<ds-icon>`, `span.ds-alert-text`, optional `a.ds-alert-link`, optional `button.ds-alert-dismiss` > `<ds-icon name="clear">`. Icons used: info -> `info`, error -> `warning-circle`, success -> `resolved`, warning -> `warning-triangle`. The inline dismiss button has no built-in behavior (remove the element yourself).
```html
<div class="ds-alert ds-alert-info">
  <span class="ds-alert-icon"><ds-icon name="info"></ds-icon></span>
  <span class="ds-alert-text">This is an information message!</span>
  <a class="ds-alert-link" href="#">Link</a>
  <button class="ds-alert-dismiss" aria-label="Dismiss"><ds-icon name="clear"></ds-icon></button>
</div>
```
Floating/toast: add `ds-alert-floating` (solid colored bg, white text, 48px, icon hidden). Two ways to show one as a fixed toast at the top center:
- Markup trigger: put `data-ds-toast` on a `.ds-alert.ds-alert-floating` element; clicking it clones it into a fixed toast that stays until dismissed.
- JS: `DS.showToast({ type: 'info'|'success'|'warning'|'error', message: 'Saved', linkText: 'Undo', linkHref: '#', duration: 5000 })`. Auto-dismisses after `duration` ms (default 5000; `0` = stay). Only one toast at a time; showing a new one replaces the old. Select the showing toast with `.ds-toast-active`.

### Tooltip - was Hint
`div.ds-tooltip` + direction `ds-tooltip-top` | `-bottom` | `-left` | `-right` containing `div.ds-tooltip-body` and `div.ds-tooltip-arrow` (inline SVG triangle; copy it). The direction names the arrow's side: `-top` body above, arrow below pointing down; `-bottom` arrow above pointing up; `-right` arrow on the right pointing right; `-left` arrow on the left pointing left. For hover tooltips wrap trigger + tooltip in `div.ds-tooltip-trigger` (or a `span` inside inline content). Like KEP's Tooltip it shows on hover after a short delay and while the trigger has keyboard focus, Escape hides it, and `ds.js` links it to the trigger (`role="tooltip"`, `aria-describedby`) and flips it to the other side when there is no room. Inside a trigger, `-top` places it ABOVE the trigger and `-bottom` BELOW it (prefer these two). Beside the trigger add the side it sits on: right of the trigger = `ds-tooltip-left ds-tooltip-place-right`; left of the trigger = `ds-tooltip-right ds-tooltip-place-left` (these flip left / right too). Arrow SVGs for those: left `<svg width="9" height="14" viewBox="0 0 9 14" fill="none"><path d="M9 0L2 5.4Q0 7 2 8.6L9 14Z" fill="currentColor"/></svg>`, right `<svg width="9" height="14" viewBox="0 0 9 14" fill="none"><path d="M0 0L7 5.4Q9 7 7 8.6L0 14Z" fill="currentColor"/></svg>`. `ds-text-truncate` = one-line ellipsis, max 260px.
```html
<div class="ds-tooltip-trigger">
  <button class="ds-btn ds-btn-md ds-btn-secondary ds-btn-icon" aria-label="Add"><ds-icon name="plus" size="16"></ds-icon></button>
  <div class="ds-tooltip ds-tooltip-top">
    <div class="ds-tooltip-body">Add item</div>
    <div class="ds-tooltip-arrow"><svg width="14" height="9" viewBox="0 0 14 9" fill="none"><path d="M0 0L5.4 7Q7 9 8.6 7L14 0Z" fill="currentColor"/></svg></div>
  </div>
</div>
```
Bottom arrow: `<svg width="14" height="9" viewBox="0 0 14 9" fill="none"><path d="M0 9L5.4 2Q7 0 8.6 2L14 9Z" fill="currentColor"/></svg>`.

### Badges, Tags & Chips
```html
<span class="ds-badge ds-badge-sm">Label</span>           <!-- sm is the default; ds-badge-lg for large -->
<span class="ds-badge-live">Live</span>                    <!-- red, uppercase; add ds-badge-lg for large -->
<span class="ds-badge-duration">02:34</span>               <!-- dark translucent pill for video length -->
<span class="ds-tag">Label <button class="ds-tag-close" aria-label="Remove"><ds-icon name="close" size="16"></ds-icon></button></span>
<span class="ds-tag ds-tag-disabled">Label</span>
<span class="ds-chip"><img class="ds-chip-picture" src="a.png" alt=""><span class="ds-chip-content">Label <span class="ds-chip-status">Blocked</span> <button class="ds-chip-close" aria-label="Remove"><ds-icon name="close" size="16"></ds-icon></button></span></span>
<span class="ds-chip ds-chip-disabled"><span class="ds-chip-content">Label</span></span>
```
Tag/chip close buttons have no built-in behavior. `ds-chip-picture` and `ds-chip-status` are optional; the `.ds-chip-content` wrapper is required. For a disabled tag/chip use the class (`ds-tag-disabled`, `ds-chip-disabled`) or the `disabled` attribute.

### Status
KEP `Status` (Figma "status"): a small non-clickable chip. `span.ds-status` + color `ds-status-success` | `-warning` | `-error` | `-primary` (none = default grey) + optional `ds-status-borderless` (no background; the label takes the color). First child: `span.ds-status-icon` (6px bullet) or a `<ds-icon size="16">`; then the text. Prefer it to the older `ds-table-status`.
```html
<span class="ds-status ds-status-success"><span class="ds-status-icon"></span>Published</span>
<span class="ds-status ds-status-warning"><ds-icon name="general-spinner" size="16"></ds-icon>Processing</span>
<span class="ds-status ds-status-borderless ds-status-error"><span class="ds-status-icon"></span>Failed</span>
```

### Link
KEP `Link`: `a.ds-link` (bold, tone-1, underlined; hover / focus tone-2 without underline). Size inherits; `ds-link-sm` (14px) or `ds-link-lg` (16px). A leading `<ds-icon size="16">` makes it an icon link without underline (Figma "Custom Links"). Disabled: no `href` and `aria-disabled="true"` (or a disabled `button.ds-link`). On images or video: `ds-link-translucent`. A `button.ds-link` looks like a link and acts as a button.
```html
<a class="ds-link ds-link-sm" href="/terms">Terms of use</a>
<a class="ds-link ds-link-sm" href="/wiki"><ds-icon name="external-link" size="16"></ds-icon>Learn More</a>
```

### Modal
Two types, like KEP `Modal` `variant`: **task** (the default, below) and **content** (`ds-modal-variant-content`, further down). Pick task for anything the user fills in or decides; pick content for something they only read or look at.

Task modal: a static dialog for forms and tasks. **Clicking the backdrop and pressing Escape do NOT close it** (users would lose what they typed). It closes only through an element with `data-ds-close` inside the dialog (the Cancel button) or `DS.closeModal()`. Do not put `data-ds-close` on the backdrop (it is ignored). Always give the modal a Cancel button with `data-ds-close`; a Save/Delete button that should also close needs `data-ds-close` too.

Structure: `div.ds-modal` + size (`ds-modal-sm` 400px | `-md` 560px | `-lg` 800px | `-xl` 960px) with `id` and the `hidden` attribute (keep it; `ds.js` removes it on open) > `div.ds-modal-backdrop` + `div.ds-modal-dialog[role=dialog][aria-modal=true][aria-labelledby]` > `ds-modal-header` (centered 24px `h2.ds-modal-title`, no divider), `ds-modal-body` (the only part that scrolls), `ds-modal-footer` (12px vertical padding + top border, so 65px tall with `ds-btn-lg` buttons and 57px with `-md`; buttons right-aligned; optional `span.ds-modal-footer-note` on the left). Use a borderless secondary button for Cancel. Open with `<button data-ds-open="id">` or `DS.openModal('id')`. Focus is trapped while open, moves to `[autofocus]` or the first focusable element, and returns to the opener on close. The page behind does not scroll. An open select inside a modal still closes on Escape (modal stays). Optional corner X: `<button class="ds-modal-close" data-ds-close aria-label="Close"><ds-icon name="clear"></ds-icon></button>` as the last child of `.ds-modal-header`.
```html
<button class="ds-btn ds-btn-md ds-btn-primary" data-ds-open="rename-modal">Rename</button>

<div class="ds-modal ds-modal-md" id="rename-modal" hidden>
  <div class="ds-modal-backdrop"></div>
  <div class="ds-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="rename-title">
    <div class="ds-modal-header"><h2 class="ds-modal-title" id="rename-title">Rename document</h2></div>
    <div class="ds-modal-body">
      <div class="ds-composed-input">
        <label class="ds-form-label" for="rename-input">Name</label>
        <input class="ds-input ds-input-md" id="rename-input" placeholder="Enter a name">
      </div>
    </div>
    <div class="ds-modal-footer">
      <span class="ds-modal-footer-note">Optional note</span>
      <button class="ds-btn ds-btn-md ds-btn-secondary ds-btn-borderless" data-ds-close>Cancel</button>
      <button class="ds-btn ds-btn-md ds-btn-primary" data-ds-close>Save</button>
    </div>
  </div>
</div>
```
Content modal (KEP `variant="content"`): add `ds-modal-variant-content` to `div.ds-modal`. For showing text, images or video, so it **is dismissible**: Escape, a click on the backdrop or the corner X (`button.ds-modal-close[data-ds-close]`, always include it) close it. The whole dialog scrolls with the window instead of only its body. A footer is optional. An open select, menu, popover, picker or autocomplete inside it takes the Escape first. For media running edge to edge, make `img.ds-modal-media` (or `video.ds-modal-media`) the dialog's first content, and put the X straight in the dialog as a round pill that stays readable over media: `button.ds-modal-close.ds-modal-close-pill` (KEP `closeButtonVariant="pill"`); with no title, label the dialog with `aria-label`.
```html
<div class="ds-modal ds-modal-md ds-modal-variant-content" id="whats-new" hidden>
  <div class="ds-modal-backdrop"></div>
  <div class="ds-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="whats-new-title">
    <div class="ds-modal-header">
      <h2 class="ds-modal-title" id="whats-new-title">What's new</h2>
      <button class="ds-modal-close" data-ds-close aria-label="Close"><ds-icon name="clear"></ds-icon></button>
    </div>
    <div class="ds-modal-body">…</div>
  </div>
</div>

<div class="ds-modal ds-modal-md ds-modal-variant-content" id="photo" hidden>
  <div class="ds-modal-backdrop"></div>
  <div class="ds-modal-dialog" role="dialog" aria-modal="true" aria-label="Team photo">
    <button class="ds-modal-close ds-modal-close-pill" data-ds-close aria-label="Close"><ds-icon name="clear"></ds-icon></button>
    <img class="ds-modal-media" src="team.jpg" alt="">
    <div class="ds-modal-body">…</div>
  </div>
</div>
```
On phones (narrower than 600px, KEP's `sm` breakpoint) every modal, task or content, fills the screen with square corners, like KEP's `Modal` `fullScreen`; nothing to add. Keep the footer short there: the note and the buttons share one row.

Events on the `.ds-modal` element (bubble): `ds-open` `detail: { id }`; `ds-close` `detail: { id, reason }` where `reason` is `'button'` (a `[data-ds-close]` click), `'api'` (`DS.closeModal()`), and for a content modal also `'escape'` or `'backdrop'`. Nested modals stack; `DS.closeModal()` closes the top one.

### Loader - was Spinner
Loading indicator: a 20px ring (4px stroke) whose quarter arc turns. CSS only, no JS. Default is primary on a light primary track; `ds-loader-white` for dark or colored surfaces (e.g. on a primary button area or a dark overlay); `ds-loader-black` for light images. Give a standalone spinner `role="status"` and `aria-label="Loading"`; next to text that already says "Loading…", use `aria-hidden="true"` instead. Under reduced motion it turns more slowly.
```html
<span class="ds-loader" role="status" aria-label="Loading"></span>
<span class="ds-loader ds-loader-white" role="status" aria-label="Loading"></span>
<span style="display:inline-flex;align-items:center;gap:var(--ds-space-2)"><span class="ds-loader" aria-hidden="true"></span>Loading results…</span>
```
For a loading table use the table's own `ds-table-loader` state instead.

## Events

All bubble, so listen on `document` and use `e.target`. Fired only on a user change, once per change.

| Event | Fired on | `detail` |
|---|---|---|
| `ds-change` | select wrapper | `{ value, label }` - `value` = item `data-value` or the label text |
| `ds-change` | multi-select wrapper | `{ value: [values], label: "A, B" }` - all checked items |
| `ds-change` | `.ds-autocomplete` | single `{ value, label }` (cleared: `{ value: '', label: '' }`); multiple `{ value: [values], label: "A, B" }` - all chips |
| `ds-change` | `.ds-tabs` / `.ds-segmented-container` | `{ value, label }` - `value` = item `data-value` or its label (segmented icon-only: its `aria-label`); not fired if the item was already selected |
| `ds-change` | switch button | `{ value: true\|false, label }` - label = nearest `.ds-switch-label` / `.ds-select-item-label` text |
| `ds-change` | `.ds-slider` | `{ value: <number>, label }` - label = the active mark or value label text; fired when the user lets go |
| `ds-change` | `.ds-table-pagination` | `{ value: <number>, label: "<number>" }` |
| `ds-change` | `.ds-date-picker` | `{ value: 'YYYY-MM-DD', label: 'MM/DD/YYYY' }` (cleared: `''`) |
| `ds-change` | `.ds-time-picker` | `{ value: 'HH:mm', label: 'hh:mm AM' }` (cleared: `''`) |
| `ds-change` | `.ds-rich-text` | `{ value: <html>, label: <plain text> }` - on every edit |
| `ds-open` / `ds-close` | `.ds-modal` | `{ id }` / `{ id, reason }` - reason `'button'`, `'api'`, `'escape'` or `'backdrop'` (the last two only for a content modal) |
| `ds-theme-change` | `document` | `{ theme: 'light'\|'dark' }` |

```js
document.addEventListener('ds-change', e => {
  if (e.target.matches('.ds-tabs')) showPanel(e.detail.value);
});
```
Checkbox, radio, input and textarea fire only the native `change` / `input` events.

## JS API (`window.DS`)

| Call | Effect |
|---|---|
| `DS.version` | version string, e.g. `'1.0.0'` |
| `DS.setTheme('light'\|'dark')` | set theme (warns on other values), fires `ds-theme-change` |
| `DS.getTheme()` | `'light'` or `'dark'` |
| `DS.showToast({ type, message, linkText, linkHref, duration })` | build and show a toast; returns the element. `type` `info`(default)/`success`/`warning`/`error`; `duration` ms, default 5000, `0` = stay |
| `DS.showToast(element)` | clone a `.ds-alert-floating` element into a toast that stays until dismissed |
| `DS.openModal('id')` | open a `.ds-modal` (warns if the id is not a modal); returns the element |
| `DS.closeModal()` / `DS.closeModal('id')` | close the top modal / a specific one |
| `DS.setProcessing(btn, on)` | `btn` is an element or id; `on` defaults to `true`. Toggles `ds-btn-processing` and `aria-busy` on a `.ds-btn` |

Data attributes (no JS needed): `data-ds-open="modal-id"`, `data-ds-close`, `data-ds-toast`, `data-ds-theme-toggle`, `data-value` (select item, tab, segmented item), `data-count` / `data-page` (generated pagination), `data-min` / `data-max` (date picker), `data-minutes-step` / `data-ampm` (time picker).

## What the DS does not have
No grid, layout, spacing-utility, heading or paragraph classes, and no card, sidebar, navbar, date-range picker, accordion or progress bar component. For layout use your own `display:flex|grid` with `gap: var(--ds-space-N)`. For text use `font-size: var(--ds-font-size-N)`, `font-weight: var(--ds-font-weight-bold)`, `color: var(--ds-tone-1|2)`. Surfaces: `background: var(--ds-paper)` for panels, `var(--ds-elevated)` for floating layers, `border: 1px solid var(--ds-tone-5)`.

