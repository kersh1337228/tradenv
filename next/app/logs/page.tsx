import LogList from 'components/logs/list/LogList';
import {
    Metadata
} from 'next';
import {
    serverRequest
} from 'utils/actions';

export const metadata: Metadata = {
    title: 'Logs'
};

export default async function Page() {
    const logs = (await serverRequest(
        'logs',
        'GET',
        { 'cache': 'force-cache' }
    )).data as LogPartial[];

    const timeframes = (await serverRequest(
        'stocks/meta/timeframe',
        'GET',
        { cache: 'force-cache' }
    )).data as string[];

    return <LogList
        logs={logs}
        timeframes={timeframes}
    />;
}
