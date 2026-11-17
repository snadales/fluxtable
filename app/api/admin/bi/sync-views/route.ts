import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-guard';
import { BiViewsGenerator } from '@/lib/bi/generators/views-generator';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) {
    return auth.response;
  }

  try {
    const results = await BiViewsGenerator.syncAllViews();
    return NextResponse.json({
      success: true,
      syncedViews: results.length,
      views: results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'SYNC_VIEWS_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
