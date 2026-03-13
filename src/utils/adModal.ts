export const showAdModal = (t: (key: string) => string): Promise<boolean> => {
    return new Promise((resolve) => {
        // Create a simple modal
        const modal = document.createElement('div')
        modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4'
        modal.innerHTML = `
            <div class="bg-[#0f1117] w-full max-w-md rounded-[32px] border border-white/10 p-8 text-center shadow-2xl">
                <h3 class="text-xl font-black text-white italic mb-4">${t('common.watch_ad') || 'Advertisement'}</h3>
                <div class="bg-white/5 rounded-xl p-8 mb-6 border border-white/10 relative overflow-hidden group">
                    <div class="absolute top-2 right-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">
                        Sponsored
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 mx-auto border border-indigo-500/20 shadow-lg group-hover:scale-110 transition-transform">
                        <span class="text-xl font-black text-indigo-400">Ad</span>
                    </div>
                    <p class="text-white/60 text-sm font-bold uppercase italic">Ad content here...</p>
                </div>
                <button id="ad-skip" class="text-white/40 text-xs uppercase tracking-widest mb-4 hover:text-white transition-colors">Skip</button>
                <button id="ad-complete" disabled class="w-full bg-emerald-500 text-white py-3 rounded-xl font-black uppercase tracking-widest opacity-50 cursor-not-allowed transition-all">Watch to Complete (3s)</button>
            </div>
        `
        document.body.appendChild(modal)
        
        let timeLeft = 3;
        const btn = document.getElementById('ad-complete') as HTMLButtonElement | null;
        
        const timer = setInterval(() => {
            timeLeft -= 1;
            if (btn) {
                if (timeLeft > 0) {
                    btn.innerText = `Watch to Complete (${timeLeft}s)`;
                } else {
                    clearInterval(timer);
                    btn.innerText = 'Complete';
                    btn.disabled = false;
                    btn.classList.remove('opacity-50', 'cursor-not-allowed');
                    btn.classList.add('hover:bg-emerald-400', 'active:scale-95', 'cursor-pointer');
                }
            }
        }, 1000);
        
        const cleanup = () => {
            clearInterval(timer);
            document.body.removeChild(modal);
        }
        
        document.getElementById('ad-skip')?.addEventListener('click', () => {
            cleanup()
            resolve(false)
        })
        
        document.getElementById('ad-complete')?.addEventListener('click', () => {
            if (timeLeft <= 0) {
                cleanup()
                resolve(true)
            }
        })
    })
}
