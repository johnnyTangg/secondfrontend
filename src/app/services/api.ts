import { ethers } from 'ethers';

export interface MintingDetails {
  tokenId: string;
  timestamp: Date;
  transactionHash: string;
  tokenType: 'ERC721' | 'ERC404';
  levels: {
    rollNumber: number;
    winAmount: string;
  }[];
  rollResult?: number;
  payout?: string;
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
console.log('Current API URL:', API_URL);
console.log('Environment variable:', process.env.NEXT_PUBLIC_API_URL);

// Add a function to ensure the URL is properly formatted
const getApiUrl = (endpoint: string) => {
  const url = `${API_URL}${endpoint}`;
  console.log('Making request to:', url);
  return url;
};

// Simplify fetch options
const fetchOptions = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  mode: 'cors' as const,
  credentials: 'omit' as const
};

export const api = {
  async getMintingDetails(): Promise<MintingDetails[]> {
    try {
      const url = getApiUrl('/minting-details');
      console.log('Fetching minting details from:', url);
      const response = await fetch(url, fetchOptions);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('API endpoint not found. Is the server running?');
          return [];
        }
        throw new Error(`Failed to fetch minting details: ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Invalid response format: expected JSON. Is the server running?');
        const text = await response.text();
        console.log('Received non-JSON response:', text);
        return [];
      }
      const data = await response.json();
      console.log('Received data:', JSON.stringify(data, null, 2));
      return data.map((detail: MintingDetails) => ({
        ...detail,
        timestamp: new Date(detail.timestamp),
        levels: detail.levels.map((level) => ({
          ...level,
          winAmount: level.winAmount.toString()
        }))
      }));
    } catch (error) {
      console.error('Error fetching minting details:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('Connection Error: Please check if the server is running and accessible.');
        console.error('Try visiting this URL in your browser:', API_URL);
      }
      console.error('Full error:', JSON.stringify(error, null, 2));
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
      const url = getApiUrl(`/address/${address}/minting-details`);
      console.log('Fetching minting details for address:', address);
      const response = await fetch(url, fetchOptions);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('API endpoint not found. Is the server running?');
          return [];
        }
        throw new Error(`Failed to fetch minting details: ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Invalid response format: expected JSON. Is the server running?');
        const text = await response.text();
        console.log('Received non-JSON response:', text);
        return [];
      }
      const data = await response.json();
      console.log('Received data:', JSON.stringify(data, null, 2));
      return data.map((detail: MintingDetails) => ({
        ...detail,
        timestamp: new Date(detail.timestamp),
        levels: detail.levels.map((level) => ({
          ...level,
          winAmount: level.winAmount.toString()
        }))
      }));
    } catch (error) {
      console.error('Error fetching minting details:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('Connection Error: Please check if the server is running and accessible.');
        console.error('Try visiting this URL in your browser:', API_URL);
      }
      console.error('Full error:', JSON.stringify(error, null, 2));
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