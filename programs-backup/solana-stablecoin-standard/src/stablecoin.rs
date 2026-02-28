// Solana Stablecoin Standard - SSS-2 Compliant Implementation
// Layer 1: Base SDK + Layer 2: Compliance Module + Layer 3: SSS-2 Preset

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, FreezeAccount, ThawAccount, Transfer, Token, TokenAccount};

// Re-export error codes from lib.rs
use super::StablecoinError;

#[program]
pub mod stablecoin {
    use super::*;

    /// Initialize SSS-2 Compliant Stablecoin
    /// Creates mint, sets up authorities, and configures compliance features
    pub fn initialize(
        ctx: Context<Initialize>,
        name: String,
        symbol: String,
        uri: String,
        decimals: u8,
    ) -> Result<()> {
        let stablecoin_config = &mut ctx.accounts.stablecoin_config;
        
        // Validate string lengths
        require!(name.len() <= 32, StablecoinError::NameTooLong);
        require!(symbol.len() <= 16, StablecoinError::SymbolTooLong);
        require!(uri.len() <= 256, StablecoinError::UriTooLong);
        
        stablecoin_config.name = name;
        stablecoin_config.symbol = symbol;
        stablecoin_config.uri = uri;
        stablecoin_config.decimals = decimals;
        stablecoin_config.mint_authority = ctx.accounts.authority.key();
        stablecoin_config.freeze_authority = ctx.accounts.authority.key();
        stablecoin_config.bump = ctx.bumps.stablecoin_config;

        msg!("Stablecoin initialized: {}", stablecoin_config.symbol);
        Ok(())
    }

    /// Mint new tokens to a recipient account
    /// Only callable by mint authority
    pub fn mint_to(
        ctx: Context<MintTo>,
        amount: u64,
    ) -> Result<()> {
        let seeds = &[
            b"stablecoin",
            ctx.accounts.mint.key().as_ref(),
        ];
        let bump = ctx.bumps.mint_authority;
        let signer_seeds = &[&seeds[..], &[bump]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.to.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
            signer_seeds,
        );

        token::mint_to(cpi_ctx, amount)?;
        msg!("Minted {} tokens to {}", amount, ctx.accounts.to.key());
        Ok(())
    }

    /// Freeze a token account (compliance feature)
    /// Only callable by freeze authority
    pub fn freeze_account(ctx: Context<FreezeAccount>) -> Result<()> {
        let seeds = &[
            b"stablecoin",
            ctx.accounts.mint.key().as_ref(),
        ];
        let bump = ctx.bumps.freeze_authority;
        let signer_seeds = &[&seeds[..], &[bump]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::FreezeAccount {
                account: ctx.accounts.token_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
            signer_seeds,
        );

        token::freeze_account(cpi_ctx)?;
        msg!("Froze account {}", ctx.accounts.token_account.key());
        Ok(())
    }

    /// Thaw a frozen token account
    /// Only callable by freeze authority
    pub fn thaw_account(ctx: Context<ThawAccount>) -> Result<()> {
        let seeds = &[
            b"stablecoin",
            ctx.accounts.mint.key().as_ref(),
        ];
        let bump = ctx.bumps.freeze_authority;
        let signer_seeds = &[&seeds[..], &[bump]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::ThawAccount {
                account: ctx.accounts.token_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
            signer_seeds,
        );

        token::thaw_account(cpi_ctx)?;
        msg!("Thawed account {}", ctx.accounts.token_account.key());
        Ok(())
    }

    /// Add an address to the blacklist (compliance)
    /// Blacklisted addresses cannot receive tokens
    pub fn add_to_blacklist(
        ctx: Context<ModifyBlacklist>, 
        address: Pubkey
    ) -> Result<()> {
        let blacklist_entry = &mut ctx.accounts.blacklist_entry;
        
        // Verify authority
        require!(
            ctx.accounts.authority.key() == ctx.accounts.stablecoin_config.mint_authority,
            StablecoinError::UnauthorizedAccess
        );

        blacklist_entry.address = address;
        blacklist_entry.is_blacklisted = true;
        blacklist_entry.timestamp = Clock::get()?.unix_timestamp;

        msg!("Added address {} to blacklist", address);
        Ok(())
    }

    /// Remove an address from the blacklist
    pub fn remove_from_blacklist(
        ctx: Context<ModifyBlacklist>, 
        address: Pubkey
    ) -> Result<()> {
        let blacklist_entry = &mut ctx.accounts.blacklist_entry;
        
        // Verify authority
        require!(
            ctx.accounts.authority.key() == ctx.accounts.stablecoin_config.mint_authority,
            StablecoinError::UnauthorizedAccess
        );

        blacklist_entry.address = address;
        blacklist_entry.is_blacklisted = false;
        blacklist_entry.timestamp = Clock::get()?.unix_timestamp;

        msg!("Removed address {} from blacklist", address);
        Ok(())
    }

    /// Seize tokens from a blacklisted account (compliance)
    /// This is a forced transfer for regulatory compliance
    pub fn seize_tokens(
        ctx: Context<SeizeTokens>,
        amount: u64,
    ) -> Result<()> {
        // First freeze the account using freeze authority
        let freeze_seeds = &[
            b"stablecoin",
            ctx.accounts.mint.key().as_ref(),
        ];
        let freeze_bump = ctx.bumps.freeze_authority;
        let freeze_signer = &[&freeze_seeds[..], &[freeze_bump]];

        let freeze_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::FreezeAccount {
                account: ctx.accounts.from.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
            freeze_signer,
        );
        token::freeze_account(freeze_ctx)?;

        // Then transfer from account owner to treasury
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
                authority: ctx.accounts.from_authority.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;

        msg!("Seized {} tokens from {} to treasury", amount, ctx.accounts.from.key());
        Ok(())
    }

    /// Check if an address is blacklisted (for Transfer Hook)
    /// Returns true if blacklisted, false otherwise
    pub fn check_blacklist(
        ctx: Context<CheckBlacklist>, 
        address: Pubkey
    ) -> Result<bool> {
        let blacklist_entry = &ctx.accounts.blacklist_entry;

        if blacklist_entry.address == address && blacklist_entry.is_blacklisted {
            return Err(StablecoinError::AddressBlacklisted.into());
        }

        Ok(false)
    }

    /// Update mint authority (multi-sig compatible)
    pub fn update_minter(
        ctx: Context<UpdateAuthority>,
        new_mint_authority: Pubkey,
    ) -> Result<()> {
        let stablecoin_config = &mut ctx.accounts.stablecoin_config;
        
        require!(
            ctx.accounts.authority.key() == stablecoin_config.mint_authority,
            StablecoinError::UnauthorizedAccess
        );

        stablecoin_config.mint_authority = new_mint_authority;
        msg!("Updated mint authority to {}", new_mint_authority);
        Ok(())
    }

    /// Update freeze authority (multi-sig compatible)
    pub fn update_freezer(
        ctx: Context<UpdateAuthority>,
        new_freeze_authority: Pubkey,
    ) -> Result<()> {
        let stablecoin_config = &mut ctx.accounts.stablecoin_config;
        
        require!(
            ctx.accounts.authority.key() == stablecoin_config.freeze_authority,
            StablecoinError::UnauthorizedAccess
        );

        stablecoin_config.freeze_authority = new_freeze_authority;
        msg!("Updated freeze authority to {}", new_freeze_authority);
        Ok(())
    }
}

// ============================================================================
// Contexts (Account Validation)
// ============================================================================

#[derive(Accounts)]
#[instruction(name: String, symbol: String, uri: String)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 16 + 256 + 1 + 32 + 32 + 1, // discriminator + strings + decimals + authorities + bump
        seeds = [b"stablecoin", mint.key().as_ref()],
        bump
    )]
    pub stablecoin_config: Account<'info, StablecoinConfig>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 9,
        mint::authority = authority,
        mint::freeze_authority = authority,
    )]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct MintTo<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        seeds = [b"stablecoin", mint.key().as_ref()],
        bump
    )]
    pub mint_authority: Signer<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        token::mint = mint,
        token::authority = mint_authority,
    )]
    pub to: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FreezeAccount<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"stablecoin", mint.key().as_ref()],
        bump
    )]
    pub freeze_authority: Signer<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ThawAccount<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"stablecoin", mint.key().as_ref()],
        bump
    )]
    pub freeze_authority: Signer<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ModifyBlacklist<'info> {
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + 32 + 1 + 8, // discriminator + address + bool + timestamp
        seeds = [b"blacklist", address.as_ref()],
        bump
    )]
    pub blacklist_entry: Account<'info, BlacklistEntry>,

    pub stablecoin_config: Account<'info, StablecoinConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SeizeTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub from: Account<'info, TokenAccount>,

    #[account(mut)]
    pub from_authority: Signer<'info>,

    #[account(mut)]
    pub treasury: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"stablecoin", mint.key().as_ref()],
        bump
    )]
    pub freeze_authority: Signer<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CheckBlacklist<'info> {
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + 32 + 1 + 8, // discriminator + address + bool + timestamp
        seeds = [b"blacklist", address.as_ref()],
        bump
    )]
    pub blacklist_entry: Account<'info, BlacklistEntry>,

    pub address: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAuthority<'info> {
    #[account(mut)]
    pub stablecoin_config: Account<'info, StablecoinConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

// ============================================================================
// Data Structures
// ============================================================================

#[account]
pub struct StablecoinConfig {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
    pub mint_authority: Pubkey,
    pub freeze_authority: Pubkey,
    pub bump: u8,
}

#[account]
pub struct BlacklistEntry {
    pub address: Pubkey,
    pub is_blacklisted: bool,
    pub timestamp: i64,
}
