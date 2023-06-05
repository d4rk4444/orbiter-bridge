import Web3 from 'web3';
import { info, orbiter } from './other.js';
import { bridgeAbi } from './abi.js';
import chalk from 'chalk';
import { Account, Contract, ec, json, stark, Provider, hash, number, uint256, SequencerProvider, RpcProvider } from 'starknet';

export const bridgeETHToStarknet = async(rpc, amountETH, addressStarknet, addressFrom) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(bridgeAbi, orbiter.routerToken);

    const data = await contract.methods.transfer(
        orbiter.routerETH,
        '0x30' + (addressStarknet).slice(2)
    );

    const encodeABI = data.encodeABI();
    const estimateGas = await data.estimateGas({ from: addressFrom, value: amountETH });

    return { encodeABI, estimateGas };
}

export const privateToStarknetAddress = async(privateKey) => {
    //new Argent X account v0.2.3 :
    const argentXproxyClassHash = "0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918";
    const argentXaccountClassHash = "0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2";

    const starkKeyPairAX = ec.getKeyPair(privateKey);
    const starkKeyPubAX = ec.getStarkKey(starkKeyPairAX);

    // Calculate future address of the ArgentX account
    const AXproxyConstructorCallData = stark.compileCalldata({
        implementation: argentXaccountClassHash,
        selector: hash.getSelectorFromName("initialize"),
        calldata: stark.compileCalldata({ signer: starkKeyPubAX, guardian: "0" }),
    });

    let AXcontractAddress = hash.calculateContractAddressFromHash(
        starkKeyPubAX,
        argentXproxyClassHash,
        AXproxyConstructorCallData,
        0
    );
    AXcontractAddress = stark.makeAddress(AXcontractAddress);

    return AXcontractAddress;
}

export const sendStarknetTX = async(rpc, payload, privateKey) => {
    const provider = new RpcProvider({ nodeUrl: rpc });
    const starkKeyPair = ec.getKeyPair(privateKey);
    const address = await privateToStarknetAddress(privateKey);
    const account = new Account(provider, address, starkKeyPair);

    try {
        const executeHash = await account.execute(payload);
        console.log(chalk.white(`Send TX: ${info.explorerStarknet + executeHash.transaction_hash}`));
        console.log(chalk.yellow(`Wait for result...`));
        const res = await provider.waitForTransaction(executeHash.transaction_hash);
        console.log(chalk.green(`Fee: ${parseFloat(number.hexToDecimalString(res.actual_fee) / 10**18).toFixed(6)}ETH`));
    } catch (err) {
        throw new Error(`Error Starknet TX: ${err.message}`);
    }
}

export const getAmountTokenStark = async(rpc, walletAddress, tokenAddress, abiAddress) => {
    const w3 = new Web3();
    const provider = new RpcProvider({ nodeUrl: rpc });

    if (!abiAddress) { abiAddress = tokenAddress };
    const { abi: abi } = await provider.getClassAt(abiAddress);
    if (abi === undefined) { throw new Error("no abi.") };
    const contract = new Contract(abi, tokenAddress, provider);
    const balance = await contract.balanceOf(walletAddress);

    return w3.utils.hexToNumberString(uint256.bnToUint256(balance[0].low).low);
}

export const dataBridgeETHFromStarknet = async(amountETH, toAddress) => {
    const payload = [{
        contractAddress: info.Starknet.ETH,
        entrypoint: "approve",
        calldata: stark.compileCalldata({
            spender: '0x0173f81c529191726c6e7287e24626fe24760ac44dae2a1f7e02080230f8458b',
            amount: {type: 'struct', low: info.approveAmount, high: '0'},
        })
    },
    {
        contractAddress: '0x0173f81c529191726c6e7287e24626fe24760ac44dae2a1f7e02080230f8458b',
        entrypoint: "transferERC20",
        calldata: stark.compileCalldata({
            _token: info.Starknet.ETH,
            _to: '0x07b393627bd514d2aa4c83e9f0c468939df15ea3c29980cd8e7be3ec847795f0',
            _amount: {type: 'struct', low: amountETH.toString(), high: '0'},
            _ext: toAddress
        })
    }];

    return payload;
}

export const estimateInvokeMaxFee = async(rpc, payload, privateKey) => {
    const provider = new RpcProvider({ nodeUrl: rpc });
    const starkKeyPair = ec.getKeyPair(privateKey);
    const address = await privateToStarknetAddress(privateKey);
    const account = new Account(provider, address, starkKeyPair);

    const res = await account.estimateInvokeFee(payload);
    return number.hexToDecimalString(uint256.bnToUint256(res.suggestedMaxFee).low);
}

export const estimateMsgFee = async(l2Recipient, amountDeposit) => {
    const w3 = new Web3();
    const provider = new SequencerProvider({
        baseUrl: 'https://alpha-mainnet.starknet.io/',
        feederGatewayUrl: 'feeder_gateway',
        gatewayUrl: 'gateway',
    });

    const responseEstimateMessageFee = await provider.estimateMessageFee({
        from_address: '0xae0ee0a63a2ce6baeeffe56e7714fb4efe48d419',
        to_address: '0x073314940630fd6dcda0d772d4c972c4e0a9946bef9dabf4ef84eda8ef542b82',
        entry_point_selector: "handle_deposit",
        payload: [w3.utils.hexToNumberString(l2Recipient), amountDeposit, '0']
    });

    const msgFee = responseEstimateMessageFee.overall_fee;

    return msgFee;
}