'use server';

import {
    serverRequest
} from 'utils/actions';
import {
    redirect
} from 'next/navigation';

export async function deleteLog(id: string) {
    const response = await serverRequest(
        `logs/${id}`,
        'DELETE',
        { cache: 'no-store' }
    );

    if (response.ok)
        redirect('/logs/');

    return response.data;
}
