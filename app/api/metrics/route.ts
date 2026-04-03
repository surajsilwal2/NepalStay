import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export interface MetricData {
  name: string;
  value: number;
  unit?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

/**
 * POST /api/metrics
 * Receives performance metrics from the client
 * 
 * Expected body:
 * {
 *   "name": "FCP",
 *   "value": 1200,
 *   "unit": "ms",
 *   "metadata": { "page": "/" }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const data: MetricData = await request.json();

    // Validate required fields
    if (!data.name || data.value === undefined) {
      return NextResponse.json(
        { error: 'name and value are required' },
        { status: 400 }
      );
    }

    // Log to console (in production, send to external service)
    console.log(`[METRIC] ${data.name}: ${data.value}${data.unit || ''}`);

    // Send critical metrics to Sentry
    if (data.value > 5000) {
      // Performance issue detected
      Sentry.captureMessage(
        `Slow ${data.name}: ${data.value}ms`,
        'warning'
      );
    }

    // Store metric (example: could send to database, analytics service, etc.)
    // const metric = await db.metrics.create({
    //   name: data.name,
    //   value: data.value,
    //   unit: data.unit,
    //   metadata: data.metadata,
    //   timestamp: data.timestamp || Date.now(),
    // });

    return NextResponse.json(
      { success: true, message: 'Metric recorded' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error recording metric:', error);
    Sentry.captureException(error);

    return NextResponse.json(
      { error: 'Failed to record metric' },
      { status: 500 }
    );
  }
}
