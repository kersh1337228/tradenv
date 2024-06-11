'use client';

import Error from 'next/error';
import CommonError from '../src/components/misc/errors/common';

export default function ErrorPage(
    {
        error,
        reset
    }: {
        error: Error & { digest?: string };
        reset: () => void;
    }
) {
    return <main>
        <CommonError
            // @ts-ignore
            error={error}
            reset={reset}
        />
    </main>;
}
