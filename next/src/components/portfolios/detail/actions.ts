'use server';

import {
    serverRequest
} from 'utils/actions';
import {
    redirect
} from 'next/navigation';

export async function deletePortfolio(id: string) {
    const response = await serverRequest(
        `portfolios/${id}`,
        'DELETE',
        { cache: 'no-store' }
    );

    if (response.ok)
        redirect('/portfolios/');

    return response.data;
}
