import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
)

ChartJS.defaults.color = '#666680'
ChartJS.defaults.font.family = "'JetBrains Mono', monospace"
ChartJS.defaults.font.size = 11

const COLORS = [
  'rgba(110,231,183,0.7)',
  'rgba(167,139,250,0.7)',
  'rgba(251,191,36,0.7)',
  'rgba(251,113,133,0.7)',
  'rgba(56,189,248,0.7)',
]

const AXIS_STYLE = {
  grid: { color: '#ffffff08' },
  border: { display: false },
  ticks: { maxTicksLimit: 5 },
}

function Card({ children, style }) {
  return <div style={{ ...cardStyle, ...style }}>{children}</div>
}

function Label({ children }) {
  return <div style={labelStyle}>{children}</div>
}

function BigValue({ children, color = 'var(--accent1)' }) {
  return <div style={{ ...bigValueStyle, color }}>{children}</div>
}

export default function Dashboard({ data, onReset }) {
  const { summary, messages_per_participant, avg_length_per_participant,
    messages_by_hour, messages_by_dow, messages_over_time,
    top_words, top_emojis, call_stats } = data

  const total = messages_per_participant.reduce((s, p) => s + p.count, 0)
  const avgMap = Object.fromEntries(avg_length_per_participant.map(p => [p.sender, p.avg_length]))

  return (
    <div>
      {/* Header */}
      <header style={headerStyle}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--accent1)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
            // whatsapp chat analysis
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800 }}>
            {summary.participants.join(' & ')}
          </h1>
        </div>
        <div style={{ textAlign: 'right', color: 'var(--muted)', fontSize: 11, lineHeight: 1.9 }}>
          <div><strong style={{ color: 'var(--text)' }}>{summary.date_range.start}</strong> → <strong style={{ color: 'var(--text)' }}>{summary.date_range.end}</strong></div>
          <div>{summary.total_messages.toLocaleString()} messages · {summary.total_words.toLocaleString()} words</div>
          <button onClick={onReset} style={resetBtn}>← upload another</button>
        </div>
      </header>

      <div style={grid}>

        {/* Stat cards */}
        <Card style={{ gridColumn: 'span 3' }}>
          <Label>Total Messages</Label>
          <BigValue>{summary.total_messages.toLocaleString()}</BigValue>
        </Card>

        <Card style={{ gridColumn: 'span 3' }}>
          <Label>Total Words</Label>
          <BigValue color="var(--accent2)">{summary.total_words.toLocaleString()}</BigValue>
          <div style={subStyle}>~{(summary.total_words / summary.total_messages).toFixed(1)} words/msg</div>
        </Card>

        <Card style={{ gridColumn: 'span 3' }}>
          <Label>Peak Day</Label>
          <BigValue color="var(--accent3)">{summary.most_active_day.count}</BigValue>
          <div style={{ ...subStyle, marginTop: 6 }}>
            <span style={{ background: 'var(--accent3)', color: '#000', padding: '2px 8px', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em' }}>
              {summary.most_active_day.date}
            </span>
          </div>
        </Card>

        <Card style={{ gridColumn: 'span 3' }}>
          <Label>Most Active Hour</Label>
          <BigValue>{
            messages_by_hour.reduce((m, h) => h.count > m.count ? h : m, messages_by_hour[0]).hour
          }:00</BigValue>
          <div style={subStyle}>
            {messages_by_hour.reduce((m, h) => h.count > m.count ? h : m, messages_by_hour[0]).count.toLocaleString()} messages
          </div>
        </Card>

        {/* Who writes more */}
        <Card style={{ gridColumn: 'span 4' }}>
          <Label>Who Writes More</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>
            {messages_per_participant.map((p, i) => {
              const pct = ((p.count / total) * 100).toFixed(1)
              return (
                <div key={p.sender}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: COLORS[i], fontWeight: 500 }}>{p.sender}</span>
                    <span style={{ color: 'var(--muted)' }}>{p.count.toLocaleString()} · {pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: COLORS[i] }} />
                  </div>
                  <div style={{ ...subStyle, marginTop: 4 }}>avg {avgMap[p.sender]} chars/msg</div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Call stats */}
        {call_stats && (call_stats.total_voice_calls + call_stats.total_video_calls + call_stats.missed_calls) > 0 && (
          <Card style={{ gridColumn: 'span 4' }}>
            <Label>Calls</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>📞 Voice</span>
                <span>{call_stats.total_voice_calls} calls · {call_stats.voice_duration_min} min</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>📹 Video</span>
                <span>{call_stats.total_video_calls} calls · {call_stats.video_duration_min} min</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>🚫 Missed</span>
                <span style={{ color: 'rgba(251,113,133,0.9)' }}>{call_stats.missed_calls}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(call_stats.by_participant).map(([name, s]) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: 'var(--muted)' }}>{name}</span>
                    <span>{s.voice_calls}v · {s.video_calls}vid · {s.missed_calls} missed</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Top emojis */}
        <Card style={{ gridColumn: 'span 4' }}>
          <Label>Top Emojis</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
            {top_emojis.map(({ emoji, count }) => (
              <div key={emoji} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>{emoji}</span>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top words */}
        <Card style={{ gridColumn: 'span 4' }}>
          <Label>Top Words</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, alignItems: 'center' }}>
            {top_words.slice(0, 30).map(({ word, count }) => {
              const maxCount = top_words[0].count
              const size = 11 + Math.round((count / maxCount) * 10)
              return (
                <span key={word} style={{ ...wordTag, fontSize: size }}>
                  {word}
                </span>
              )
            })}
          </div>
        </Card>

        {/* Messages over time */}
        <Card style={{ gridColumn: 'span 12' }}>
          <Label>Messages Over Time · Daily Activity</Label>
          <div style={{ height: 180, marginTop: 16 }}>
            <Bar
              data={{
                labels: messages_over_time.total.map(d => d.date),
                datasets: [{
                  data: messages_over_time.total.map(d => d.count),
                  backgroundColor: messages_over_time.total.map(d =>
                    d.count === summary.most_active_day.count
                      ? 'rgba(251,191,36,0.9)'
                      : 'rgba(110,231,183,0.5)'
                  ),
                  borderWidth: 0,
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { display: false },
                  y: { ...AXIS_STYLE },
                }
              }}
            />
          </div>
        </Card>

        {/* Activity by hour */}
        <Card style={{ gridColumn: 'span 6' }}>
          <Label>Activity by Hour</Label>
          <div style={{ height: 220, marginTop: 16 }}>
            <Bar
              data={{
                labels: messages_by_hour.map(d => `${d.hour}h`),
                datasets: [{
                  label: 'Messages',
                  data: messages_by_hour.map(d => d.count),
                  backgroundColor: 'rgba(110,231,183,0.6)',
                  borderWidth: 0,
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { grid: { display: false }, border: { display: false } }, y: { ...AXIS_STYLE } }
              }}
            />
          </div>
        </Card>

        {/* Activity by day of week */}
        <Card style={{ gridColumn: 'span 6' }}>
          <Label>Activity by Day of Week</Label>
          <div style={{ height: 220, marginTop: 16 }}>
            <Bar
              data={{
                labels: messages_by_dow.map(d => d.day.slice(0, 3)),
                datasets: [{
                  label: 'Messages',
                  data: messages_by_dow.map(d => d.count),
                  backgroundColor: 'rgba(167,139,250,0.6)',
                  borderWidth: 0,
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { grid: { display: false }, border: { display: false } }, y: { ...AXIS_STYLE } }
              }}
            />
          </div>
        </Card>

      </div>
    </div>
  )
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: 1,
  background: 'var(--border)',
  margin: 1,
}

const cardStyle = {
  background: 'var(--surface)',
  padding: 28,
}

const labelStyle = {
  fontSize: 10,
  color: 'var(--muted)',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  marginBottom: 12,
}

const bigValueStyle = {
  fontFamily: 'Syne, sans-serif',
  fontSize: 40,
  fontWeight: 800,
  lineHeight: 1,
}

const subStyle = {
  fontSize: 11,
  color: 'var(--muted)',
  marginTop: 6,
}

const headerStyle = {
  padding: '40px 28px 28px',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
}

const resetBtn = {
  background: 'none',
  border: 'none',
  color: 'var(--accent1)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 11,
  padding: 0,
  marginTop: 4,
}

const wordTag = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  padding: '3px 10px',
  color: 'var(--text)',
  letterSpacing: '0.05em',
  cursor: 'default',
}
