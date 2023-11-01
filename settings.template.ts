import { LCDClient, LCDClientConfig } from '@terra-money/feather.js';

export const settings = {
    general: {
        chain_id: "columbus-5",
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
        airdrop_cw20: {
            airdrop_wallet: 'terra1...',
            airdrop_seed: 'word1 word2 word3 ...',
            token: 'terra1...'
        },
        airdrop_native: {
            airdrop_wallet: 'terra1...',
            airdrop_seed: 'word1 word2 word3 ...',
            denom: 'denom'
        }
    },
    liquidity: {
        lp_token: 'terra1...',
        airdrop_blacklist: []
    },
    delegations: {
        valoper: 'terravaloper1...',
        airdrop_blacklist: []
    },
};
