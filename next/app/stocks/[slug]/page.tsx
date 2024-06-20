import {
    serverRequest
} from 'utils/actions';
import Stock from 'components/stocks/detail/Stock';

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
    const stock = (await serverRequest(
        `stocks/${decodeURI(params.slug).replaceAll('%3D', '=')}`,
        'GET',
        { cache: 'force-cache' }
    )).data as StockObject;

    const timeframes = (await serverRequest(
        'stocks/meta/timeframe',
        'GET',
        { cache: 'force-cache' }
    )).data as string[];

    const indicators = (await serverRequest(
        `stocks/indicators`,
        'GET',
        { cache: 'force-cache' }
    )).data as Record<string, IndicatorAvailable>;

    return <Stock
        stock={stock}
        timeframes={timeframes}
        indicators={indicators}
    />;
}