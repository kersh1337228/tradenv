import {
    serverRequest
} from 'utils/actions';
import Portfolio from 'components/portfolios/detail/Portfolio';

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
    const portfolio = (await serverRequest(
        `portfolios/${params.slug}`,
        'GET',
        { cache: 'force-cache' }
    )).data as Portfolio;

    return <Portfolio portfolio={portfolio}/>;
}