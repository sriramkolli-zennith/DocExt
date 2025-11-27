declare module "jsr:@supabase/supabase-js@2" {
  export type SupabaseClient = any
  export function createClient(...args: any[]): SupabaseClient
}

declare const Deno: {
  env: {
    get: (key: string) => string | undefined
  }
  serve: (handler: (req: Request) => Response | Promise<Response>) => void
}

