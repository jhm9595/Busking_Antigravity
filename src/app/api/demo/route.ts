import { NextResponse } from 'next/server'
import { ensureDemoData, getDemoData, resetDemoData } from '@/lib/demo-mode'

interface DemoRequestBody {
  action?: 'ensure' | 'reset'
}

export async function GET() {
  try {
    const data = await getDemoData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error reading demo data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as DemoRequestBody
    const action = body?.action === 'reset' ? 'reset' : 'ensure'

    const data = action === 'reset' ? await resetDemoData() : await ensureDemoData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error mutating demo data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
