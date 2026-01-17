import React, { useEffect, useState } from 'react';

interface AdBannerProps {
    slotId?: string; // Google AdSense Data Ad Slot ID
    format?: 'auto' | 'fluid' | 'rectangle';
    className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ slotId = "1234567890", format = "auto", className = "" }) => {
    // Detect if we are using a placeholder ID or if the script is missing
    const isPlaceholder = slotId === "1234567890" || slotId === "POPUP_MODAL_AD_ID";
    const [adError, setAdError] = useState(false);

    useEffect(() => {
        if (isPlaceholder || adError) return;

        try {
            // Push the ad to Google AdSense only if script is loaded
            if ((window as any).adsbygoogle) {
                (window as any).adsbygoogle.push({});
            } else {
                // Script not loaded (e.g. commented out in index.html)
                setAdError(true);
            }
        } catch (e) {
            console.error("AdSense Error:", e);
            setAdError(true);
        }
    }, [isPlaceholder, adError]);

    // Show a clean placeholder in development or if Ads fail to load
    if (isPlaceholder || adError) {
        return (
            <div className={`w-full bg-slate-100 border border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 p-4 my-4 min-h-[100px] animate-pulse ${className}`}>
                <span className="font-bold text-xs uppercase tracking-widest text-slate-300">Advertisement Space</span>
                <span className="text-[10px] text-slate-300 mt-1">AdSense will appear here in production</span>
            </div>
        );
    }

    return (
        <div className={`w-full my-6 text-center overflow-hidden bg-white/50 rounded-lg ${className}`}>
            <div className="text-[10px] text-slate-300 uppercase tracking-widest mb-1">Sponsored</div>
            <ins 
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-YOUR_PUBLISHER_ID_HERE" // REPLACE THIS WITH YOUR REAL PUBLISHER ID
                data-ad-slot={slotId}
                data-ad-format={format}
                data-full-width-responsive="true"
            ></ins>
        </div>
    );
};

export default AdBanner;