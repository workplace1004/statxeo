"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useAnimate, stagger } from "motion/react";
import { Thermometer, Droplets, Zap, Send, Globe, Cpu, MessageSquare, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export function SitePreviewSection() {
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, { once: true, margin: "-20%" });

  useEffect(() => {
    let isRunning = true;
    let hasCompletedSequence = false;

    if (isInView) {
      const runSequence = async () => {
        while (isRunning && !hasCompletedSequence) {
          // --- RESET STATES ---
          const safeAnimate = async (selector: string, props: any, options?: any) => {
            const el = scope.current?.querySelector(selector);
            if (el) return animate(selector, props, options);
          };

          await Promise.all([
            safeAnimate(".site-element", { opacity: 0, y: 15 }, { duration: 0 }),
            safeAnimate(".site-scroll-container", { y: "0%", scale: 1, opacity: 1 }, { duration: 0 }),
            safeAnimate(".lead-form", { opacity: 0, scale: 0.9, y: 20 }, { duration: 0 }),
            safeAnimate(".typing-cursor", { opacity: 0 }, { duration: 0 }),
            safeAnimate(".typing-text", { width: 0 }, { duration: 0 }),
            safeAnimate(".submit-button", { scale: 1, backgroundColor: "#10b981" }, { duration: 0 }),
            safeAnimate(".lead-form-content", { opacity: 1 }, { duration: 0 }),
            safeAnimate(".success-state", { opacity: 0, scale: 0.8 }, { duration: 0 }),

            // Revert Morph Desktop elements
            safeAnimate(".browser-header", { height: "auto", opacity: 1 }, { duration: 0 }),
            safeAnimate(".browser-frame", { width: "100%", height: "600px", borderRadius: "12px", opacity: 0 }, { duration: 0 }),
            safeAnimate(".desktop-nav", { opacity: 1, display: "flex" }, { duration: 0 }),
            safeAnimate(".badges-row", { opacity: 1, display: "flex", height: "auto" }, { duration: 0 }),
            safeAnimate(".fake-hero-title", { fontSize: "", lineHeight: "" }, { duration: 0 }),
            safeAnimate(".fake-hero-desc", { fontSize: "", lineHeight: "" }, { duration: 0 }),
            safeAnimate(".fake-site-content", { padding: "", gap: "" }, { duration: 0 }),
            safeAnimate(".services-grid", { gap: "" }, { duration: 0 }),
            safeAnimate(".hero-buttons", { scale: 1, transformOrigin: "left center" }, { duration: 0 }),

            safeAnimate(".phone-overlay", { opacity: 0 }, { duration: 0 }),
            safeAnimate(".incoming-message", { y: 40, opacity: 0, scale: 0.9 }, { duration: 0 }),

            // Chat states
            safeAnimate(".chat-interface", { opacity: 0, display: "none" }, { duration: 0 }),
            safeAnimate(".chat-bubble-user", { opacity: 0, x: 20 }, { duration: 0 }),
            safeAnimate(".chat-bubble-agent", { opacity: 0, x: -20 }, { duration: 0 }),

            // Logo Reveal states
            safeAnimate(".lock-screen-logo", { opacity: 0, y: 15, display: "none" }, { duration: 0 }),
            safeAnimate(".final-logo-reveal", { opacity: 0, scale: 0.5, display: "none" }, { duration: 0 }),
          ]);

          if (!isRunning) break;
          // Fade the empty browser in smoothly as a clean start
          await safeAnimate(".browser-frame", { opacity: 1 }, { duration: 0.6, ease: "easeInOut" });
          await new Promise((resolve) => setTimeout(resolve, 200));
          if (!isRunning) break;

          // Step 1: Site Builds (Elements fade in)
          await safeAnimate(".site-element", { opacity: [0, 1], y: [15, 0] }, { delay: stagger(0.12), duration: 0.5, ease: "easeOut" });

          // Wait a moment for user to see the built site
          await new Promise((resolve) => setTimeout(resolve, 1200));
          if (!isRunning) break;

          // Step 2: Site scrolls down
          await safeAnimate(".site-scroll-container", { y: "-45%" }, { duration: 2, ease: "easeInOut" });

          // Step 3: Pop up form appears
          await safeAnimate(".lead-form", { opacity: [0, 1], scale: [0.8, 1], y: [20, 0] }, { duration: 0.6, type: "spring", bounce: 0.4 });

          // Step 4: Form fills out (typing effect)
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (!isRunning) break;
          await safeAnimate(".typing-cursor", { opacity: [0, 1, 0] }, { duration: 0.4, repeat: 3 });
          if (!isRunning) break;
          await safeAnimate(".typing-text", { width: "100%" }, { duration: 0.8, ease: "linear" });
          await safeAnimate(".typing-cursor", { opacity: 0 }, { duration: 0.1 });

          // Submit button press
          await safeAnimate(".submit-button", { scale: 0.92, backgroundColor: "#059669" }, { duration: 0.15 });
          await safeAnimate(".submit-button", { scale: 1, backgroundColor: "#10b981" }, { duration: 0.15 });

          // Form success state
          await safeAnimate(".lead-form-content", { opacity: 0 }, { duration: 0.3 });
          await safeAnimate(".success-state", { opacity: [0, 1], scale: [0.8, 1] }, { duration: 0.4, type: "spring" });

          await new Promise((resolve) => setTimeout(resolve, 800));
          if (!isRunning) break;

          // Let the form disappear before morphing
          await safeAnimate(".lead-form", { opacity: 0, scale: 0.9 }, { duration: 0.4 });

          // Step 5: Morph to Mobile Phone
          const morphPromise = safeAnimate(
            ".browser-frame",
            { width: "320px", height: "650px", borderRadius: "36px" },
            { duration: 1.2, ease: [0.25, 1, 0.5, 1] }
          );

          // Hide desktop elements
          safeAnimate(".browser-header", { height: 0, opacity: 0, overflow: "hidden" }, { duration: 0.6, ease: "anticipate" });
          safeAnimate(".desktop-nav", { opacity: 0, display: "none" }, { duration: 0.4 });
          safeAnimate(".badges-row", { opacity: 0, display: "none", height: 0 }, { duration: 0.4 });

          // Adjust internal zoom/position and mobile font sizing
          safeAnimate(".fake-hero-title", { fontSize: "24px", lineHeight: "1.2" }, { duration: 1.2, ease: "easeInOut" });
          safeAnimate(".fake-hero-desc", { fontSize: "12px", lineHeight: "1.4" }, { duration: 1.2, ease: "easeInOut" });
          safeAnimate(".fake-site-content", { padding: "24px", gap: "24px" }, { duration: 1.2, ease: "easeInOut" });
          safeAnimate(".services-grid", { gap: "10px" }, { duration: 1.2, ease: "easeInOut" });
          safeAnimate(".hero-buttons", { scale: 0.85, transformOrigin: "left center" }, { duration: 1.2, ease: "easeInOut" });

          const scrollPromise = safeAnimate(".site-scroll-container", { opacity: 0 }, { duration: 0.6 });

          await Promise.all([morphPromise, scrollPromise]);

          // Transition to Mobile Lock Screen
          await safeAnimate(".phone-overlay", { opacity: [0, 1, 0.8] }, { duration: 0.8 });
          safeAnimate(".lock-screen-logo", { display: "flex" }, { duration: 0 });
          safeAnimate(".lock-screen-logo", { opacity: 1, y: 0 }, { duration: 0.6 });
          if (!isRunning) break;

          // Step 6: Incoming Lead Message on phone
          await new Promise((resolve) => setTimeout(resolve, 400));
          await safeAnimate(".incoming-message", { y: [40, 0], opacity: [0, 1], scale: [0.9, 1] }, { duration: 0.6, type: "spring", bounce: 0.5 });

          await new Promise((resolve) => setTimeout(resolve, 1500));
          if (!isRunning) break;

          // Step 7: "Tap" notification -> Enter Chat Interface
          await safeAnimate(".incoming-message", { scale: 1.1, opacity: 0 }, { duration: 0.3 });
          safeAnimate(".lock-screen-logo", { opacity: 0 }, { duration: 0.3 });
          await safeAnimate(".phone-overlay", { opacity: 0 }, { duration: 0.4 });
          safeAnimate(".lock-screen-logo", { display: "none" }, { duration: 0 });
          await safeAnimate(".chat-interface", { display: "flex", opacity: 1 }, { duration: 0.4 });

          if (!isRunning) break;

          // Show User Message (Lead)
          await new Promise((resolve) => setTimeout(resolve, 400));
          await safeAnimate(".chat-bubble-user", { opacity: 1, x: 0 }, { duration: 0.5, type: "spring" });

          // Agent typing delay
          await new Promise((resolve) => setTimeout(resolve, 800));
          if (!isRunning) break;

          // Show Agent Reply
          await safeAnimate(".chat-bubble-agent", { opacity: 1, x: 0 }, { duration: 0.5, type: "spring" });

          await new Promise((resolve) => setTimeout(resolve, 2000));
          if (!isRunning) break;

          // Step 8: Final Logo Reveal
          // Fade out chat first
          await safeAnimate(".chat-interface", { opacity: 0 }, { duration: 0.5 });
          await safeAnimate(".chat-interface", { display: "none" }, { duration: 0 });

          // Show big brand logo
          await safeAnimate(".final-logo-reveal", { display: "flex", opacity: 1, scale: [0.8, 1] }, { duration: 0.8, ease: "backOut" });

          // Wait 3 seconds on the big logo
          await new Promise((resolve) => setTimeout(resolve, 3000));
          if (!isRunning) break;

          hasCompletedSequence = true;
        }
      };

      runSequence();
    }

    return () => {
      isRunning = false;
    };
  }, [isInView, animate]);

  return (
    <section id="site-preview" className="w-full py-24 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 relative z-30"
        >
          <p className="text-sm font-mono text-primary mb-3 tracking-wider uppercase">
            Example Template
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            See the magic happen
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Our optimized templates don’t just look good. They capture leads and instantly text them to your phone, so you close faster.
          </p>
        </motion.div>

        {/* Animation Container */}
        <div ref={scope} className="relative w-full h-[700px] flex items-center justify-center perspective-[2000px]">
          {/* The Morphed Frame */}
          <div className="browser-frame w-full max-w-4xl h-[600px] bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden relative shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] flex flex-col mx-auto">
            {/* Same internal content */}

            {/* Browser Chrome (hides on mobile morph) */}
            <div className="browser-header shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-secondary/80 backdrop-blur-md relative z-20">
              <div className="flex gap-1.5 z-30">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 flex items-center justify-center z-30">
                <div className="flex items-center gap-2 rounded-md bg-background/60 border border-border/50 px-4 py-1.5 text-[11px] sm:text-xs text-muted-foreground font-mono shadow-inner w-full max-w-sm justify-center">
                  <Globe className="h-3 w-3" />
                  statxt.com/your-business
                </div>
              </div>
            </div>

            {/* Scroll viewport */}
            <div className="relative flex-1 bg-background overflow-hidden flex flex-col">

              {/* Scrolling content (Site) */}
              <div className="site-scroll-container w-full min-h-[1200px] bg-background origin-top flex flex-col relative z-0">

                {/* Fake Site Content */}
                <div className="fake-site-content p-8 sm:p-12 w-full max-w-3xl mx-auto flex flex-col gap-10">

                  {/* Header */}
                  <div className="site-element opacity-0 flex items-center justify-between">
                    <span className="text-xl font-bold text-foreground tracking-tight">YourBusiness</span>
                    <div className="desktop-nav flex gap-6 text-sm text-muted-foreground font-medium">
                      <span className="hidden sm:inline">Services</span>
                      <span className="hidden sm:inline">Reviews</span>
                      <span className="hidden sm:inline">About</span>
                    </div>
                  </div>

                  {/* Hero Area */}
                  <div className="site-element opacity-0 flex flex-col gap-5 pt-8">
                    <div className="badges-row flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Licensed & Insured
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-wider text-primary font-semibold">
                        <Cpu className="h-3 w-3" />
                        Top Rated Pros
                      </span>
                    </div>
                    <h3 className="fake-hero-title text-4xl sm:text-5xl font-black text-foreground leading-[1.1] text-balance">
                      Professional Service You Can Actually Trust
                    </h3>
                    <p className="fake-hero-desc text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
                      Serving the metro area with fast, reliable, and expert solutions. Same-day appointments available.
                    </p>
                    <div className="hero-buttons flex flex-wrap gap-4 pt-2">
                      <div className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 cursor-pointer">
                        Book Now
                      </div>
                      <div className="inline-flex items-center justify-center rounded-xl border border-border bg-transparent px-6 py-3 text-sm font-bold text-foreground cursor-pointer">
                        Our Services
                      </div>
                    </div>
                  </div>

                  {/* Services Grid */}
                  <div className="services-grid site-element opacity-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
                    {[
                      { icon: Thermometer, name: "HVAC", desc: "Install & repair" },
                      { icon: Droplets, name: "Plumbing", desc: "Leaks & piping" },
                      { icon: Zap, name: "Electrical", desc: "Wiring & panels" },
                    ].map((service, i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-border/80 bg-secondary/30 p-6 flex flex-col gap-3"
                      >
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <service.icon className="h-6 w-6" />
                        </div>
                        <h4 className="text-lg font-bold text-foreground">
                          {service.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{service.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Spacer for scrolling down to form */}
                  <div className="w-full h-screen" />
                </div>
              </div>

              {/* Mobile Chat Interface */}
              <div className="chat-interface absolute inset-0 z-50 bg-[#F2F2F7] dark:bg-[#09090b] flex-col hidden opacity-0">
                {/* Chat Header */}
                <div className="px-6 py-4 flex items-center gap-4 bg-background/80 backdrop-blur-md border-b border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary overflow-hidden">
                    <Image src="/whiteNBG.png" alt="Statxt" width={40} height={40} className="w-8 h-auto object-contain" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">Service Dispatch</span>
                    <span className="text-[10px] text-primary uppercase font-bold tracking-widest">Active Now</span>
                  </div>
                </div>

                {/* Chat Bubbles */}
                <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
                  {/* User Bubble */}
                  <div className="chat-bubble-user self-end max-w-[85%] bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-none shadow-md opacity-0">
                    <p className="text-sm font-medium">I need an AC repair ASAP at 123 Main St.</p>
                    <span className="text-[10px] opacity-70 mt-1 block text-right">Delivered</span>
                  </div>

                  {/* Agent Bubble */}
                  <div className="chat-bubble-agent self-start max-w-[85%] bg-secondary text-foreground px-4 py-3 rounded-2xl rounded-tl-none border border-border/50 shadow-sm opacity-0">
                    <p className="text-sm font-medium">We will have a technician on the way!</p>
                    <span className="text-[10px] text-muted-foreground mt-1 block">Just now</span>
                  </div>
                </div>

                {/* Chat Input Placeholder */}
                <div className="p-4 bg-background/50 border-t border-border/30">
                  <div className="h-12 w-full bg-secondary/50 rounded-full border border-border/50 px-5 flex items-center text-muted-foreground text-sm">
                    Type a message...
                  </div>
                </div>
              </div>

              {/* Final Logo Reveal State */}
              <div className="final-logo-reveal absolute inset-0 z-[70] flex flex-col items-center justify-center bg-background hidden opacity-0">
                <div className="w-full flex flex-col items-center justify-center -translate-y-4">
                  <div className="relative group flex items-center justify-center w-full">
                    {/* Glowing background behind logo */}
                    <div className="absolute w-48 h-48 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
                    <Image
                      src="/whiteNBG.png"
                      alt="Statxt"
                      width={300}
                      height={100}
                      className="relative w-[70%] h-auto object-contain drop-shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                    />
                  </div>
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mt-12 text-primary font-mono text-xs tracking-[0.4em] uppercase"
                  >
                    Powered by Statxt
                  </motion.div>
                </div>
              </div>

              {/* Pop Up Form Overlay */}
              <div className="lead-form opacity-0 absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 pointer-events-none">
                <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col relative overflow-hidden">

                  {/* Filling State */}
                  <div className="lead-form-content flex flex-col relative z-10 w-full h-full">
                    <h4 className="text-xl font-bold text-foreground mb-2">Request Service</h4>
                    <p className="text-sm text-muted-foreground mb-6">We reply in under 5 minutes.</p>

                    <div className="space-y-4">
                      <div className="w-full h-11 rounded-lg bg-secondary/50 border border-border/60 px-4 flex items-center text-sm font-medium">
                        Alex Johnson
                      </div>
                      <div className="w-full h-11 rounded-lg bg-secondary/50 border border-border/60 px-4 flex items-center text-sm font-medium">
                        555-0199
                      </div>
                      <div className="w-full h-11 rounded-lg bg-secondary/50 border border-ring/50 px-4 flex items-center text-sm font-medium shadow-[0_0_0_1px_rgba(16,185,129,0.3)] relative overflow-hidden">
                        <div className="absolute inset-x-4 flex items-center">
                          <span className="text-foreground tracking-wide whitespace-nowrap overflow-hidden inline-block typing-text w-0">
                            I need an AC repair ASAP
                          </span>
                          <span className="typing-cursor w-[2px] h-5 bg-primary ml-1 opacity-0" />
                        </div>
                      </div>
                    </div>

                    <div className="submit-button mt-6 w-full h-12 bg-primary rounded-xl flex items-center justify-center gap-2 text-primary-foreground font-bold shadow-lg shadow-primary/20">
                      <Send className="h-4 w-4" />
                      Send Request
                    </div>
                  </div>

                  {/* Success State */}
                  <div className="success-state opacity-0 absolute inset-0 flex flex-col items-center justify-center z-20 bg-card p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h4 className="text-xl font-bold text-foreground mb-2">Request Sent!</h4>
                    <p className="text-sm text-muted-foreground">We'll be in touch shortly.</p>
                  </div>

                </div>
              </div>

              {/* Phone Boot flash overlay (leaves a dark dim over the site for lock screen effect) */}
              <div className="phone-overlay absolute inset-0 bg-black z-40 opacity-0 pointer-events-none backdrop-blur-sm" />

              {/* Lock Screen Logo */}
              <div className="lock-screen-logo absolute top-24 inset-x-0 z-50 flex justify-center items-center pointer-events-none opacity-0 translate-y-4 hidden">
                <Image src="/whiteNBG.png" alt="Statxt" width={160} height={50} className="w-32 h-auto object-contain opacity-40" />
              </div>

              {/* Incoming Lead Message Notification (Visible only when morphed to phone) */}
              <div className="absolute top-48 inset-x-0 flex justify-center items-center z-[60] pointer-events-none">
                <div className="incoming-message opacity-0 flex items-center gap-4 bg-[#1C1C1E]/95 backdrop-blur-xl border border-white/10 rounded-[28px] p-4 w-[90%] max-w-[300px] shadow-2xl">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                    <Image src="/whiteNBG.png" alt="Statxt" width={40} height={40} className="w-7 h-auto object-contain" />
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex justify-between items-center w-full mb-0.5">
                      <span className="text-white font-semibold text-[15px]">New Lead ✨</span>
                      <span className="text-white/40 text-[11px]">now</span>
                    </div>
                    <span className="text-white/80 text-[13px] leading-tight truncate">
                      Alex: "I need an AC repair..."
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
