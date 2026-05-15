import { seedDatabase } from '@/lib/seed';
import { NextResponse } from 'next/server';

// Protect this endpoint - only allow with correct secret
const SEED_SECRET = process.env.SEED_SECRET || 'development-only';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (authHeader !== `Bearer ${SEED_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await seedDatabase();

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
    });
  } catch (error) {
    console.error('Seed API error:', error);
    return NextResponse.json(
      {
        error: 'Seed failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return NextResponse.json({
    message: 'Use POST to seed the database',
    example: 'POST /api/admin/seed with header: Authorization: Bearer YOUR_SEED_SECRET',
  });
}
