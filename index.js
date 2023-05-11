import { info,
    orbiter,
    timeout,
    parseFile,
    generateRandomAmount,
    privateToAddress } from './src/other.js';
import { dataSendToken, getETHAmount, getEstimateGas, getGasPrice, sendEVMTX, toWei } from './src/web3.js';
import { bridgeETHToStarknet } from './src/starknet.js';
import { subtract, multiply, divide, pow, add, number } from 'mathjs';
import fs from 'fs';
import readline from 'readline-sync';
import consoleStamp from 'console-stamp';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
dotenv.config();

const output = fs.createWriteStream(`history.log`, { flags: 'a' });
const logger = new console.Console(output);
consoleStamp(console, { format: ':date(HH:MM:ss)' });
consoleStamp(logger, { format: ':date(yyyy/mm/dd HH:MM:ss)', stdout: output });

const bridgeETHOrbiter = async(fromChain, toChain, privateKey, toAddress) => {
    const address = privateToAddress(privateKey);
    const random = generateRandomAmount(process.env.PERCENT_BRIDGE_MIN / 100, process.env.PERCENT_BRIDGE_MAX / 100, 3);

    let isReady;
    while(!isReady) {
        try {
            const rpc = info['rpc' + fromChain];
            await getETHAmount(rpc, address).then(async(amountETH) => {
                await getGasPrice(rpc).then(async(gasPrice) => {
                    gasPrice = parseFloat(gasPrice * 1.2).toFixed(4).toString();

                    let gasLimit = fromChain == 'Arbitrum' ? await getEstimateGas(rpc, '0x', '100000', address) : 21000;
                    gasLimit = fromChain == 'zkSyncEra' ? (await dataSendToken(rpc, info.ETH, orbiter.routerETH, '100000', address)).estimateGas : gasLimit;
                    gasLimit = toChain == 'Starknet' ? (await bridgeETHToStarknet(rpc, '100000', toAddress, address)).estimateGas : gasLimit;
                    gasLimit = parseInt(multiply(gasLimit, 1.2));

                    const amountFee = parseInt(add(multiply(gasLimit, gasPrice * 10**9), orbiter[toChain].holdFee * 10**18));
                    amountETH = toWei(parseFloat(multiply(subtract(amountETH, amountFee), random) / pow(10, 22)).toFixed(8).toString(), 'Ether') + orbiter[toChain].chainId;

                    const data = toChain == 'Starknet' ? (await bridgeETHToStarknet(rpc, amountETH, toAddress, address)).encodeABI : null;
                    if (Number(amountETH) > add(orbiter.minAmount, orbiter[toChain].holdFee) * 10**18) {
                        const typeTX = fromChain == 'Optimism' || fromChain == 'BSC' ? 0 : 2;
                        const bridgeOrbiter = toChain == 'Starknet' ? orbiter.routerToken : orbiter.routerETH;
                        await sendEVMTX(rpc, typeTX, gasLimit, bridgeOrbiter, amountETH, data, privateKey, gasPrice, gasPrice);
                        console.log(chalk.yellow(`Bridge ${parseFloat(amountETH / 10**18).toFixed(4)}ETH ${fromChain} -> ${toChain}`));
                        logger.log(`Bridge ${parseFloat(amountETH / 10**18).toFixed(4)}ETH ${fromChain} -> ${toChain}`);
                        isReady = true;
                    } else {
                        isReady = true;
                        logger.log(`You can\'t send less than 0.005 + holdFee ${orbiter[toChain].holdFee} ETH`);
                        console.log(chalk.gray(`You can\'t send less than 0.005 + holdFee ${orbiter[toChain].holdFee} ETH`));
                    }
                });
            });
        } catch (err) {
            logger.log(err);
            console.log(err.message);
            return;
        }
    }
}

(async() => {
    const wallet = parseFile('private.txt');
    const walletStarknet = parseFile('addressStarknet.txt');
    const mainStage = [
        'ARBITRUM -> zKSYNC ERA',
        'ARBITRUM -> STARKNET',
        'ARBITRUM -> OPTIMISM',
        'zKSYNC ERA -> ARBITRUM',
        'OPTIMISM -> ARBITRUM',
    ];

    const index = readline.keyInSelect(mainStage, 'Choose stage!');
    if (index == -1) { process.exit() };
    console.log(chalk.green(`Start ${mainStage[index]}`));
    logger.log(`Start ${mainStage[index]}`);
    
    for (let i = 0; i < wallet.length; i++) {
        let pauseWalletTime = generateRandomAmount(process.env.TIMEOUT_WALLET_SEC_MIN * 1000, process.env.TIMEOUT_WALLET_SEC_MAX * 1000, 0);
        try {
            console.log(chalk.blue(`Wallet ${i+1}: ${privateToAddress(wallet[i])}`));
            logger.log(`Wallet ${i+1}: ${privateToAddress(wallet[i])}`);
        } catch (err) { throw new Error('Error: Add Private Keys!') };

        if (index == 0) {
            await bridgeETHOrbiter('Arbitrum', 'zkSyncEra', wallet[i]);
        } else if (index == 1) {
            await bridgeETHOrbiter('Arbitrum', 'Starknet', wallet[i], walletStarknet[i]);
        } else if (index == 2) {
            await bridgeETHOrbiter('Arbitrum', 'Optimism', wallet[i]);
        } else if (index == 3) {
            await bridgeETHOrbiter('zkSyncEra', 'Arbitrum', wallet[i]);
        } else if (index == 4) {
            await bridgeETHOrbiter('Optimism', 'Arbitrum', wallet[i]);
        }

        await timeout(pauseWalletTime);
    }
    console.log(chalk.bgMagentaBright('Process End!'));
    logger.log('Process End!');
})();