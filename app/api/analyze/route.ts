import { NextResponse } from 'next/server';
import { runFullAnalysis } from '@/lib/analysis';
import {
  validateContractAddress,
  displayNameForContract,
  isEthAddress,
} from '@/lib/contract-validation';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('q')?.trim();

  if (!input) {
    return NextResponse.json({ error: 'Paste an Ethereum contract address (0x…)' }, { status: 400 });
  }

  if (!isEthAddress(input)) {
    return NextResponse.json(
      {
        error: 'Only contract addresses (0x…) are supported. Name and symbol search is disabled.',
        code: 'INVALID_ADDRESS',
      },
      { status: 400 }
    );
  }

  try {
    const validation = await validateContractAddress(input);

    if (!validation.exists) {
      return NextResponse.json(
        {
          error:
            'No token found at this address on Ethereum mainnet. Double-check the contract and try again.',
          code: 'CONTRACT_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const contractAddress = validation.contractAddress;
    const projectName = displayNameForContract(contractAddress, {
      name: validation.name,
      symbol: validation.symbol,
      coingeckoId: validation.coingeckoId,
      github: validation.github,
    });

    const result = await runFullAnalysis({
      name: projectName,
      contractAddress,
      coingeckoId: validation.coingeckoId,
      chain: 'Ethereum',
      githubRepo: validation.github,
    });

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err) {
    console.error('Analyze error:', err);
    return NextResponse.json({ error: 'Failed to analyze project' }, { status: 500 });
  }
}
