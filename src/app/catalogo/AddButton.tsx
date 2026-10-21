"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";

export function AddButton({ productId }: { productId: number }) {
  const [added, setAdded] = useState(false);
  return (
    <button
      className="btn-soft"
      onClick={() => {
        addToCart(productId);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
    >
      {added ? "Añadido" : "Añadir"}
    </button>
  );
}
