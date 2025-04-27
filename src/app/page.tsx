'use client';

import ActivitySection from './components/ActivitySection';
import TokensCard from './components/TokensCard';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="grid gap-8">
        <TokensCard />
        <ActivitySection />
      </div>
    </main>
  );
}
