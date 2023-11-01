import { Delegation, LCDClient, Coin, ValAddress, ContractEvent, Wallet, WasmMsg, MsgExecuteContract } from '@terra-money/feather.js';
import { Balance } from './entities/Balance'
import { Snapshot } from './entities/Snapshot';
import { DataSource, createConnection } from 'typeorm';
import { settings } from './settings'

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

type Cw20Transfer = {
	recipient: string,
	amount: number,
}

export async function getDelegators(
    lcd: LCDClient,
	valoper: string,
	paginationLimit?: number,
	filterWallets?: Array<string>
): Promise<Balance[]> {

	const limit = paginationLimit ? paginationLimit : 30;
	var delegators = [];
	var nextKey: string = "";

	do {
		console.log("fetching delegators")
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
export async function getLProviders(
    lcd: LCDClient,
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
			return !filterWallets.includes(element);
		});
		liqProviders = liqProviders.concat(accountsResponseFiltered);
	} while (nextKey)
	return liqProviders;

}

// get the token balance for an address
export async function getSingleBalance(
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
export async function getBalances(
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

export async function fetchSnapshots(
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

export function calcAverages(
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

export function calcSum(
	input: Map<string, number>
): number {

	const values = Array.from(input.values());
	const sum = values.reduce((acc: number, curr: number) => {
		return acc + curr;
	}, +0.0);
	return sum;

}

export function pieChart(
	input: Map<string, number>
): Map<string, number> {

	const ret = new Map<string, number>;
	const sum = calcSum(input);
	input.forEach((value, key, input) => {
		ret.set(key, value/sum)
	});
	return ret;

}

export function multiplySingle(
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
export function airdropCW20Msgs(
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
					//"from": wallet,	// (the airdrop wallet)
					"recipient": address,	//
					"amount": Math.floor(amnt).toString()
				}
			}
		);
		msgs.push(msg);
	});
	return msgs;

}