"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

interface StructuredSvgBgProps {
  className?: string;
  primaryColor?: string;
}

export function StructuredSvgBg({ 
  className = "", 
  primaryColor = "16, 185, 129" // Emerald 500 RGB
}: StructuredSvgBgProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmallViewport = window.innerWidth < 1024;

    if (prefersReducedMotion || isSmallViewport) {
      return;
    }
    
    const lines = containerRef.current.querySelectorAll('.animated-line');
    const nodes = containerRef.current.querySelectorAll('.animated-node');
    const scans = containerRef.current.querySelectorAll('.animated-scan');
    
    const tl = gsap.timeline();
    
    // Draw lines in
    gsap.set(lines, { strokeDasharray: 1000, strokeDashoffset: 1000, opacity: 0 });
    gsap.to(lines, {
        strokeDashoffset: 0,
        opacity: 0.15,
        duration: 3,
        stagger: 0.1,
        ease: "power2.inOut",
    });

    // Pulse nodes sequentially
    gsap.set(nodes, { scale: 0, opacity: 0, transformOrigin: "center" });
    gsap.to(nodes, {
        scale: 1,
        opacity: 0.8,
        duration: 0.5,
        stagger: 0.05,
        ease: "back.out(1.7)",
        delay: 1.5
    });

    // Continuous subtle node pulse
    gsap.to(nodes, {
        scale: 1.2,
        opacity: 0.4,
        duration: 2,
        stagger: {
            each: 0.2,
        repeat: 1,
            yoyo: true
        },
        ease: "sine.inOut",
        delay: 3
    });

    // Scanner beam effect
    gsap.set(scans, { opacity: 0, scaleY: 0.1, x: -100, transformOrigin: "left center" });
    gsap.to(scans, {
        x: '120vw',
        opacity: 0.5,
        duration: 6,
        stagger: 2,
      repeat: 1,
        ease: "linear",
        delay: 2
    });

    return () => {
        tl.kill();
        gsap.killTweensOf([lines, nodes, scans]);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`absolute inset-0 z-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 z-10 bg-background/58" />
      
      {/* Central glow */}
      <div 
        className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-[96px]"
        style={{ backgroundColor: `rgb(${primaryColor})` }}
      />
      
      <svg
        className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`rgba(${primaryColor}, 0.02)`} />
            <stop offset="50%" stopColor={`rgba(${primaryColor}, 0.2)`} />
            <stop offset="100%" stopColor={`rgba(${primaryColor}, 0.02)`} />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g className="opacity-80">
          {/* Main geometric structure */}
          <path className="animated-line" d="M -100,200 L 300,200 L 500,400 L 1200,400" fill="none" stroke="url(#lineGrad)" strokeWidth="1" />
          <path className="animated-line" d="M 200,-100 L 200,300 L 400,500 L 400,1000" fill="none" stroke="url(#lineGrad)" strokeWidth="1" />
          <path className="animated-line" d="M 800,-100 L 800,200 L 1000,400 L 1000,1000" fill="none" stroke="url(#lineGrad)" strokeWidth="1" />
          <path className="animated-line" d="M -100,600 L 200,600 L 400,800 L 1200,800" fill="none" stroke="url(#lineGrad)" strokeWidth="1" />
          
          {/* Diagonal connecting lines */}
          <path className="animated-line" d="M 300,200 L 800,200" fill="none" stroke="url(#lineGrad)" strokeWidth="1" />
          <path className="animated-line" d="M 500,400 L 1000,400" fill="none" stroke="url(#lineGrad)" strokeWidth="1" />
          
          {/* Nodes placed at intersections */}
          <circle className="animated-node" cx="300" cy="200" r="3" fill={`rgba(${primaryColor}, 0.6)`} filter="url(#glow)" />
          <circle className="animated-node" cx="500" cy="400" r="3" fill={`rgba(${primaryColor}, 0.6)`} filter="url(#glow)" />
          <circle className="animated-node" cx="200" cy="300" r="3" fill={`rgba(${primaryColor}, 0.6)`} filter="url(#glow)" />
          <circle className="animated-node" cx="400" cy="500" r="3" fill={`rgba(${primaryColor}, 0.6)`} filter="url(#glow)" />
          <circle className="animated-node" cx="800" cy="200" r="3" fill={`rgba(${primaryColor}, 0.6)`} filter="url(#glow)" />
          <circle className="animated-node" cx="1000" cy="400" r="3" fill={`rgba(${primaryColor}, 0.6)`} filter="url(#glow)" />
          
          {/* Subtle grid in background */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </g>
        
        {/* Horizontal Scanner Beams */}
        <g>
          <rect className="animated-scan" y="200" width="150" height="2" fill={`rgba(${primaryColor}, 0.5)`} filter="url(#glow)" />
          <rect className="animated-scan" y="400" width="200" height="1" fill={`rgba(${primaryColor}, 0.8)`} filter="url(#glow)" />
          <rect className="animated-scan" y="800" width="100" height="3" fill={`rgba(${primaryColor}, 0.3)`} filter="url(#glow)" />
        </g>
      </svg>
      
      {/* Edge fading to blend seamlessly */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_80%)]" />
    </div>
  );
}
