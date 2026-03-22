// AdSense Offerwall / Rewarded Ads Integration
// 
// FOR FUTURE IMPLEMENTATION (After AdSense Approval):
// 
// Option 1: Google Ad Manager (Recommended)
// - Use Google Publisher Tag (GPT) for rewarded ads
// - Example: googletag.pubads().display('/1234567/rewarded_ad_slot', [300, 250], adSlot)
// 
// Option 2: AdSense Offerwall (When Approved)
// - Use AdMob/Adsense SDK for offerwall
// - Example: googletag.pubads().refresh([rewardedSlot])
//
// Option 3: Third-party Ad Networks (e.g., AppLovin, Unity Ads)
// - Integrate their SDKs for rewarded video ads

/**
 * Show rewarded ad modal
 * 
 * CURRENT STATE: Mock mode (simulated ad)
 * 
 * TO INTEGRATE WITH GOOGLE ADSENSE/ADMOB:
 * 1. After getting AdSense approval, add the Google Publisher Tag script to your layout
 * 2. Replace the mock implementation below with actual ad display logic
 * 3. Use the callback/promise pattern to handle ad completion
 * 
 * @param t - Translation function for i18n
 * @returns Promise<boolean> - true if ad was watched, false if skipped
 */
export const showAdModal = (t: (key: string) => string): Promise<boolean> => {
    return new Promise((resolve) => {
        // Create a simple modal with theme variables
        const modal = document.createElement('div')
        modal.className = 'fixed inset-0 z-[200] flex items-center justify-center p-4'
        modal.style.backgroundColor = 'var(--color-background)'
        modal.style.opacity = '0.95'
        
        modal.innerHTML = `
            <div class="w-full max-w-md rounded-[32px] p-8 text-center shadow-2xl" style="background: var(--color-popup, var(--color-card)); border: var(--popup-border, 1px solid var(--color-border)); box-shadow: var(--popup-shadow, 0 25px 50px -12px rgba(0,0,0,0.25)); backdrop-filter: var(--popup-backdrop-filter, none);">
                <h3 class="text-xl font-black italic mb-4" style="color: var(--color-text-primary)">\${t('common.watch_ad') || 'Advertisement'}</h3>
                <div class="rounded-xl p-8 mb-6 relative overflow-hidden group" style="background-color: var(--color-surface); border: 1px solid var(--color-border)">
                    <div class="absolute top-2 right-4 text-[10px] font-black uppercase tracking-[0.2em] italic" style="color: var(--color-text-muted); opacity: 0.5">
                        Sponsored
                    </div>
                    <div class="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:scale-110 transition-transform" style="background-color: var(--color-primary); opacity: 0.1">
                        <span class="text-xl font-black" style="color: var(--color-primary)">Ad</span>
                    </div>
                    <p class="text-sm font-bold uppercase italic" style="color: var(--color-text-muted)">Ad content here...</p>
                </div>
                <button id="ad-skip" class="text-xs uppercase tracking-widest mb-4 transition-colors" style="color: var(--color-text-muted)">Skip</button>
                <button id="ad-complete" disabled class="w-full py-3 rounded-xl font-black uppercase tracking-widest opacity-50 cursor-not-allowed transition-all" style="background-color: var(--color-primary); color: var(--color-primary-foreground)">Watch to Complete (3s)</button>
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
                    btn.classList.add('cursor-pointer');
                    btn.style.opacity = '1';
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
