## How to use

1. Create a `.env` file with your `FORDEFI_API_TOKEN` (API user token), Solana `VAULT_ID`, `SENDER_PUBKEY` and `RECEIVER_PUBKEY`.
2. In the root of the repo, create a `/secret` folder with the secret key `.pem` file you used for registering your API user with the API Signer.
3. Open `craft_request.py` and select the `jito_tip_amount`, `priority_fee,` and `vault` then save.
4. Run `craft_request.py`
5. Run `create_tx.py`.
6. Run `sign_tx.py`.
7. Run `broadcast_to_jito.py`.