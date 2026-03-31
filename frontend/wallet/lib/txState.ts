// Module-level flag so the inactivity lock doesn't fire mid-transaction.
// Not stored in sessionStorage (which gets cleared on lock) — lives in memory.
let _active = false
export const beginTx  = () => { _active = true }
export const endTx    = () => { _active = false }
export const txActive = () => _active
