
import React, { useEffect } from 'react';

interface SEOProps {
    title: string;
    description?: string;
    keywords?: string[];
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'book' | 'profile' | 'product' | 'course';
    author?: string;
    publishedTime?: string;
    modifiedTime?: string; // NEW: Triggers Google to re-crawl immediately
    price?: { amount: number; currency: string };
    schema?: object;
    noIndex?: boolean;
    breadcrumbs?: { name: string; url: string }[]; // NEW: Breadcrumb Schema for better structure
}

const SEO: React.FC<SEOProps> = ({ 
    title, 
    description = "EduMaster Pro - The ultimate educational platform for students and admins.", 
    keywords = ["education", "learning", "exam", "bangladesh", "edtech", "SSC", "HSC", "Admission"],
    image = "/vite.svg", 
    url = window.location.href,
    type = "website",
    author = "EduMaster Team",
    publishedTime,
    modifiedTime,
    price,
    schema,
    noIndex = false,
    breadcrumbs
}) => {
    
    useEffect(() => {
        // 1. Update Document Title
        document.title = `${title} | EduMaster Pro`;

        // 2. Helper to manage Meta Tags
        const setMeta = (name: string, content: string) => {
            let element = document.querySelector(`meta[name="${name}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute('name', name);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        const setOgMeta = (property: string, content: string) => {
            let element = document.querySelector(`meta[property="${property}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute('property', property);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        const setCanonical = (href: string) => {
            let element = document.querySelector(`link[rel="canonical"]`);
            if (!element) {
                element = document.createElement('link');
                element.setAttribute('rel', 'canonical');
                document.head.appendChild(element);
            }
            element.setAttribute('href', href);
        };

        // --- APPLY META TAGS ---
        setMeta('description', description);
        setMeta('keywords', keywords.join(', '));
        setMeta('author', author);
        setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

        // Open Graph
        setOgMeta('og:title', title);
        setOgMeta('og:description', description);
        setOgMeta('og:image', window.location.origin + image);
        setOgMeta('og:url', url);
        setOgMeta('og:type', type);
        setOgMeta('og:site_name', 'EduMaster Pro');
        if (publishedTime) setOgMeta('article:published_time', publishedTime);
        if (modifiedTime) setOgMeta('article:modified_time', modifiedTime); // Critical for freshness ranking

        // Twitter Card
        setMeta('twitter:card', 'summary_large_image');
        setMeta('twitter:title', title);
        setMeta('twitter:description', description);
        setMeta('twitter:image', window.location.origin + image);

        setCanonical(url);

        // --- 4. ADVANCED GOOGLE SCHEMA (JSON-LD) ---
        // This is the "Magic" part that structures data for Google
        let jsonLdData: any[] = [];

        // Base Website Schema
        jsonLdData.push({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "EduMaster Pro",
            "url": window.location.origin,
            "potentialAction": {
                "@type": "SearchAction",
                "target": `${window.location.origin}/#/student/store?search={search_term_string}`,
                "query-input": "required name=search_term_string"
            }
        });

        // Breadcrumb Schema (Helps ranking hierarchy)
        if (breadcrumbs && breadcrumbs.length > 0) {
            jsonLdData.push({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": breadcrumbs.map((crumb, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "name": crumb.name,
                    "item": window.location.origin + crumb.url
                }))
            });
        }

        // Specific Content Schema
        if (type === 'article') {
            jsonLdData.push({
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "headline": title,
                "image": [window.location.origin + image],
                "datePublished": publishedTime || new Date().toISOString(),
                "dateModified": modifiedTime || new Date().toISOString(),
                "author": [{
                    "@type": "Person",
                    "name": author,
                }],
                "publisher": {
                    "@type": "Organization",
                    "name": "EduMaster Pro",
                    "logo": {
                        "@type": "ImageObject",
                        "url": window.location.origin + "/vite.svg"
                    }
                }
            });
        } else if (type === 'course') {
             jsonLdData.push({
                "@context": "https://schema.org",
                "@type": "Course",
                "name": title,
                "description": description,
                "provider": {
                    "@type": "Organization",
                    "name": "EduMaster Pro",
                    "sameAs": window.location.origin
                }
            });
        } else if (schema) {
            jsonLdData.push(schema);
        }

        // Inject JSON-LD
        // Remove old scripts first to prevent duplicates
        document.querySelectorAll('script[type="application/ld+json"]').forEach(e => e.remove());

        // Add new scripts
        jsonLdData.forEach(data => {
            const script = document.createElement('script');
            script.setAttribute('type', 'application/ld+json');
            script.textContent = JSON.stringify(data);
            document.head.appendChild(script);
        });

        // --- DEBUGGING ---
        console.groupCollapsed(`⚡ Auto-Rank SEO Signal: ${title}`);
        console.log('🤖 Schema Generated:', jsonLdData);
        console.log('📅 Content Freshness:', modifiedTime || 'New');
        console.groupEnd();

    }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime, price, schema, noIndex, breadcrumbs]);

    return null;
};

export default SEO;
