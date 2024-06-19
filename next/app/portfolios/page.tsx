import PortfoliosList from 'components/portfolios/list/PortfoliosList';
import {
    Metadata
} from 'next';
import {
    serverRequest
} from 'utils/actions';

export const metadata: Metadata = {
    title: 'Portfolios'
};

export default async function Page() {
    const portfolios = (await serverRequest(
        'portfolios',
        'GET',
        { 'cache': 'force-cache' }
    )).data as PortfolioPartial[];

    return <PortfoliosList portfolios={portfolios}/>;
}
