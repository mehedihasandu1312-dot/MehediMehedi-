
import React, { useEffect } from 'react';

interface SEOProps {
    title: string;
    description?: string;
    keywords?: string[];
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'book' | 'profile' | 'product';
    author?: string;
    publishedTime?: string;
    price?: { amount: number; currency: string }; // For Products
    schema?: object; // Custom JSON-LD for advanced Google Rich Results
}

const SEO: React.FC<SEOProps> = ({ 
    title, 
    description = "EduMaster Pro - The ultimate educational platform for students and admins.", 
    keywords = ["education", "learning", "exam", "bangladesh", "edtech"],
    image = "/vite.svg", 
    url = window.location.href,
    type = "website",
    author = "EduMaster Team",
    publishedTime,
    price,
    schema
}) => {
    
    useEffect(() => {
        // 1. Update Document Title (This is visible in the Browser Tab)
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

        // 3. Helper for Canonical Link
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
        setMeta('robots', 'index, follow'); // Allow Google to index

        // Open Graph (Facebook/LinkedIn)
        setOgMeta('og:title', title);
        setOgMeta('og:description', description);
        setOgMeta('og:image', window.location.origin + image); // Ensure absolute URL
        setOgMeta('og:url', url);
        setOgMeta('og:type', type);
        setOgMeta('og:site_name', 'EduMaster Pro');

        // Twitter Card
        setMeta('twitter:card', 'summary_large_image');
        setMeta('twitter:title', title);
        setMeta('twitter:description', description);
        setMeta('twitter:image', window.location.origin + image);

        // Canonical URL
        setCanonical(url);

        // --- 4. GOOGLE STRUCTURED DATA (JSON-LD) ---
        let jsonLdData: any = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "EduMaster Pro",
            "url": window.location.origin,
        };

        if (type === 'article') {
            jsonLdData = {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "headline": title,
                "image": [window.location.origin + image],
                "datePublished": publishedTime || new Date().toISOString(),
                "author": [{
                    "@type": "Person",
                    "name": author,
                }]
            };
        } else if (type === 'product' && price) {
            jsonLdData = {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": title,
                "image": [window.location.origin + image],
                "description": description,
                "brand": {
                    "@type": "Brand",
                    "name": "EduMaster Store"
                },
                "offers": {
                    "@type": "Offer",
                    "url": url,
                    "priceCurrency": price.currency,
                    "price": price.amount,
                    "availability": "https://schema.org/InStock"
                }
            };
        } else if (schema) {
            jsonLdData = schema;
        }

        // Inject JSON-LD
        let script = document.querySelector('script[type="application/ld+json"]');
        if (!script) {
            script = document.createElement('script');
            script.setAttribute('type', 'application/ld+json');
            document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(jsonLdData);

        // --- DEBUGGING: PRINT TO CONSOLE SO YOU CAN SEE IT WORKING ---
        console.groupCollapsed(`🔍 SEO Updated: ${title}`);
        console.log('📄 Title:', document.title);
        console.log('📝 Description:', description);
        console.log('🖼️ Image:', window.location.origin + image);
        console.log('🤖 Structured Data (JSON-LD):', jsonLdData);
        console.groupEnd();

    }, [title, description, keywords, image, url, type, author, publishedTime, price, schema]);

    return null;
};

export default SEO;
