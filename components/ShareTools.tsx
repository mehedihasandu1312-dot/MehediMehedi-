
import React, { useState } from 'react';
import { Share2, Copy, Check, Code, Facebook, Twitter, Linkedin } from 'lucide-react';
import { Button, Card } from './UI';

interface ShareToolsProps {
    title: string;
    url?: string;
    type: 'NOTE' | 'RESULT' | 'EXAM';
    score?: number;
}

const ShareTools: React.FC<ShareToolsProps> = ({ title, url = window.location.href, type, score }) => {
    const [copied, setCopied] = useState(false);
    const [embedCopied, setEmbedCopied] = useState(false);
    const [showEmbed, setShowEmbed] = useState(false);

    // --- STRATEGY 1: AUTO CITATION GENERATOR (Do-Follow Backlink) ---
    const citationHtml = `<a href="${url}" target="_blank" rel="dofollow">Read full notes on "${title}" at EduMaster Pro</a>`;
    
    // --- STRATEGY 2: EMBEDDABLE BADGE (For Results) ---
    const embedBadgeHtml = `
    <div style="border:1px solid #E2136E; padding:10px; border-radius:8px; display:inline-block; font-family:sans-serif; text-align:center;">
        <span style="font-size:12px; color:#555;">I scored</span><br/>
        <strong style="font-size:24px; color:#E2136E;">${score}%</strong><br/>
        <span style="font-size:12px;">on ${title}</span><br/>
        <a href="${url}" style="text-decoration:none; color:#fff; background:#E2136E; padding:4px 8px; border-radius:4px; font-size:10px; display:block; margin-top:5px;">Take This Exam</a>
    </div>`;

    const handleCopy = (text: string, setFn: (v: boolean) => void) => {
        navigator.clipboard.writeText(text);
        setFn(true);
        setTimeout(() => setFn(false), 2000);
    };

    const shareSocial = (platform: 'fb' | 'tw' | 'li') => {
        let shareUrl = '';
        const text = `Check out "${title}" on EduMaster Pro!`;
        if (platform === 'fb') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        if (platform === 'tw') shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        if (platform === 'li') shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank', 'width=600,height=400');
    };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mt-8">
            <h3 className="font-bold text-slate-800 flex items-center mb-4">
                <Share2 size={20} className="mr-2 text-indigo-600" /> 
                {type === 'RESULT' ? 'Share Success & Build Profile' : 'Share & Cite This Resource'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SOCIAL SHARE SIGNALS */}
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-3">Quick Share</p>
                    <div className="flex gap-2">
                        <button onClick={() => shareSocial('fb')} className="flex-1 bg-[#1877F2] text-white py-2 rounded-lg font-bold text-xs hover:opacity-90 flex items-center justify-center">
                            Facebook
                        </button>
                        <button onClick={() => shareSocial('tw')} className="flex-1 bg-[#1DA1F2] text-white py-2 rounded-lg font-bold text-xs hover:opacity-90 flex items-center justify-center">
                            Twitter
                        </button>
                        <button onClick={() => shareSocial('li')} className="flex-1 bg-[#0A66C2] text-white py-2 rounded-lg font-bold text-xs hover:opacity-90 flex items-center justify-center">
                            LinkedIn
                        </button>
                    </div>
                </div>

                {/* BACKLINK GENERATOR */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-slate-500 uppercase">
                            {type === 'RESULT' ? 'Embed Badge (For Your Blog)' : 'Cite on Website (Get Credit)'}
                        </p>
                        <button onClick={() => setShowEmbed(!showEmbed)} className="text-xs text-indigo-600 font-bold hover:underline">
                            {showEmbed ? 'Hide Code' : 'Get HTML Code'}
                        </button>
                    </div>
                    
                    {showEmbed ? (
                        <div className="relative">
                            <textarea 
                                readOnly 
                                className="w-full bg-slate-800 text-green-400 font-mono text-[10px] p-3 rounded-lg h-24 resize-none focus:outline-none"
                                value={type === 'RESULT' ? embedBadgeHtml : citationHtml}
                            />
                            <button 
                                onClick={() => handleCopy(type === 'RESULT' ? embedBadgeHtml : citationHtml, setEmbedCopied)}
                                className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-1.5 rounded"
                            >
                                {embedCopied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 p-3 rounded-lg flex items-center justify-between">
                            <div className="flex items-center text-sm text-slate-600">
                                <Code size={16} className="mr-2 text-slate-400" />
                                {type === 'RESULT' ? 'Add Score Badge to your site' : 'Copy Citation Link'}
                            </div>
                            <Button size="sm" variant="outline" onClick={() => setShowEmbed(true)} className="h-8 text-xs">
                                View Code
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareTools;
