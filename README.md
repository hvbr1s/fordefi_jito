# Solana Transaction Sender with Fordefi Integration

A tool for sending Solana transactions with Jito's Block Engine integration using the Fordefi API.

## Prerequisites

- Fordefi API user token.
- Solana wallet addresses (sender and receiver).
- API Signer set up.
- Python 3.x installed.

## Setup

1. Clone this repository
2. Create a `.env` file in the root directory with the following variables:
   ```
   FORDEFI_API_TOKEN=your_api_token
   VAULT_ID=your_vault_id
   SENDER_PUBKEY=your_sender_address
   RECEIVER_PUBKEY=your_receiver_address
   ```
3. Create a `/secret` directory in the root folder
4. Place your API Signer's `.pem` private key file in the `/secret` directory

## Configuration

Open `craft_request.py` and configure the following parameters:
- `jito_tip_amount`: Amount to tip Jito validators
- `priority_fee`: Transaction priority fee
- `vault`: Vault settings

## Usage

Execute the following scripts in order:

1. `python craft_request.py` - Prepares the transaction request
2. `python create_tx.py` - Creates the transaction
3. `python sign_tx.py` - Signs the transaction using Fordefi
4. `python broadcast_to_jito.py` - Broadcasts the signed transaction to Jito's block engine.
