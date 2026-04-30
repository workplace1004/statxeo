"use client";

import React, { useState, useEffect } from "react";
import Preloader from "@/components/react-bits/preloader";

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate initial page load/asset fetching
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Preloader
            loading={loading}
            textClassName="text-emerald-500 font-bold tracking-widest"
        >
            {children}
        </Preloader>
    );
}
