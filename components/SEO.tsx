
import React, { useEffect } from 'react';

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    type?: string;
}

const SEO: React.FC<SEOProps> = ({ 
    title, 
    description = "EduMaster Pro - The ultimate educational platform for students and admins.", 
    image = "/vite.svg", 
    type = "website" 
}) => {
    
    useEffect(() => {
        // Update Title
        document.title = `${title} | EduMaster Pro`;

        // Helper to update meta tags
        const updateMeta = (name: string, content: string, attribute = 'name') => {
            let element = document.querySelector(`meta[${attribute}="${name}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attribute, name);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // Standard Meta
        updateMeta('description', description);

        // Open Graph / Facebook
        updateMeta('og:title', title, 'property');
        updateMeta('og:description', description, 'property');
        updateMeta('og:image', image, 'property');
        updateMeta('og:type', type, 'property');
        updateMeta('og:site_name', 'EduMaster Pro', 'property');

        // Twitter
        updateMeta('twitter:card', 'summary_large_image');
        updateMeta('twitter:title', title);
        updateMeta('twitter:description', description);
        updateMeta('twitter:image', image);

    }, [title, description, image, type]);

    return null;
};

export default SEO;
