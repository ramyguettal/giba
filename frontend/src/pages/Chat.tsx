import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, User, CheckCircle2, Search, Clock, FileText, Database, 
  CalendarDays, Book, Link as LinkIcon, HelpCircle, Bell, 
  ExternalLink, FileCheck, Info, ChevronRight, X
} from 'lucide-react';

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Welcome Amine! 👋\nI am your GIBA HR assistant. How can I help you today?',
      tools: null,
      citation: null
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), role: 'user', content: input, tools: null, citation: null };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate Agent processing with RAG focus
    setTimeout(() => {
      let response = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        tools: [] as any[],
        citation: null as any
      };

      const lowerInput = input.toLowerCase();
      
      if (lowerInput.includes('leave') || lowerInput.includes('conge')) {
        response.content = "Checked the system for you. You currently have 14.5 days of annual leave remaining for the 2024 period.";
        response.tools = [{ name: 'get_leave_balance', status: 'success', label: 'Leave balance retrieved' }];
        response.citation = { title: 'Leave Policy 2024', page: 4 };
      } else if (lowerInput.includes('policy') || lowerInput.includes('remote')) {
        response.content = "According to the GIBA Remote Work Policy, employees are entitled to up to 2 days of remote work per week, subject to departmental approval.";
        response.citation = { title: 'Internal Handbook v2.1', page: 12 };
      } else if (lowerInput.includes('payslip') || lowerInput.includes('paie')) {
        response.content = "I found your latest payslip (September 2024). Would you like me to send a protected copy to your official email or download it here?";
        response.tools = [{ name: 'fetch_payslip_metadata', status: 'success', label: 'September Payslip Found' }];
      } else {
        response.content = "I've searched our internal documentation and policy files. Here is what I found regarding your query...";
        response.citation = { title: 'General HR Guidelines', page: 1 };
      }

      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  const quickPrompts = [
    { label: 'My leave balance', icon: <CalendarDays size={16}/> },
    { label: 'Remote work policy', icon: <Clock size={16}/> },
    { label: 'Download last payslip', icon: <FileText size={16}/> },
  ];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 144px)', gap: '24px', position: 'relative' }}>
      
      {/* 1. Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', borderRadius: '24px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        
        {/* Chat Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(27,107,58,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/giba.png" alt="GIBA AI" style={{ width: '24px', height: '24px' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>GIBA Assistant</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', background: 'var(--color-success)', borderRadius: '50%' }}></span> Always Active
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
             <button className="icon-button" title="Clear Chat"><Clock size={20}/></button>
             <button className="icon-button" title="Settings"><Info size={20}/></button>
          </div>
        </div>

        {/* Messages List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Welcome Alert / Notification */}
          {showNotification && (
            <div className="animate-fade-in" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)', padding: '16px', borderRadius: '16px', display: 'flex', gap: '16px', position: 'relative' }}>
               <div style={{ color: 'var(--color-info)' }}><Bell size={24}/></div>
               <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>Upcoming Training Session</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>You have a session on "Cybersecurity Awareness" scheduled for tomorrow at 10:00 AM.</div>
               </div>
               <button onClick={() => setShowNotification(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={16}/></button>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {msg.role === 'assistant' && msg.tools && (
                <div style={{
                  background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                  borderRadius: '12px', padding: '10px 14px', fontSize: '0.85rem', color: 'var(--color-text-muted)',
                  display: 'flex', flexDirection: 'column', gap: '6px', width: 'fit-content'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                    <Database size={16} /> <span>Querying HR Core Systems...</span>
                  </div>
                  {msg.tools.map((t: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '24px', color: 'var(--color-success)', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> {t.label}
                    </div>
                  ))}
                </div>
              )}

              <div style={{
                background: msg.role === 'user' ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))' : 'white',
                color: msg.role === 'user' ? 'white' : 'var(--color-text-primary)',
                padding: '16px 20px',
                borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                border: msg.role === 'assistant' ? '1px solid var(--color-border-subtle)' : 'none',
                boxShadow: 'var(--shadow-sm)',
                lineHeight: '1.6'
              }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                
                {msg.citation && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                    <Book size={14} /> Source: {msg.citation.title} (Page {msg.citation.page})
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ alignSelf: 'flex-start', background: 'white', border: '1px solid var(--color-border-subtle)', padding: '12px 20px', borderRadius: '18px 18px 18px 4px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                 <div className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--color-primary)', borderRadius: '50%' }}></div>
                 <div className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--color-primary)', borderRadius: '50%', animationDelay: '0.2s' }}></div>
                 <div className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--color-primary)', borderRadius: '50%', animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts & Input Area */}
        <div style={{ padding: '24px', borderTop: '1px solid var(--color-border-subtle)', background: 'var(--color-surface)' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
            {quickPrompts.map((p, i) => (
              <button 
                key={i} 
                onClick={() => setInput(p.label)} 
                style={{ 
                  whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px', 
                  padding: '8px 16px', borderRadius: '100px', border: '1px solid var(--color-border)', 
                  background: 'white', fontSize: '0.85rem', color: 'var(--color-text-secondary)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', background: 'var(--color-surface-2)', padding: '8px', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
            <input
              type="text"
              className="input-field"
              style={{ border: 'none', background: 'transparent', boxShadow: 'none', fontSize: '1rem' }}
              placeholder="Type your HR question here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={!input.trim()} className="btn-primary" style={{ borderRadius: '12px', padding: '10px 20px' }}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* 2. Side Support Panel (Dashboard for Employee) */}
      <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* User Card */}
        <div className="dashboard-card" style={{ padding: '20px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>AB</div>
              <div>
                 <div style={{ fontWeight: 700, fontSize: '1rem' }}>Amine B.</div>
                 <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Software Developer • IT</div>
              </div>
           </div>
           <div style={{ padding: '12px', background: 'var(--color-surface-2)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Leave Balance</div>
              <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>14.5 Days</div>
           </div>
        </div>

        {/* Support Tabs Panel */}
        <div className="dashboard-card" style={{ flex: 1, padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
           <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border-subtle)', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Book size={18} color="var(--color-primary)"/> Support Resources
           </div>
           
           <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              
              {/* Document Library */}
              <div style={{ marginBottom: '24px' }}>
                 <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Document Library</div>
                 {[
                   { name: 'Employee Handbook 2024.pdf', size: '2.4 MB' },
                   { name: 'Insurance_Policy_GIBA.pdf', size: '1.1 MB' },
                   { name: 'Training_Roadmap_IT.pdf', size: '840 KB' }
                 ].map((doc, i) => (
                   <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '10px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)', cursor: 'pointer' }}>
                      <FileCheck size={18} color="var(--color-primary)"/>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                         <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>
                         <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{doc.size}</div>
                      </div>
                      <ExternalLink size={14} color="var(--color-text-muted)"/>
                   </div>
                 ))}
              </div>

              {/* FAQs */}
              <div>
                 <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Common Questions</div>
                 {[
                   'How do I request a reimbursement?',
                   'What is the remote work policy?',
                   'When is the next payday?'
                 ].map((q, i) => (
                   <div key={i} onClick={() => setInput(q)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)', cursor: 'pointer', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <HelpCircle size={14} color="var(--color-text-muted)"/>
                      <span style={{ flex: 1 }}>{q}</span>
                      <ChevronRight size={14} color="var(--color-text-muted)"/>
                   </div>
                 ))}
              </div>
           </div>

           {/* Quick Actions Footer */}
           <div style={{ padding: '16px', background: 'var(--color-surface-2)', borderTop: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Request Links</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                 <button style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'white', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}><LinkIcon size={12}/> Submit Leave</button>
                 <button style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'white', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}><LinkIcon size={12}/> Expenses</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
