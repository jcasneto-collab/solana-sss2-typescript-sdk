// Solana Stablecoin Standard - Main Entry Point
// SSS-2 Compliant Stablecoin Implementation

use anchor_lang::prelude::*;

// Declare program ID (matches Anchor.toml)
declare_id!("Fg6PaFpoGXkYsnMp2CT5a1k9WkYc2dMkq");

// Export the main stablecoin module
pub mod stablecoin;

// Export the program module
pub use stablecoin::*;

// ============================================================================
// Error Codes
// ============================================================================

#[error_code]
pub enum StablecoinError {
    #[msg("Unauthorized access")]
    UnauthorizedAccess,
    
    #[msg("Invalid Mint Authority")]
    InvalidMintAuthority,
    
    #[msg("Invalid Freeze Authority")]
    InvalidFreezeAuthority,
    
    #[msg("Invalid Token Account")]
    InvalidTokenAccount,
    
    #[msg("Address is blacklisted")]
    AddressBlacklisted,
    
    #[msg("Invalid mint amount")]
    InvalidMintAmount,
    
    #[msg("Invalid freeze amount")]
    InvalidFreezeAmount,
    
    #[msg("Already initialized")]
    AlreadyInitialized,
    
    #[msg("Not initialized")]
    NotInitialized,
    
    #[msg("Name too long")]
    NameTooLong,
    
    #[msg("Symbol too long")]
    SymbolTooLong,
    
    #[msg("URI too long")]
    UriTooLong,
}
