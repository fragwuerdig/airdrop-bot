import * as fs from 'fs';
import { CreateTxOptions, LCDClientConfig, MnemonicKey, MnemonicKeyOptions, MsgExecuteContract, Tx } from '@terra-money/feather.js';
import {settings} from './settings'
import { airdropCW20Msgs } from './common';
import { setMaxIdleHTTPParsers } from 'http';
import { getSystemErrorMap } from 'util';
import { threadId } from 'worker_threads';
import { exit } from 'process';

// main call
async function main() {

    if ( !process.argv[2] ) {
        console.log("no filename provided")
        return
    }
    let filename = process.argv[2]
	let rawData = fs.readFileSync(filename, 'utf8');
    let jsonData = JSON.parse(rawData);
    let map = new Map<string, number>
    jsonData.list.forEach(function(item) {
        map.set(item.wallet, item.amount)
    })
    let msgs = airdropCW20Msgs(
        map,
        settings.general.airdrop_cw20.airdrop_wallet,
        settings.general.airdrop_cw20.token
    )
    
    const mk = new MnemonicKey({
        mnemonic: settings.general.airdrop_cw20.airdrop_seed
    })
    const wallet = settings.general.lcd.wallet(mk);

    let id = settings.general.chain_id
    const signedTx = await wallet.createAndSignTx({
        msgs: msgs,
        memo: 'airdrop',
        chainID: id,
        sequence: 494539
    }).catch((reason) => {console.log(reason)});

    console.log(signedTx)

    let result = await settings.general.lcd.tx.broadcast(signedTx as Tx, settings.general.chain_id)
        .catch((reason) => console.log(reason))
    
    console.log(result)
    

}

main()