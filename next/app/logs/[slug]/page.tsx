import {
    serverRequest
} from 'utils/actions';
import Log from 'components/logs/detail/Log';

export async function generateMetadata(
    {
        params
    }: {
        params: {
            slug: string
        }
    }
) {
    return {
        title: params.slug
    };
}

export default async function Page(
    {
        params
    }: {
        params: {
            slug: string;
        };
    }
) {
    const log = (await serverRequest(
        `logs/${params.slug}`,
        'GET',
        { cache: 'force-cache' }
    )).data as Log;

    return <Log
        log={log}
    />;
}
