# Fortune Tickets Frontend

A Next.js application for the Fortune Tickets platform.

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- A WalletConnect Project ID (get one from [WalletConnect Cloud](https://cloud.walletconnect.com/))

## Setup

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Configure environment variables:
Create a `.env.local` file with the following variables:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Vercel

1. Push your code to a GitHub repository

2. Go to [Vercel](https://vercel.com) and sign in with your GitHub account

3. Click "New Project" and select your repository

4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: secondfrontend
   - Build Command: `npm run build` or `yarn build`
   - Output Directory: `.next`

5. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL

6. Click "Deploy"

## Features

- Connect to Base Sepolia testnet using Web3Modal
- Display connected wallet address
- View and manage Fortune Tickets
- Real-time updates via WebSocket
- Responsive design with dark mode support

## Dependencies

- Next.js 14
- Web3Modal
- ethers.js
- TailwindCSS

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
