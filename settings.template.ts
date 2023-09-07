import { LCDClient } from '@terra-money/feather.js';

export const settings = {
    general: {
        lcd: new LCDClient({
            'columbus-5': {
                lcd: 'https://terra-classic-lcd.publicnode.com',
                chainID: 'columbus-5',
                gasAdjustment: 2.5,
                gasPrices: { uluna: 29.0 },
                prefix: 'terra',
            },
        }),
    },
    liquidity: {
        lp_token: 'terra1...',
        airdrop_blacklist: [
            'terra1...',
            'terra1...',
        ]
    },
    delegations: {
        valoper: 'terravaloper1...',
        airdrop_blacklist: [
            'terra1...',
            'terra1...',
        ]
    },
};
