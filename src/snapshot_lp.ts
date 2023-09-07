import { DataSource, createConnection } from 'typeorm';
import { getLProviders, getBalances } from './common';
import { settings } from './settings';
import { Snapshot } from './entities/Snapshot';

// main call
async function main() {

	const connection = await createConnection("liquidity");

	const lps = await getLProviders(
		settings.general.lcd,
		settings.liquidity.lp_token,
		undefined,
		settings.liquidity.airdrop_blacklist
	);
	const pairs = await getBalances(
		settings.general.lcd,
		settings.liquidity.lp_token,
		lps,
	);
	const snapshot = new Snapshot();
	snapshot.balances = pairs;
	const dbResponse = await connection.manager.save(snapshot);

}

main();


