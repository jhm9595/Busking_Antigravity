import { ArrowRight, Calendar, Compass, LayoutDashboard, Map, MessageCircle, Mic2, Monitor, Music2, Phone, QrCode, Tablet, Users } from 'lucide-react'

function SectionTitle({ role, title, desc, tone }: { role: string; title: string; desc: string; tone: string }) {
  return (
    <div className={`rounded-[32px] border p-7 ${tone}`}>
      <div className="text-[11px] font-black uppercase tracking-[0.28em] text-white/60">{role}</div>
      <h2 className="mt-3 text-4xl font-black italic tracking-tight text-white">{title}</h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70">{desc}</p>
    </div>
  )
}

function DeviceHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-cyan-300">{icon}</div>
        <div>
          <div className="text-lg font-black uppercase tracking-[0.12em] text-white">{title}</div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/42">{subtitle}</div>
        </div>
      </div>
    </div>
  )
}

function StepCard({ index, label, title, body, accent }: { index: string; label: string; title: string; body: string; accent: string }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${accent}`}>{label}</div>
        <div className="text-xs font-black text-white/30">{index}</div>
      </div>
      <div className="text-xl font-black italic text-white">{title}</div>
      <p className="mt-3 text-sm leading-6 text-white/65">{body}</p>
    </div>
  )
}

function FlowArrow({ note }: { note: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-1 text-white/35">
      <ArrowRight className="h-4 w-4" />
      <span className="text-[10px] font-black uppercase tracking-[0.18em]">{note}</span>
      <ArrowRight className="h-4 w-4" />
    </div>
  )
}

function MiniScreen({ title, lines, tone }: { title: string; lines: string[]; tone: string }) {
  return (
    <div className={`rounded-[26px] border border-white/10 p-4 ${tone}`}>
      <div className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/55">{title}</div>
      <div className="space-y-2">
        {lines.map((line) => (
          <div key={line} className="rounded-xl bg-black/20 px-3 py-2 text-xs font-bold text-white/78">{line}</div>
        ))}
      </div>
    </div>
  )
}

function DeviceFlow({
  header,
  summary,
  steps,
  screenTitle,
  screens,
}: {
  header: React.ReactNode
  summary: string
  steps: { index: string; label: string; title: string; body: string; accent: string }[]
  screenTitle: string
  screens: { title: string; lines: string[]; tone: string }[]
}) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-[#0d1420] p-5">
      {header}
      <p className="mb-5 text-sm leading-6 text-white/60">{summary}</p>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div key={step.index}>
              <StepCard {...step} />
              {idx < steps.length - 1 ? <FlowArrow note="next decision" /> : null}
            </div>
          ))}
        </div>
        <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-300/75">{screenTitle}</div>
          <div className="space-y-3">
            {screens.map((screen) => (
              <MiniScreen key={screen.title} {...screen} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function DesignFlowPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(180deg,#04070d_0%,#0b1018_100%)] px-6 py-10 text-white md:px-10">
      <div className="mx-auto max-w-[1800px] space-y-10">
        <header className="rounded-[38px] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30">
          <div className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-300/75">Flow-First To-Be</div>
          <h1 className="mt-3 text-4xl font-black italic tracking-tight md:text-5xl">Role + device UX flows that are visible at a glance</h1>
          <p className="mt-4 max-w-5xl text-sm leading-7 text-white/62 md:text-base">
            This board corrects the biggest discomfort in the previous proposal: it now shows how audience and singer users move through the product depending on device.
            Instead of isolated screens, each lane explains entry point, key decision, and target screen, then pairs that flow with the right surface for mobile, tablet, and desktop.
          </p>
        </header>

        <SectionTitle
          role="Audience"
          title="Discover -> trust -> join -> act"
          desc="Audience users should not experience the same journey on every device. Mobile favors fast entry into live mode and quick fan actions. Tablet supports browsing and comparing nearby performers. Desktop works better for planning, profile review, and booking decisions."
          tone="bg-[linear-gradient(135deg,rgba(34,197,94,0.16),rgba(6,182,212,0.12))] border-emerald-300/10"
        />

        <div className="grid gap-6 xl:grid-cols-3">
          <DeviceFlow
            header={<DeviceHeader icon={<Phone className="h-5 w-5" />} title="Audience Mobile" subtitle="Fast entry / thumb-first live actions" />}
            summary="Mobile should minimize detours. Users often arrive from a QR code, a shared link, or a live moment in the street. The best flow is to enter the singer profile, confirm value quickly, then jump straight into live mode and act from the bottom bar."
            steps={[
              { index: '01', label: 'Entry', title: 'Open singer profile from QR or shared link', body: 'Landing should instantly show singer identity, live status, and one dominant CTA so the user understands the current moment in less than 3 seconds.', accent: 'bg-cyan-400 text-black' },
              { index: '02', label: 'Decision', title: 'Join live mode if the show is active', body: 'When a session is live, the profile should strongly prefer live entry over secondary actions such as generic social links.', accent: 'bg-emerald-400 text-black' },
              { index: '03', label: 'Action', title: 'Request song / sponsor / booking from the bottom action rail', body: 'Once inside the live room, actions must be reachable with one hand and remain visible without covering chat or current-song context.', accent: 'bg-white text-black' },
            ]}
            screenTitle="Why this device flow works"
            screens={[
              { title: 'Profile Hero', lines: ['Live badge + stage name', 'One dominant CTA: Join live', 'Lightweight proof: followers / top songs'], tone: 'bg-cyan-400/10' },
              { title: 'Live Room', lines: ['Current song card on top', 'Chat in the center', 'Bottom sticky action rail'], tone: 'bg-white/[0.04]' },
              { title: 'Quick Actions', lines: ['Song Request modal', 'Sponsor shortcut', 'Booking inquiry'], tone: 'bg-emerald-400/10' },
            ]}
          />

          <DeviceFlow
            header={<DeviceHeader icon={<Tablet className="h-5 w-5" />} title="Audience Tablet" subtitle="Browse + compare + decide" />}
            summary="Tablet gives enough room to support discovery better than mobile. For this role, it should emphasize the explore experience first, then move users into a richer singer profile with schedule context before entering live mode."
            steps={[
              { index: '01', label: 'Browse', title: 'Start from map/list explore', body: 'Tablet is ideal for browsing multiple performers nearby, so map and card list should coexist rather than forcing a hard mode switch.', accent: 'bg-cyan-400 text-black' },
              { index: '02', label: 'Compare', title: 'Open singer profile with schedule + setlist snapshot', body: 'Users on tablet can absorb more context comfortably, so this is the right place for upcoming schedule, top songs, and booking confidence cues.', accent: 'bg-emerald-400 text-black' },
              { index: '03', label: 'Commit', title: 'Enter live or start a booking inquiry', body: 'Tablet users often sit in a planning zone between casual discovery and action, so both live entry and booking should be clearly available.', accent: 'bg-white text-black' },
            ]}
            screenTitle="Tablet opportunity"
            screens={[
              { title: 'Explore Split View', lines: ['Map + nearby cards', 'Follow state visible', 'Quick compare'], tone: 'bg-cyan-400/10' },
              { title: 'Richer Profile', lines: ['Schedule block', 'Setlist preview', 'Trust cues before decision'], tone: 'bg-white/[0.04]' },
              { title: 'Booking Start', lines: ['Event type', 'Budget', 'Message', 'Context stays visible'], tone: 'bg-emerald-400/10' },
            ]}
          />

          <DeviceFlow
            header={<DeviceHeader icon={<Monitor className="h-5 w-5" />} title="Audience Desktop" subtitle="Research + trust-building + inquiry" />}
            summary="Desktop audience behavior is less impulse-driven and more evaluative. It is the strongest surface for profile depth, booking readiness, and comparing multiple performers before engaging."
            steps={[
              { index: '01', label: 'Research', title: 'Explore and shortlist performers', body: 'Desktop should let users scan more performers and use denser profile summaries without forcing immediate commitment.', accent: 'bg-cyan-400 text-black' },
              { index: '02', label: 'Trust', title: 'Review singer profile with social proof and repertoire', body: 'This is where ratings, follower counts, recurring venues, and polished artist identity can do the heaviest work.', accent: 'bg-emerald-400 text-black' },
              { index: '03', label: 'Inquire', title: 'Open a fuller booking request flow', body: 'Desktop is the best place for entering event details, budget, and intent carefully, so the booking flow should feel more premium and less cramped.', accent: 'bg-white text-black' },
            ]}
            screenTitle="Desktop audience value"
            screens={[
              { title: 'Comparison-Friendly Explore', lines: ['More artists on screen', 'Filter + status visibility', 'Better scanning'], tone: 'bg-cyan-400/10' },
              { title: 'Trust-Heavy Profile', lines: ['Bio + proof + media', 'Upcoming schedule', 'Detailed booking CTA'], tone: 'bg-white/[0.04]' },
              { title: 'Premium Inquiry', lines: ['Long-form context', 'Event details grouped', 'Lower cognitive friction'], tone: 'bg-emerald-400/10' },
            ]}
          />
        </div>

        <SectionTitle
          role="Singer"
          title="Plan -> operate -> respond -> monetize"
          desc="Singer flows also need device-specific logic. Mobile is an emergency control surface during a show. Tablet is a lightweight planning and monitoring surface. Desktop is the primary HQ for scheduling, setlist management, audience operations, and revenue tools."
          tone="bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(249,115,22,0.14))] border-amber-300/10"
        />

        <div className="grid gap-6 xl:grid-cols-3">
          <DeviceFlow
            header={<DeviceHeader icon={<Phone className="h-5 w-5" />} title="Singer Mobile" subtitle="On-stage control / emergency decisions" />}
            summary="A singer holding a phone mid-performance does not want a full dashboard. Mobile singer flow should be ruthlessly short: jump into live control, respond to requests, and keep the show moving."
            steps={[
              { index: '01', label: 'Entry', title: 'Open live control quickly from dashboard hero', body: 'If a performance is active or about to start, the singer should not need to browse tabs. The dashboard must route directly into live mode.', accent: 'bg-amber-300 text-black' },
              { index: '02', label: 'Operate', title: 'Manage current song, requests, and chat readiness', body: 'Song completion, accepting requests, and opening chat are the mission-critical live actions. They should fit within one screen rhythm.', accent: 'bg-orange-300 text-black' },
              { index: '03', label: 'Recover', title: 'Handle urgent actions only', body: 'End performance, reopen chat, or add a song manually. Everything else should move to tablet or desktop.', accent: 'bg-white text-black' },
            ]}
            screenTitle="Mobile singer priority"
            screens={[
              { title: 'Go-Live Shortcut', lines: ['Resume active show', 'Nearest scheduled show', 'No browsing'], tone: 'bg-amber-300/12' },
              { title: 'Live Console', lines: ['Current song', 'Request queue', 'Chat toggle'], tone: 'bg-white/[0.04]' },
              { title: 'Emergency Actions', lines: ['Add song', 'End show', 'Force status change'], tone: 'bg-orange-300/12' },
            ]}
          />

          <DeviceFlow
            header={<DeviceHeader icon={<Tablet className="h-5 w-5" />} title="Singer Tablet" subtitle="Backstage planning + mid-show monitoring" />}
            summary="Tablet can act as a backstage companion. It has enough space for schedule review, booking triage, and queue management, but should still avoid desktop-level density."
            steps={[
              { index: '01', label: 'Prepare', title: 'Review today schedule and pending bookings', body: 'Tablet works well for checking upcoming sets, venue info, and incoming booking requests before heading on stage.', accent: 'bg-amber-300 text-black' },
              { index: '02', label: 'Monitor', title: 'Track follower / request / point signals during the day', body: 'This device is good for glanceable metrics, but not for overloading the singer with too many operational controls.', accent: 'bg-orange-300 text-black' },
              { index: '03', label: 'Adjust', title: 'Edit setlist or performance details when needed', body: 'Changes should be available, but structured and lighter than the full desktop editor.', accent: 'bg-white text-black' },
            ]}
            screenTitle="Tablet singer role"
            screens={[
              { title: 'Today Board', lines: ['Schedule first', 'Pending bookings second', 'Metrics third'], tone: 'bg-amber-300/12' },
              { title: 'Mid-Weight Management', lines: ['Edit details', 'Review requests', 'Triage followers'], tone: 'bg-white/[0.04]' },
              { title: 'Less Noise', lines: ['No desktop overload', 'Bigger touch zones', 'Simpler hierarchy'], tone: 'bg-orange-300/12' },
            ]}
          />

          <DeviceFlow
            header={<DeviceHeader icon={<Monitor className="h-5 w-5" />} title="Singer Desktop" subtitle="Full operating HQ" />}
            summary="Desktop should be the main command center. This is where performance planning, queue design, profile management, booking review, and monetization controls can coexist with strong hierarchy."
            steps={[
              { index: '01', label: 'Plan', title: 'Build the week through performance management', body: 'Desktop is the right surface for creating or editing schedules, building setlists, and checking conflicts in detail.', accent: 'bg-amber-300 text-black' },
              { index: '02', label: 'Run', title: 'Use live mode as an operating cockpit', body: 'When live mode is open on desktop, it should behave like a control room with request handling, setlist progression, and audience chat side by side.', accent: 'bg-orange-300 text-black' },
              { index: '03', label: 'Monetize', title: 'Manage points, QR conversion, and profile trust', body: 'Revenue tools and creator identity should sit in a stable right rail, not feel like disconnected secondary cards.', accent: 'bg-white text-black' },
            ]}
            screenTitle="Desktop singer advantage"
            screens={[
              { title: 'Planning HQ', lines: ['Performance builder', 'Setlist editing', 'Conflict visibility'], tone: 'bg-amber-300/12' },
              { title: 'Live Cockpit', lines: ['Setlist + requests + chat', 'Realtime focus', 'Action priority'], tone: 'bg-white/[0.04]' },
              { title: 'Monetization Rail', lines: ['QR card', 'Points', 'Booking conversion', 'Identity tools'], tone: 'bg-orange-300/12' },
            ]}
          />
        </div>

        <footer className="rounded-[34px] border border-white/10 bg-white/[0.04] p-7 shadow-2xl shadow-black/20">
          <div className="mb-4 text-[11px] font-black uppercase tracking-[0.28em] text-emerald-300/70">Design conclusion</div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-black/15 p-5">
              <div className="mb-2 flex items-center gap-2 text-lg font-black italic"><Compass className="h-5 w-5 text-cyan-300" /> Audience</div>
              <p className="text-sm leading-6 text-white/65">Let each device support a different depth of decision instead of forcing the same content stack everywhere.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/15 p-5">
              <div className="mb-2 flex items-center gap-2 text-lg font-black italic"><Mic2 className="h-5 w-5 text-amber-300" /> Singer</div>
              <p className="text-sm leading-6 text-white/65">Separate performance-time controls from planning-time controls, and tie them to the device that makes sense operationally.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/15 p-5">
              <div className="mb-2 flex items-center gap-2 text-lg font-black italic"><LayoutDashboard className="h-5 w-5 text-emerald-300" /> Figma usage</div>
              <p className="text-sm leading-6 text-white/65">This board is meant to sit next to the current As-Is and To-Be boards so stakeholders can compare flow logic before polishing visual detail.</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
