"use client";

import { useSyncExternalStore } from "react";

export type CartItem = { productId: number; quantity: number };

const KEY = "carrito";
const EVENT = "carrito-cambiado";
const EMPTY: CartItem[] = [];
let cached: { raw: string | null; items: CartItem[] } = { raw: null, items: EMPTY };

function read(): CartItem[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cached.raw) return cached.items;
  let items: CartItem[] = EMPTY;
  try {
    items = raw ? (JSON.parse(raw) as CartItem[]) : EMPTY;
  } catch {}
  cached = { raw, items };
  return items;
}

function write(items: CartItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.filter((i) => i.quantity > 0)));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function addToCart(productId: number, quantity = 1) {
  const items = [...read()];
  const found = items.find((i) => i.productId === productId);
  if (found) found.quantity += quantity;
  else items.push({ productId, quantity });
  write(items.map((i) => ({ ...i })));
}

export function setQuantity(productId: number, quantity: number) {
  write(read().map((i) => (i.productId === productId ? { ...i, quantity } : i)));
}

export function replaceCart(items: CartItem[]) {
  write(items);
}

export function useCart(): CartItem[] {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENT, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(EVENT, cb);
        window.removeEventListener("storage", cb);
      };
    },
    read,
    () => EMPTY,
  );
}
