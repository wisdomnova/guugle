import { NextRequest, NextResponse } from 'next/server';
import {
  runSecurityPreFlight,
  getSmartMoneySignals,
  analyzeMemeToken,
  discoverYieldOpportunities,
  readWalletHoldings,
  calculateTradeRoute,
  executeTradeViaOKX,
} from '@/lib/integrations/okx';

/**
 * POST /api/okx/security-scan
 * Security pre-flight check for token
 */
export async function POST(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.includes('security-scan')) {
    const { tokenAddress, chain } = await request.json();

    if (!tokenAddress || !chain) {
      return NextResponse.json(
        { error: 'Missing tokenAddress or chain' },
        { status: 400 }
      );
    }

    const result = await runSecurityPreFlight(tokenAddress, chain);
    return NextResponse.json(result);
  }

  if (pathname.includes('smart-money-signals')) {
    const { tokenAddress, chain, limit } = await request.json();

    if (!tokenAddress || !chain) {
      return NextResponse.json(
        { error: 'Missing tokenAddress or chain' },
        { status: 400 }
      );
    }

    const signals = await getSmartMoneySignals(tokenAddress, chain, limit);
    return NextResponse.json(signals);
  }

  if (pathname.includes('meme-analysis')) {
    const { tokenAddress, chain } = await request.json();

    if (!tokenAddress || !chain) {
      return NextResponse.json(
        { error: 'Missing tokenAddress or chain' },
        { status: 400 }
      );
    }

    const analysis = await analyzeMemeToken(tokenAddress, chain);
    return NextResponse.json(analysis);
  }

  if (pathname.includes('defi-yield')) {
    const { asset, chain, minAPY } = await request.json();

    if (!asset || !chain) {
      return NextResponse.json(
        { error: 'Missing asset or chain' },
        { status: 400 }
      );
    }

    const opportunities = await discoverYieldOpportunities(asset, chain, minAPY);
    return NextResponse.json(opportunities);
  }

  if (pathname.includes('wallet-holdings')) {
    const { walletAddress, chain } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing walletAddress' },
        { status: 400 }
      );
    }

    const holdings = await readWalletHoldings(walletAddress, chain);
    return NextResponse.json(holdings);
  }

  if (pathname.includes('trade-route')) {
    const { inputToken, outputToken, amount, chain, maxSlippage } = await request.json();

    if (!inputToken || !outputToken || !amount || !chain) {
      return NextResponse.json(
        { error: 'Missing required trade parameters' },
        { status: 400 }
      );
    }

    const route = await calculateTradeRoute(inputToken, outputToken, amount, chain, maxSlippage);
    return NextResponse.json(route);
  }

  if (pathname.includes('execute-trade')) {
    const { route, walletAddress } = await request.json();

    if (!route || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing route or walletAddress' },
        { status: 400 }
      );
    }

    const result = await executeTradeViaOKX(route, walletAddress);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Unknown endpoint' }, { status: 404 });
}
