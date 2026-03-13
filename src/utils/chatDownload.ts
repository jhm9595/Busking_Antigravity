export interface ChatMessage {
    performanceId: string
    author: string
    message: string
    timestamp: string
    type: 'singer' | 'audience' | 'system' | 'donation'
    amount?: number
    donorName?: string
}

export function downloadChatAsText(messages: ChatMessage[], performanceTitle: string): void {
    const text = messages.map(msg => {
        const time = new Date(msg.timestamp).toLocaleString()
        if (msg.type === 'donation') {
            return `[${time}] ${msg.donorName || msg.author} donated ${msg.amount}P: ${msg.message}`
        }
        if (msg.type === 'system') {
            return `[${time}] system: ${msg.message}`
        }
        return `[${time}] ${msg.author}: ${msg.message}`
    }).join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${performanceTitle}-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
}
