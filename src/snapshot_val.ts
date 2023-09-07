import { DataSource, createConnection } from 'typeorm';
import { getDelegators, getLProviders, getBalances } from './common';
import { settings } from './settings';
import { Snapshot } from './entities/Snapshot';

// main call
async function main() {

	const connection = await createConnection("delegations");
	const delegators = await getDelegators(
		settings.general.lcd,
		settings.delegations.valoper,
		10,
		settings.delegations.airdrop_blacklist
	);
	const snapshot = new Snapshot();
	snapshot.balances = delegators;
	const dbResponse = await connection.manager.save(snapshot);
	console.log(dbResponse);

}

main();


