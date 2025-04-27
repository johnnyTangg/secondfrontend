'use client';

import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import { ReactNode, createContext, useContext, useEffect, useState, useRef } from 'react';

interface Web3ContextType {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  address: null,
  connect: async () => {},
  disconnect: () => {},
});

export function useWeb3() {
  return useContext(Web3Context);
}

export function Web3ModalProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [web3Modal, setWeb3Modal] = useState<Web3Modal | null>(null);
  const providerRef = useRef<ethers.providers.Web3Provider | null>(null);

  useEffect(() => {
    const modal = new Web3Modal({
      cacheProvider: true,
      providerOptions: {},
    });
    setWeb3Modal(modal);
  }, []);

  const connect = async () => {
    if (!web3Modal) return;

    try {
      const instance = await web3Modal.connect();
      const newProvider = new ethers.providers.Web3Provider(instance);
      const newSigner = newProvider.getSigner();
      const newAddress = await newSigner.getAddress();

      // Clean up old event listeners
      if (providerRef.current) {
        const oldInstance = providerRef.current.provider;
        if (oldInstance) {
          (oldInstance as any).removeAllListeners('accountsChanged');
          (oldInstance as any).removeAllListeners('chainChanged');
        }
      }

      // Set up new event listeners
      instance.on('accountsChanged', (accounts: string[]) => {
        setAddress(accounts[0] || null);
      });

      instance.on('chainChanged', () => {
        window.location.reload();
      });

      providerRef.current = newProvider;
      setProvider(newProvider);
      setSigner(newSigner);
      setAddress(newAddress);
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  };

  const disconnect = () => {
    if (web3Modal) {
      web3Modal.clearCachedProvider();
    }
    if (providerRef.current) {
      const instance = providerRef.current.provider;
      if (instance) {
        (instance as any).removeAllListeners('accountsChanged');
        (instance as any).removeAllListeners('chainChanged');
      }
    }
    providerRef.current = null;
    setProvider(null);
    setSigner(null);
    setAddress(null);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && web3Modal?.cachedProvider) {
      connect();
    }

    return () => {
      if (providerRef.current) {
        const instance = providerRef.current.provider;
        if (instance) {
          (instance as any).removeAllListeners('accountsChanged');
          (instance as any).removeAllListeners('chainChanged');
        }
      }
    };
  }, [web3Modal, connect]);

  return (
    <Web3Context.Provider value={{ provider, signer, address, connect, disconnect }}>
      {children}
    </Web3Context.Provider>
  );
} 