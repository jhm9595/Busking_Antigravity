import { Calendar, Check, Clock3, Coins, LayoutDashboard, MapPin, MessageCircle, Music2, Plus, QrCode, Sparkles, Star, Users } from 'lucide-react'

function Frame({ title, summary, size, children }: { title: string; summary: string; size: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 shadow-2xl shadow-black/30">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-black uppercase tracking-[0.22em] text-white">{title}</div>
          <p className="mt-1 max-w-xl text-xs font-medium leading-5 text-white/55">{summary}</p>
        </div>
        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">{size}</div>
      </div>
      {children}
    </section>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">{children}</div>
}

function AudienceProfileToBe() {
  return (
    <div className="flex min-h-[980px] flex-col bg-[linear-gradient(180deg,#07111f_0%,#0a1527_100%)] text-white">
      <header className="flex items-center justify-between px-8 py-6">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.26em] text-cyan-300/75">Audience / To-Be</div>
          <h2 className="mt-2 text-4xl font-black italic tracking-tight">Singer profile with one clear next action</h2>
        </div>
        <Note>Reduce split focus. One hero action, one secondary action.</Note>
      </header>
      <main className="grid flex-1 grid-cols-[1.05fr_0.95fr] gap-6 px-8 pb-8">
        <section className="rounded-[36px] border border-white/8 bg-white/[0.04] p-8 backdrop-blur-xl">
          <div className="mb-8 flex items-center gap-5">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-3xl font-black text-black">M</div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/80">Verified busker</div>
              <h3 className="mt-2 text-5xl font-black italic tracking-tight">mini Big</h3>
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.18em] text-white/45">Late-night acoustic pop / crowd sing-along</p>
            </div>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-white/72">Instead of splitting attention across too many equal-weight buttons, the profile leads with the live session and uses social proof to build confidence.</p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {['12.8K Followers', '4.9 Rating', '26 Upcoming Requests'].map((item) => (
              <div key={item} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-white/38">Social proof</div>
                <div className="mt-2 text-lg font-black">{item}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex gap-3">
            <button className="rounded-2xl bg-cyan-400 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-black">Join live session</button>
            <button className="rounded-2xl border border-white/12 bg-white/6 px-6 py-4 text-sm font-black uppercase tracking-[0.18em]">Request booking</button>
          </div>
        </section>
        <section className="space-y-5">
          <div className="rounded-[36px] border border-white/8 bg-[#0f1d31] p-7 shadow-2xl shadow-cyan-500/10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/80">Live now</div>
                <h3 className="mt-2 text-3xl font-black italic">Han River Sunset Session</h3>
              </div>
              <div className="rounded-full bg-red-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]">Live</div>
            </div>
            <div className="grid gap-3 text-sm font-bold text-white/74">
              <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-cyan-300" /> Friday, March 14</div>
              <div className="flex items-center gap-3"><Clock3 className="h-4 w-4 text-emerald-300" /> 19:00 - 21:00</div>
              <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-amber-300" /> Yeouido Han River Park</div>
            </div>
          </div>
          <div className="rounded-[36px] border border-white/8 bg-white/[0.04] p-7">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-xl font-black italic">Setlist snapshot</h4>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Top songs</span>
            </div>
            <div className="space-y-3">
              {['APT.', 'Ditto', 'Through the Night'].map((song, index) => (
                <div key={song} className={`rounded-2xl border p-4 ${index === 0 ? 'border-cyan-400/30 bg-cyan-400/10' : 'border-white/8 bg-black/15'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-black italic">{song}</div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/38">Music taste preview</div>
                    </div>
                    {index === 0 ? <Star className="h-5 w-5 text-cyan-300" /> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function AudienceLiveToBe() {
  return (
    <div className="flex min-h-[932px] flex-col bg-[#09111c] text-white">
      <header className="border-b border-white/6 bg-[#0d1624] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">Audience / Live</div>
            <h3 className="mt-2 text-3xl font-black italic">Chat-first compact live room</h3>
          </div>
          <Note>Put current song + chat + actions in one thumb zone.</Note>
        </div>
      </header>
      <main className="flex-1 space-y-4 px-4 py-4">
        <section className="rounded-[28px] border border-cyan-400/20 bg-cyan-400/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/90">Now performing</div>
              <div className="mt-2 text-2xl font-black italic">APT.</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/50">Han River Sunset Session</div>
            </div>
            <div className="rounded-full bg-red-500 px-3 py-1 text-[10px] font-black uppercase">Live</div>
          </div>
        </section>
        <section className="rounded-[28px] border border-white/8 bg-white/[0.04] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em]"><MessageCircle className="h-4 w-4 text-cyan-300" /> Fan chat</h4>
            <div className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">128 watching</div>
          </div>
          <div className="space-y-2">
            {['Encore one more!', 'Please sing Ditto next', '500P sent from row B'].map((line, index) => (
              <div key={line} className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm font-bold ${index === 1 ? 'ml-auto bg-cyan-400 text-black' : 'bg-black/25 text-white/82'}`}>{line}</div>
            ))}
          </div>
        </section>
      </main>
      <footer className="sticky bottom-0 border-t border-white/6 bg-[#0d1624] p-4">
        <div className="grid grid-cols-3 gap-2">
          <button className="rounded-2xl bg-white/8 py-4 text-[10px] font-black uppercase tracking-[0.16em]">Song request</button>
          <button className="rounded-2xl bg-cyan-400 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-black">Sponsor</button>
          <button className="rounded-2xl bg-white py-4 text-[10px] font-black uppercase tracking-[0.16em] text-black">Booking</button>
        </div>
      </footer>
    </div>
  )
}

function SingerDashboardToBe() {
  return (
    <div className="min-h-[1024px] bg-[linear-gradient(180deg,#0c0f17_0%,#121826_100%)] text-white">
      <header className="flex items-center justify-between px-8 py-6">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.26em] text-amber-300/70">Singer / To-Be</div>
          <h2 className="mt-2 text-4xl font-black italic tracking-tight">Dashboard with clearer operating priorities</h2>
        </div>
        <Note>Hero should answer: what is live, what needs action, what earns money.</Note>
      </header>
      <main className="grid gap-6 px-8 pb-8 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="rounded-[36px] border border-white/8 bg-gradient-to-br from-amber-300 to-orange-400 p-8 text-black shadow-2xl shadow-orange-500/15">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-black/55">Today operating snapshot</div>
                <h3 className="mt-3 text-5xl font-black italic tracking-tight">1 live, 3 urgent requests, 14.5K points</h3>
                <p className="mt-4 max-w-2xl text-base font-bold text-black/70">Current dashboard hides the most important state behind multiple equally weighted cards. This version promotes live status and pending money-related actions first.</p>
              </div>
              <button className="rounded-2xl bg-black px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-white">Go live control</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              ['Pending bookings', '03', <Calendar key="c" className="h-5 w-5" />],
              ['Fan requests', '12', <MessageCircle key="m" className="h-5 w-5" />],
              ['Followers today', '+47', <Users key="u" className="h-5 w-5" />],
            ].map(([label, value, icon]) => (
              <div key={label as string} className="rounded-[28px] border border-white/8 bg-white/[0.04] p-5">
                <div className="mb-4 flex items-center justify-between text-white/48">{icon}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/38">{label}</div>
                <div className="mt-2 text-3xl font-black">{value}</div>
              </div>
            ))}
          </div>
          <div className="rounded-[36px] border border-white/8 bg-white/[0.04] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-black italic">Performance queue</h3>
              <button className="rounded-2xl bg-amber-300 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-black">Add performance</button>
            </div>
            <div className="space-y-3">
              {['Live now / Gangnam Street Jam', 'Next / Han River Sunset Session', 'Past / Hongdae Encore Session'].map((item, index) => (
                <div key={item} className={`rounded-2xl border p-4 ${index === 0 ? 'border-amber-300/30 bg-amber-300/10' : 'border-white/8 bg-black/15'}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-black italic">{item}</div>
                    <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em]">Manage</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="space-y-6">
          <div className="rounded-[36px] border border-white/8 bg-white p-6 text-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Creator identity</div>
                <div className="mt-2 text-2xl font-black">mini Big</div>
              </div>
              <QrCode className="h-6 w-6 text-gray-500" />
            </div>
            <div className="rounded-[28px] border border-gray-200 bg-gray-50 p-5">
              <div className="text-sm font-bold text-gray-500">QR / social / booking conversion card</div>
            </div>
          </div>
          <div className="rounded-[36px] border border-white/8 bg-white/[0.04] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-black italic">Revenue tools</h3>
              <Coins className="h-5 w-5 text-amber-300" />
            </div>
            <div className="space-y-3">
              {['Point charge', 'Sponsorship settings', 'Chat opening controls'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-black/15 p-4 text-sm font-bold text-white/75">{item}</div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function PerformanceModalToBe() {
  return (
    <div className="flex min-h-[900px] items-center justify-center bg-[#10131b] p-8">
      <div className="w-full max-w-[1200px] rounded-[36px] border border-white/8 bg-white text-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b px-8 py-6">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-500">To-Be modal</div>
            <h3 className="mt-2 text-3xl font-black italic">Performance registration as a 3-step builder</h3>
          </div>
          <Note>Use progressive disclosure instead of dumping all inputs at once.</Note>
        </div>
        <div className="grid grid-cols-[240px_1fr] gap-8 p-8">
          <aside className="space-y-3 rounded-[28px] bg-gray-50 p-5">
            {['1. Basic info', '2. Audience setup', '3. Setlist & review'].map((step, index) => (
              <div key={step} className={`rounded-2xl px-4 py-4 text-sm font-black ${index === 0 ? 'bg-amber-300 text-black' : 'bg-white text-gray-400 border border-gray-200'}`}>{step}</div>
            ))}
          </aside>
          <section className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <input className="rounded-2xl border border-gray-300 px-4 py-4" value="Han River Sunset Session" readOnly />
              <input className="rounded-2xl border border-gray-300 px-4 py-4" value="Yeouido Han River Park" readOnly />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[28px] border border-gray-200 p-5">
                <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Schedule</div>
                <div className="text-lg font-black">Mar 14 / 19:00 - 21:00</div>
              </div>
              <div className="rounded-[28px] border border-gray-200 p-5">
                <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Location map</div>
                <div className="flex h-28 items-center justify-center rounded-2xl bg-gray-100 text-sm font-bold text-gray-400">Map preview</div>
              </div>
            </div>
            <div className="rounded-[28px] border border-amber-300/30 bg-amber-300/10 p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em]"><Sparkles className="h-4 w-4" /> Improvement point</div>
              <p className="text-sm font-bold text-black/70">Streaming, chat, expected audience, and setlist should not compete with title and schedule in the same visual layer. Group them by task flow.</p>
            </div>
            <div className="rounded-[28px] border border-gray-200 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-lg font-black italic">Recommended setlist</div>
                <button className="rounded-xl bg-black px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white">Auto arrange</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['APT.', 'Ditto', 'Supernova', 'Love wins all'].map((song, index) => (
                  <div key={song} className={`rounded-2xl border p-4 ${index < 2 ? 'border-amber-300/30 bg-amber-300/10' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="font-bold">{song}</div>
                      {index < 2 ? <Check className="h-4 w-4 text-emerald-500" /> : <Plus className="h-4 w-4 text-gray-400" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default function DesignToBePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_32%),linear-gradient(180deg,#05070d_0%,#0c1018_100%)] px-6 py-10 text-white md:px-10">
      <div className="mx-auto max-w-[1700px]">
        <header className="mb-12 rounded-[36px] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30">
          <div className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-300/75">To-Be Area</div>
          <h1 className="mt-3 text-4xl font-black italic tracking-tight md:text-5xl">Design improvements drawn as a next-state proposal</h1>
          <p className="mt-4 max-w-4xl text-sm font-medium leading-7 text-white/60 md:text-base">I focused on four corrections: stronger action hierarchy, less visual fragmentation, clearer monetization areas, and more task-based forms. This board is intended to sit next to the current As-Is frames in Figma.</p>
        </header>
        <div className="grid gap-6 xl:grid-cols-2">
          <Frame title="Audience Profile To-Be" summary="Current profile splits attention across equal-weight cards. This version makes the live entry point dominant and turns social proof into supporting content." size="Desktop 1440x980">
            <AudienceProfileToBe />
          </Frame>
          <Frame title="Audience Live To-Be" summary="The mobile live room should behave like a compact fan console: current song, chat, then action buttons in a tight rhythm." size="Mobile 430x932">
            <AudienceLiveToBe />
          </Frame>
          <Frame title="Singer Dashboard To-Be" summary="The dashboard should surface business-critical state first: live performance, urgent requests, revenue tools, then secondary management cards." size="Desktop 1440x1024">
            <SingerDashboardToBe />
          </Frame>
          <Frame title="Performance Modal To-Be" summary="Registration is easier to scan as a builder with steps, instead of one long generic modal. This reduces cognitive load and highlights decisions in order." size="Desktop 1280x900">
            <PerformanceModalToBe />
          </Frame>
        </div>
      </div>
    </main>
  )
}
