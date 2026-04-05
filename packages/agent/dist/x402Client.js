/**
 * Creates an x402-aware fetch wrapper for the agent.
 * Attempts plain fetch first. If a 402 is returned, handles the payment
 * challenge using x402HTTPClient and retries with the payment header.
 */
export function createX402Fetch(_agentKeypair, _options = {}) {
    async function fetchWithPayment(url, init) {
        const response = await fetch(url, init);
        // No payment required — return directly
        if (response.status !== 402) {
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Request failed ${response.status}: ${text}`);
            }
            return response.json();
        }
        // 402 received — attempt x402 payment
        try {
            // @ts-ignore — @x402 packages ship ESM-only types
            const { createEd25519Signer } = await import('@x402/stellar');
            // @ts-ignore
            const { ExactStellarScheme } = await import('@x402/stellar/exact/client');
            // @ts-ignore
            const { x402Client: CoreX402Client, x402HTTPClient } = await import('@x402/core/client');
            const network = process.env.STELLAR_NETWORK === 'mainnet'
                ? 'stellar:pubnet'
                : 'stellar:testnet';
            const signer = createEd25519Signer(_agentKeypair.secret(), network);
            const scheme = new ExactStellarScheme(signer);
            const coreClient = new CoreX402Client().register(network, scheme);
            const httpClient = new x402HTTPClient(coreClient);
            // Parse 402 body (v1 puts requirements in body, v2 in headers)
            let body;
            try {
                body = await response.clone().json();
            }
            catch {
                body = undefined;
            }
            const paymentRequired = httpClient.getPaymentRequiredResponse((name) => response.headers.get(name), body);
            const paymentPayload = await httpClient.createPaymentPayload(paymentRequired);
            const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);
            const retryResponse = await fetch(url, {
                ...init,
                headers: {
                    ...(init?.headers ?? {}),
                    ...paymentHeaders,
                },
            });
            if (!retryResponse.ok) {
                const text = await retryResponse.text();
                throw new Error(`x402 request failed ${retryResponse.status}: ${text}`);
            }
            return retryResponse.json();
        }
        catch (err) {
            throw new Error(`Payment required and x402 failed: ${err.message}`);
        }
    }
    return { fetchWithPayment };
}
