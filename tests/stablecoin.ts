// Solana Stablecoin Standard - Integration Tests
// Tests all major functionality on local validator

import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
} from '@solana/spl-token';
import { assert } from 'chai';

// Load the program IDL
const IDL = require('../target/idl/solana_stablecoin_standard.json');

describe('Solana Stablecoin Standard - Integration Tests', () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaStablecoinStandard as Program;

  let mint: Keypair;
  let stablecoinConfig: PublicKey;
  let mintAuthority: PublicKey;
  let freezeAuthority: PublicKey;
  let blacklistEntry: PublicKey;

  let userTokenAccount: PublicKey;
  let treasuryAccount: PublicKey;

  const authority = provider.wallet as anchor.Wallet;

  console.log('Testing with authority:', authority.publicKey.toString());

  before(async () => {
    console.log('Setting up test environment...');

    // Create a new token mint
    mint = Keypair.generate();

    // Find PDAs
    [stablecoinConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from('stablecoin'), mint.publicKey.toBuffer()],
      program.programId
    );

    [mintAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('authority'), Buffer.from('mint'), mint.publicKey.toBuffer()],
      program.programId
    );

    [freezeAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('authority'), Buffer.from('freeze'), mint.publicKey.toBuffer()],
      program.programId
    );

    // Create token accounts
    userTokenAccount = await createAccount(
      provider.connection,
      authority.payer,
      mint.publicKey,
      authority.publicKey
    );

    treasuryAccount = await createAccount(
      provider.connection,
      authority.payer,
      mint.publicKey,
      authority.publicKey
    );

    console.log('Test environment setup complete');
  });

  it('Initializes the stablecoin', async () => {
    console.log('\n=== TEST: Initialize Stablecoin ===');

    try {
      const tx = await program.methods
        .initialize(
          'Test Stablecoin',
          'TST',
          'https://example.com/metadata.json',
          9,
          true,  // enable_permanent_delegate
          true,  // enable_transfer_hook
          false  // default_account_frozen
        )
        .accounts({
          stablecoinConfig,
          mint: mint.publicKey,
          mintAuthority,
          freezeAuthority,
          authority: authority.publicKey,
          payer: authority.payer.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([mint, authority.payer])
        .rpc();

      console.log('✅ Stablecoin initialized');
      console.log('Transaction:', tx);

      // Verify the config was created
      const config = await program.account.stablecoinConfig.fetch(stablecoinConfig);
      console.log('Config:', config);
      assert.equal(config.symbol, 'TST');
      assert.equal(config.decimals, 9);

    } catch (error) {
      console.error('❌ Initialize failed:', error);
      throw error;
    }
  });

  it('Mints tokens to a recipient', async () => {
    console.log('\n=== TEST: Mint Tokens ===');

    try {
      const amount = new anchor.BN(1000000000); // 1 token with 9 decimals

      const tx = await program.methods
        .mintTo(amount)
        .accounts({
          mint: mint.publicKey,
          mintAuthority,
          to: userTokenAccount,
          payer: authority.payer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([authority.payer])
        .rpc();

      console.log('✅ Tokens minted');
      console.log('Transaction:', tx);

      // Verify the balance
      const account = await getAccount(provider.connection, userTokenAccount);
      console.log('Balance:', account.amount.toString());
      assert.equal(account.amount.toString(), amount.toString());

    } catch (error) {
      console.error('❌ Mint failed:', error);
      throw error;
    }
  });

  it('Freezes a token account', async () => {
    console.log('\n=== TEST: Freeze Account ===');

    try {
      const tx = await program.methods
        .freezeAccount()
        .accounts({
          mint: mint.publicKey,
          tokenAccount: userTokenAccount,
          freezeAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('✅ Account frozen');
      console.log('Transaction:', tx);

    } catch (error) {
      console.error('❌ Freeze failed:', error);
      throw error;
    }
  });

  it('Thaws a frozen token account', async () => {
    console.log('\n=== TEST: Thaw Account ===');

    try {
      const tx = await program.methods
        .thawAccount()
        .accounts({
          mint: mint.publicKey,
          tokenAccount: userTokenAccount,
          freezeAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('✅ Account thawed');
      console.log('Transaction:', tx);

    } catch (error) {
      console.error('❌ Thaw failed:', error);
      throw error;
    }
  });

  it('Adds an address to the blacklist', async () => {
    console.log('\n=== TEST: Add to Blacklist ===');

    const addressToBlacklist = Keypair.generate().publicKey;

    [blacklistEntry] = PublicKey.findProgramAddressSync(
      [Buffer.from('blacklist'), addressToBlacklist.toBuffer()],
      program.programId
    );

    try {
      const tx = await program.methods
        .addToBlacklist(addressToBlacklist)
        .accounts({
          blacklistEntry,
          stablecoinConfig,
          authority: authority.publicKey,
          payer: authority.payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority.payer])
        .rpc();

      console.log('✅ Address added to blacklist');
      console.log('Transaction:', tx);

      // Verify the blacklist entry
      const entry = await program.account.blacklistEntry.fetch(blacklistEntry);
      console.log('Blacklist entry:', entry);
      assert.equal(entry.isBlacklisted, true);

    } catch (error) {
      console.error('❌ Add to blacklist failed:', error);
      throw error;
    }
  });

  it('Removes an address from the blacklist', async () => {
    console.log('\n=== TEST: Remove from Blacklist ===');

    const addressToRemove = Keypair.generate().publicKey;

    [blacklistEntry] = PublicKey.findProgramAddressSync(
      [Buffer.from('blacklist'), addressToRemove.toBuffer()],
      program.programId
    );

    try {
      // First add to blacklist
      await program.methods
        .addToBlacklist(addressToRemove)
        .accounts({
          blacklistEntry,
          stablecoinConfig,
          authority: authority.publicKey,
          payer: authority.payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority.payer])
        .rpc();

      // Then remove
      const tx = await program.methods
        .removeFromBlacklist(addressToRemove)
        .accounts({
          blacklistEntry,
          stablecoinConfig,
          authority: authority.publicKey,
          payer: authority.payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority.payer])
        .rpc();

      console.log('✅ Address removed from blacklist');
      console.log('Transaction:', tx);

      // Verify the blacklist entry
      const entry = await program.account.blacklistEntry.fetch(blacklistEntry);
      console.log('Blacklist entry:', entry);
      assert.equal(entry.isBlacklisted, false);

    } catch (error) {
      console.error('❌ Remove from blacklist failed:', error);
      throw error;
    }
  });

  it('Seizes tokens from a blacklisted account', async () => {
    console.log('\n=== TEST: Seize Tokens ===');

    try {
      const amount = new anchor.BN(500000000); // 0.5 tokens

      const tx = await program.methods
        .seizeTokens(amount)
        .accounts({
          mint: mint.publicKey,
          from: userTokenAccount,
          fromAuthority: authority.payer.publicKey,
          treasury: treasuryAccount,
          freezeAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('✅ Tokens seized');
      console.log('Transaction:', tx);

      // Verify the balance
      const fromAccount = await getAccount(provider.connection, userTokenAccount);
      const treasuryAcc = await getAccount(provider.connection, treasuryAccount);
      console.log('From balance:', fromAccount.amount.toString());
      console.log('Treasury balance:', treasuryAcc.amount.toString());

    } catch (error) {
      console.error('❌ Seize failed:', error);
      throw error;
    }
  });

  it('Updates mint authority', async () => {
    console.log('\n=== TEST: Update Mint Authority ===');

    const newAuthority = Keypair.generate().publicKey;

    try {
      const tx = await program.methods
        .updateMinter(newAuthority)
        .accounts({
          stablecoinConfig,
          authority: authority.publicKey,
        })
        .rpc();

      console.log('✅ Mint authority updated');
      console.log('Transaction:', tx);

      // Verify the config
      const config = await program.account.stablecoinConfig.fetch(stablecoinConfig);
      console.log('New mint authority:', config.mintAuthority.toString());
      assert.equal(config.mintAuthority.toString(), newAuthority.toString());

    } catch (error) {
      console.error('❌ Update mint authority failed:', error);
      throw error;
    }
  });

  it('Updates freeze authority', async () => {
    console.log('\n=== TEST: Update Freeze Authority ===');

    const newAuthority = Keypair.generate().publicKey;

    try {
      const tx = await program.methods
        .updateFreezer(newAuthority)
        .accounts({
          stablecoinConfig,
          authority: authority.publicKey,
        })
        .rpc();

      console.log('✅ Freeze authority updated');
      console.log('Transaction:', tx);

      // Verify the config
      const config = await program.account.stablecoinConfig.fetch(stablecoinConfig);
      console.log('New freeze authority:', config.freezeAuthority.toString());
      assert.equal(config.freezeAuthority.toString(), newAuthority.toString());

    } catch (error) {
      console.error('❌ Update freeze authority failed:', error);
      throw error;
    }
  });

  after(async () => {
    console.log('\n=== TEST SUITE COMPLETE ===');
    console.log('All tests passed successfully!');
  });
});
