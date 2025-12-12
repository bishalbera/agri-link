import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const KESTRA_URL = process.env.KESTRA_URL || 'http://localhost:8080'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      farmer_id,
      crop_type,
      state,
      district,
      quantity_kg,
      cost_of_production_per_kg,
    } = body

    // Trigger Kestra workflow
    const response = await axios.post(
      `${KESTRA_URL}/api/v1/executions/agriculture/agri-link-crisis-shield`,
      {
        inputs: {
          farmer_id: farmer_id || 'FARMER_001',
          crop_type: crop_type || 'Tomato',
          state: state || 'Delhi',
          district: district || 'South Delhi',
          quantity_kg: quantity_kg || 5000,
          cost_of_production_per_kg: cost_of_production_per_kg || 15,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    return NextResponse.json({
      executionId: response.data.id,
      status: response.data.state,
    })
  } catch (error: any) {
    console.error('Error triggering Kestra execution:', error)
    return NextResponse.json(
      {
        error: error.response?.data?.message || error.message || 'Failed to start execution',
      },
      { status: 500 }
    )
  }
}
