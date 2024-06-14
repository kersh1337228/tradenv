'use client';

import Select from 'src/components/misc/form/Select';
import Quotes from './Quotes';
import {
    useState
} from 'react';
import {
    serverRequest
} from 'src/utils/actions';
import styles from './styles.module.css';

export default function Stock(
    {
        stock,
        timeframes,
        quotes_
    }: {
        stock: Stock;
        timeframes: string[];
        quotes_: Quotes;
    }
) {
    const [quotes, setQuotes] = useState(quotes_);

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
                label="Timeframe"
                defaultValue={timeframes[0]}
                onChange={async (event) => {
                    const response = await serverRequest(
                        `stocks/${stock.symbol}/${event.target.value}`,
                        'GET',
                        { cache: 'no-store' }
                    );

                    if (response.ok)
                        setQuotes(response.data as Quotes);
                }}
            >
                {timeframes.map(timeframe =>
                    <option
                        key={timeframe}
                        value={timeframe}
                    >
                        {timeframe}
                    </option>
                )}
            </Select>
            <Quotes
                stock={stock}
                quotes={quotes}
            />
        </section>
    </main>;
}
