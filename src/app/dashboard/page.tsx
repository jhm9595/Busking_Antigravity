import { redirect } from 'next/navigation'

export default function Dashboard() {
    // For MVP, redirect everyone to Singer Dashboard
    // In real app, check role metadata
    redirect('/singer/dashboard')
}
