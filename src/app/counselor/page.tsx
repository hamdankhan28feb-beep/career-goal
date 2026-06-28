'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Send, Bot, User, Sparkles, ArrowRight, RotateCcw, BookOpen } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

const QUICK_PROMPTS = [
  'Which universities in Karachi are best for Computer Science?',
  'I have 75% in FSc Pre-Engineering, where can I apply?',
  'What is the difference between CS and Software Engineering?',
  'Which university has the best scholarships in Karachi?',
  'What entry tests do I need to give for medical?',
  'Is FAST better than NEDUET for CS?',
];

const DEMO_RESPONSES: Record<string, string> = {
  default: `I'm the FuturePath AI Counselor, trained on Pakistani university data. Here's what I can help you with:

📚 **University Information** — Programs, fees, merit, campuses, accreditations
🎓 **Admission Guidance** — Merit requirements, entry tests, deadlines
💰 **Scholarships** — Merit-based, need-based, external scholarships
🗺️ **Career Paths** — What you can do after graduation
📊 **University Comparisons** — Side-by-side analysis
🔮 **Admission Chances** — Based on your marks

Ask me anything about Pakistani universities and careers! For example: *"Which university is best for CS in Karachi?"*`,

  cs: `Great question! Here are the **top CS universities in Karachi**:

**1. FAST-NUCES Karachi** 🥇
- Pakistan's top CS university
- ABET-accredited programs
- Typical merit: 75-80% aggregate
- Strong industry links with tech companies

**2. IBA Karachi** 🥈
- Excellent CS + Business programs
- Most selective (80%+ aggregate)
- Best campus culture and alumni network

**3. Habib University** 🥉
- US-style liberal arts + CS
- Small classes, personalized attention
- Strong research culture

**4. NED University (NEDUET)**
- Excellent public university, affordable fees
- Strong engineering tradition
- Merit: typically 72-78%

**5. MAJU / SZABIST / PAF-KIET**
- Good alternatives with lower entry barriers
- Decent industry connections

**My recommendation**: If your marks are 80%+, target FAST or IBA. 70-79% → NEDUET or Habib. Below 70% → MAJU, SZABIST, or Iqra.

Want me to compare any two of these?`,

  scholarship: `Here's a summary of **scholarships available at Karachi universities**:

**HEC Need-Based Scholarships**
- Available at: All HEC-recognized universities
- Coverage: 100% tuition + stipend
- Eligibility: Family income < PKR 45,000/month

**Merit-Based University Scholarships**
- FAST: Top 5% students get 50-100% fee waiver
- IBA: Endowment scholarships for top merit
- Habib University: Up to 100% merit scholarships

**External Scholarships**
- Ehsaas Undergraduate Scholarship (BISP)
- KRL Scholarship
- Sindh Talent Scholarship Program
- USAID/Fulbright (for postgrad)

**How to maximize chances:**
1. Apply early (most have limited seats)
2. Keep CGPA above 3.5/4.0
3. Apply to multiple scholarships simultaneously

Want details on any specific scholarship?`,

  merit: `Here are the **typical merit requirements** for top Karachi universities:

| University | Merit Range | Entry Test |
|---|---|---|
| IBA Karachi | 80-90% | IBA SAT-style test |
| FAST Karachi | 75-85% | NU Entry Test |
| Habib University | 75-88% | HU Entrance Test |
| NEDUET | 70-80% | University Entry Test |
| MAJU | 60-70% | University Test |
| SZABIST | 55-70% | Own test (some waivers) |
| Iqra University | 50-65% | Own test |

**Merit Formula (standard)**:
- 60% weight = Intermediate/A-levels percentage
- 40% weight = Matric/O-levels percentage
- Entry test adds bonus points at most universities

Use our **Admission Predictor** to calculate your exact chances!`,
};

function getDemoResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('cs') || lower.includes('computer science') || lower.includes('software')) return DEMO_RESPONSES.cs;
  if (lower.includes('scholarship') || lower.includes('financial')) return DEMO_RESPONSES.scholarship;
  if (lower.includes('merit') || lower.includes('percentage') || lower.includes('%')) return DEMO_RESPONSES.merit;
  return DEMO_RESPONSES.default;
}

function formatMessage(text: string) {
  return text
    .split('\n')
    .map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-foreground mb-1">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="ml-4 text-muted-foreground">{line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}</li>;
      }
      if (line.startsWith('**') ) {
        return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="text-muted-foreground mb-1">{line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}</p>;
    });
}

export default function CounselorPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: DEMO_RESPONSES.default },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setInput('');
    setMessages((p) => [...p, { role: 'user', content: msg }]);
    setLoading(true);

    // Try API first, fallback to demo
    try {
      const res = await fetch('/api/counselor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: messages }),
      });
      if (res.ok) {
        const data = await res.json() as { reply: string };
        setMessages((p) => [...p, { role: 'assistant', content: data.reply }]);
      } else {
        throw new Error('API error');
      }
    } catch {
      // Demo fallback with simulated delay
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
      setMessages((p) => [...p, { role: 'assistant', content: getDemoResponse(msg) }]);
    }
    setLoading(false);
  }

  function reset() {
    setMessages([{ role: 'assistant', content: DEMO_RESPONSES.default }]);
    setInput('');
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-400 text-white shadow-glow-primary">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">FuturePath AI Counselor</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online — trained on your university database
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/universities" className="hidden rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition sm:flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" /> Universities
          </Link>
          <button onClick={reset} className="rounded-full border border-border/60 p-2 text-muted-foreground hover:text-foreground transition" title="Reset chat">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
              msg.role === 'assistant' ? 'bg-gradient-to-br from-primary to-emerald-400 text-white' : 'bg-muted text-foreground'
            }`}>
              {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className={`max-w-[80%] rounded-3xl px-5 py-3.5 text-sm leading-7 ${
              msg.role === 'assistant' ? 'bg-card/80 border border-border/70' : 'bg-primary text-primary-foreground'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="space-y-0.5">{formatMessage(msg.content)}</div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-400 text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-3xl border border-border/70 bg-card/80 px-5 py-3.5">
              <div className="flex gap-1">
                {[0, 150, 300].map((delay) => (
                  <span key={delay} className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="border-t border-border/50 bg-background/80 backdrop-blur px-4 pt-3 sm:px-6">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              className="shrink-0 rounded-full border border-border/60 bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3 pb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about universities, admissions, careers, scholarships…"
            className="input-field flex-1"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <div className="pb-3 text-center text-xs text-muted-foreground">
          <Sparkles className="inline h-3 w-3 mr-1 text-primary" />
          Demo mode — add OPENAI_API_KEY or GEMINI_API_KEY to enable full AI responses
        </div>
      </div>
    </div>
  );
}
