'use client';

import Link from 'next/link';
import { useWeb3 } from '../providers/Web3ModalProvider';

export default function TokensCard() {
  const { address } = useWeb3();

  return (
    <Link href="/tokens">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <h2 className="text-xl font-semibold mb-2">Your Tokens</h2>
        <p className="text-gray-600 dark:text-gray-300">
          {address ? 'View your token holdings' : 'Connect wallet to view tokens'}
        </p>
      </div>
    </Link>
  );
} 