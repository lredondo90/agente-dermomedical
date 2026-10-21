"use client";

import { useRouter } from "next/navigation";
import { replaceCart, type CartItem } from "@/lib/cart";

export function RepeatButton({ items }: { items: CartItem[] }) {
  const router = useRouter();
  return (
    <button
      className="btn-ghost"
      onClick={() => {
        replaceCart(items);
        router.push("/carrito");
      }}
    >
      Repetir este pedido
    </button>
  );
}
