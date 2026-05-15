/**
 * Admin API: Trigger background data sync
 * Can be called via cron jobs or manually
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncAllProjectData } from '@/lib/background-jobs';

function verifySecret(req: NextRequest): boolean {
  const secret = req.headers.get('Authorization')?.replace('Bearer ', '');
  return secret === process.env.JOB_SECRET && !!process.env.JOB_SECRET;
}

/**
 * POST /api/admin/sync-data
 * Trigger background data sync for all projects
 *
 * Protected by JOB_SECRET
 * Use with a cron service (like EasyCron, cron-job.org, etc.)
 *
 * Cron Setup Example (daily at 2 AM UTC):
 * curl -X POST https://guugle.com/api/admin/sync-data \
 *   -H "Authorization: Bearer YOUR_JOB_SECRET" \
 *   -H "Content-Type: application/json"
 */
export async function POST(req: NextRequest) {
  try {
    if (!verifySecret(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await syncAllProjectData();

    return NextResponse.json({
      success: true,
      updated: result.updated,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/sync-data
 * Instructions for setting up automated syncs
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/sync-data',
    method: 'POST',
    auth: 'Bearer token (JOB_SECRET env var)',
    description: 'Trigger background data sync for all projects',
    rateLimit: 'Recommended: once per 24 hours',
    setup: {
      cronService: 'Use any cron service (EasyCron, cron-job.org, etc.)',
      frequency: 'Recommended daily at off-peak hours (2-4 AM UTC)',
      command: `curl -X POST https://guugle.com/api/admin/sync-data \\
        -H "Authorization: Bearer YOUR_JOB_SECRET" \\
        -H "Content-Type: application/json"`,
    },
    response: {
      success: true,
      updated: 'number of projects updated',
      failed: 'number of projects that failed',
      timestamp: 'ISO timestamp',
    },
    notes: [
      'Each project takes ~1 second to process (rate limiting for API compliance)',
      'With 50 projects per batch, full sync takes ~50 seconds',
      'Monitor Sentry/logs for API rate limit errors',
      'Consider running multiple batches if you have 100+ projects',
    ],
  });
}
