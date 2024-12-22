import fs from 'fs'
import { BN } from 'bn.js'
import DLMM from '@meteora-ag/dlmm'
import * as web3 from '@solana/web3.js'
import * as jito from 'jito-ts'


const quicknode_key = process.env.QUICKNODE_MAINNET_KEY
const connection = new web3.Connection(`https://winter-solemn-sun.solana-mainnet.quiknode.pro/${quicknode_key}/`)
const SOL_USDC_POOL = new web3.PublicKey('HTvjzsfX3yU6BUodCjZ5vZkUrAxMDTrBs3CJaq43ashR')
const TRADER = new web3.PublicKey('CtvSEG7ph7SQumMtbnSKtDTLoUQoy8bxPUcjwvmNgGim')

async function createDlmm(){

    const dlmmPool = DLMM.create(connection, SOL_USDC_POOL);
    return dlmmPool

}

async function userPosition() {

    const dlmmPool = await createDlmm()
    const activeBin = await dlmmPool.getActiveBin();

    const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(TRADER);
    const binData = userPositions[0].positionData.positionBinData;
    
    return userPositions
}

async function removeLiquidity(onePosition: any, TRADER: web3.PublicKey){
    const dllmPool = await createDlmm()

    const binIdsToRemove = onePosition.positionData.positionBinData.map(
        (bin:any) => bin.binId
    );

    const removeLiquidityTx = await dllmPool.removeLiquidity({
        position: onePosition.publicKey,
        user: TRADER,
        binIds: binIdsToRemove,
        bps: new BN(10000),
        shouldClaimAndClose: true,
    });

    return removeLiquidityTx
}

async function main(){

    const myPositions = await userPosition()

    const onePosition = myPositions.find(({ publicKey }) =>
        publicKey.equals(new web3.PublicKey('7pcrUCzPLkj4H4ZEc6c8Ubd5W8dTeDtyBDaESdNNL2du'))
      );

    const removeLiquidityTx = await removeLiquidity(onePosition, TRADER)
    
    // Jito
    const client = jito.searcher.searcherClient("https://mainnet.block-engine.jito.wtf/api/v1")
    const tipAccount  = new web3.PublicKey(client.getTipAccounts())
    const tip = 1000 // amount in lamports (1 SOL = 1e9 lamports)
    const tippingTx = new web3.Transaction().add(
        web3.SystemProgram.transfer({
            fromPubkey: TRADER,
            toPubkey: tipAccount,
            lamports: tip, 
        })
    );

    // Ensure transactions are in an array format
    const transactions = Array.isArray(removeLiquidityTx) ? removeLiquidityTx : [removeLiquidityTx];

    // Map each transaction to its corresponding JSON body
    const jsonBodies = transactions.map((tx, index) => {
        const v0Message = tx.compileMessage();

        // Serialize the transaction message to base64
        const serializedV0Message = Buffer.from(
        v0Message.serialize()
        ).toString('base64');

            return {
            "vault_id": process.env.VAULT_ID, // Replace with your vault ID
            "signer_type": "api_signer",
            "sign_mode": "triggered", // IMPORTANT
            "type": "solana_transaction",
            "details": {
                "type": "solana_serialized_transaction_message",
                "chain": "solana_mainnet",
                "push_mode": "manual", // IMPORTANT,
                "data": serializedV0Message,  // For legacy transactions, use `serializedLegacyMessage`
            },
        };
    });

    // console.log("Generated JSON Bodies:", JSON.stringify(jsonBodies, null, 2));

    fs.writeFileSync(
        'withdraw_tx.json',
        JSON.stringify(jsonBodies[0], null, 2), 
        'utf8'
    );
    console.log("Transaction data written to withdraw_tx.json");


}

main().catch(console.error);
