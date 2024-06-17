import StocksList from 'components/stocks/list/StocksList';
import {
    Metadata
} from 'next';
import {
    serverRequest
} from 'utils/actions';

export const metadata: Metadata = {
    title: 'Stocks'
};

export default async function Page() {
    const response = (await serverRequest(
        'stocks',
        'POST',
        { 'cache': 'force-cache' }
    )).data;

    return <StocksList
        stocks={response.stocks}
        pagination={response.pagination}
    />;
}
