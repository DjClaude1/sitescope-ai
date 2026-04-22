import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/60">
        <div>© {new Date().getFullYear()} SiteScope AI. All rights reserved.</div>
        <div className="flex items-center gap-5">
          <Link href="/pricing" className="hover:text-white">
            Pricing
          </Link>
          <Link href="/#faq" className="hover:text-white">
            FAQ
          </Link>
          <a
            href="https://github.com/DjClaude1/sitescope-ai"
            className="hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
