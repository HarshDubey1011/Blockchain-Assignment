#!/usr/bin/env node

const fs = require('fs');
const { Command } = require('commander');
const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');

const program = new Command();
const walletsFile = 'wallets.json';

// Check if wallets file exists, if not create it
if (!fs.existsSync(walletsFile)) {
    fs.writeFileSync(walletsFile, JSON.stringify({ wallets: [] }));
}

program
    .command('create')
    .description('Create a new BIP39 wallet')
    .action(() => {
        const mnemonic = bip39.generateMnemonic();
        const wallet = bitcoin.bip32.fromSeed(bip39.mnemonicToSeedSync(mnemonic)).toWIF();
        const newWallet = { mnemonic, address: bitcoin.payments.p2pkh({ pubkey: bitcoin.bip32.fromBase58(wallet).publicKey }).address };
        const data = JSON.parse(fs.readFileSync(walletsFile));
        data.wallets.push(newWallet);
        fs.writeFileSync(walletsFile, JSON.stringify(data, null, 2));
        console.log('New wallet created successfully!');
        console.log('Mnemonic:', newWallet.mnemonic);
        console.log('Address:', newWallet.address);
    });

program
    .command('import <mnemonic>')
    .description('Import a BIP39 wallet from mnemonic')
    .action((mnemonic) => {
        const wallet = bitcoin.bip32.fromSeed(bip39.mnemonicToSeedSync(mnemonic)).toWIF();
        const address = bitcoin.payments.p2pkh({ pubkey: bitcoin.bip32.fromBase58(wallet).publicKey }).address;
        const data = JSON.parse(fs.readFileSync(walletsFile));
        data.wallets.push({ mnemonic, address });
        fs.writeFileSync(walletsFile, JSON.stringify(data, null, 2));
        console.log('Wallet imported successfully!');
        console.log('Address:', address);
    });

program
    .command('list')
    .description('List all wallets')
    .action(() => {
        const data = JSON.parse(fs.readFileSync(walletsFile));
        data.wallets.forEach(wallet => {
            console.log('Address:', wallet.address);
        });
    });

program
    .command('balance <address>')
    .description('Get bitcoin balance of a wallet')
    .action(async (address) => {
        try {
            const response = await axios.get(`https://blockchain.info/q/addressbalance/${address}`);
            console.log('Balance:', response.data / 1e8, 'BTC');
        } catch (error) {
            console.error('Error retrieving balance:', error.response.data);
        }
    });

program
    .command('transactions <address>')
    .description('Get the list of bitcoin transactions of a wallet')
    .action(async (address) => {
        try {
            const response = await axios.get(`https://blockchain.info/rawaddr/${address}`);
            console.log('Transactions:', response.data.txs.map(tx => tx.hash));
        } catch (error) {
            console.error('Error retrieving transactions:', error.response.data);
        }
    });

program
    .command('generate-address <mnemonic>')
    .description('Generate an unused bitcoin address for a wallet')
    .action((mnemonic) => {
        const wallet = bitcoin.bip32.fromSeed(bip39.mnemonicToSeedSync(mnemonic)).toWIF();
        const newAddress = bitcoin.payments.p2pkh({ pubkey: bitcoin.bip32.fromBase58(wallet).publicKey }).address;
        console.log('New Address:', newAddress);
    });

program.parse(process.argv);
