import Link from "next/link";
import { getSession } from "@/lib/session";
import SignOutButton from "@/components/SignOutButton";

export default async function Navbar() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700 bg-ink-950/90 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-display text-base uppercase tracking-tight text-bone">
          Archive<span className="text-accent">·</span>District
        </Link>

        <div className="flex items-center gap-4 text-sm text-ink-300">
          <Link href="/shop" className="hover:text-bone">
            Shop
          </Link>
          <Link href="/sell" className="hover:text-bone">
            Sell to Us
          </Link>

          {session?.user?.role === "ADMIN" && (
            <Link href="/admin" className="hover:text-bone">
              Admin
            </Link>
          )}

          {session?.user ? (
            <>
              <Link href="/account" className="hover:text-bone">
                Account
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-bone">
                Log in
              </Link>
              <Link href="/register" className="btn-primary">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
