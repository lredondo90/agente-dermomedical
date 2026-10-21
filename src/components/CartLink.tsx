"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export function CartLink() {
  const count = useCart().reduce((n, i) => n + i.quantity, 0);
  return (
    <Link href="/carrito" className="relative inline-flex items-center gap-1.5" aria-label={`Carrito, ${count} unidades`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M6 7h12l-1 13H7L6 7Z" strokeLinejoin="round" />
        <path d="M9 7V6a3 3 0 0 1 6 0v1" />
      </svg>
      <span className="hidden sm:inline">Carrito</span>
      {count > 0 && (
        <span className="absolute -top-2 left-3 min-w-[18px] rounded-full bg-accent px-1 text-center text-[10px] leading-[18px] font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
