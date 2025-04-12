import { ethers } from 'ethers';

// Define contract addresses and ABIs (Ensure these are correct)
const affectionTokenAddress = '0x24F0154C1dCe548AdF15da2098Fdd8B8A3B8151D';
const lotteryContractAddress = '0xf729Be9fde78Ea358b787f0E87170438C0743737';

const affectionTokenABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const lotteryContractABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_lotteryId",
                "type": "uint256"
            }
        ],
        "name": "joinLottery",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

export async function connectWallet() {
    try {
        if (typeof window.ethereum !== 'undefined') {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const provider = new ethers.BrowserProvider(window.ethereum);
            if (!provider) {
                console.log('User rejected wallet connection.');
                return null;
            }
            const signer = await provider.getSigner();
            return signer;
        } else {
            console.log('MetaMask not detected.');
            return null;
        }
    } catch (error) {
        console.error("Could not connect wallet:", error);
        return null;
    }
}

export async function approveTokens(signer, amount) {
    try {
        const affectionTokenContract = new ethers.Contract(affectionTokenAddress, affectionTokenABI, signer);
        const transaction = await affectionTokenContract.approve(lotteryContractAddress, amount);
        await transaction.wait(); // Wait for the transaction to be mined
        console.log("Token approval successful!");
    } catch (error) {
        console.error("Token approval failed:", error);
        throw error;
    }
}

export async function enterLottery(signer, amount, lotteryId) {
    try {
        const lotteryContract = new ethers.Contract(lotteryContractAddress, lotteryContractABI, signer);
        const transaction = await lotteryContract.joinLottery(amount, lotteryId, { gasLimit: 300000 });
        await transaction.wait();
        console.log('Lottery entry successful!');
    } catch (error) {
        console.error('Lottery entry failed:', error);
        throw error;
    }
}
