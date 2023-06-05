import Web3 from 'web3';
import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

export const info = {
    rpcEthereum: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    rpcArbitrum: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    rpcOptimism: `https://optimism-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    rpczkSyncEra: 'https://mainnet.era.zksync.io',
    rpcStarknet: `https://starknet-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    explorerEthereum: 'https://etherscan.io/tx/',
    explorerArbitrum: 'https://arbiscan.io/tx/',
    explorerOptimism: 'https://optimistic.etherscan.io/tx/',
    explorerzkSyncEra: 'https://explorer.zksync.io/tx/',
    explorerStarknet: 'https://voyager.online/tx/',
    ETH: '0x0000000000000000000000000000000000000000',
    Starknet: {
        ETH: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        ETHAbi: '0x48624e084dc68d82076582219c7ed8cb0910c01746cca3cd72a28ecfe07e42d',
    },
    approveAmount: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
}

export const orbiter = {
    routerETH: '0x80C67432656d59144cEFf962E8fAF8926599bCF8',
    routerToken: '0xD9D74a29307cc6Fc8BF424ee4217f1A587FBc8Dc',
    minAmount: 0.005,
    Arbitrum: {
        chainId: '9002',
        holdFee: 0.0009,
    },
    Optimism: {
        chainId: '9007',
        holdFee: 0.0017,
    },
    zkSyncEra: {
        chainId: '9014',
        holdFee: 0.0016,
    },
    Starknet: {
        chainId: '9004',
        holdFee: 0.0012,
    }
}

export const timeout = ms => new Promise(res => setTimeout(res, ms));

export const generateRandomAmount = (min, max, num) => {
    const amount = Number(Math.random() * (parseFloat(max) - parseFloat(min)) + parseFloat(min));
    return Number(parseFloat(amount).toFixed(num));
}

export const parseFile = (file) => {
    const data = fs.readFileSync(file, "utf-8");
    const array = (data.replace(/[^a-zA-Z0-9\n]/g,'')).split('\n');
    return array;
}

export const privateToAddress = (privateKey) => {
    const w3 = new Web3();
    return w3.eth.accounts.privateKeyToAccount(privateKey).address;
}