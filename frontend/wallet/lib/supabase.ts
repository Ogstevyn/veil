import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vlnwwekmukgoretgdkcj.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbnd3ZWttdWtnb3JldGdka2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyODg5NDEsImV4cCI6MjA5MDg2NDk0MX0.iJ5lr95PqzhgDpNZp4TqLdBXUcWl-6j0I7CctjkjXg0'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/** Track a newly deployed wallet. Fire-and-forget — never blocks the UI. */
export async function trackWalletCreated(
  contractAddress: string,
  feePayerAddress: string,
) {
  try {
    await supabase.from('wallets').insert({
      contract_address: contractAddress,
      fee_payer_address: feePayerAddress,
    })
  } catch {
    // Silent — analytics must never break the wallet flow
  }
}
