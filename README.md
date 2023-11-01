# Airbot

this is a selection of tools around the task of airdropping (for either CW20 or native tokens). This repository is work-in-progress. It's subject to modification and/or extension while the author is working on his projects. Feel free to drop any comments or issues or requests.

This project has the following features:

- Airdrop CW20 tokens from a single airdrop wallet (native taxless token support incoming)
- Snapshot and record delegators for a particular validator
- Snapshot and record liquidity providers on a swap pool

## General Setup

The particular setup depends on the task that you want to achieve. The common steps to setup this repository are the following:

```
# Clone the repository
$ git clone https://github.com/fragwuerdig/airdrop-bot

# CD into the repo
$ cd airdrop-bot

# Install Dependencies
$ npm i

# Copy and Move the settings template
$ cp settings.template.ts src/settings.ts
```

## Airdropping (CW20)

If you want to airdrop people with CW20 tokens from a wallet then open the `settings.ts` in your favorite editor and modify the sections `general.lcd`, `general.chain_id` and `general.airdrop_cw20` accordingly. Please, also note the comments in the file.

To proceed, this guide is going to assume that you have an existing CSV file (`input.csv`) of the following format:

```
wallet, amount
terra1abc..., 12345
terra1def..., 321987
...
```

Follow these steps to send tokens to your eligible airdrop recipients:

```
# Convert the input CSV into a json format that is understood by the airbot:
$ npm run csv -- input.csv airdrop_file.json

# Use the output json to do the airdrop
$ npm run airdrop -- airdrop_file.json

```
