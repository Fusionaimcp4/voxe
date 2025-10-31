"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { slugify } from "@/lib/slug";
import { normalizeUrl } from "@/lib/url";

/**
 * User‑Facing Demo Page
 *
 * Streamlined Flow (3 steps):
 * 0) Business Info (read-only summary pulled from the target URL) + CTA to continue
 * 1) Demo Configuration (business inputs + contact override) -> POST to backend to create demo
 * 2) Demo Output (links + marketing only; no system/technical internals)
 *
 * Notes:
 * - Integrated with Dashboard UI and user authentication
 * - Pre-populates contact info from user session
 * - Allows contact override for different demo contact info
 * - Handles contact deduplication automatically
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
  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
    <span className="mb-1 block">{label}{required && <span className="text-red-500"> *</span>}</span>
    <input
      {...props}
      pattern={pattern}
      title={title}
      className={`w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 ${props.className ?? ""}`}
    />
  </label>
);

const TextArea = ({ label, required = false, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; required?: boolean }) => (
  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
    <span className="mb-1 block">{label}{required && <span className="text-red-500"> *</span>}</span>
    <textarea
      {...props}
      className={`w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 ${props.className ?? ""}`}
    />
  </label>
);

const Card: React.FC<React.PropsWithChildren<{ title?: string; subtitle?: string; className?: string }>> = ({ title, subtitle, className = "", children }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm ${className}`}>
    {(title || subtitle) && (
      <div className="px-6 pt-6">
        {title && <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
        {subtitle && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
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
  const { data: session } = useSession();
  const [step, setStep] = useState<0 | 1 | 2>(0);

  // Step 0: business info prompt
  const [targetUrl, setTargetUrl] = useState("");
  const [biz, setBiz] = useState<BusinessInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  // Step 1: demo configuration (combined contact + demo setup)
  const [lead, setLead] = useState({ name: "", email: "", company: "", phone: "", consent: false });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [useCustomContact, setUseCustomContact] = useState(false);
  
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

  // Demo configuration
  const [demo, setDemo] = useState({ businessName: "", logoUrl: "", primaryColor: "#7ee787", secondaryColor: "#f4a261" });
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const canContinueFromInfo = biz !== null;

  // Pre-populate contact info from session
  useEffect(() => {
    if (session?.user && !useCustomContact) {
      setLead({
        name: session.user.name || "",
        email: session.user.email || "",
        company: "",
        phone: "",
        consent: true
      });
    }
  }, [session, useCustomContact]);

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

  // Removed handleContactSubmit - now combined with demo creation

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
      setStep(2);
    } catch (err: any) {
      setCreateError(err?.message || "We couldn't create your demo just now.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              Create AI Support Demo
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Generate a tailored demo for your business in minutes
            </p>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className={`inline-flex h-2 w-2 rounded-full ${step >= 0 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}></span>
              <span className="hidden sm:inline">Business Info</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex h-2 w-2 rounded-full ${step >= 1 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}></span>
              <span className="hidden sm:inline">Configuration</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex h-2 w-2 rounded-full ${step >= 2 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}></span>
              <span className="hidden sm:inline">Ready</span>
            </div>
          </div>
        </div>
      </motion.div>

        {/* STEP 0: URL + Business preview */}
        {step === 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="1) Enter Your Website" subtitle="We’ll analyze your site and show a simple business summary.">
              <form onSubmit={handleInspect} className="space-y-4">
                <Input label="Business URL" required placeholder="https://example.com" value={targetUrl} onChange={e => setTargetUrl(e.target.value)} />
                <button disabled={!targetUrl || loadingInfo} className="w-full px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                  {loadingInfo ? "Analyzing…" : "Show Business Info"}
                </button>
                {infoError && <p className="text-sm text-red-600 dark:text-red-400">{infoError}</p>}
              </form>
            </Card>

            <Card title="Business Information" subtitle="AI-generated knowledge preview from your website." className="min-h-[400px] max-h-[500px] overflow-y-auto">
              {!biz && <p className="text-slate-500 dark:text-slate-400">Enter a URL and click "Show Business Info".</p>}
              {biz && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {biz.logoUrl ? (
                      <img src={biz.logoUrl} alt="Logo" className="h-12 w-12 rounded-xl object-contain bg-slate-100 dark:bg-slate-700" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-700" />
                    )}
                    <div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{biz.name || new URL(biz.url).hostname}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{biz.url}</div>
                      {biz.generated_at && (
                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          {biz.from_cache ? 'Cached' : 'Generated'} {new Date(biz.generated_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Rich Knowledge Preview */}
                  {biz.knowledge_preview && (
                    <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                      {biz.knowledge_preview.project_overview && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Project Overview</h4>
                          <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
                            {biz.knowledge_preview.project_overview.split('\n\n').map((part, idx) => (
                              <p key={idx} dangerouslySetInnerHTML={{ 
                                __html: part.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-slate-100">$1</strong>') 
                              }} />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {biz.knowledge_preview.unique_value_prop && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Unique Value Proposition</h4>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{biz.knowledge_preview.unique_value_prop}</p>
                        </div>
                      )}
                      
                      {biz.knowledge_preview.key_features && biz.knowledge_preview.key_features.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Key Features</h4>
                          <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                            {biz.knowledge_preview.key_features.slice(0, 5).map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-emerald-500 mt-1">•</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                            {biz.knowledge_preview.key_features.length > 5 && (
                              <li className="text-slate-500 dark:text-slate-400 text-xs">...and {biz.knowledge_preview.key_features.length - 5} more features</li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      {biz.knowledge_preview.goals_objectives && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Goals & Objectives</h4>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{biz.knowledge_preview.goals_objectives}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Fallback to summary if no knowledge preview */}
                  {!biz.knowledge_preview && biz.summary && (
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{biz.summary}</p>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 sticky bottom-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
                    <button
                      disabled={!canContinueFromInfo}
                      onClick={() => setStep(1)}
                      className="w-full px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      Looks good — configure demo
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* STEP 1: Demo Configuration (combined contact + demo setup) */}
        {step === 1 && biz && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card title="2) Configure Your Demo" subtitle="Set up your demo details and contact information.">
                <form onSubmit={handleCreateDemo} className="space-y-6">
                  {/* Demo Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Demo Settings</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Input label="Business URL" required value={biz.url} readOnly />
                      <Input label="Business Name" placeholder={biz.name || "Auto-detected"} value={demo.businessName} onChange={e => setDemo({ ...demo, businessName: e.target.value })} />
                    </div>
                    <Input label="Logo URL (optional)" placeholder={biz.logoUrl || "https://…"} value={demo.logoUrl} onChange={e => setDemo({ ...demo, logoUrl: e.target.value })} />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Primary Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={demo.primaryColor}
                            onChange={e => setDemo({ ...demo, primaryColor: e.target.value })}
                            className="w-12 h-10 sm:w-16 p-1 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:border-emerald-500 outline-none cursor-pointer"
                          />
                          <input
                            type="text"
                            value={demo.primaryColor}
                            onChange={e => setDemo({ ...demo, primaryColor: e.target.value })}
                            placeholder="#7ee787"
                            className="flex-1 px-3 sm:px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-sm sm:text-base"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Secondary Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={demo.secondaryColor}
                            onChange={e => setDemo({ ...demo, secondaryColor: e.target.value })}
                            className="w-12 h-10 sm:w-16 p-1 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:border-emerald-500 outline-none cursor-pointer"
                          />
                          <input
                            type="text"
                            value={demo.secondaryColor}
                            onChange={e => setDemo({ ...demo, secondaryColor: e.target.value })}
                            placeholder="#f4a261"
                            className="flex-1 px-3 sm:px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-sm sm:text-base"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Contact Information</h3>
                      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <input 
                          type="checkbox" 
                          checked={useCustomContact} 
                          onChange={e => setUseCustomContact(e.target.checked)} 
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-emerald-500" 
                        />
                        <span>Use different contact info</span>
                      </label>
                    </div>
                    
                    {!useCustomContact && session?.user ? (
                      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">Using your account information:</p>
                        <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                          <div><strong>Name:</strong> {session.user.name}</div>
                          <div><strong>Email:</strong> {session.user.email}</div>
                          <div><strong>Company:</strong> Not specified</div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Input label="Full Name" required value={lead.name} onChange={e => setLead({ ...lead, name: e.target.value })} />
                          <Input label="Work Email" required type="email" value={lead.email} onChange={e => setLead({ ...lead, email: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Input label="Company" required value={lead.company} onChange={e => setLead({ ...lead, company: e.target.value })} />
                          <div>
                            <Input 
                              label="Phone (optional)" 
                              placeholder="+15551234567"
                              pattern="^\+[1-9]\d{9,14}$"
                              title="Enter phone number in E.164 format (e.g., +15551234567)"
                              value={lead.phone} 
                              onChange={handlePhoneChange} 
                            />
                            {phoneError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{phoneError}</p>}
                          </div>
                        </div>
                        <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                          <input type="checkbox" checked={lead.consent} onChange={e => setLead({ ...lead, consent: e.target.checked })} className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-emerald-500" />
                          <span>I agree to be contacted about this demo and related updates.</span>
                        </label>
                      </div>
                    )}
                  </div>

                  <button 
                    disabled={creating || (useCustomContact && !contactValid)} 
                    className="w-full px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {creating ? "Creating your demo…" : "Create My Demo"}
                  </button>
                  {createError && <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>}
                </form>
              </Card>
            </div>
            <div className="lg:col-span-1">
              <Card title="What you'll get" className="h-full">
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li>A live demo page with your branding</li>
                  <li>AI chat that answers common questions instantly</li>
                  <li>Optional handoff to your team for complex issues</li>
                  <li>Links you can share with stakeholders</li>
                </ul>
              </Card>
            </div>
          </div>
        )}

        {/* STEP 2: Demo Output */}
        {step === 2 && result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card title="Your Demo Is Ready!" subtitle="Share these links with your team.">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Demo Page with Knowledge Base Support Chat</div>
                      <a href={result.demo_url} target="_blank" className="mt-1 inline-flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-2 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">{result.demo_url}</a>
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
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li>Open the demo and ask a few common customer questions.</li>
                    <li>Try a refund/billing question to see human handoff.</li>
                    <li>Share the link with a teammate and test together.</li>
                  </ol>
                  <div className="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                    Tip: the AI answers instantly for common questions; complex ones route to a human smoothly.
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
    </div>
  );
}
