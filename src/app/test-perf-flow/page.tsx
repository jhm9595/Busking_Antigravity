'use client'
import React, { useState, useEffect } from 'react'
import { getPerformances, addPerformance, updatePerformanceStatus, getPerformanceById } from '@/services/singer'

export default function TestPage() {
    const singerId = 'user_38Mwh293kkUWLJVgJNO4OOuFy6m' // Used from test-check.js
    const [logs, setLogs] = useState<string[]>([])

    const addLog = (msg: string) => setLogs(l => [...l, msg])

    const runTest = async () => {
        try {
            addLog("Test started: Creating performance for CURRENT TIME")
            const now = new Date()
            const start = new Date(now)
            const end = new Date(now.getTime() + 60 * 60 * 1000)

            addLog(`1. Adding performance start: ${start.toISOString()} end: ${end.toISOString()}`)
            const res = await addPerformance({
                singerId,
                title: "Automated Test Perf " + now.getTime(),
                locationText: "Seoul",
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                chatEnabled: true,
                chatCost: 0
            })
            addLog(`addPerformance result: ` + JSON.stringify(res))

            addLog("2. Emulating handleStartMode (fetching performances)")
            const perfs = await getPerformances(singerId)
            addLog(`Fetched ${perfs.length} perfs`)

            const activeLive = perfs.find((p: any) => p.status === 'live')
            if (activeLive) {
                addLog(`Found active LIVE! ID: ${activeLive.id} title: ${activeLive.title}`)
            } else {
                addLog("No active live. Finding candidates...")
                const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000)
                const candidates = perfs.filter((p: any) => {
                    if (p.status !== 'scheduled') return false
                    const pStart = new Date(p.startTime)
                    const pEnd = p.endTime ? new Date(p.endTime) : new Date(pStart.getTime() + 3 * 3600000)
                    if (now >= pStart && now <= pEnd) return true
                    if (pStart > now && pStart <= tenMinutesFromNow) return true
                    return false
                })
                addLog(`Found ${candidates.length} candidates`)

                if (candidates.length > 0) {
                    const bestCandidate = candidates[0]
                    addLog(`Best candidate: ID ${bestCandidate.id} title ${bestCandidate.title}`)

                    addLog(`Updating status to 'live'`)
                    const updateRes = await updatePerformanceStatus(bestCandidate.id, 'live')
                    addLog(`Update res: ` + JSON.stringify(updateRes))

                    addLog(`3. Emulating LivePerformancePage: fetching getPerformanceById`)
                    const perfById = await getPerformanceById(bestCandidate.id)
                    if (!perfById) {
                        addLog(`ERROR: getPerformanceById returned NULL for ID: ${bestCandidate.id}`)
                    } else {
                        addLog(`SUCCESS! Loaded perf. ID: ${perfById.id} status: ${perfById.status}`)
                    }

                }
            }


        } catch (e: any) {
            addLog(`Exception: ${e.message}`)
        }
    }

    return (
        <div className="p-8 text-black bg-white min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Internal Workflow Test</h1>
            <button onClick={runTest} className="px-4 py-2 bg-blue-500 text-white rounded mb-4">Run Test Flow</button>
            <div className="bg-gray-100 p-4 font-mono text-sm whitespace-pre-wrap">
                {logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
        </div>
    )
}
