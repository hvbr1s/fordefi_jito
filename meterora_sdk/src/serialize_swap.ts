import fs from 'fs'
import { BN } from 'bn.js'
import DLMM from '@meteora-ag/dlmm'
import * as web3 from '@solana/web3.js'
import * as jito from 'jito-ts'


const quicknode_key = process.env.QUICKNODE_MAINNET_KEY
const connection = new web3.Connection(`https://winter-solemn-sun.solana-mainnet.quiknode.pro/${quicknode_key}/`)
const SOL_USDC_POOL = new web3.PublicKey('BVRbyLjjfSBcoyiYFuxbgKYnWuiFaF9CSXEa5vdSZ9Hh') // info can be fetched from block explorer'
const TRADER = new web3.PublicKey('CtvSEG7ph7SQumMtbnSKtDTLoUQoy8bxPUcjwvmNgGim') // your Fordefi Solana Vault address

// Swap params
const swapAmount = new BN(100);

async function createDlmm(){

    const dlmmPool = DLMM.create(connection, SOL_USDC_POOL); // your pool
    
    return dlmmPool

}

async function swapQuote(pool: any){

    const swapYtoX = true;
    const binArrays = await pool.getBinArrayForSwap(swapYtoX);
    const swapQuote = await pool.swapQuote(
    swapAmount,
    swapYtoX,
    new BN(10),
    binArrays
    );

    return swapQuote
}

async function swapTx(pool:any, swapQuote: any, TRADER: web3.PublicKey){

    // Craft swap tx
    const swapTx = await pool.swap({
        inToken: pool.tokenX.publicKey,
        binArraysPubkey: swapQuote.binArraysPubkey,
        inAmount: swapAmount,
        lbPair: pool.pubkey,
        user: TRADER,
        minOutAmount: swapQuote.minOutAmount,
        outToken: pool.tokenY.publicKey,
    });

    return swapTx
}

async function main(){

    const getdlmmPool =  await createDlmm()

    const getQuote = await swapQuote(getdlmmPool)
    console.log(`Swap quote -> ${getQuote}`)

    const getSwapTx =  await swapTx(getdlmmPool, getQuote, TRADER)
    console.log(`Swap Tx -> ${getSwapTx}`)
    
    // Create Jito client instance
    const client = jito.searcher.searcherClient("frankfurt.mainnet.block-engine.jito.wtf") // can customize

    const tipAccountsResult = await client.getTipAccounts();
    if (!tipAccountsResult.ok) {
        throw new Error(`Failed to get tip accounts: ${tipAccountsResult.error}`);
    }

    // Get first tip account from the array and convert it to PubKey
    const tipAccount = new web3.PublicKey(tipAccountsResult.value[0]);
    console.log(`Tip account -> ${tipAccount}`)

    const tip = 1000 // amount in lamports (1 SOL = 1e9 lamports)
    const priorityFee = 1000 // in lamports too
    const tippingTx = new web3.Transaction()
    .add(
        web3.ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: priorityFee, 
        })
    )
    .add(
        web3.SystemProgram.transfer({
            fromPubkey: TRADER,
            toPubkey: tipAccount,
            lamports: tip, 
        })
    );

    // Set blockhash + fee payer
    const { blockhash } = await connection.getLatestBlockhash();
    tippingTx.recentBlockhash = blockhash;
    tippingTx.feePayer = TRADER;

    // Is Array check
    const swapTxs = Array.isArray(getSwapTx) 
        ? getSwapTx 
        : [getSwapTx];

    // Add swapTxs instructions to Jito tippingTx instructions
    for (const tx of swapTxs) {
        tippingTx.add(...tx.instructions);
    }

    // Compile + serialize the merged transactions
    const mergedMessage = tippingTx.compileMessage();
    const serializedV0Message = Buffer.from(
        mergedMessage.serialize()
    ).toString('base64');

    // Create JSON
    const jsonBody = {
        "vault_id": process.env.VAULT_ID, // Replace with your vault ID
        "signer_type": "api_signer",
        "sign_mode": "auto", // IMPORTANT
        "type": "solana_transaction",
        "details": {
            "type": "solana_serialized_transaction_message",
            "push_mode": "manual", // IMPORTANT,
            "data": serializedV0Message,  // For legacy transactions, use `serializedLegacyMessage`
            "chain": "solana_mainnet"
        },
        "wait_for_state": "signed" // only for create-and-wait
    };

    // Write json body to file
    fs.writeFileSync(
        '../request_body.json',
        JSON.stringify(jsonBody, null, 2), 
        'utf8'
    );
    console.log("Tx data written to request_body.json");
}

main().catch(console.error);