import React, { useEffect } from 'react';

interface AdBannerProps {
    slotId?: string; // Google AdSense Data Ad Slot ID
    format?: 'auto' | 'fluid' | 'rectangle';
    className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ slotId = "1234567890", format = "auto", className = "" }) => {
    useEffect(() => {
        try {
            // Push the ad to Google AdSense
            const adsbygoogle = (window as any).adsbygoogle || [];
            adsbygoogle.push({});
        } catch (e) {
            console.error("AdSense Error:", e);
        }
    }, []);

    // Placeholder Development Mode (Remove this logic in production and keep only the <ins> tag)
    const isDev = false; // Set to true to see placeholders instead of real ads

    if (isDev) {
        return (
            <div className={`w-full bg-slate-200 border border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 p-4 my-4 min-h-[100px] ${className}`}>
                <span className="font-bold text-xs uppercase tracking-widest">Advertisement</span>
                <span className="text-[10px]">Google AdSense Space</span>
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