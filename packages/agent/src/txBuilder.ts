import {
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
} from '@stellar/stellar-sdk'

const horizonUrl = process.env.HORIZON_URL ?? 'https://horizon-testnet.stellar.org'
const networkPassphrase = process.env.STELLAR_NETWORK === 'mainnet'
  ? Networks.PUBLIC
  : Networks.TESTNET

const horizon = new Horizon.Server(horizonUrl)

function parseAsset(assetStr: string): Asset {
  if (assetStr === 'XLM' || assetStr === 'native') return Asset.native()
  const [code, issuer] = assetStr.split(':')
  if (!issuer) throw new Error(`Asset "${assetStr}" must be "CODE:ISSUER" or "XLM"`)
  return new Asset(code, issuer)
}

export interface SwapInput {
  from_asset: string
  to_asset: string
  amount: number
  min_received?: number
  wallet_address: string
}

export interface PaymentInput {
  to_address: string
  asset: string
  amount: number
  wallet_address: string
  memo?: string
}

/**
 * Builds a path payment transaction (swap via SDEX best path).
 * Returns unsigned XDR — user must sign with passkey before submission.
 */
export async function buildSwap(input: SwapInput): Promise<string> {
  const account = await horizon.loadAccount(input.wallet_address)
  const sendAsset = parseAsset(input.from_asset)
  const destAsset = parseAsset(input.to_asset)
  const sendAmount = input.amount.toFixed(7)
  const destMin = (input.min_received ?? input.amount * 0.995).toFixed(7)

  const txBuilder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })

  // Auto-add trustline if the fee-payer account doesn't yet hold the destination asset
  const hasTrustline = destAsset.isNative() ||
    account.balances.some((b: any) =>
      b.asset_code === destAsset.getCode() && b.asset_issuer === destAsset.getIssuer(),
    )

  if (!hasTrustline) {
    txBuilder.addOperation(Operation.changeTrust({ asset: destAsset }))
  }

  txBuilder
    .addOperation(Operation.pathPaymentStrictSend({
      sendAsset,
      sendAmount,
      destination: input.wallet_address,
      destAsset,
      destMin,
      path: [],
    }))
    .setTimeout(180)

  return txBuilder.build().toXDR()
}

/**
 * Builds a simple payment transaction.
 * Returns unsigned XDR — user must sign with passkey before submission.
 */
export async function buildPayment(input: PaymentInput): Promise<string> {
  const account = await horizon.loadAccount(input.wallet_address)
  const asset = parseAsset(input.asset)
  const amount = input.amount.toFixed(7)

  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  }).addOperation(Operation.payment({
    destination: input.to_address,
    asset,
    amount,
  }))

  if (input.memo) {
    builder.addMemo({ type: 'text', value: input.memo } as any)
  }

  const tx = builder.setTimeout(180).build()
  return tx.toXDR()
}

/**
 * Fetch XLM + token balances for a wallet address.
 */
export async function getBalances(address: string): Promise<Record<string, string>> {
  const account = await horizon.loadAccount(address)
  const result: Record<string, string> = {}
  for (const balance of account.balances) {
    const key = balance.asset_type === 'native'
      ? 'XLM'
      : `${(balance as any).asset_code}:${(balance as any).asset_issuer}`
    result[key] = balance.balance
  }
  return result
}
