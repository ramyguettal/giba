import React, { useState } from 'react';
import { 
  MessageSquare, Settings, Shield, Zap, Terminal, Activity, 
  BarChart, PieChart, Info, HelpCircle, Save, Sliders, Lock
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart as ReBarChart, Bar
} from 'recharts';

export const AdminChatbot: React.FC = () => {
  const [modelSettings, setModelSettings] = useState({
    temperature: 0.7,
    maxTokens: 1024,
    tone: 'Professional/Formal',
    restrictions: 'Internal HR Only'
  });

  const [prompt, setPrompt] = useState(`You are GIBA HR Assistant, a professional AI trained to help employees at Groupe Industriel Babahom.
Rules:
- Respect the GIBA brand guidelines.
- Only provide information from the provided context (RAG).
- If unsure, direct the user to the HR department via email hr@giba.dz.`);

  const statsDataDay = [
    { hour: '08:00', queries: 12 },
    { hour: '10:00', queries: 45 },
    { hour: '12:00', queries: 28 },
    { hour: '14:00', queries: 54 },
    { hour: '16:00', queries: 32 },
  ];

  return (
    <div className="dashboard-grid">
      {/* 1. Header & Usage Metrics */}
      <div className="dashboard-card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '20px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(27,107,58,0.1)', color: 'var(--color-primary)', borderRadius: '14px' }}><Zap size={24}/></div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>LLM Performance</h3>
         </div>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Engine</span>
               <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Groq / Llama 3</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Processing Latency</span>
               <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-success)' }}>~240ms</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Daily Token Consumption</span>
               <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>14.2k tokens</span>
            </div>
         </div>
         <button className="btn-primary" style={{ width: '100%', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', background: 'transparent', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <Terminal size={16}/> View Logs
         </button>
      </div>

      <div className="dashboard-card" style={{ gridColumn: 'span 8' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 className="card-title">Daily Query Volume</h3>
            <span className="badge badge-approved">+12% vs Yesterday</span>
         </div>
         <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
               <LineChart data={statsDataDay}>
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                  <Line type="monotone" dataKey="queries" stroke="var(--color-primary)" strokeWidth={3} dot={{ fill: 'var(--color-primary)', strokeWidth: 2 }} />
               </LineChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* 2. System Instructions & Prompt Management */}
      <div className="dashboard-card" style={{ gridColumn: 'span 7' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <Terminal size={20} color="var(--color-primary)"/>
            <h3 className="card-title">System Prompt (Primary Guidelines)</h3>
         </div>
         <textarea 
            className="input-field" 
            style={{ width: '100%', height: '300px', resize: 'none', fontFamily: 'monospace', fontSize: '0.85rem', padding: '16px', lineHeight: 1.6, background: 'var(--color-surface-2)', border: '1px solid var(--color-border-subtle)' }}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
         />
         <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="btn-primary" style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)'}}>Reset To Default</button>
            <button className="btn-primary"><Save size={18} /> Update Model</button>
         </div>
      </div>

      {/* 3. Parameter Sliders */}
      <div className="dashboard-card" style={{ gridColumn: 'span 5' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
            <Sliders size={20} color="var(--color-primary)"/>
            <h3 className="card-title">Model Hyperparameters</h3>
         </div>
         
         <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
               <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Temperature</label>
               <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{modelSettings.temperature}</span>
            </div>
            <input type="range" style={{ width: '100%', accentColor: 'var(--color-primary)' }} min="0" max="1" step="0.1" value={modelSettings.temperature} onChange={(e) => setModelSettings({...modelSettings, temperature: parseFloat(e.target.value)})}/>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>Risk vs Creativity. 0 is deterministic (strict responses), 1 is creative.</p>
         </div>

         <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>Access Protocol</label>
            <div style={{ padding: '12px', border: '1px solid var(--color-border-subtle)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', background: 'var(--color-surface-2)' }}>
               <Lock size={18} color="var(--color-primary)"/>
               <span style={{ fontSize: '0.85rem' }}>Authenticated Employees Only</span>
            </div>
            <div style={{ padding: '12px', border: '1px solid var(--color-border-subtle)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.5 }}>
               <Zap size={18}/>
               <span style={{ fontSize: '0.85rem' }}>Guest Mode (Disabled)</span>
            </div>
         </div>

         <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '16px' }}>Top Monitoring Alerts</h4>
            {[
              { label: 'Unanswered Questions', status: '8' },
              { label: 'Policy Content Flags', status: '0' },
              { label: 'Access Violations', status: '1' }
            ].map((alert, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                 <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{alert.label}</span>
                 <span style={{ fontWeight: 700, color: parseInt(alert.status) > 0 ? 'var(--color-accent)' : 'var(--color-success)' }}>{alert.status}</span>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};
