'use client';

const links = [
  ['#product', 'Product'],
  ['#workflow', 'How it works'],
  ['#demo', 'Live demo'],
  ['#tech', 'Technology']
];

export default function SiteNavigation() {
  return <>
    <div className="nav-links">
      {links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
    </div>
    <details className="mobile-menu" onKeyDown={event => {
      if (event.key === 'Escape' && event.currentTarget.open) {
        event.currentTarget.open = false;
        event.currentTarget.querySelector('summary')?.focus();
      }
    }}>
      <summary aria-controls="mobile-navigation">Menu</summary>
      <div id="mobile-navigation" className="mobile-nav-links" onClick={event => {
        if (event.target instanceof Element && event.target.closest('a')) {
          event.currentTarget.closest('details')?.removeAttribute('open');
        }
      }}>
        {links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
        <a href="/dashboard">Open workspace</a>
      </div>
    </details>
  </>;
}
