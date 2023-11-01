import { LCDClient, LCDClientConfig } from '@terra-money/feather.js';

export const settings = {
    // general settings section
    general: {
        
        // specify the chain ID you are working on
        chain_id: "columbus-5",

        // specify the options of the LCD you are working with
        lcd: new LCDClient({
            'columbus-5': {
                lcd: 'https://terra-classic-rpc.publicnode.com:443',
                chainID: 'columbus-5',
                gasAdjustment: 2.5,
                gasPrices: { uluna: 29.0 },
                prefix: 'terra',
                isClassic: true
            },
        }),

        // specify the details of the to-be-airdropped token
        // `airdrop_wallet` specifies the wallet that holds the tokens to be airdropped 
        // `airdrop_seed` contains the passphrase for the airdrop_wallet
        // `token` specifies the token CW20 contract address
        airdrop_cw20: {
            airdrop_wallet: 'terra1...',
            airdrop_seed: 'word1 word2 word3 ...',
            token: 'terra1...'
        },

        // specify the details of the to-be-airdropped native bank token
        // `airdrop_wallet` specifies the wallet that holds the tokens to be airdropped 
        // `airdrop_seed` contains the passphrase for the airdrop_wallet
        // `denom` specifies the tokens bank denom
        airdrop_native: {
            airdrop_wallet: 'terra1...',
            airdrop_seed: 'word1 word2 word3 ...',
            denom: 'denom'
        }
    },

    // These are settings for liquidity snapshotting
    // `lp_token` specifies the CW20 contract address of the liquidity token
    // `aidrop_blacklist` specifies a list of addresses that should _not_ be part of the snapshot
    liquidity: {
        lp_token: 'terra1...',
        airdrop_blacklist: []
    },

    // These are settings for delegations snapshotting
    // `valoper` specifies validator operator address of the validator to snapshot the delegations
    // `aidrop_blacklist` specifies a list of addresses that should _not_ be part of the snapshot
    delegations: {
        valoper: 'terravaloper1...',
        airdrop_blacklist: []
    },
};
