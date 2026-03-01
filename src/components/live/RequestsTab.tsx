import React from 'react'
import { MessageCircle, Check, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface RequestsTabProps {
    requests: any[];
    isRefreshingRequests: boolean;
    requestsLastUpdated: Date | null;
    refreshRequests: () => void;
    processingRequestIds: Set<string>;
    handleAcceptRequest: (reqId: string) => void;
    handleRejectRequest: (reqId: string) => void;
}

export default function RequestsTab({
    requests,
    isRefreshingRequests,
    requestsLastUpdated,
    refreshRequests,
    processingRequestIds,
    handleAcceptRequest,
    handleRejectRequest
}: RequestsTabProps) {
    const { t } = useLanguage()

    return (
        <div className="space-y-4 pb-20">
            {/* Refresh header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {isRefreshingRequests ? (
                        <svg className="w-3.5 h-3.5 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                    ) : (
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                    )}
                    <span className="text-xs text-gray-500">
                        {requestsLastUpdated
                            ? `Updated ${requestsLastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                            : 'Loading...'}
                    </span>
                </div>
                <button
                    onClick={refreshRequests}
                    disabled={isRefreshingRequests}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-40 bg-gray-800 px-2.5 py-1.5 rounded-lg border border-gray-700 transition"
                >
                    <svg className={`w-3.5 h-3.5 ${isRefreshingRequests ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {requests.length === 0 ? (
                <div className="p-12 text-center text-gray-600 bg-gray-900/50 rounded-xl border border-gray-800 border-dashed">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{t('live.requests.empty')}</p>
                </div>
            ) : (
                requests.map((req: any) => (
                    <div key={req.id} className={`p-4 rounded-xl border ${req.status === 'pending' ? 'bg-gray-800/90 border-indigo-500/50 shadow-lg shadow-indigo-900/20' : 'bg-gray-900/50 border-gray-800 opacity-70'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="text-lg font-bold text-white">{req.title}</h3>
                                <p className="text-gray-400 text-sm">{req.artist}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${req.status === 'pending' ? 'bg-green-900/50 text-green-400 border border-green-800' :
                                req.status === 'accepted' ? 'bg-blue-900/50 text-blue-400 border border-blue-800' :
                                    'bg-red-900/50 text-red-400 border border-red-800'
                                }`}>
                                {req.status}
                            </span>
                        </div>

                        {req.status === 'pending' && (
                            <div className="flex space-x-2 mt-2">
                                <button
                                    onClick={() => handleAcceptRequest(req.id)}
                                    disabled={processingRequestIds.has(req.id)}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center transition"
                                >
                                    <Check className="w-4 h-4 mr-1" /> {processingRequestIds.has(req.id) ? t('common.loading') : t('live.requests.accept')}
                                </button>
                                <button
                                    onClick={() => handleRejectRequest(req.id)}
                                    disabled={processingRequestIds.has(req.id)}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center transition"
                                >
                                    <X className="w-4 h-4 mr-1" /> {t('live.requests.reject')}
                                </button>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    )
}
