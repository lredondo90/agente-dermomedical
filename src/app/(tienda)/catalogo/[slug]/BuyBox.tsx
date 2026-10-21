"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addToCart } from "@/lib/cart";

export function BuyBox({ productId }: { productId: number }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">Cantidad</span>
        <div className="flex h-11 items-center rounded-full border border-card-border bg-surface">
          <button className="h-full w-11 rounded-full text-lg transition-colors hover:bg-soft" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Menos">−</button>
          <span className="w-8 text-center text-sm font-medium tabular-nums">{quantity}</span>
          <button className="h-full w-11 rounded-full text-lg transition-colors hover:bg-soft" onClick={() => setQuantity((q) => Math.min(999, q + 1))} aria-label="Más">+</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          className="btn-ghost h-12 flex-1 px-6 text-[15px]"
          onClick={() => {
            addToCart(productId, quantity);
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
          }}
        >
          {added ? "Añadido ✓" : "Añadir al carrito"}
        </button>
        <button
          className="btn h-12 flex-1 px-6 text-[15px]"
          onClick={() => {
            addToCart(productId, quantity);
            router.push("/carrito");
          }}
        >
          Comprar ahora
        </button>
      </div>
    </div>
  );
}
