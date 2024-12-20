import os
import datetime
import json
import requests
from api_requests.broacast import broadcast_tx
from signing.signer import sign

# Fetch triggered transaction ID
with open("./tx_data.json", "r") as f:
    response_data = json.load(f)
triggered_tx_id = response_data["id"]
print(triggered_tx_id)

request_json = {
    "id":triggered_tx_id
}

# Sign transaction
access_token = os.getenv("FORDEFI_API_TOKEN")
path = f"/api/v1/transactions/{triggered_tx_id}/trigger-signing"
request_body = json.dumps(request_json)
timestamp = datetime.datetime.now().strftime("%s")
payload = f"{path}|{timestamp}|{request_body}"


def ping(path, access_token):

    signature = sign(payload=payload)
            
    try:    
        resp_tx = broadcast_tx(path, access_token, signature, timestamp, request_body)
        resp_tx.raise_for_status()
        return resp_tx
    except requests.exceptions.HTTPError as e:
        error_message = f"HTTP error occurred: {str(e)}"
        if resp_tx.text:
            try:
                error_detail = resp_tx.json()
                error_message += f"\nError details: {error_detail}"
            except json.JSONDecodeError:
                error_message += f"\nRaw response: {resp_tx.text}"
        raise RuntimeError(error_message)
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Network error occurred: {str(e)}")

def main():
    if not access_token:
        print("Error: FORDEFI_API_TOKEN environment variable is not set")
        return
        
    try:
        response = ping(path, access_token)
        if response.status_code == 204:
            print("Transaction signing triggered successfully (Status 204)")
        else:
            print(f"Unexpected response status: {response.status_code}")
            if response.text:
                print(json.dumps(response.json(), indent=2))
                data = response.json()
                # Save data to a JSON file
                with open('trigger_data.json', 'w') as json_file:
                    json.dump(data, json_file, indent=2)
                print("Data has been saved to 'trigger_data.json'")

    except Exception as e:
            print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()

