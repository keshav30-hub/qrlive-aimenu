
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DeprecatedCategoryPage() {
    const router = useRouter();
    const params = useParams();

    useEffect(() => {
        if (params['business-name'] && params['table-number'] && params.category) {
            router.replace(`/qrmenu/${params['business-name']}/${params['table-number']}/${params.category}`);
        } else {
            router.replace('/dashboard');
        }
    }, [router, params]);
    
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Redirecting...</p>
        </div>
    );
}
