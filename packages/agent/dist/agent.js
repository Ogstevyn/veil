import Anthropic from '@anthropic-ai/sdk';
import { Keypair } from '@stellar/stellar-sdk';
import { createX402Fetch } from './x402Client.js';
import { buildSwap, buildPayment, getBalances } from './txBuilder.js';
function resolveConfig(config) {
    return {
        anthropicApiKey: config.anthropicApiKey,
        agentKeypair: Keypair.fromSecret(config.agentKeypairSecret),
        oracleUrl: config.oracleUrl,
        wraithUrl: config.wraithUrl,
        horizonUrl: config.horizonUrl ?? 'https://horizon-testnet.stellar.org',
        sorobanRpcUrl: config.sorobanRpcUrl ?? 'https://soroban-testnet.stellar.org',
        network: config.network ?? 'testnet',
        model: config.model ?? 'claude-sonnet-4-6',
        maxHistoryTurns: config.maxHistoryTurns ?? 20,
    };
}
// ── Tools ────────────────────────────────────────────────────────────────────
const tools = [
    {
        name: 'get_price',
        description: 'Get the current best price and swap route for an asset pair on Stellar. ' +
            'Returns VWAP, SDEX price, AMM price, 24h volume, and best execution route. ' +
            'Costs a small USDC fee via x402 micropayment (auto-paid).',
        input_schema: {
            type: 'object',
            properties: {
                asset_a: { type: 'string', description: 'First asset: "XLM" or "CODE:ISSUER"' },
                asset_b: { type: 'string', description: 'Second asset: "XLM" or "CODE:ISSUER"' },
            },
            required: ['asset_a', 'asset_b'],
        },
    },
    {
        name: 'get_transfer_history',
        description: 'Get recent transfer history for a wallet — includes both classic Stellar payments (XLM sends/receives) ' +
            'and Soroban token transfers. Returns classicPayments from Horizon and sorobanTransfers from Wraith.',
        input_schema: {
            type: 'object',
            properties: {
                address: { type: 'string', description: 'Stellar wallet address (G...)' },
                direction: { type: 'string', enum: ['incoming', 'outgoing', 'both'] },
                limit: { type: 'number', description: 'Max results (default 10)' },
            },
            required: ['address', 'direction'],
        },
    },
    {
        name: 'get_wallet_balance',
        description: 'Get current XLM and token balances for a wallet address. Free.',
        input_schema: {
            type: 'object',
            properties: {
                address: { type: 'string', description: 'Stellar wallet address (G...)' },
            },
            required: ['address'],
        },
    },
    {
        name: 'build_swap',
        description: 'Build a Stellar path payment transaction to swap one asset for another at the best available rate. ' +
            'ALWAYS call get_price first, and ALWAYS call request_user_approval after building — never execute without approval.',
        input_schema: {
            type: 'object',
            properties: {
                from_asset: { type: 'string', description: '"XLM" or "CODE:ISSUER"' },
                to_asset: { type: 'string', description: '"XLM" or "CODE:ISSUER"' },
                amount: { type: 'number', description: 'Amount of from_asset to swap' },
                min_received: {
                    type: 'number',
                    description: 'Minimum to_asset to accept for slippage protection. Default: amount * estimated_price * 0.995',
                },
                wallet_address: { type: 'string' },
            },
            required: ['from_asset', 'to_asset', 'amount', 'wallet_address'],
        },
    },
    {
        name: 'build_payment',
        description: 'Build a Stellar payment transaction to send XLM or tokens. ' +
            'ALWAYS call request_user_approval after building.',
        input_schema: {
            type: 'object',
            properties: {
                to_address: { type: 'string', description: 'Recipient Stellar address (G...)' },
                asset: { type: 'string', description: '"XLM" or "CODE:ISSUER"' },
                amount: { type: 'number' },
                wallet_address: { type: 'string' },
                memo: { type: 'string', description: 'Optional text memo' },
            },
            required: ['to_address', 'asset', 'amount', 'wallet_address'],
        },
    },
    {
        name: 'request_user_approval',
        description: 'ALWAYS call this before any transaction executes. ' +
            'Sends the transaction to the wallet UI for passkey (biometric) approval. ' +
            'The user must approve with Face ID / fingerprint before the tx is submitted.',
        input_schema: {
            type: 'object',
            properties: {
                transaction_xdr: { type: 'string', description: 'Unsigned transaction XDR (base64)' },
                summary: {
                    type: 'string',
                    description: 'Plain English: what this transaction does, amounts, assets, recipient',
                },
                estimated_fee_xlm: { type: 'number', description: 'Estimated network fee in XLM' },
            },
            required: ['transaction_xdr', 'summary'],
        },
    },
];
const ROLE_CONTEXT = {
    trader: `The user is a TRADER. They actively swap and trade assets.
- Proactively suggest trade opportunities when they check prices.
- When they receive funds, ask if they'd like to swap or trade.
- Mention spread, slippage, and execution routes when relevant.
- Be quick and action-oriented — traders want speed.`,
    investor: `The user is an INVESTOR. They hold long-term and look for yield.
- When they receive funds, suggest yield opportunities or portfolio diversification.
- Emphasize value, market context, and long-term thinking.
- Mention price trends and whether timing seems favorable.
- Be analytical and informative.`,
    saver: `The user is a SAVER. They primarily save and send money.
- Focus on balance updates, transfers, and payment confirmations.
- When they receive funds, confirm the amount and updated balance.
- Keep things simple — avoid jargon about trading or DeFi unless asked.
- Be clear and reassuring.`,
    explorer: `The user is an EXPLORER — new to crypto/Stellar.
- Explain concepts briefly when relevant (what's a swap, what's XLM, etc.).
- Be encouraging and educational without being condescending.
- Suggest simple actions they can try to learn the ropes.
- When they receive funds, explain what they can do with them.`,
};
const SYSTEM_PROMPT = (walletAddress, feePayerAddress, profile) => {
    const nameClause = profile?.name ? `The user's name is ${profile.name}. Address them by name occasionally.` : '';
    const langClause = profile?.language && profile.language !== 'English'
        ? `IMPORTANT: The user prefers ${profile.language}. Respond in ${profile.language} unless they write in a different language.`
        : '';
    const personaClause = profile?.persona
        ? `Personality note: The user wants you to be ${profile.persona}. Adjust your tone accordingly.`
        : '';
    const roleClause = profile?.role && ROLE_CONTEXT[profile.role]
        ? `\n${ROLE_CONTEXT[profile.role]}`
        : '';
    return `\
You are a helpful AI agent embedded in the Veil passkey smart wallet on Stellar.

The user's wallet contract address is: ${walletAddress}
The user's fee-payer address (use this as wallet_address in ALL build_swap and build_payment calls): ${feePayerAddress}
${nameClause}
${langClause}
${personaClause}
${roleClause}

You help users:
- Check their balance and recent transfers
- Get live prices and swap routes (SDEX vs AMM)
- Execute swaps and payments — always with biometric approval

RULES:
1. Before recommending any swap, call get_price to get the live rate.
2. Before executing any transaction, ALWAYS call request_user_approval — never skip this.
3. For swaps, set min_received = estimated_output * 0.995 (0.5% slippage) unless user specifies otherwise.
4. Inform the user when a small x402 micropayment is being auto-paid to fetch data.
5. Format amounts clearly: "500 XLM", "47.3 USDC".
6. If you need a recipient address and the user hasn't provided one, ask before building.
7. Keep responses concise. Use bullet points for multi-step flows.
8. Always use the fee-payer address (not the contract address) as wallet_address when calling build_swap or build_payment.`;
};
/**
 * Run a single agent turn. Used internally by both the server and createVeilAgent.
 */
export async function runAgent(userMessage, walletAddress, agentKeypair, conversationHistory, feePayerAddress, profile, 
/** Pass an Anthropic client instance for reuse. */
client, 
/** Service URLs — if not provided, falls back to process.env. */
urls, 
/** Model override. */
model) {
    const { fetchWithPayment } = createX402Fetch(agentKeypair);
    let pendingTxXdr;
    let pendingTxSummary;
    const oracleUrl = urls?.oracleUrl ?? process.env.ORACLE_URL ?? '';
    const wraithUrl = urls?.wraithUrl ?? process.env.WRAITH_URL ?? '';
    const horizonUrl = urls?.horizonUrl ?? process.env.HORIZON_URL ?? 'https://horizon-testnet.stellar.org';
    const claudeModel = model ?? process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';
    async function executeTool(name, input) {
        switch (name) {
            case 'get_price': {
                const url = `${oracleUrl}/price/${input.asset_a}/${input.asset_b}`;
                const data = await fetchWithPayment(url);
                return JSON.stringify(data);
            }
            case 'get_transfer_history': {
                const limit = input.limit ?? 10;
                const horizonAddr = feePayerAddress ?? input.address;
                const [wraithResult, horizonResult] = await Promise.allSettled([
                    fetchWithPayment(`${wraithUrl}/transfers/address/${input.address}?direction=${input.direction}&limit=${limit}`),
                    fetch(`${horizonUrl}/accounts/${horizonAddr}/payments?limit=${limit}&order=desc`)
                        .then(r => r.json()),
                ]);
                const sorobanTransfers = wraithResult.status === 'fulfilled' ? wraithResult.value : [];
                const classicPayments = horizonResult.status === 'fulfilled'
                    ? horizonResult.value?._embedded?.records ?? []
                    : [];
                return JSON.stringify({ sorobanTransfers, classicPayments });
            }
            case 'get_wallet_balance': {
                const fpAddress = feePayerAddress ?? input.address;
                const contractAddr = walletAddress?.startsWith('C') ? walletAddress : undefined;
                const balances = await getBalances(fpAddress, contractAddr);
                return JSON.stringify(balances);
            }
            case 'build_swap': {
                const swapInput = {
                    ...input,
                    wallet_address: feePayerAddress ?? input.wallet_address,
                };
                const xdr = await buildSwap(swapInput);
                return JSON.stringify({ transaction_xdr: xdr, status: 'built' });
            }
            case 'build_payment': {
                const payInput = {
                    ...input,
                    wallet_address: feePayerAddress ?? input.wallet_address,
                };
                const xdr = await buildPayment(payInput);
                return JSON.stringify({ transaction_xdr: xdr, status: 'built' });
            }
            case 'request_user_approval': {
                pendingTxXdr = input.transaction_xdr;
                pendingTxSummary = input.summary;
                return JSON.stringify({ status: 'awaiting_approval' });
            }
            default:
                return JSON.stringify({ error: `Unknown tool: ${name}` });
        }
    }
    const messages = [
        ...conversationHistory,
        { role: 'user', content: userMessage },
    ];
    let response = await client.messages.create({
        model: claudeModel,
        max_tokens: 1024,
        system: SYSTEM_PROMPT(walletAddress, feePayerAddress ?? walletAddress, profile),
        tools,
        messages,
    });
    // Agentic loop — keep going until no more tool calls
    while (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');
        const toolResults = [];
        for (const toolUse of toolUseBlocks) {
            let content;
            try {
                content = await executeTool(toolUse.name, toolUse.input);
            }
            catch (err) {
                content = JSON.stringify({ error: err.message });
            }
            toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content });
        }
        messages.push({ role: 'assistant', content: response.content });
        messages.push({ role: 'user', content: toolResults });
        response = await client.messages.create({
            model: claudeModel,
            max_tokens: 1024,
            system: SYSTEM_PROMPT(walletAddress, feePayerAddress ?? walletAddress, profile),
            tools,
            messages,
        });
    }
    const text = response.content
        .filter((b) => b.type === 'text')
        .map(b => b.text)
        .join('');
    return { response: text, pendingTxXdr, pendingTxSummary };
}
/**
 * Create a reusable Veil agent instance.
 *
 * @example
 * ```typescript
 * import { createVeilAgent } from '@veil/agent'
 *
 * const agent = createVeilAgent({
 *   anthropicApiKey: 'sk-ant-...',
 *   agentKeypairSecret: 'S...',
 *   oracleUrl: 'https://oracle.example.com',
 *   wraithUrl: 'https://wraith.example.com',
 * })
 *
 * const result = await agent.chat('What is my balance?', {
 *   walletAddress: 'C...',
 *   feePayerAddress: 'G...',
 *   profile: { name: 'Alice', role: 'trader' },
 * })
 *
 * console.log(result.response)
 * if (result.pendingTxXdr) {
 *   // Present to user for passkey approval, then sign + submit
 * }
 * ```
 */
export function createVeilAgent(config) {
    const resolved = resolveConfig(config);
    const client = new Anthropic({
        apiKey: resolved.anthropicApiKey,
    });
    const conversations = new Map();
    return {
        publicKey: resolved.agentKeypair.publicKey(),
        async chat(message, options) {
            const { walletAddress, feePayerAddress, profile } = options;
            const history = conversations.get(walletAddress) ?? [];
            const result = await runAgent(message, walletAddress, resolved.agentKeypair, history, feePayerAddress, profile, client, {
                oracleUrl: resolved.oracleUrl,
                wraithUrl: resolved.wraithUrl,
                horizonUrl: resolved.horizonUrl,
            }, resolved.model);
            // Update conversation history
            history.push({ role: 'user', content: message });
            history.push({ role: 'assistant', content: result.response });
            conversations.set(walletAddress, history.slice(-resolved.maxHistoryTurns));
            return result;
        },
        clearHistory(walletAddress) {
            conversations.delete(walletAddress);
        },
    };
}
