/* data.js - fake data for the prototype, as plain JS objects.
   Loaded before app.js, which reads it from window.APP_DATA.
   Replace with your own data; keep it plain objects and arrays. */

window.APP_DATA = {
  product: {
    name: 'My Product'
  },

  // Sidebar items. `icon` must be a 24px icon name from ds/DS-GUIDE.md.
  // For a multi-page prototype, point `href` at the other HTML files.
  nav: [
    { label: 'Home',      icon: 'home',      href: 'index.html', current: true },
    { label: 'Videos',    icon: 'video',     href: '#' },
    { label: 'Library',   icon: 'folder',    href: '#' },
    { label: 'Analytics', icon: 'analytics', href: '#' },
    { label: 'Settings',  icon: 'settings',  href: '#' }
  ],

  project: {
    name: 'Product launch video',
    visibilityOptions: [
      { value: 'private', label: 'Private' },
      { value: 'team',    label: 'My team' },
      { value: 'public',  label: 'Public', selected: true }
    ]
  }
};
