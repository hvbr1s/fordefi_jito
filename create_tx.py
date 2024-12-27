import os
import datetime
import json
import requests
from api_requests.broacast import broadcast_tx
from signing.signer import sign


with open('request_body.json', 'r') as f:
    request_json = json.load(f)
request_body = json.dumps(request_json)

access_token = os.getenv("FORDEFI_API_TOKEN")
#path = "/api/v1/transactions"
path = "/api/v1/transactions/create-and-wait"
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
        print(json.dumps(response.json(), indent=2))
        data = response.json()

        # Save data to a JSON file (RECOMMENDED TO RUN ONCE TO HAVE A GOOD VIEW OF THE OBJECT RETURNED BY THE API)
        with open('tx_data.json', 'w') as json_file:
            json.dump(data, json_file, indent=2)
        print("Data has been saved to 'tx_data.json'")

    except Exception as e:
            print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
