'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useWeb3 } from '../providers/Web3ModalProvider';
import { api } from '../services/api';
import { ethers } from 'ethers';

interface Holdings {
  erc404: {
    fungible: string;
    nfts: string[];
  };
  erc721: string[];
}

const FORTUNE_TICKET_ADDRESS = '0xE64Ea2215CD88a5d3cfe764bCEB2c1e3C60ECfC4';
const BASE_SEPOLIA_CHAIN_ID = 84532;
const FORTUNE_TICKET_ABI = [
  "function mintTicket(address,bool,(uint256,uint256,uint256)[]) returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "function getTicketLevels(uint256) view returns ((uint256,uint256,uint256)[])",
  "function initiateOpenTicket(uint256) returns ()",
  "event TicketOpeningInitiated(uint256 indexed tokenId, address indexed opener)",
  "event TicketResolved(uint256 indexed tokenId, uint256 rollResult, uint256 winAmount)"
];

const LEVEL_RANGES = [
  { rollNumber: 50000, winAmount: { min: 1, max: 3 } },
  { rollNumber: 30000, winAmount: { min: 2, max: 8 } },
  { rollNumber: 15000, winAmount: { min: 10, max: 20 } },
  { rollNumber: 5000, winAmount: { min: 25, max: 75 } },
  { rollNumber: 2000, winAmount: { min: 100, max: 250 } }
];

export default function TokensPage() {
  const { address, provider } = useWeb3();
  const [holdings, setHoldings] = useState<Holdings | null>(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [isOpening, setIsOpening] = useState<{ [key: string]: boolean }>({});
  const [tokenLevels, setTokenLevels] = useState<{ [key: string]: any[] }>({});
  const wsRef = useRef<WebSocket | null>(null);

  const calculateLevelRanges = (levels: { rollNumber: number; winAmount: string }[]) => {
    if (!levels || !Array.isArray(levels)) return [];
    
    // Calculate total rolls first
    const totalRolls = levels.reduce((sum, level) => sum + Number(level.rollNumber), 0);
    
    let currentRange = 0;
    return levels.map(level => {
      const rollNumber = Number(level.rollNumber);
      const range = {
        start: currentRange,
        end: currentRange + rollNumber,
        rollNumber,
        winAmount: level.winAmount
      };
      currentRange += rollNumber;
      const winPercentage = (rollNumber / totalRolls) * 100;
      return { ...range, winPercentage };
    });
  };

  const fetchTokenLevels = useCallback(async (tokenId: string) => {
    if (!provider) return;
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(FORTUNE_TICKET_ADDRESS, FORTUNE_TICKET_ABI, signer);
      const levels = await contract.getTicketLevels(tokenId);
      setTokenLevels(prev => ({ ...prev, [tokenId]: levels }));
    } catch (error) {
      console.error('Error fetching token levels:', error);
    }
  }, [provider]);

  const fetchHoldings = async () => {
    if (!address) {
      setHoldings(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.getHoldings(address);
      setHoldings(response);
    } catch (error) {
      console.error('Error fetching holdings:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = useCallback(() => {
    // If we already have a connection, don't create a new one
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected on tokens page');
      return;
    }

    // If we have a connection that's closing, wait for it to close
    if (wsRef.current?.readyState === WebSocket.CLOSING) {
      console.log('WebSocket is closing, waiting...');
      return;
    }

    // Close any existing connection before creating a new one
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket('ws://localhost:3001/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected on tokens page');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      if (data.type === 'MINTING_DETAILS_UPDATED') {
        fetchHoldings();
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...');
      // Only attempt to reconnect if the component is still mounted
      if (wsRef.current === ws) {
        setTimeout(connectWebSocket, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Close the connection on error to trigger reconnection
      ws.close();
    };
  }, [fetchHoldings]);

  useEffect(() => {
    const checkNetwork = async () => {
      if (!provider) return;
      
      try {
        const network = await provider.getNetwork();
        setWrongNetwork(network.chainId !== BASE_SEPOLIA_CHAIN_ID);
      } catch (error) {
        console.error('Error checking network:', error);
      }
    };

    checkNetwork();
  }, [provider]);

  useEffect(() => {
    fetchHoldings();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [address, connectWebSocket, fetchHoldings]);

  useEffect(() => {
    if (holdings?.erc721) {
      holdings.erc721.forEach(tokenId => {
        fetchTokenLevels(tokenId);
      });
    }
  }, [holdings?.erc721, fetchTokenLevels]);

  const openTicket = async (tokenId: string) => {
    if (!provider || !address) return;

    try {
      setIsOpening(prev => ({ ...prev, [tokenId]: true }));
      const signer = provider.getSigner();
      const contract = new ethers.Contract(FORTUNE_TICKET_ADDRESS, FORTUNE_TICKET_ABI, signer);

      let retries = 3;
      let lastError = null;

      while (retries > 0) {
        try {
          const tx = await contract.initiateOpenTicket(tokenId);
          const receipt = await tx.wait();
          
          // Find the TicketOpeningInitiated event in the receipt
          const openingEvent = receipt.logs.find((log: any) => {
            try {
              const parsedLog = contract.interface.parseLog(log);
              return parsedLog?.name === 'TicketOpeningInitiated';
            } catch {
              return false;
            }
          });

          if (openingEvent) {
            const parsedLog = contract.interface.parseLog(openingEvent);
            const eventTokenId = Number(parsedLog.args.tokenId);
            console.log('Ticket opening initiated for token:', eventTokenId);
          }

          // Refresh holdings after successful opening
          await fetchHoldings();
          setIsOpening(prev => ({ ...prev, [tokenId]: false }));
          return;
        } catch (error: any) {
          lastError = error;
          console.error(`Error opening ticket (retries left: ${retries - 1}):`, error);
          
          // Check if it's a rate limit error
          if (error.code === -32603 || error.message?.includes('429')) {
            // Wait for 2 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
            retries--;
          } else {
            // If it's not a rate limit error, break the retry loop
            break;
          }
        }
      }

      if (lastError) {
        throw lastError;
      }
    } catch (error: any) {
      console.error('Error opening ticket:', error);
    } finally {
      setIsOpening(prev => ({ ...prev, [tokenId]: false }));
    }
  };

  const generateRandomLevels = (): { rollNumber: number; winAmount: number }[] => {
    return [
      {
        rollNumber: Math.floor(Math.random() * 50000),
        winAmount: Math.floor(Math.random() * 3) + 1
      },
      {
        rollNumber: Math.floor(Math.random() * 30000),
        winAmount: Math.floor(Math.random() * 8) + 2
      },
      {
        rollNumber: Math.floor(Math.random() * 15000),
        winAmount: Math.floor(Math.random() * 10) + 10
      },
      {
        rollNumber: Math.floor(Math.random() * 5000),
        winAmount: Math.floor(Math.random() * 50) + 25
      },
      {
        rollNumber: Math.floor(Math.random() * 2000),
        winAmount: Math.floor(Math.random() * 150) + 100
      }
    ];
  };

  const handleMint = async () => {
    if (!provider || !address) return;

    try {
      const network = await provider.getNetwork();
      if (network.chainId !== BASE_SEPOLIA_CHAIN_ID) {
        setWrongNetwork(true);
        return;
      }

      setMinting(true);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(FORTUNE_TICKET_ADDRESS, FORTUNE_TICKET_ABI, signer);

      // Generate random levels
      const levels = generateRandomLevels();
      
      // Convert levels to the format expected by the contract
      const formattedLevels = levels.map(level => [
        level.rollNumber,
        level.winAmount * 100, // Convert to basis points (percentage)
        ethers.utils.parseUnits(level.winAmount.toString(), 18) // Convert to token decimals
      ]);

      // Mint the ticket (false for token payout)
      const tx = await contract.mintTicket(
        await signer.getAddress(),
        false,
        formattedLevels
      );

      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      
      // Find the Transfer event in the receipt
      const transferEvent = receipt.logs.find((log: any) => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog?.name === 'Transfer';
        } catch {
          return false;
        }
      });

      if (transferEvent) {
        // Refresh holdings after minting
        await fetchHoldings();
      }
    } catch (error) {
      console.error('Error minting token:', error);
    } finally {
      setMinting(false);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-8">Your Tokens</h1>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200">
            Please connect your wallet to view your tokens.
          </p>
        </div>
      </div>
    );
  }

  if (wrongNetwork) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-8">Your Tokens</h1>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 mb-4">
            Please switch to Base Sepolia testnet to interact with Fortune Tickets.
          </p>
          <button
            onClick={() => provider?.send('wallet_switchEthereumChain', [{ chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}` }])}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            Switch to Base Sepolia
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-8">Your Tokens</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Your Tokens</h1>

      {/* Token Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Token Information</h2>
        <div className="grid gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-4">
            <p className="text-lg">Maximum Potential Payout: 250 tokens</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-4">
            <p className="text-lg mb-2">Potential Level Ranges:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {LEVEL_RANGES.map((level, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Level {index + 1}:</span>
                    <span className="text-green-600">{level.winAmount.min}-{level.winAmount.max} tokens</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Max Roll: {level.rollNumber.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid gap-8">
        {/* Mint Button */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Mint New Token</h2>
          <button
            onClick={handleMint}
            disabled={minting}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
              minting 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {minting ? 'Minting...' : 'Mint Token'}
          </button>
        </div>

        {/* Fungible Tokens */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Fungible Tokens</h2>
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-4">
            <p className="text-lg">
              Balance: {holdings?.erc404.fungible ? Number(holdings.erc404.fungible) / 10**18 : 0} FT
            </p>
          </div>
        </div>

        {/* NFT Holdings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">NFT Holdings</h2>
          <div className="space-y-4">
            {/* ERC721 Tokens */}
            <div>
              <h3 className="text-lg font-medium mb-2">ERC721 Tokens</h3>
              {holdings?.erc721.length ? (
                <div className="grid grid-cols-1 gap-4">
                  {holdings.erc721.map((tokenId) => (
                    <div key={tokenId} className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">Token #{tokenId}</span>
                        <button
                          onClick={() => openTicket(tokenId)}
                          disabled={isOpening[tokenId]}
                          className={`px-3 py-1 rounded text-sm ${
                            isOpening[tokenId]
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-500 hover:bg-blue-600'
                          } text-white font-medium transition-colors duration-200`}
                        >
                          {isOpening[tokenId] ? 'Opening...' : 'Open'}
                        </button>
                      </div>
                      {tokenLevels[tokenId] && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium mb-2">Levels:</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {calculateLevelRanges(tokenLevels[tokenId]).map((level, index) => (
                              <div
                                key={index}
                                className="text-sm bg-gray-100 dark:bg-gray-600 p-2 rounded"
                              >
                                <p>Level {index + 1}</p>
                                <p>Win: {level.winAmount} tokens</p>
                                <p>Roll: {level.rollNumber.toLocaleString()}</p>
                                <p>Range: {level.start.toLocaleString()} - {(level.end - 1).toLocaleString()}</p>
                                <p>Win Chance: {level.winPercentage.toFixed(2)}%</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No ERC721 tokens found</p>
              )}
            </div>

            {/* ERC404 NFTs */}
            <div>
              <h3 className="text-lg font-medium mb-2">ERC404 NFTs</h3>
              {holdings?.erc404.nfts.length ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {holdings.erc404.nfts.map((tokenId) => (
                    <div key={tokenId} className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                      Token #{tokenId}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No ERC404 NFTs found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 