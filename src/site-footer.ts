// Central footer. Edit the markup here once; every page that renders
// <site-footer> picks up the change.
//
// Usage:  <site-footer></site-footer>
//         <site-footer colophon="AI-assisted HTML, CSS and TypeScript. Built with Vite, served by nginx on k3s."></site-footer>
// The optional `colophon` attribute overrides the last line.

const DEFAULT_COLOPHON =
  'AI-assisted HTML, CSS and TypeScript. Built with Vite, served by nginx on k3s.'

class SiteFooter extends HTMLElement {
  connectedCallback(): void {
    const colophon = this.getAttribute('colophon') ?? DEFAULT_COLOPHON

    this.innerHTML = `
      <footer class="site-footer">
        <p>
          <a href="https://github.com/cecedabro" rel="me">GitHub</a>
          <span aria-hidden="true">·</span>
          <a href="https://www.linkedin.com/in/c%C3%A9dric-schippers-53b745385" rel="me">LinkedIn</a>
          <span aria-hidden="true">·</span>
          <a href="mailto:cedricschippers@proton.me">Email</a>
        </p>
        <p class="site-footer__colophon">${colophon}</p>
      </footer>
    `
  }
}

customElements.define('site-footer', SiteFooter)
