import { Connection, Keypair, PublicKey } from '@solana/web3.js';
/**
 * SSS-2 Base: Initialize Stablecoin
 */
export declare function initializeStablecoin(connection: Connection, payer: Keypair, authority: PublicKey, mint: PublicKey, freezeAuthority: PublicKey, name: string, symbol: string, uri: string, decimals: number): Promise<PublicKey>;
/**
 * SSS-1 Minimal: Mint Tokens
 */
export declare function mint(connection: Connection, payer: Keypair, mint: PublicKey, to: PublicKey, amount: number | bigint, mintAuthority?: PublicKey, freezeAuthority?: PublicKey): Promise<void>;
/**
 * SSS-1 Minimal: Freeze/Thaw Account
 */
export declare function freezeAccount(connection: Connection, owner: Keypair | PublicKey, freezeAuthority: Keypair | PublicKey, mint: PublicKey, account: PublicKey): Promise<void>;
export declare function thawAccount(connection: Connection, owner: Keypair | PublicKey, freezeAuthority: Keypair | PublicKey, mint: PublicKey, account: PublicKey): Promise<void>;
/**
 * SSS-2 Compliance: Blacklist Management (Off-chain)
 * - Uses SQLite for off-chain state
 * - Blacklist entries are stored locally
 */
export declare function addToBlacklist(connection: Connection, payer: Keypair, authority: Keypair, mint: PublicKey, target: PublicKey): Promise<void>;
export declare function removeFromBlacklist(connection: Connection, payer: Keypair, authority: Keypair, target: PublicKey): Promise<void>;
/**
 * SSS-2 Compliance: Seize Funds (via Permanent Delegate)
 * - Requires Permanent Delegate PDA on Mint
 * - Transfers entire balance to treasury
 */
export declare function seize(connection: Connection, authority: Keypair, mint: PublicKey, fromAccount: PublicKey, toAccount: PublicKey): Promise<void>;
/**
 * Helper: Get Token Balance
 */
export declare function getTokenBalance(connection: Connection, mint: PublicKey, owner: PublicKey): Promise<bigint>;
