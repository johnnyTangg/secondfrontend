'use client';

import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

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
      const provider = new ethers.providers.Web3Provider(instance);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      setProvider(provider);
      setSigner(signer);
      setAddress(address);

      instance.on('accountsChanged', (accounts: string[]) => {
        setAddress(accounts[0] || null);
      });

      instance.on('chainChanged', () => {
        window.location.reload();
      });
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  };

  const disconnect = () => {
    if (web3Modal) {
      web3Modal.clearCachedProvider();
    }
    setProvider(null);
    setSigner(null);
    setAddress(null);
  };

  useEffect(() => {
    if (web3Modal?.cachedProvider) {
      connect();
    }
  }, [web3Modal]);

  return (
    <Web3Context.Provider value={{ provider, signer, address, connect, disconnect }}>
      {children}
    </Web3Context.Provider>
  );
} 