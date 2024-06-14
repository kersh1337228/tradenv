import StocksList from 'src/components/stocks/list/StocksList';
import {
    Metadata
} from 'next';
import {
    serverRequest
} from 'src/utils/actions';

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
        stocks_={response.stocks}
        pagination_={response.pagination}
    />;
}
