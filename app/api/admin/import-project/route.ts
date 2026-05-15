/**
 * Admin API: Import projects and trigger data syncs
 * Protected by JOB_SECRET header
 */

import { NextRequest, NextResponse } from 'next/server';
import { importNewProject } from '@/lib/background-jobs';
import type { ScoringInputs } from '@/lib/scoring';

function verifySecret(req: NextRequest): boolean {
  const secret = req.headers.get('Authorization')?.replace('Bearer ', '');
  return secret === process.env.JOB_SECRET && !!process.env.JOB_SECRET;
}

/**
 * POST /api/admin/import-project
 * Import a new project with real API scoring
 *
 * Body: {
 *   name: string;
 *   chain: string;
 *   category: string;
 *   website: string;
 *   description: string;
 *   contractAddress?: string;
 *   twitterHandle?: string;
 *   githubRepo?: string;
 *   coingeckoId?: string;
 * }
 */
export async function POST(req: NextRequest) {
  try {
    if (!verifySecret(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    const result = await importNewProject(data.name, data.chain, {
      contractAddress: data.contractAddress,
      twitterHandle: data.twitterHandle,
      githubRepo: data.githubRepo,
      coingeckoId: data.coingeckoId,
      chain: data.chain,
      projectStage: 'early',
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to import project' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      projectId: result.projectId,
      scores: result.scores,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/import-project
 * Instructions for using this endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/import-project',
    method: 'POST',
    auth: 'Bearer token (JOB_SECRET env var)',
    body: {
      name: 'Project Name',
      chain: 'Ethereum|Solana|Base|Arbitrum|Polygon|Optimism',
      category: 'DeFi|AI|Gaming|Infra|DePIN|Restaking|Wallet|etc',
      website: 'https://project.com',
      description: 'Project description',
      contractAddress: '0x... (optional)',
      twitterHandle: '@project (optional)',
      githubRepo: 'owner/repo (optional)',
      coingeckoId: 'token-id (optional)',
    },
    example: `curl -X POST http://localhost:3000/api/admin/import-project \\
  -H "Authorization: Bearer YOUR_JOB_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Example Protocol",
    "chain": "Ethereum",
    "category": "DeFi",
    "website": "https://example.com",
    "description": "A decentralized protocol",
    "contractAddress": "0x1234...",
    "twitterHandle": "@exampleproto",
    "githubRepo": "example/protocol",
    "coingeckoId": "example-token"
  }'`,
  });
}
