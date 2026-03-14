import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("oryx_admin_token");
  return NextResponse.json({ success: true });
}
