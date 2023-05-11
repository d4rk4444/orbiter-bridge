import Web3 from 'web3';
import { info, orbiter } from './other.js';
import { bridgeAbi } from './abi.js';

export const bridgeETHToStarknet = async(rpc, amountETH, addressStarknet, addressFrom) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(bridgeAbi, orbiter.routerToken);

    const data = await contract.methods.transfer(
        orbiter.routerETH,
        addressStarknet
    );

    const encodeABI = data.encodeABI();
    const estimateGas = await data.estimateGas({ from: addressFrom, value: amountETH });

    return { encodeABI, estimateGas };
}