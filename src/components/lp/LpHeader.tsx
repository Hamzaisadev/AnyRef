import Link from 'next/link';
import { nav, site } from '@/data/landing';
import { MobileMenu } from './MobileMenu';

/** The duplicate label is decorative (the roll's second face), so it is aria-hidden. */
function Roll({ label }: { label: string }) {
  return (
    <span className="lp-roll__clip">
      <span>{label}</span>
      <span aria-hidden="true">{label}</span>
    </span>
  );
}

export function LpHeader() {
  return (
    <header className="lp-header">
      <Link href="/" className="lp-wordmark" aria-label={`${site.name} home`}>
        {site.name}
      </Link>
      <div className="lp-nav">
        <nav className="lp-nav-links" aria-label="Sections">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="lp-roll">
              <Roll label={item.label} />
            </a>
          ))}
        </nav>
        <Link href="/login" className="lp-roll lp-signin">
          <Roll label="Sign in" />
        </Link>
        <MobileMenu />
      </div>
    </header>
  );
}
