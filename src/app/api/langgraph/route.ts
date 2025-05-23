// app/api/langgraph/route.ts
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const res = await fetch(process.env.NEXT_PUBLIC_API_URL!);
  const data = await res.text();
  return new Response(data, { status: 200 });
}