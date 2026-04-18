import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { Keypair } from '@stellar/stellar-sdk';
import { runAgent } from './agent.js';
// ── Agent keypair (Ed25519 — for x402 payments only, never signs wallet txs) ──
if (!process.env.AGENT_KEYPAIR_SECRET) {
    console.error('[agent] AGENT_KEYPAIR_SECRET is required');
    process.exit(1);
}
const agentKeypair = Keypair.fromSecret(process.env.AGENT_KEYPAIR_SECRET);
console.log(`[agent] Agent keypair: ${agentKeypair.publicKey()}`);
// ── Shared Anthropic client ──────────────────────────────────────────────────
const anthropicClient = new Anthropic();
// ── Per-wallet conversation history ──────────────────────────────────────────
const conversations = new Map();
// ── HTTP server ───────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGIN ?? '*' }));
app.use(express.json());
app.get('/health', (_req, res) => {
    res.json({ ok: true, agentAddress: agentKeypair.publicKey() });
});
const httpServer = createServer(app);
// ── WebSocket server ──────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server: httpServer });
wss.on('connection', (ws) => {
    console.log('[agent] Client connected');
    ws.on('message', async (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw.toString());
        }
        catch {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
            return;
        }
        if (msg.type === 'chat') {
            const walletAddress = msg.walletAddress;
            const feePayerAddress = msg.feePayerAddress;
            const userMessage = msg.message;
            const profile = msg.profile;
            if (!walletAddress || !userMessage) {
                ws.send(JSON.stringify({ type: 'error', message: 'walletAddress and message required' }));
                return;
            }
            // Signal "thinking" immediately
            ws.send(JSON.stringify({ type: 'thinking' }));
            try {
                const history = conversations.get(walletAddress) ?? [];
                const { response, pendingTxXdr, pendingTxSummary } = await runAgent(userMessage, walletAddress, agentKeypair, history, feePayerAddress, profile, anthropicClient);
                // Update conversation history (keep last 20 turns)
                history.push({ role: 'user', content: userMessage });
                history.push({ role: 'assistant', content: response });
                conversations.set(walletAddress, history.slice(-20));
                ws.send(JSON.stringify({
                    type: 'response',
                    message: response,
                    ...(pendingTxXdr ? { pendingTxXdr, pendingTxSummary } : {}),
                }));
            }
            catch (err) {
                console.error('[agent] runAgent error:', err.message);
                ws.send(JSON.stringify({ type: 'error', message: err.message }));
            }
        }
        if (msg.type === 'clear_history') {
            const walletAddress = msg.walletAddress;
            if (walletAddress)
                conversations.delete(walletAddress);
            ws.send(JSON.stringify({ type: 'history_cleared' }));
        }
    });
    ws.on('close', () => console.log('[agent] Client disconnected'));
});
// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.AGENT_PORT ?? '3001', 10);
httpServer.listen(PORT, () => {
    console.log(`[agent] HTTP  → http://localhost:${PORT}/health`);
    console.log(`[agent] WS   → ws://localhost:${PORT}`);
});
