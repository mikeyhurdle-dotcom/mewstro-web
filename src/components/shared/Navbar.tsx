"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Brand } from "@/config/brands";

interface NavLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

function getNavConfig(brand: Brand): {
  links: NavLink[];
  cta: { label: string; href: string; isExternal: boolean };
} {
  const base = `/${brand.id}`;
  if (brand.id === "mewstro") {
    return {
      links: [
        { label: "For teachers", href: base },
        { label: "Studio toolkit", href: `${base}/teachers/assets` },
        { label: "Solo learners", href: `${base}/app` },
        { label: "Story", href: `${base}/story` },
        { label: "Roadmap", href: `${base}/roadmap` },
        { label: "Pricing", href: `${base}/pricing` },
        { label: "Support", href: brand.links.support },
      ],
      cta: {
        label: "Start free trial",
        href: `${base}/pricing`,
        isExternal: false,
      },
    };
  }
  return {
    links: [
      { label: "Features", href: `${base}#features` },
      { label: "Pricing", href: `${base}#pricing` },
      { label: "Guides", href: `${base}/guides` },
      { label: "Support", href: brand.links.support },
    ],
    cta: {
      label: "Download",
      href: brand.links.appStore,
      isExternal: true,
    },
  };
}

export function Navbar({ brand }: { brand: Brand }) {
  const [open, setOpen] = useState(false);
  const base = `/${brand.id}`;
  const { links, cta } = getNavConfig(brand);

  const CtaComponent = cta.isExternal ? "a" : Link;
  const ctaProps = cta.isExternal
    ? { href: cta.href }
    : { href: cta.href };

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-md border-b"
      style={{
        backgroundColor: `${brand.colors.background}ee`,
        borderColor: `${brand.colors.textDim}22`,
      }}
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
        <Link href={base} className="flex items-center gap-3">
          <Image
            src={brand.logo}
            alt={brand.name}
            width={40}
            height={40}
            className="rounded-xl"
          />
          <span
            className="text-xl font-bold"
            style={{ color: brand.colors.text }}
          >
            {brand.name}
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: brand.colors.textDim }}
            >
              {l.label}
            </Link>
          ))}
          <CtaComponent
            {...ctaProps}
            className="rounded-full px-5 py-2 text-sm font-semibold transition-transform hover:scale-105"
            style={{
              backgroundColor: brand.colors.primary,
              color: brand.colors.primaryForeground,
            }}
          >
            {cta.label}
          </CtaComponent>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={brand.colors.text}
            strokeWidth="2"
          >
            {open ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden px-6 pb-4 space-y-3"
          style={{ backgroundColor: brand.colors.background }}
        >
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-sm font-medium"
              style={{ color: brand.colors.textDim }}
            >
              {l.label}
            </Link>
          ))}
          <CtaComponent
            {...ctaProps}
            onClick={() => setOpen(false)}
            className="block w-full text-center rounded-full px-5 py-2 text-sm font-semibold"
            style={{
              backgroundColor: brand.colors.primary,
              color: brand.colors.primaryForeground,
            }}
          >
            {cta.label}
          </CtaComponent>
        </div>
      )}
    </nav>
  );
}
