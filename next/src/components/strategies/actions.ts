'use server';

import {
    serverRequest
} from 'utils/actions';
import {
    redirect
} from 'next/navigation';

export async function testStrategies(
    data: Record<string, any>
) {
    const response = await serverRequest(
        `strategies`,
        'POST',
        { 'cache': 'no-store' },
        data
    );

    if (response.ok)
        redirect(`/logs/${response.data}`);

    return response.data;
}
