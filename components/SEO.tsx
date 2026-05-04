
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    keywords?: string[];
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'book' | 'profile' | 'product' | 'course' | 'quiz';
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
    price?: { amount: number; currency: string };
    schema?: object | object[]; // Accepts single or array of schema objects
    noIndex?: boolean;
    breadcrumbs?: { name: string; url: string }[];
}

const SEO: React.FC<SEOProps> = ({ 
    title, 
    description = "EduMaster Pro - The ultimate educational platform for students and admins.", 
    keywords = ["education", "learning", "exam", "bangladesh", "edtech", "SSC", "HSC", "Admission"],
    image = "/vite.svg", 
    url = typeof window !== 'undefined' ? window.location.href : '',
    type = "website",
    author = "EduMaster Team",
    publishedTime,
    modifiedTime,
    schema,
    noIndex = false,
    breadcrumbs
}) => {
    
    const fullTitle = `${title} | EduMaster Pro`;
    const fullImage = image.startsWith('http') ? image : `${window.location.origin}${image}`;
    const fullUrl = url;

    // Construct JSON-LD Schema
    let jsonLdData: any[] = [];

    // 1. Base Website Schema
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

    // 2. Breadcrumb Schema
    if (breadcrumbs && breadcrumbs.length > 0) {
        jsonLdData.push({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbs.map((crumb, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": crumb.name,
                "item": crumb.url.startsWith('http') ? crumb.url : `${window.location.origin}${crumb.url}`
            }))
        });
    }

    // 3. Content Specific Schemas
    if (type === 'article') {
        jsonLdData.push({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": title,
            "image": [fullImage],
            "datePublished": publishedTime || new Date().toISOString(),
            "dateModified": modifiedTime || new Date().toISOString(),
            "author": [{ "@type": "Person", "name": author }],
            "publisher": {
                "@type": "Organization",
                "name": "EduMaster Pro",
                "logo": { "@type": "ImageObject", "url": `${window.location.origin}/vite.svg` }
            },
            "description": description
        });
    }

    // 4. Inject Custom Schema passed via props (e.g. Quiz, Course)
    if (schema) {
        if (Array.isArray(schema)) {
            jsonLdData = [...jsonLdData, ...schema];
        } else {
            jsonLdData.push(schema);
        }
    }

    return (
        <Helmet>
            {/* Standard Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords.join(', ')} />
            <meta name="author" content={author} />
            <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
            <link rel="canonical" href={fullUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type === 'quiz' ? 'article' : type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:site_name" content="EduMaster Pro" />
            {publishedTime && <meta property="article:published_time" content={publishedTime} />}
            {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullImage} />

            {/* Schema.org JSON-LD */}
            {jsonLdData.length > 0 && (
                <script type="application/ld+json">
                    {JSON.stringify(jsonLdData)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
