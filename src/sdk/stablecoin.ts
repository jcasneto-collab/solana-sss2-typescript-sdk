// Solana Stablecoin Standard - TypeScript SDK
// Layer 1: Base SDK + Layer 2: Compliance Module + Layer 3: SSS-2 Preset

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';

// ID do programa (gerado automaticamente pelo Anchor)
const STABLECOIN_PROGRAM_ID = new PublicKey('STABLE111111111111111111111111111111111');

// ============================================================================
// Interfaces
// ============================================================================

export interface StablecoinConfig {
  name: string;
  symbol: string;
  uri: string;
  decimals: number;
  enable_permanent_delegate: boolean;
  enable_transfer_hook: boolean;
  default_account_frozen: boolean;
  mint_authority: PublicKey;
  freeze_authority: PublicKey;
}

export interface BlacklistEntry {
  address: PublicKey;
  is_blacklisted: boolean;
  timestamp: number;
}

export interface MintToParams {
  to: PublicKey;
  amount: number;
}

export interface FreezeAccountParams {
  account: PublicKey;
}

export interface ModifyBlacklistParams {
  address: PublicKey;
}

export interface SeizeTokensParams {
  from: PublicKey;
  treasury: PublicKey;
  amount: number;
}

export interface UpdateAuthorityParams {
  newAuthority: PublicKey;
}

export interface InitializeWithTransferHookParams {
  name: string;
  symbol: string;
  uri: string;
  decimals: number;
  transferHookProgram?: PublicKey; // NOVO: Transfer hook program (opcional)
}

// ============================================================================
// StablecoinSDK Class
// ============================================================================

export class StablecoinSDK {
  public program: Program;
  public programId: PublicKey;

  constructor(
    provider: AnchorProvider,
    idl: any,
    programId: PublicKey = STABLECOIN_PROGRAM_ID
  ) {
    this.programId = programId;
    this.program = new Program(idl, programId, provider);
  }

  /**
   * Initialize SSS-2 Compliant Stablecoin
   * Creates mint, sets up authorities, and configures compliance features
   */
  async initialize(config: StablecoinConfig): Promise<string> {
    const mint = Keypair.generate();
    const [stablecoinConfig] = await PublicKey.findProgramAddress(
      [Buffer.from('stablecoin'), mint.publicKey.toBuffer()],
      this.programId
    );

    const [mintAuthority] = await PublicKey.findProgramAddress(
      [Buffer.from('authority'), Buffer.from('mint'), mint.publicKey.toBuffer()],
      this.programId
    );

    const [freezeAuthority] = await PublicKey.findProgramAddress(
      [Buffer.from('authority'), Buffer.from('freeze'), mint.publicKey.toBuffer()],
      this.programId
    );

    const tx = await this.program.methods
      .initialize(
        config.name,
        config.symbol,
        config.uri,
        config.decimals,
        config.enable_permanent_delegate,
        config.default_account_frozen
      )
      .accounts({
        stablecoinConfig,
        mint: mint.publicKey,
        mintAuthority: config.mint_authority,
        freezeAuthority: config.freeze_authority,
        authority: this.program.provider.wallet.publicKey,
        payer: this.program.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .signers([mint])
      .rpc();

    console.log('Stablecoin initialized:', tx);
    return tx;
  }

  /**
   * Initialize stablecoin WITH transfer hook (NOVO)
   * Allows specifying a separate transfer hook program for blacklist enforcement
   */
  async initializeWithTransferHook(
    config: StablecoinConfig & {
      transferHookProgram?: PublicKey
    }
  ): Promise<string> {
    const mint = Keypair.generate();
    const [stablecoinConfig] = await PublicKey.findProgramAddress(
      [Buffer.from('stablecoin'), mint.publicKey.toBuffer()],
      this.programId
    );

    const [mintAuthority] = await PublicKey.findProgramAddress(
      [Buffer.from('authority'), Buffer.from('mint'), mint.publicKey.toBuffer()],
      this.programId
    );

    const [freezeAuthority] = await PublicKey.findProgramAddress(
      [Buffer.from('authority'), Buffer.from('freeze'), mint.publicKey.toBuffer()],
      this.programId
    );

    const tx = await this.program.methods
      .initialize(
        config.name,
        config.symbol,
        config.uri,
        config.decimals,
        config.enable_permanent_delegate,
        config.default_account_frozen,
        config.transferHookProgram || null // NOVO: Hook program opcional
      )
      .accounts({
        stablecoinConfig,
        mint: mint.publicKey,
        mintAuthority: config.mint_authority,
        freezeAuthority: config.freeze_authority,
        authority: this.program.provider.wallet.publicKey,
        payer: this.program.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .signers([mint])
      .rpc();

    console.log('Stablecoin initialized with hook:', config.transferHookProgram);
    return tx;
  }

  /**
   * Mint new tokens to a recipient account
   * Only callable by mint authority
   */
  async mintTo(params: MintToParams): Promise<string> {
    const [mintAuthority] = await PublicKey.findProgramAddress(
      [Buffer.from('authority'), Buffer.from('mint'), params.to.toBuffer()],
      this.programId
    );

    const tx = await this.program.methods
      .mintTo(new web3.BN(params.amount))
      .accounts({
        mint: params.to,
        mintAuthority,
        to: params.to,
        payer: this.program.provider.wallet.publicKey,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .rpc();

    return tx;
  }

  /**
   * Freeze a token account (compliance)
   * Uses Token-2022 Freeze extension
   */
  async freezeAccount(params: FreezeAccountParams): Promise<string> {
    const [freezeAuthority] = await PublicKey.findProgramAddress(
      [Buffer.from('authority'), Buffer.from('freeze'), params.account.toBuffer()],
      this.programId
    );

    const tx = await this.program.methods
      .freezeAccount()
      .accounts({
        mint: params.account,
        tokenAccount: params.account,
        freezeAuthority,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .rpc();

    return tx;
  }

  /**
   * Thaw a frozen token account
   * Uses Token-2022 Thaw extension
   */
  async thawAccount(params: FreezeAccountParams): Promise<string> {
    const [freezeAuthority] = await PublicKey.findProgramAddress(
      [Buffer.from('authority'), Buffer.from('freeze'), params.account.toBuffer()],
      this.programId
    );

    const tx = await this.program.methods
      .thawAccount()
      .accounts({
        mint: params.account,
        tokenAccount: params.account,
        freezeAuthority,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .rpc();

    return tx;
  }

  /**
   * Add an address to blacklist (compliance)
   * Stores blacklist status in PDA for Transfer Hook
   */
  async addToBlacklist(params: ModifyBlacklistParams): Promise<string> {
    const [blacklistEntry] = await PublicKey.findProgramAddress(
      [Buffer.from('blacklist'), params.address.toBuffer()],
      this.programId
    );

    const tx = await this.program.methods
      .addToBlacklist(params.address)
      .accounts({
        blacklistEntry,
        authority: this.program.provider.wallet.publicKey,
        payer: this.program.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  /**
   * Remove an address from blacklist
   */
  async removeFromBlacklist(params: ModifyBlacklistParams): Promise<string> {
    const [blacklistEntry] = await PublicKey.findProgramAddress(
      [Buffer.from('blacklist'), params.address.toBuffer()],
      this.programId
    );

    const tx = await this.program.methods
      .removeFromBlacklist(params.address)
      .accounts({
        blacklistEntry,
        authority: this.program.provider.wallet.publicKey,
        payer: this.program.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  /**
   * Seize tokens from a blacklisted account (compliance)
   * Freeze + Transfer to treasury
   */
  async seizeTokens(params: SeizeTokensParams): Promise<string> {
    const [freezeAuthority] = await PublicKey.findProgramAddress(
      [Buffer.from('authority'), Buffer.from('freeze'), params.from.toBuffer()],
      this.programId
    );

    const tx = await this.program.methods
      .seizeTokens(new web3.BN(params.amount))
      .accounts({
        mint: params.from,
        from: params.from,
        fromAuthority: this.program.provider.wallet.publicKey,
        treasury: params.treasury,
        freezeAuthority,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .rpc();

    return tx;
  }

  /**
   * Update mint authority (multi-sig compatible)
   */
  async updateMinter(params: UpdateAuthorityParams): Promise<string> {
    const tx = await this.program.methods
      .updateMinter(params.newAuthority)
      .accounts({
        authority: this.program.provider.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  /**
   * Update freeze authority (multi-sig compatible)
   */
  async updateFreezer(params: UpdateAuthorityParams): Promise<string> {
    const tx = await this.program.methods
      .updateFreezer(params.newAuthority)
      .accounts({
        authority: this.program.provider.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  /**
   * Check if an address is blacklisted
   * Returns true if blacklisted, false otherwise
   */
  async isBlacklisted(address: PublicKey): Promise<boolean> {
    const [blacklistEntry] = await PublicKey.findProgramAddress(
      [Buffer.from('blacklist'), address.toBuffer()],
      this.programId
    );

    try {
      const account = await this.program.account.blacklistEntry.fetch(blacklistEntry);
      return account.isBlacklisted;
    } catch (error) {
      // Account doesn't exist = not blacklisted
      return false;
    }
  }

  /**
   * Get stablecoin configuration
   */
  async getConfig(mint: PublicKey): Promise<StablecoinConfig> {
    const [stablecoinConfig] = await PublicKey.findProgramAddress(
      [Buffer.from('stablecoin'), mint.toBuffer()],
      this.programId
    );

    const account = await this.program.account.stablecoinConfig.fetch(stablecoinConfig);

    return {
      name: account.name,
      symbol: account.symbol,
      uri: account.uri,
      decimals: account.decimals,
      enable_permanent_delegate: account.enablePermanentDelegate,
      enable_transfer_hook: account.enableTransferHook,
      default_account_frozen: account.defaultAccountFrozen,
      mint_authority: new PublicKey(account.mintAuthority),
      freeze_authority: new PublicKey(account.freezeAuthority),
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a new StablecoinSDK instance
 */
export function createStablecoinSDK(
  connection: Connection,
  wallet: any,
  programId?: PublicKey
): StablecoinSDK {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });
  AnchorProvider.setProvider(provider);

  // Load IDL (this would be generated by Anchor build)
  const idl = {
    // IDL would be loaded here
    version: '0.1.0',
    name: 'stablecoin',
    instructions: [],
    accounts: [],
    types: [],
  };

  return new StablecoinSDK(provider, idl, programId);
}

/**
 * Example: Initialize a new stablecoin
 */
export async function exampleInitialize(): Promise<void> {
  const connection = new Connection('https://api.devnet.solana.com');
  const wallet = window.solana; // Phantom wallet

  const sdk = createStablecoinSDK(connection, wallet);

  const config: StablecoinConfig = {
    name: 'My Stablecoin',
    symbol: 'MSTBL',
    uri: 'https://example.com/metadata.json',
    decimals: 9,
    enable_permanent_delegate: true,
    enable_transfer_hook: true,
    default_account_frozen: false,
    mint_authority: wallet.publicKey,
    freeze_authority: wallet.publicKey,
  };

  const tx = await sdk.initialize(config);
  console.log('Stablecoin initialized:', tx);
}

/**
 * Example: Initialize stablecoin WITH transfer hook (NOVO)
 */
export async function exampleInitializeWithTransferHook(): Promise<void> {
  const connection = new Connection('https://api.devnet.solana.com');
  const wallet = window.solana; // Phantom wallet
  const hookProgramId = new PublicKey('hookProg11111111111111111111'); // Simulado para teste

  const sdk = createStablecoinSDK(connection, wallet);

  const config: StablecoinConfig = {
    name: 'My Stablecoin',
    symbol: 'MSTBL',
    uri: 'https://example.com/metadata.json',
    decimals: 9,
    enable_permanent_delegate: true,
    enable_transfer_hook: true,
    default_account_frozen: false,
    mint_authority: wallet.publicKey,
    freeze_authority: wallet.publicKey,
    transferHookProgram: hookProgramId, // NOVO: Especificar hook program
  };

  const tx = await sdk.initializeWithTransferHook(config);
  console.log('Stablecoin initialized with hook:', tx);
}

/**
 * Example: Mint tokens to a recipient
 */
export async function exampleMintTo(to: PublicKey, amount: number): Promise<void> {
  const connection = new Connection('https://api.devnet.solana.com');
  const wallet = window.solana;

  const sdk = createStablecoinSDK(connection, wallet);

  const tx = await sdk.mintTo({ to, amount });
  console.log('Tokens minted:', tx);
}

/**
 * Example: Freeze an account
 */
export async function exampleFreezeAccount(account: PublicKey): Promise<void> {
  const connection = new Connection('https://api.devnet.solana.com');
  const wallet = window.solana;

  const sdk = createStablecoinSDK(connection, wallet);

  const tx = await sdk.freezeAccount({ account });
  console.log('Account frozen:', tx);
}

/**
 * Example: Add address to blacklist
 */
export async function exampleAddToBlacklist(address: PublicKey): Promise<void> {
  const connection = new Connection('https://api.devnet.solana.com');
  const wallet = window.solana;

  const sdk = createStablecoinSDK(connection, wallet);

  const tx = await sdk.addToBlacklist({ address });
  console.log('Address blacklisted:', tx);
}

/**
 * Example: Seize tokens from a blacklisted account
 */
export async function exampleSeizeTokens(
  from: PublicKey,
  treasury: PublicKey,
  amount: number
): Promise<void> {
  const connection = new Connection('https://api.devnet.solana.com');
  const wallet = window.solana;

  const sdk = createStablecoinSDK(connection, wallet);

  const tx = await sdk.seizeTokens({ from, treasury, amount });
  console.log('Tokens seized:', tx);
}

/**
 * Example: Check if address is blacklisted
 */
export async function exampleIsBlacklisted(address: PublicKey): Promise<boolean> {
  const connection = new Connection('https://api.devnet.solana.com');
  const wallet = window.solana;

  const sdk = createStablecoinSDK(connection, wallet);

  const isBlacklisted = await sdk.isBlacklisted(address);
  console.log('Is blacklisted:', isBlacklisted);

  return isBlacklisted;
}

// ============================================================================
// Exports
// ============================================================================

export { STABLECOIN_PROGRAM_ID };
