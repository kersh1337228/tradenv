import {
    Metadata
} from 'next';
import {
    serverRequest
} from 'utils/actions';
import TestForm from 'components/strategies/TestForm';

export const metadata: Metadata = {
    title: 'Strategies'
};

export default async function Page() {
    const portfolios = (await serverRequest(
        'portfolios',
        'GET',
        { 'cache': 'force-cache' }
    )).data as PortfolioPartial[];

    const timeframes = (await serverRequest(
        'stocks/meta/timeframe',
        'GET',
        { cache: 'force-cache' }
    )).data as string[];

    const strategies = (await serverRequest(
        'strategies',
        'GET',
        { cache: 'force-cache' }
    )).data as Record<string, Strategy>;

    return <TestForm
        timeframes={timeframes}
        portfolios={portfolios}
        strategies={strategies}
    />
}
