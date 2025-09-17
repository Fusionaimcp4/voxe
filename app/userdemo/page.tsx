"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { slugify } from "@/lib/slug";
import { normalizeUrl } from "@/lib/url";

/**
 * User‑Facing Demo Page
 *
 * Flow (3 steps):
 * 0) Business Info (read-only summary pulled from the target URL) + CTA to continue
 * 1) Contact Form (gate access)
 * 2) Demo Form (collect business inputs) -> POST to your backend to create a demo
 * 3) Demo Output (links + marketing only; no system/technical internals)
 *
 * Notes:
 * - Designed for Next.js/React 18 + TailwindCSS.
 * - Replace ENDPOINT paths in `createDemo` and `fetchBusinessInfo` to match your server.
 * - This page shows NO system-level details (tokens, IDs, etc.).
 */

// -----------------------------
// Types
// -----------------------------

type BusinessInfo = {
  url: string;
  name?: string;
  slug?: string;
  logoUrl?: string;
  summary?: string;
  knowledge_preview?: {
    project_overview?: string;
    goals_objectives?: string;
    unique_value_prop?: string;
    key_features?: string[];
    architecture_tech_stack?: string;
    user_journey?: string;
  };
  system_message_file?: string;
  generated_at?: string;
  from_cache?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
};

type DemoResult = {
  demo_url: string; // Public demo link
  system_message_file: string; // Link to generated .md
};

// -----------------------------
// Helpers
// -----------------------------

const Input = ({ label, required = false, pattern, title, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean; pattern?: string; title?: string }) => (
  <label className="block text-sm font-medium text-zinc-200">
    <span className="mb-1 block">{label}{required && <span className="text-red-400"> *</span>}</span>
    <input
      {...props}
      pattern={pattern}
      title={title}
      className={`w-full rounded-2xl bg-zinc-900/60 border border-zinc-700 focus:border-zinc-500 outline-none px-4 py-3 text-zinc-100 placeholder-zinc-500 ${props.className ?? ""}`}
    />
  </label>
);

const TextArea = ({ label, required = false, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; required?: boolean }) => (
  <label className="block text-sm font-medium text-zinc-200">
    <span className="mb-1 block">{label}{required && <span className="text-red-400"> *</span>}</span>
    <textarea
      {...props}
      className={`w-full rounded-2xl bg-zinc-900/60 border border-zinc-700 focus:border-zinc-500 outline-none px-4 py-3 text-zinc-100 placeholder-zinc-500 ${props.className ?? ""}`}
    />
  </label>
);

const Card: React.FC<React.PropsWithChildren<{ title?: string; subtitle?: string; className?: string }>> = ({ title, subtitle, className = "", children }) => (
  <div className={`rounded-3xl border border-zinc-800 bg-zinc-900/60 shadow-xl shadow-black/30 ${className}`}>
    {(title || subtitle) && (
      <div className="px-6 pt-6">
        {title && <h3 className="text-xl font-semibold text-zinc-100">{title}</h3>}
        {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

// -----------------------------
// API shims (replace with your real endpoints)
// -----------------------------

async function fetchBusinessInfo(url: string): Promise<BusinessInfo> {
  // Use POST with generateKB flag to get rich knowledge preview
  const res = await fetch("/api/demo/inspect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      url, 
      generateKB: true,
      canonicalUrls: [] // Empty array - will show primary site only
    }),
  });
  if (!res.ok) throw new Error("Unable to fetch business info");
  return res.json();
}

async function createDemo(payload: {
  url: string;
  businessName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  // Optional: pass through contact to associate lead -> demo
  lead?: { name: string; email: string; company: string; phone?: string; consent?: boolean };
}): Promise<DemoResult> {
  // Replace with your server action that orchestrates Chatwoot + n8n + KB
  const res = await fetch("/api/demo/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Demo creation failed");
  return res.json();
}

// -----------------------------
// Main Component
// -----------------------------

export default function UserFacingDemoPage() {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  // Step 0: business info prompt
  const [targetUrl, setTargetUrl] = useState("");
  const [biz, setBiz] = useState<BusinessInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  // Step 1: contact form
  const [lead, setLead] = useState({ name: "", email: "", company: "", phone: "", consent: false });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  
  // E.164 phone validation
  const isValidPhone = (phone: string) => {
    if (!phone.trim()) return true; // Optional field
    return /^\+[1-9]\d{9,14}$/.test(phone.trim());
  };
  
  const contactValid = useMemo(() => {
    const basicValid = lead.name.trim() && /.+@.+\..+/.test(lead.email) && lead.company.trim() && lead.consent;
    const phoneValid = isValidPhone(lead.phone);
    return basicValid && phoneValid;
  }, [lead]);

  // Step 2: demo form
  const [demo, setDemo] = useState({ businessName: "", logoUrl: "", primaryColor: "#7ee787", secondaryColor: "#f4a261" });
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const canContinueFromInfo = biz !== null;

  // Handle phone number changes with validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setLead({ ...lead, phone });
    
    // Clear error if phone becomes valid or empty
    if (!phone.trim() || isValidPhone(phone)) {
      setPhoneError(null);
    } else {
      setPhoneError("Please enter a valid phone number in E.164 format (e.g., +15551234567)");
    }
  };

  async function handleInspect(e: React.FormEvent) {
    e.preventDefault();
    setLoadingInfo(true);
    setInfoError(null);
    setBiz(null);
    try {
      // Normalize the URL before making the API call
      const normalizedUrl = normalizeUrl(targetUrl);
      const data = await fetchBusinessInfo(normalizedUrl);
      setBiz(data);
      setDemo(d => ({
        ...d,
        businessName: data.name || d.businessName,
        logoUrl: data.logoUrl || d.logoUrl,
        primaryColor: data.primaryColor || d.primaryColor,
        secondaryColor: data.secondaryColor || d.secondaryColor,
      }));
    } catch (err: any) {
      setInfoError(err?.message || "Could not analyze that URL. Please try another.");
    } finally {
      setLoadingInfo(false);
    }
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!biz || !contactValid) return;
    
    // Simply proceed to Step 2 - lead creation will be handled during demo creation
    setStep(2);
  }

  async function handleCreateDemo(e: React.FormEvent) {
    e.preventDefault();
    if (!biz) return;
    setCreating(true);
    setCreateError(null);
    try {
      const payload = {
        url: biz.url,
        businessName: demo.businessName || biz.name,
        logoUrl: demo.logoUrl || biz.logoUrl,
        primaryColor: demo.primaryColor,
        secondaryColor: demo.secondaryColor,
        lead,
      };
      const out = await createDemo(payload);
      setResult(out);
      setStep(3);
    } catch (err: any) {
      setCreateError(err?.message || "We couldn't create your demo just now.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Experience an AI Support Demo for Your Business</h1>
            <p className="mt-2 max-w-2xl text-zinc-400">Enter your website, leave your contact, and generate a tailored demo — all in a couple of minutes.</p>
          </div>
          <div className="hidden md:block text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <span className={`inline-flex h-2.5 w-2.5 rounded-full ${step >= 0 ? "bg-emerald-400" : "bg-zinc-700"}`}></span>
              <span>Business Info</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex h-2.5 w-2.5 rounded-full ${step >= 1 ? "bg-emerald-400" : "bg-zinc-700"}`}></span>
              <span>Contact</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex h-2.5 w-2.5 rounded-full ${step >= 2 ? "bg-emerald-400" : "bg-zinc-700"}`}></span>
              <span>Demo Setup</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex h-2.5 w-2.5 rounded-full ${step >= 3 ? "bg-emerald-400" : "bg-zinc-700"}`}></span>
              <span>Demo Ready</span>
            </div>
          </div>
        </div>

        {/* STEP 0: URL + Business preview */}
        {step === 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="1) Enter Your Website" subtitle="We’ll analyze your site and show a simple business summary.">
              <form onSubmit={handleInspect} className="space-y-4">
                <Input label="Business URL" required placeholder="https://example.com" value={targetUrl} onChange={e => setTargetUrl(e.target.value)} />
                <button disabled={!targetUrl || loadingInfo} className="w-full rounded-2xl bg-emerald-500/90 hover:bg-emerald-500 disabled:opacity-60 px-4 py-3 font-medium">
                  {loadingInfo ? "Analyzing…" : "Show Business Info"}
                </button>
                {infoError && <p className="text-sm text-red-400">{infoError}</p>}
              </form>
            </Card>

            <Card title="Business Information" subtitle="AI-generated knowledge preview from your website." className="min-h-[400px] max-h-[500px] overflow-y-auto">
              {!biz && <p className="text-zinc-400">Enter a URL and click "Show Business Info".</p>}
              {biz && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {biz.logoUrl ? (
                      <img src={biz.logoUrl} alt="Logo" className="h-12 w-12 rounded-xl object-contain bg-zinc-800" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-zinc-800" />
                    )}
                    <div>
                      <div className="text-lg font-semibold">{biz.name || new URL(biz.url).hostname}</div>
                      <div className="text-sm text-zinc-400">{biz.url}</div>
                      {biz.generated_at && (
                        <div className="text-xs text-zinc-500">
                          {biz.from_cache ? 'Cached' : 'Generated'} {new Date(biz.generated_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Rich Knowledge Preview */}
                  {biz.knowledge_preview && (
                    <div className="space-y-4 border-t border-zinc-700 pt-4">
                      {biz.knowledge_preview.project_overview && (
                        <div>
                          <h4 className="text-sm font-medium text-zinc-200 mb-2">Project Overview</h4>
                          <div className="text-sm text-zinc-300 leading-relaxed space-y-2">
                            {biz.knowledge_preview.project_overview.split('\n\n').map((part, idx) => (
                              <p key={idx} dangerouslySetInnerHTML={{ 
                                __html: part.replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-200">$1</strong>') 
                              }} />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {biz.knowledge_preview.unique_value_prop && (
                        <div>
                          <h4 className="text-sm font-medium text-zinc-200 mb-2">Unique Value Proposition</h4>
                          <p className="text-sm text-zinc-300 leading-relaxed">{biz.knowledge_preview.unique_value_prop}</p>
                        </div>
                      )}
                      
                      {biz.knowledge_preview.key_features && biz.knowledge_preview.key_features.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-zinc-200 mb-2">Key Features</h4>
                          <ul className="text-sm text-zinc-300 space-y-1">
                            {biz.knowledge_preview.key_features.slice(0, 5).map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-1">•</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                            {biz.knowledge_preview.key_features.length > 5 && (
                              <li className="text-zinc-400 text-xs">...and {biz.knowledge_preview.key_features.length - 5} more features</li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      {biz.knowledge_preview.goals_objectives && (
                        <div>
                          <h4 className="text-sm font-medium text-zinc-200 mb-2">Goals & Objectives</h4>
                          <p className="text-sm text-zinc-300 leading-relaxed">{biz.knowledge_preview.goals_objectives}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Fallback to summary if no knowledge preview */}
                  {!biz.knowledge_preview && biz.summary && (
                    <div className="border-t border-zinc-700 pt-4">
                      <p className="text-sm text-zinc-300 leading-relaxed">{biz.summary}</p>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-zinc-700 sticky bottom-0 bg-zinc-900/95 backdrop-blur-sm">
                    <button
                      disabled={!canContinueFromInfo}
                      onClick={() => setStep(1)}
                      className="w-full rounded-2xl bg-emerald-500/90 hover:bg-emerald-500 disabled:opacity-60 px-6 py-3 text-sm font-medium"
                    >
                      Looks good — continue
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* STEP 1: Contact Form */}
        {step === 1 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card title="2) Tell Us Where to Send Your Demo" subtitle="We’ll email your links and keep you updated.">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input label="Full Name" required value={lead.name} onChange={e => setLead({ ...lead, name: e.target.value })} />
                    <Input label="Work Email" required type="email" value={lead.email} onChange={e => setLead({ ...lead, email: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input label="Company" value={lead.company} onChange={e => setLead({ ...lead, company: e.target.value })} />
                    <div>
                      <Input 
                        label="Phone (optional)" 
                        placeholder="+15551234567"
                        pattern="^\+[1-9]\d{9,14}$"
                        title="Enter phone number in E.164 format (e.g., +15551234567)"
                        value={lead.phone} 
                        onChange={handlePhoneChange} 
                      />
                      {phoneError && <p className="mt-1 text-sm text-red-400">{phoneError}</p>}
                    </div>
                  </div>
                  <label className="flex items-center gap-3 text-sm text-zinc-300">
                    <input type="checkbox" checked={lead.consent} onChange={e => setLead({ ...lead, consent: e.target.checked })} className="h-4 w-4 rounded border-zinc-600 bg-zinc-900" />
                    <span>I agree to be contacted about this demo and related updates.</span>
                  </label>
                  <button disabled={!contactValid} className="w-full rounded-2xl bg-emerald-500/90 hover:bg-emerald-500 disabled:opacity-60 px-4 py-3 font-medium">
                    Continue to Demo Setup
                  </button>
                </form>
              </Card>
            </div>
            <div className="lg:col-span-1">
              <Card title="What you’ll get" className="h-full">
                <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-300">
                  <li>A live demo page with your branding</li>
                  <li>AI chat that answers common questions instantly</li>
                  <li>Optional handoff to your team for complex issues</li>
                  <li>Links you can share with stakeholders</li>
                </ul>
              </Card>
            </div>
          </div>
        )}

        {/* STEP 2: Demo Form */}
        {step === 2 && biz && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card title="3) Configure Your Demo" subtitle="Tweak anything you like — or just use our best guess.">
                <form onSubmit={handleCreateDemo} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input label="Business URL" required value={biz.url} readOnly />
                    <Input label="Business Name" placeholder={biz.name || "Auto-detected"} value={demo.businessName} onChange={e => setDemo({ ...demo, businessName: e.target.value })} />
                  </div>
                  <Input label="Logo URL (optional)" placeholder={biz.logoUrl || "https://…"} value={demo.logoUrl} onChange={e => setDemo({ ...demo, logoUrl: e.target.value })} />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-zinc-200 mb-1">Primary Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={demo.primaryColor}
                          onChange={e => setDemo({ ...demo, primaryColor: e.target.value })}
                          className="w-16 h-10 p-1 rounded-2xl bg-zinc-900/60 border border-zinc-700 focus:border-zinc-500 outline-none cursor-pointer"
                        />
                        <input
                          type="text"
                          value={demo.primaryColor}
                          onChange={e => setDemo({ ...demo, primaryColor: e.target.value })}
                          placeholder="#7ee787"
                          className="flex-1 rounded-2xl bg-zinc-900/60 border border-zinc-700 focus:border-zinc-500 outline-none px-4 py-3 text-zinc-100 placeholder-zinc-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-200 mb-1">Secondary Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={demo.secondaryColor}
                          onChange={e => setDemo({ ...demo, secondaryColor: e.target.value })}
                          className="w-16 h-10 p-1 rounded-2xl bg-zinc-900/60 border border-zinc-700 focus:border-zinc-500 outline-none cursor-pointer"
                        />
                        <input
                          type="text"
                          value={demo.secondaryColor}
                          onChange={e => setDemo({ ...demo, secondaryColor: e.target.value })}
                          placeholder="#f4a261"
                          className="flex-1 rounded-2xl bg-zinc-900/60 border border-zinc-700 focus:border-zinc-500 outline-none px-4 py-3 text-zinc-100 placeholder-zinc-500"
                        />
                      </div>
                    </div>
                  </div>
                  <button disabled={creating} className="w-full rounded-2xl bg-emerald-500/90 hover:bg-emerald-500 disabled:opacity-60 px-4 py-3 font-medium">
                    {creating ? "Creating your demo…" : "Create My Demo"}
                  </button>
                  {createError && <p className="text-sm text-red-400">{createError}</p>}
                </form>
              </Card>
            </div>
            <div className="lg:col-span-1">
              <Card title="Why teams love this" className="h-full">
                <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-300">
                  <li>Fast setup — see value in minutes</li>
                  <li>Own your data — keep it on your infra</li>
                  <li>Unlimited agents & AI resolutions</li>
                  <li>Seamless human handoff when needed</li>
                </ul>
              </Card>
            </div>
          </div>
        )}

        {/* STEP 3: Demo Output */}
        {step === 3 && result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card title="Your Demo Is Ready!" subtitle="Share these links with your team.">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-zinc-400">Demo Page with Knowledge Base Support Chat</div>
                      <a href={result.demo_url} target="_blank" className="mt-1 inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-emerald-300 hover:bg-white/10">{result.demo_url}</a>
                    </div>
                    {/* <div>
                      <div className="text-sm text-zinc-400">Generated Knowledge Base (.md)</div>
                      <a href={result.system_message_file} target="_blank" className="mt-1 inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-emerald-300 hover:bg-white/10">{result.system_message_file}</a>
                    </div>*/}
                  </div>
                </Card>
              </div>
              <div className="lg:col-span-1">
                <Card title="What to try next" className="h-full">
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-zinc-300">
                    <li>Open the demo and ask a few common customer questions.</li>
                    <li>Try a refund/billing question to see human handoff.</li>
                    <li>Share the link with a teammate and test together.</li>
                  </ol>
                  <div className="mt-4 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-300">
                    Tip: the AI answers instantly for common questions; complex ones route to a human smoothly.
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
