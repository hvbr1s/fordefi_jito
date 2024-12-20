## How to use

1. Open `craft_request` and select the `jito_tip_amount`, `priority_fee,` `vault`, `sender` and `receiver` then save.
2. Create a `.env` file with your `FORDEFI_API_TOKEN` (API user token) and a `/secret` folder with the secret key for registering your API user with the API Signer.
3. Run `craft_request`
4. Run `sign_tx` and grab the transaction id from the logs.
5. Open `broadcast_to_jito` and replace `transaction_id` with the value you just copied from the logs and save.
6. Run `broadcast_to_jito`.