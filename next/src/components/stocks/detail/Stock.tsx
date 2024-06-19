'use client';

import Select from 'components/misc/form/Select';
import Quotes from './Quotes';
import {
    useState
} from 'react';
import {
    serverRequest
} from 'utils/actions';
import styles from './styles.module.css';

export default function Stock(
    {
        stock,
        timeframes,
        indicators
    }: {
        stock: StockObject;
        timeframes: string[];
        indicators: Record<string, IndicatorAvailable>;
    }
) {
    const [loading, setLoading] = useState(false);
    const [quotes, setQuotes] = useState<QuotesObject>();
    const [timeframe, setTimeframe] = useState(timeframes[0]);

    return <main>
        <section>
            <h1>Information</h1>
            <table>
                <tbody>
                    <tr>
                        <th>Symbol</th>
                        <td>{stock.symbol}</td>
                    </tr>
                    <tr>
                        <th>Name</th>
                        <td>{stock.name ?? '-'}</td>
                    </tr>
                    <tr>
                        <th>Type</th>
                        <td>{stock.type}</td>
                    </tr>
                    <tr>
                        <th>Exchange</th>
                        <td>
                            {stock.exchange_name ?
                                `${stock.exchange_name} (${stock.exchange})`
                                : stock.exchange ?? '-'}
                        </td>
                    </tr>
                    <tr>
                        <th>Timezone</th>
                        <td>{stock.timezone}</td>
                    </tr>
                    <tr>
                        <th>Country</th>
                        <td>{stock.country}</td>
                    </tr>
                    <tr>
                        <th>Currency</th>
                        <td>{stock.currency}</td>
                    </tr>
                    <tr>
                        <th>Sector</th>
                        <td>{stock.sector ?? '-'}</td>
                    </tr>
                    <tr>
                        <th>Industry</th>
                        <td>{stock.industry ?? '-'}</td>
                    </tr>
                </tbody>
            </table>
        </section>
        <section>
            <h1>Quotes</h1>
            <Select
                name="timeframe"
                defaultValue="default"
                onChange={async (event) => {
                    setLoading(true);

                    const timeframe = event.target.value;
                    const response = await serverRequest(
                        `stocks/${stock.symbol}/${timeframe}`,
                        'GET',
                        { cache: 'no-store' }
                    );

                    if (response.ok) {
                        setTimeframe(timeframe);
                        setQuotes(response.data as QuotesObject);
                    }

                    setLoading(false);
                }}
            >
                <option disabled value="default">Timeframe</option>
                {timeframes.map(timeframe =>
                    <option
                        key={timeframe}
                        value={timeframe}
                    >
                        {timeframe}
                    </option>
                )}
            </Select>
            {loading ? <span>
                Loading quotes...
            </span> : null}
            {quotes ? <Quotes
                stock={stock}
                timeframe={timeframe}
                quotes={quotes}
                indicators={indicators}
            /> : null}
        </section>
    </main>;
}
