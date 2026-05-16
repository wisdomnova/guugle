/**
 * Health check endpoint
 * Monitor API status and integrations
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const health: {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    checks: Record<string, boolean>;
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      supabase: false,
      etherscan: !!process.env.ETHERSCAN_API_KEY,
      coingecko: !!process.env.COINGECKO_PRO_API_KEY,
      okx: true, // OKX configured via xagt-plugin
    },
  };

  // Check Supabase connection
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data, error } = await (supabase
      .from('projects') as any)
      .select('count')
      .limit(1);

    health.checks.supabase = !error;
  } catch (error) {
    health.checks.supabase = false;
  }

  // Determine overall health
  const criticalServices = ['supabase'];
  const isCriticalDown = criticalServices.some(
    (service) => !health.checks[service as keyof typeof health.checks]
  );

  if (isCriticalDown) {
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
