export const dynamic = "force-dynamic"

export async function GET() {
  return Response.json({
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing",
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing",
  })
}
