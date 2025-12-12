import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const KESTRA_URL = process.env.KESTRA_URL || 'http://localhost:8080'

export async function GET(
  request: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const { executionId } = params

    // Fetch execution status from Kestra
    const response = await axios.get(
      `${KESTRA_URL}/api/v1/executions/${executionId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Error fetching execution status:', error)
    return NextResponse.json(
      {
        error: error.response?.data?.message || error.message || 'Failed to fetch status',
      },
      { status: 500 }
    )
  }
}
