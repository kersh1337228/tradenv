'use client';

import {
    useState
} from 'react';
import StockListItem from './StockListItem';
import StocksSearch from './StockSearch';

// TODO: add portfolio structure diagram
export default function StockList(
    {
        instances,
        portfolio
    }: {
        instances: StockInstance[];
        portfolio: string;
    }
) {
    const [instances_, setInstances] = useState(instances);

    return <section>
        <StocksSearch
            instances={instances_}
            setInstances={setInstances}
            portfolio={portfolio}
        />
        {instances_.length ? <table>
            <caption></caption>
            <thead>
            <tr>
                <th>Priority</th>
                <th>Symbol</th>
                <th>Name</th>
                <th>Type</th>
                <th>Exchange</th>
                <th>Timezone</th>
                <th>Country</th>
                <th>Currency</th>
                <th>Sector</th>
                <th>Industry</th>
                <th>Amount</th>
                <th></th>
            </tr>
            </thead>
            <tbody>
            {instances_.map(instance =>
                <StockListItem
                    key={instance.id}
                    instance={instance}
                    setInstances={setInstances}
                />
            )}
            </tbody>
        </table> : null}
    </section>;
}
