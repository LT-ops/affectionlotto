import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { connectWallet, approveTokens, enterLottery } from './lotteryService';
import './MyDapp.css';
// import xLogo from './x_logo.png';
// import telegramLogo from './telegram_logo.png';
// import websiteLogo from './website_logo.png';

function MyDapp() {
  console.log('MyDapp component rendered');
  const [walletConnected, setWalletConnected] = useState(false);
  const [signer, setSigner] = useState(null);
  const [tokenAmount, setTokenAmount] = useState('');
  const [networkError, setNetworkError] = useState(null);
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [lotteryData, setLotteryData] = useState({
    prizePool: 0,
    ticketPrices: [0, 0, 0],
    numParticipants: [0, 0, 0],
  });
  const [affectionBalance, setAffectionBalance] = useState(0);

  const dev2TaxPercentage = 25; // Percentage for top participants
  const devFeePercentage = 5; // Percentage for site improvements
  const contractAddress = '0xC863fE879EB06D3999eD80a04bBA21ab41966C0a'; // Replace with your actual contract address

  async function isPulseChainConnected() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        return chainId === '0x171'; // PulseChain chain ID (369 in decimal)
      } catch (error) {
        console.error('Error checking network:', error);
        return false;
      }
    }
    return false;
  }

  async function switchToPulseChain() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x171' }], // PulseChain chain ID
      });
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x171',
              chainName: 'PulseChain',
              nativeCurrency: {
                name: 'Pulse',
                symbol: 'PLS',
                decimals: 18
              },
              rpcUrls: ['https://rpc.pulsechain.com'],
              blockExplorerUrls: ['https://scan.pulsechain.com']
            }],
          });
        } catch (addError) {
          console.error('Error adding PulseChain:', addError);
          setNetworkError('Failed to add PulseChain network. Please add it manually to your wallet.');
        }
      } else {
        console.error('Error switching to PulseChain:', error);
        setNetworkError('Failed to switch to PulseChain. Please switch manually in your wallet.');
      }
    }
  }

  useEffect(() => {
    async function checkAndSwitchNetwork() {
      const isPulseChain = await isPulseChainConnected();
      if (!isPulseChain) {
        await switchToPulseChain();
      }
    }
    checkAndSwitchNetwork();
  }, []);

  const detectChain = useCallback(async () => {
    console.log('detectChain called');
    try {
      if (typeof window.ethereum !== 'undefined') {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        console.log('web3Provider created', web3Provider);
        setProvider(web3Provider);
        console.log('setProvider called');
      } else {
        console.log('MetaMask not detected.');
      }
    } catch (error) {
      console.error('Error detecting chain:', error);
    }
  }, []);

  useEffect(() => {
    // Detect blockchain provider and network
    detectChain();
  }, [detectChain]);

  useEffect(() => {
    console.log('MyDapp component mounted');
    window.addEventListener('error', (event) => {
      console.error('Global error captured:', event.error);
    });
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });

    return () => {
      window.removeEventListener('error', () => {});
      window.removeEventListener('unhandledrejection', () => {});
    };
  }, []);

  async function handleConnectWallet() {
    try {
      console.log('Attempting to connect wallet...');
      await detectChain();
      const isPulseChain = await isPulseChainConnected();
      if (!isPulseChain) {
        console.log('Switching to PulseChain...');
        await switchToPulseChain();
      }
      const connectedSigner = await connectWallet();
      if (connectedSigner) {
        setSigner(connectedSigner);
        setWalletConnected(true);
        const connectedAccount = await connectedSigner.getAddress();
        setAccount(connectedAccount);
        console.log('Wallet connected:', connectedAccount);
      } else {
        console.log('Wallet connection failed');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please check the console for details.');
    }
  }

  const handleApproveTokens = async () => {
    try {
      const amountString = tokenAmount.toString();
      const weiAmount = ethers.parseUnits(amountString, 18);
      await approveTokens(signer, weiAmount);
      console.log("Token approval successful!");
    } catch (error) {
      console.error("Token approval failed:", error);
    }
  };

  const handleEnterLottery = async () => {
    if (parseFloat(affectionBalance) < parseFloat(lotteryData.ticketPrices[0])) {
      alert("You don't have enough AFF tokens to enter the lottery. Please buy more AFF on PulseX.");
      return;
    }

    console.log('enterLottery called from button');
    console.log('signer:', signer);
    console.log('ticketPrice:', lotteryData.ticketPrices[0]);
    console.log('Before enterLottery');
    try {
      console.log('Inside try block');
      const ticketPriceRaw = lotteryData.ticketPrices[0];
      const ticketPriceWei = ethers.parseUnits(ticketPriceRaw.toString(), 18);
      await enterLottery(signer, ticketPriceWei, 0);
      console.log('After enterLottery');
    } catch (error) {
      alert("Transaction failed: " + error.message);
    }
  };

  useEffect(() => {
    console.log('useEffect called - Lottery Data');
    const fetchLotteryData = async () => {
      try {
        console.log('Fetching lottery data...');
        if (provider) {
          console.log('Provider is valid:', provider);
          try {
            console.log('Fetching lottery data');
            console.log('Contract address:', contractAddress);
            const lotteryContract = new ethers.Contract(
              contractAddress,
              [
                {
                  "inputs": [],
                  "name": "lotteryBalance",
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
                  "inputs": [],
                  "name": "viewTicketPrice",
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
                  "inputs": [],
                  "name": "viewTicketPrice1",
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
                  "inputs": [],
                  "name": "viewTicketPrice2",
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
                  "inputs": [],
                  "name": "viewTicket",
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
                  "inputs": [],
                  "name": "viewTicket1",
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
                  "inputs": [],
                  "name": "viewTicket2",
                  "outputs": [
                    {
                      "internalType": "uint256",
                      "name": "",
                      "type": "uint256"
                    }
                  ],
                  "stateMutability": "view",
                  "type": "function"
                }
              ],
              signer ? signer : provider
            );

            let lotteryBalance, ticketPrice, ticketPrice1, ticketPrice2, maxParticipants, maxParticipants1, maxParticipants2;
            try {
              lotteryBalance = await lotteryContract.lotteryBalance();
              ticketPrice = await lotteryContract.viewTicketPrice();
              ticketPrice1 = await lotteryContract.viewTicketPrice1();
              ticketPrice2 = await lotteryContract.viewTicketPrice2();
              maxParticipants = await lotteryContract.viewTicket();
              maxParticipants1 = await lotteryContract.viewTicket1();
              maxParticipants2 = await lotteryContract.viewTicket2();
            } catch (contractError) {
              console.error('Error fetching contract data:', contractError);
              return;
            }

            console.log('lotteryBalance raw:', lotteryBalance);
            console.log('ticketPrice raw (unformatted):', ticketPrice);
            console.log('ticketPrice1 raw (unformatted):', ticketPrice1);
            console.log('ticketPrice2 raw (unformatted):', ticketPrice2);
            console.log('maxParticipants raw:', maxParticipants);
            console.log('maxParticipants1 raw:', maxParticipants1);
            console.log('maxParticipants2 raw:', maxParticipants2);

            setLotteryData({
              prizePool: ethers.formatEther(lotteryBalance || 0),
              ticketPrices: [
                Math.max(500, ethers.formatEther(ticketPrice || 0)),
                ethers.formatEther(ticketPrice1 || 0),
                ethers.formatEther(ticketPrice2 || 0),
              ],
              numParticipants: [
                Number(maxParticipants || 0),
                Number(maxParticipants1 || 0),
                Number(maxParticipants2 || 0),
              ],
            });

            // Fetch Affection balance
            const affectionTokenContract = new ethers.Contract(
              '0x24F0154C1dCe548AdF15da2098Fdd8B8A3B8151D',
              [
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
                }
              ],
              signer
            );

            console.log('account:', account);
            const affectionBal = await affectionTokenContract.balanceOf(account);
            console.log('affectionBalance:', affectionBal);
            setAffectionBalance(ethers.formatEther(affectionBal));

            console.log('lotteryBalance formatted:', ethers.formatEther(lotteryBalance));
            console.log('ticketPrice formatted:', ethers.formatEther(ticketPrice));
            console.log('ticketPrice1 formatted:', ethers.formatEther(ticketPrice1));
            console.log('ticketPrice2 formatted:', ethers.formatEther(ticketPrice2));
            console.log('maxParticipants formatted:', maxParticipants);
            console.log('maxParticipants1 formatted:', maxParticipants1);
            console.log('maxParticipants2 formatted:', maxParticipants2);
          } catch (error) {
            console.error('Error fetching lottery data:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching lottery data:', error);
        alert('Failed to fetch lottery data. Please check the console for details.');
      }
    };

    fetchLotteryData();
  }, [provider, account]);

  return (
    <div className="my-dapp">
      <header>
        <h1>Affection Lottery</h1>
        <div className="social-links">
          <a href="https://x.com/affection_pls" target="_blank" rel="noopener noreferrer">
            <img src={process.env.PUBLIC_URL + "/x_logo.png"} alt="X Logo" width="20" height="20" />
            X (Twitter)
          </a>
          <a href="https://t.me/affection_pls" target="_blank" rel="noopener noreferrer">
            <img src={process.env.PUBLIC_URL + "/telegram_logo.png"} alt="Telegram Logo" width="20" height="20" />
            Telegram
          </a>
          <a href="https://linktr.ee/affection_pls" target="_blank" rel="noopener noreferrer">
            <img src={process.env.PUBLIC_URL + "/world-wide-web.png"} alt="Website Logo" width="20" height="20" />
            Website
          </a>
        </div>
      </header>
      
      {networkError && (
        <div className="network-error">
          <p>{networkError}</p>
          <p>
            To manually switch to PulseChain, follow these steps:
            <br />
            Go to Settings &amp; Networks &amp;gt; Add Network.
            <br />
            Enter the following details:
          </p>
          <ul>
            <li><b>Network Name:</b> PulseChain</li>
            <li><b>RPC URL:</b> https://rpc.pulsechain.com</li>
            <li><b>Chain ID:</b> 369</li>
            <li><b>Currency Symbol:</b> PLS</li>
            <li><b>Block Explorer URL:</b> https://scan.pulsechain.com</li>
          </ul>
        </div>
      )}

      <div className="wallet-info">
        <p>
          Wallet Connected: {walletConnected ? 'Yes' : 'No'}
        </p>
        {!walletConnected ? (
          <button onClick={handleConnectWallet}>Connect Wallet</button>
        ) : (
          <div>
            <p>Connected to PulseChain!</p>
            <p>Your account: {account}</p>
            <p>Affection Balance: {affectionBalance} AFF</p>
            <p>Cost to enter: {lotteryData.ticketPrices[0]} AFF</p>
          </div>
        )}
      </div>

      {walletConnected && (
        <div className="lottery-info">
          <h2>Lottery Tiers</h2>

          <p>Lottery Balance: {lotteryData.prizePool} AFF</p>
          <button onClick={() => window.open('https://pulsex.mypinata.cloud/ipfs/bafybeibzu7nje2o2tufb3ifitjrto3n3xcwon7fghq2igtcupulfubnrim/#/', '_blank')}>Buy AFF on PulseX</button>

          <div className="lottery-tier">
            <h3>Silver</h3>
            <p>{lotteryData.numParticipants[0]} spots - Cost: 500 AFF - Prize Pool: 3500 AFF</p>
            <div className="lottery-actions">
              <input
                type="text"
                placeholder="Enter token amount"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
              />
              <button className="cta-button" onClick={handleApproveTokens}>Approve Tokens</button>
              <button className="cta-button" onClick={handleEnterLottery}>Enter Lottery</button>
            </div>
          </div>

          <div className="lottery-tier">
            <h3>Gold</h3>
            <p>{lotteryData.numParticipants[1]} spots - Cost: 2000 AFF - Prize Pool: 7000 AFF</p>
            <div className="lottery-actions">
              <input
                type="text"
                placeholder="Enter token amount"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
              />
              <button className="cta-button" onClick={handleApproveTokens}>Approve Tokens</button>
              <button className="cta-button" onClick={handleEnterLottery}>Enter Lottery</button>
            </div>
          </div>

          <div className="lottery-tier">
            <h3>Diamond</h3>
            <p>{lotteryData.numParticipants[2]} spots - Cost: 5000 AFF - Prize Pool: 7000 AFF</p>
            <div className="lottery-actions">
              <input
                type="text"
                placeholder="Enter token amount"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
              />
              <button className="cta-button" onClick={handleApproveTokens}>Approve Tokens</button>
              <button className="cta-button" onClick={handleEnterLottery}>Enter Lottery</button>
            </div>
          </div>
          <div className="lottery-summary">
            <p>Winning Pot Taxed: 30%</p>
            <p>Prize Pool Tax: 25%</p>
            <p>Affection tipjar: 5%</p>
            <a className="contract-link" href="https://scan.9mm.pro/address/0xC863fE879EB06D3999eD80a04bBA21ab41966C0a" target="_blank" rel="noopener noreferrer">
              View Contract on PulseScan
            </a>
          </div>
          <div className="participants">
            <h3>Participants:</h3>
            {participants && participants.length > 0 ? (
              <ul>
                {participants.map((participant, index) => (
                  <li key={index}>{participant}</li>
                ))}
              </ul>
            ) : (
              <p>No participants yet.</p>
            )}
          </div>
          <img src="logo.png" alt="Bipo" width="50" height="50" />
        </div>
      )}
    </div>
    );
  }

export default MyDapp;
