import { Delegation, LCDClient, Coin, ValAddress, ContractEvent, Wallet, WasmMsg, MsgExecuteContract } from '@terra-money/feather.js';
import { Balance } from './entities/Balance'
import { Snapshot } from './entities/Snapshot';
import { DataSource, createConnection } from 'typeorm';

const lcd = new LCDClient({
	'columbus-5': {
		lcd: 'http://85.214.40.68:1317',
		chainID: 'columbus-5',
		gasAdjustment: 1.5,
		gasPrices: { uluna: 29.0 },
		prefix: 'terra',
		isClassic: true,
	},
});

type AllAccountsResponse = {
	accounts: string[]
}

type BalanceResponse = {
    balance: number,
}

type DelegationsResponse = {
	delegator: string,
	amount: number,
}

async function getDelegators(
	valoper: string,
	paginationLimit?: number,
	filterWallets?: Array<string>
): Promise<Balance[]> {

	const limit = paginationLimit ? paginationLimit : 30;
	var delegators = [];
	var nextKey: string = "";

	do {
		console.log("bla")
		const delegatorsResponse = await lcd.staking.delegations(
			undefined,
			valoper,
			{
				'pagination.key': nextKey,
				'pagination.limit': limit.toString(),
			}
		);
		const delegationsResponse = delegatorsResponse[0].map( item => {
			const ret = new Balance();
			ret.address = item.delegator_address;
			ret.balance = item.balance.amount.toNumber();
			return ret;
		});
		const delegationsResponseFiltered = delegationsResponse.filter( element => {
			return filterWallets.includes(element.address) ? false : true; 
		});
		delegators = delegators.concat(delegationsResponseFiltered);
		nextKey = delegatorsResponse[1].next_key;
	} while (nextKey)

	return delegators;

}

// get a list of liquidity providers (= LP-token holders)
async function getLProviders(
	lpToken: string,
	paginationLimit?: number,
	filterWallets?: Array<string>
): Promise<string[]> {

	const limit = paginationLimit ? paginationLimit : 30;
	var liqProviders = [];
	var nextKey: string = "";
	do {

		const accountsResponse : AllAccountsResponse = await lcd.wasm.contractQuery(
			lpToken,
			nextKey ? {"all_accounts":{"limit": limit, "start_after": nextKey}} :  {"all_accounts":{"limit": limit}}
		);
		nextKey = accountsResponse.accounts.slice(-1)[0];
		const accountsResponseFiltered = accountsResponse.accounts.filter( element => {
			return filterWallets ? !filterWallets.includes(element) : true
		});
		liqProviders = liqProviders.concat(accountsResponseFiltered);
	} while (nextKey)
	return liqProviders;

}

// get the token balance for an address
async function getSingleBalance(
	lcd: LCDClient,
	lpToken: string,
	address: string,
): Promise<number> {

	let response: BalanceResponse = await lcd.wasm.contractQuery(
		lpToken,
		{"balance":{"address": address}},
	);
	return response.balance;

}

// get the token balance for a list of addresses
async function getBalances(
	lcd: LCDClient,
	lpToken: string,
	addresses: Array<string>,
): Promise<Balance[]> {

	const response = await Promise.all(
		addresses.map(async (item) => {
		  const balance = await getSingleBalance(lcd, lpToken, item);
		  const ret = new Balance();
		  ret.address = item;
		  ret.balance = balance;
		  return ret;
		})
	  );
	  return response;
	
}

async function fetchSnapshots(
	connection: DataSource,
	daysBack: number
): Promise<Snapshot[]> {

	const oneWeekAgo = new Date();
	oneWeekAgo.setDate(oneWeekAgo.getDate() - daysBack);
    const result = await connection
		.getRepository(Snapshot)
		.createQueryBuilder('snapshot')
		.leftJoinAndSelect('snapshot.balances', 'balances')
		.where('snapshot.timestamp >= :oneWeekAgo', { oneWeekAgo })
		.getMany();
	return result;
	
}

function calcAverages(
	snapshots: Snapshot[]
): Map<string, number>{

	const allBalances = snapshots.flatMap((snapshot) => snapshot.balances);

	// Use Array.reduce to calculate sums and counts for each address
	const addressSumMap = allBalances.reduce((accumulator, balance) => {
  		const address = balance.address;
  		const amount = +balance.balance;
  		if (!accumulator.has(address)) {
    		accumulator.set(address, amount);
			return accumulator;
  		}
  		accumulator.set(
			address,
			accumulator.get(address) + amount
		);
  		return accumulator;
	}, new Map<string, number>());
	
	addressSumMap.forEach((value, key, map) => {
		map.set(key, value / snapshots.length);
  	});

	return addressSumMap;

}

function calcSum(
	input: Map<string, number>
): number {

	const values = Array.from(input.values());
	const sum = values.reduce((acc: number, curr: number) => {
		return acc + curr;
	}, +0.0);
	return sum;

}

function pieChart(
	input: Map<string, number>
): Map<string, number> {

	const ret = new Map<string, number>;
	const sum = calcSum(input);
	input.forEach((value, key, input) => {
		ret.set(key, value/sum)
	});
	return ret;

}

function multiplySingle(
	input: Map<string, number>,
	mult: number
): Map<string, number> {

	let output = new Map<string, number>;
	input.forEach((num, address, input) => {
		output.set(address, mult*num);
	});
	return output;

}

// input a pie chart and a total amount of coins to airdrop of cw20 token
function airdropCW20Msgs(
	input: Map<string, number>,
	wallet: string,
	token: string,
	precision?: number
): Array<MsgExecuteContract> {

	let msgs = []
	input.forEach((amnt, address, input) => {
		const msg = new MsgExecuteContract(
			wallet, // sender (the airdrop wallet)
			token, // contract (the cw20 to be airdropped)
			{
				"transfer":{
					"from": wallet,	// (the airdrop wallet)
					"to": address,	//
					"amount": Math.floor(amnt)
				}
			}
		);
		msgs.push(msg);
	});
	return msgs;

}

const lpAddress = "terra1tarp9mv3qpckcjz943g90x5p3xy4eqqynrhl3ncre8yumpg26mrsfh2adv";
const lpFilter = [
	'terra17yjncjupvk0kmpmhe6gnwny70z4zjkrn4600lpsaz7v0menddggscsvwxm',
	'terra1tarp9mv3qpckcjz943g90x5p3xy4eqqynrhl3ncre8yumpg26mrsfh2adv'
];
const airdropWallet = "";
const airdropToken = "";

// main call
async function main() {

	// record LPs
	/*const connection = await createConnection();
	const lps = await getLProviders(lpAddress, undefined, lpFilter);
	const pairs = await getBalances(
		"terra1tarp9mv3qpckcjz943g90x5p3xy4eqqynrhl3ncre8yumpg26mrsfh2adv",
		lps
	);
	console.log(pairs);
	const snapshot = new Snapshot();
	snapshot.balances = pairs;
	const dbResponse = await connection.manager.save(snapshot);
	console.log(dbResponse);*/
	
	// record Delegators
	/*const connection = await createConnection();
	const delegators = await getDelegators(
		'terravaloper1uml7n30kyndkmjvrgy6d63kffpn6hvztx3fxr6',
		10,
		['terra1uml7n30kyndkmjvrgy6d63kffpn6hvztx79mnf']
	);
	const snapshot = new Snapshot();
	snapshot.balances = delegators;
	const dbResponse = await connection.manager.save(snapshot);
	console.log(dbResponse);;*/
	
	// config
	const airdrop_rate = 0.005;

	// database
	const connection = await createConnection("liquidity");
	const snapshots = await fetchSnapshots(connection, 31);
	
	//
	const averages = calcAverages(snapshots);
	const airdropShares = pieChart(averages);
	const totalAirdropAmnt = await getSingleBalance(
		lcd,
		airdropToken,
		airdropWallet
	);
	const airdropAmntThisRound = Math.floor(
		totalAirdropAmnt * airdrop_rate
	);
	const airdropAmnts = multiplySingle(
		airdropShares,
		airdropAmntThisRound
	);
	const airdropMsgs = airdropCW20Msgs(
		airdropAmnts,
		airdropWallet,
		airdropToken
	);
	
	//console.log(snapshots);
	//console.log(averages);
	//console.log(snapshots.length);
	console.log(airdropMsgs);


}

main();


