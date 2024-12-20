import base64
from solders.keypair import Keypair
from solders.message import Message
from solders.system_program import TransferParams, transfer
from solders.transaction import VersionedTransaction
from jito_sdk.jito_jsonrpc_sdk import JitoJsonRpcSDK


def create_legacy_simple_transaction(sender: Keypair, receiver: Keypair) -> dict:

    # Create a transfer instruction of 1 lamport
    transfer_ix = transfer(
        TransferParams(
            from_pubkey=sender.pubkey(),
            to_pubkey=receiver.pubkey(),
            lamports=1
        )
    )
    # Compile the message for a v0 transaction (with mock blockhash)
    msg = Message([transfer_ix], sender.pubkey())  # Replace with MessageV0 for v0 message
    
    # Construct the JSON body
    json_body = {
        "vault_id": "vault_id",
        "signer_type": "initiator",
        "type": "solana_transaction",
        "details": {
            "type": "solana_serialized_transaction_message",
            "data": base64.b64encode(bytes(msg)).decode(),
            "chain": "solana_mainnet"
        },
    }
    return json_body


# Usage
sender = Keypair()  # let's pretend this account actually has SOL to send
receiver = Keypair()

request_body = create_legacy_simple_transaction(sender, receiver)
print(request_body)