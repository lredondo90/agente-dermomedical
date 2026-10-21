import { NextResponse } from "next/server";
import { setSession } from "@/lib/session";
import { consumeLoginToken } from "@/lib/store";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const customerId = await consumeLoginToken((await params).token);
  if (!customerId) return NextResponse.redirect(new URL("/entrar?caducado=1", request.url));
  await setSession({ kind: "customer", customerId });
  return NextResponse.redirect(new URL("/pedidos", request.url));
}
