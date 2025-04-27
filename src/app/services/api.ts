import { ethers } from 'ethers';

export interface MintingDetails {
  tokenId: string;
  levels: {
    winAmount: string;
    rollNumber: number;
  }[];
  rollResult?: number;
  payout?: string;
  timestamp: Date;
  transactionHash: string;
}

export interface Opening {
  tokenId: string;
  timestamp: Date;
  transactionHash: string;
  tokenType: 'ERC721' | 'ERC404';
  opener: string;
}

export interface Resolution {
  tokenId: string;
  timestamp: Date;
  transactionHash: string;
  tokenType: 'ERC721' | 'ERC404';
  rollResult: number;
  winAmount: string;
}

export interface Reward {
  tokenId: string;
  timestamp: Date;
  transactionHash: string;
  tokenType: 'ERC721' | 'ERC404';
  amount: string;
  winner: string;
}

export interface Holdings {
  erc404: {
    fungible: string;
    nfts: string[];
  };
  erc721: string[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = {
  async getMintingDetails(): Promise<MintingDetails[]> {
    try {
      const response = await fetch(`${API_URL}/minting-details`);
      if (!response.ok) {
        throw new Error(`Failed to fetch minting details: ${response.statusText}`);
      }
      const data = await response.json();
      return data.map((detail: any) => ({
        ...detail,
        timestamp: new Date(detail.timestamp),
        levels: detail.levels.map((level: any) => ({
          ...level,
          winAmount: level.winAmount.toString()
        }))
      }));
    } catch (error) {
      console.error('Error fetching minting details:', error);
      return [];
    }
  },

  async getOpenings(): Promise<Opening[]> {
    try {
      const response = await fetch(`${API_URL}/openings`);
      if (!response.ok) {
        throw new Error(`Failed to fetch openings: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching openings:', error);
      return [];
    }
  },

  async getResolutions(): Promise<Resolution[]> {
    try {
      const response = await fetch(`${API_URL}/resolutions`);
      if (!response.ok) {
        throw new Error(`Failed to fetch resolutions: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching resolutions:', error);
      return [];
    }
  },

  async getRewards(): Promise<Reward[]> {
    try {
      const response = await fetch(`${API_URL}/rewards`);
      if (!response.ok) {
        throw new Error(`Failed to fetch rewards: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching rewards:', error);
      return [];
    }
  },

  async getMintingDetailsByTokenId(tokenId: string): Promise<MintingDetails> {
    const response = await fetch(`${API_URL}/minting-details/${tokenId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch minting details');
    }
    return response.json();
  },

  async getOpeningsByTokenId(tokenId: string): Promise<Opening[]> {
    const response = await fetch(`${API_URL}/openings/${tokenId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch openings');
    }
    return response.json();
  },

  async getMintingDetailsByAddress(address: string): Promise<MintingDetails[]> {
    try {
      const response = await fetch(`${API_URL}/address/${address}/minting-details`);
      if (!response.ok) {
        throw new Error(`Failed to fetch minting details: ${response.statusText}`);
      }
      const data = await response.json();
      return data.map((detail: any) => ({
        ...detail,
        timestamp: new Date(detail.timestamp),
        levels: detail.levels.map((level: any) => ({
          ...level,
          winAmount: level.winAmount.toString()
        }))
      }));
    } catch (error) {
      console.error('Error fetching minting details:', error);
      return [];
    }
  },

  async getOpeningsByAddress(address: string): Promise<Opening[]> {
    try {
      const response = await fetch(`${API_URL}/address/${address}/openings`);
      if (!response.ok) {
        throw new Error(`Failed to fetch openings: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching openings:', error);
      return [];
    }
  },

  async getHoldings(address: string): Promise<Holdings> {
    try {
      const response = await fetch(`${API_URL}/holdings/${address}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch holdings: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching holdings:', error);
      return {
        erc404: {
          fungible: '0',
          nfts: []
        },
        erc721: []
      };
    }
  }
};