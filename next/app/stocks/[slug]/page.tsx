import {
    serverRequest
} from 'src/utils/actions';
import Stock from 'src/components/stocks/detail/Stock';

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
        title: decodeURI(params.slug).replaceAll('%3D', '=')
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
    const id = decodeURI(params.slug).replaceAll('%3D', '=');

    const stock = (await serverRequest(
        `stocks/${id}`,
        'GET',
        { cache: 'force-cache' }
    )).data as Stock;

    const timeframes = (await serverRequest(
        'stocks/meta/timeframe',
        'GET',
        { cache: 'force-cache' }
    )).data as string[];

    const quotes = (await serverRequest(
        `stocks/${id}/${timeframes[0]}`,
        'GET',
        { cache: 'no-store' }
    )).data as Quotes;

    return <Stock
        stock={stock}
        timeframes={timeframes}
        quotes_={quotes}
    />
}