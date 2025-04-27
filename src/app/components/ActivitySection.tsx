'use client';

import { ethers } from 'ethers';
import { useEffect, useState, useRef } from 'react';
import { useWeb3 } from '../providers/Web3ModalProvider';
import { api, MintingDetails } from '../services/api';

export default function ActivitySection() {
  const { provider } = useWeb3();
  const [mintingDetails, setMintingDetails] = useState<MintingDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchMintingDetails = async () => {
    try {
      const data = await api.getMintingDetails();
      setMintingDetails(data);
    } catch (error) {
      console.error('Error fetching minting details:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected on activity section');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CLOSING) {
      console.log('WebSocket is closing, waiting...');
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket('ws://localhost:3001/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected on activity section');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      if (data.type === 'MINTING_DETAILS_UPDATED') {
        fetchMintingDetails();
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...');
      if (wsRef.current === ws) {
        setTimeout(connectWebSocket, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    };
  };

  useEffect(() => {
    fetchMintingDetails();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const calculateLevelRanges = (levels: any[]) => {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Recent Activity</h2>
      <div className="grid gap-4">
        {mintingDetails.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-gray-500">No activity found</p>
          </div>
        ) : (
          mintingDetails.map((detail) => (
            <div
              key={detail.tokenId}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">Token #{detail.tokenId}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(detail.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  {detail.rollResult !== undefined ? (
                    <>
                      <p className="text-sm">Roll: {detail.rollResult}</p>
                      <p className="text-sm">Payout: {ethers.utils.formatEther(detail.payout || '0')} ETH</p>
                    </>
                  ) : (
                    <p className="text-sm text-yellow-500">Not Opened</p>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <h4 className="text-sm font-medium">Levels:</h4>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {calculateLevelRanges(detail.levels).map((level, index) => (
                    <div
                      key={index}
                      className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded"
                    >
                      <p>Level {index + 1}</p>
                      <p>Win: {ethers.utils.formatEther(level.winAmount)} tokens</p>
                      <p>Roll: {level.rollNumber.toLocaleString()}</p>
                      <p>Range: {level.start.toLocaleString()} - {(level.end - 1).toLocaleString()}</p>
                      <p>Win Chance: {level.winPercentage.toFixed(2)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 