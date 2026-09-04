// Central navigation. Edit the markup here once; every page that renders
// <site-nav> picks up the change.
//
// Usage:  <site-nav current="about"></site-nav>
// The optional `current` attribute marks the matching link with
// aria-current="page". Valid values: the ids in LINKS below, plus "home".

const LINKS = [
  { id: 'case-studies', href: '/case-studies/', label: 'Case studies' },
  { id: 'architecture', href: '/architecture.html', label: 'Architecture' },
  { id: 'about', href: '/about.html', label: 'About' },
  { id: 'frutiger-aero', href: '/frutiger-aero.html', label: 'Frutiger Aero' },
] as const

type NavId = (typeof LINKS)[number]['id'] | 'home'

class SiteNav extends HTMLElement {
  connectedCallback(): void {
    const current = (this.getAttribute('current') ?? '') as NavId

    const homeCurrent = current === 'home' ? ' aria-current="page"' : ''
    const items = LINKS.map(({ id, href, label }) => {
      const active = id === current ? ' aria-current="page"' : ''
      return `<li><a href="${href}"${active}>${label}</a></li>`
    }).join('')

    this.innerHTML = `
      <header class="site-header">
        <nav class="site-nav" aria-label="Main">
          <a class="site-nav__home" href="/"${homeCurrent}>cedricschippers.dev</a>
          <ul class="site-nav__links">
            ${items}
            <li><a href="https://github.com/cecedabro" rel="me">GitHub</a></li>
          </ul>
        </nav>
      </header>
    `
  }
}

customElements.define('site-nav', SiteNav)
