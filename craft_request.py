import os
import base64
import json
import asyncio
from solders.message import Message
from solders.system_program import TransferParams, transfer
from solders.transaction import VersionedTransaction
from jito_sdk.jito_jsonrpc_sdk import JitoJsonRpcSDK
from solders.pubkey import Pubkey
from solana.rpc.async_api import AsyncClient
from solders.compute_budget import set_compute_unit_limit, set_compute_unit_price


async def create_legacy_simple_transaction(sender: Pubkey, receiver: Pubkey, vault: str) -> dict:

    sdk = JitoJsonRpcSDK(url="https://mainnet.block-engine.jito.wtf/api/v1")

    # Create a transfer instruction of 1 lamport
    transfer_ix = transfer(
        TransferParams(
            from_pubkey=sender,
            to_pubkey=receiver,
            lamports=1
        )
    )
    # Jito tip transfer
    jito_tip_amount = 10000 # CUSTOMIZE AS NEEDED
    jito_tip_account = Pubkey.from_string(sdk.get_random_tip_account())
    jito_tip_ix = transfer(TransferParams(from_pubkey=sender, to_pubkey=jito_tip_account, lamports=jito_tip_amount))
    # Priority Fee
    priority_fee = 10000 # CUSTOMIZE AS NEEDED
    priority_fee_ix = set_compute_unit_price(priority_fee)

    # Compile the message for a v0 transaction (with mock blockhash)
    msg = Message([priority_fee_ix, transfer_ix, jito_tip_ix], sender)  # Replace with MessageV0 for v0 message
    
    # Construct the JSON body
    json_body = {
        "vault_id": vault,
        "signer_type": "api_signer",
        "sign_mode": "auto", # or "triggered"
        "type": "solana_transaction",
        "details": {
            "type": "solana_serialized_transaction_message",
            "push_mode": "manual", # IMPORTANT
            "chain": "solana_mainnet",
            "data": base64.b64encode(bytes(msg)).decode()
        },
        # "wait_for_state":"signed" # only for create-and-wait
    }
    return json_body


async def main():

    vault = os.getenv("VAULT_ID")
    sender_pubkey =  str(os.getenv("SENDER_PUBKEY"))
    receiver_pubkey = str(os.getenv("RECEIVER_PUBKEY"))
    sender = Pubkey.from_string(sender_pubkey)
    receiver =  Pubkey.from_string(receiver_pubkey)
    request_body = await create_legacy_simple_transaction(sender, receiver, vault)

    # Save data to a JSON file
    with open('request_body.json', 'w') as json_file:
        json.dump(request_body, json_file, indent=2)
    print("Data has been saved to 'request_body.json'")

asyncio.run(main())
