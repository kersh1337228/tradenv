'use client';

import {
    Dispatch,
    SetStateAction,
    useState,
    useEffect,
    useRef
} from 'react';
import {
    serverRequest
} from 'utils/actions';
import HintedField from 'components/misc/form/HintedField';
import TextSearch from 'components/misc/form/TextSearch';
import HintedList from 'components/misc/form/HintedList';
import Link from 'next/link';
import styles from './styles.module.css';

function stockMeta(meta: string) {
    return async (query: string) => {
        return  query ? (await serverRequest(
            `stocks/meta/${meta}`,
            'POST',
            { cache: 'force-cache' },
            { query }
        )).data as string[] : [];
    }
}

export default function StocksSearch(
    {
        instances,
        setInstances,
        portfolio
    }: {
        instances: StockInstance[],
        setInstances: Dispatch<SetStateAction<StockInstance[]>>;
        portfolio: string;
    }
) {
    const [stocks, setStocks] = useState<StockObject[]>([]);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const [symbolOrName, setSymbolOrName] = useState('');
    const [types, setTypes] = useState<StockType[]>([]);
    const [exchange, setExchange] = useState('');
    const [timezone, setTimezone] = useState('');
    const [country, setCountry] = useState('');
    const [currency, setCurrency] = useState('');
    const [sector, setSector] = useState('');
    const [industry, setIndustry] = useState('');

    useEffect(() => {
        setErrors({});

        (async () => {
            const response = await serverRequest(
                'stocks',
                'POST',
                { 'cache': 'no-store' },
                {
                    symbol_or_name: symbolOrName,
                    types,
                    exchange,
                    timezone,
                    country,
                    currency,
                    sector,
                    industry,
                    limit: 5
                }
            );

            if (response.ok)
                setStocks(response.data.stocks as StockObject[]);
        })()
    }, [
        symbolOrName,
        types,
        exchange,
        timezone,
        country,
        currency,
        sector,
        industry
    ]);

    const formRef = useRef<HTMLFormElement>(null);

    return <details>
        <summary>Add stock</summary>
        <div className={styles.stockSearch}>
            <form
                ref={formRef}
                className={styles.stockForm}
            >
                <div className={styles.left}>
                    <TextSearch
                        name="symbol_or_name"
                        label="Symbol or Name"
                        value={symbolOrName}
                        setValue={setSymbolOrName}
                    />
                    <HintedList
                        name="types"
                        label="Types"
                        values={types}
                        setValues={setTypes}
                        search={stockMeta('type')}
                    />
                    <HintedField
                        name="exchange"
                        label="Exchange"
                        value={exchange}
                        setValue={setExchange}
                        search={stockMeta('exchange')}
                    />
                    <HintedField
                        name="timezone"
                        label="Timezone"
                        value={timezone}
                        setValue={setTimezone}
                        search={stockMeta('timezone')}
                    />
                </div>
                <div className={styles.right}>
                    <HintedField
                        name="country"
                        label="Country"
                        value={country}
                        setValue={setCountry}
                        search={stockMeta('country')}
                    />
                    <HintedField
                        name="currency"
                        label="Currency"
                        value={currency}
                        setValue={setCurrency}
                        search={stockMeta('currency')}
                    />
                    <HintedField
                        name="sector"
                        label="Sector"
                        value={sector}
                        setValue={setSector}
                        search={stockMeta('sector')}
                    />
                    <HintedField
                        name="industry"
                        label="Industry"
                        value={industry}
                        setValue={setIndustry}
                        search={stockMeta('industry')}
                    />
                </div>
                <button type="submit">Add</button>
            </form>
            {stocks.length ? <table>
                <thead>
                <tr>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Exchange</th>
                    <th>Timezone</th>
                    <th>Country</th>
                    <th>Currency</th>
                    <th>Sector</th>
                    <th>Industry</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {stocks.map(stock =>
                    <tr key={stock.symbol}>
                        <td>
                            <ul className={styles.errors}>
                                {errors[stock.symbol]?.map((error, key) =>
                                    <li key={key}>
                                        {error}
                                    </li>
                                )}
                            </ul>
                            <Link href={`/stocks/${stock.symbol}`}>
                                {stock.symbol}
                            </Link>
                        </td>
                        <td>{stock.name ?? '-'}</td>
                        <td>{stock.type}</td>
                        <td>
                            {stock.exchange_name ?
                                `${stock.exchange_name} (${stock.exchange})`
                                : stock.exchange ?? '-'}
                        </td>
                        <td>{stock.timezone}</td>
                        <td>{stock.country}</td>
                        <td>{stock.currency}</td>
                        <td>{stock.sector ?? '-'}</td>
                        <td>{stock.industry ?? '-'}</td>
                        <td onClick={async () => {
                            const response = await serverRequest(
                                'portfolios/stocks',
                                'POST',
                                { cache: 'no-store' },
                                {
                                    stock: stock.symbol,
                                    portfolio,
                                    amount: 1,
                                    priority: instances.length ? Math.max.apply(null,
                                        instances.map(instance =>
                                            instance.priority
                                        )
                                    ) + 1 : 1
                                }
                            );

                            if (response.ok) {
                                setInstances(instances =>
                                    instances.concat(response.data as StockInstance)
                                );
                                formRef.current?.reset();
                            } else {
                                const errors = response.data;
                                if (
                                    'non_field_errors' in errors
                                    && (errors.non_field_errors as string[]).some(error =>
                                        error.includes('stock')
                                    )
                                )
                                    if ('stock' in errors)
                                        errors.stock.push('Stock must be unique per portfolio');
                                    else
                                        errors.stock = ['Stock must be unique per portfolio'];

                                setErrors({
                                    [stock.symbol]: errors.stock
                                });
                            }
                        }}>Add
                        </td>
                    </tr>
                )}
                </tbody>
            </table> : null}
        </div>
    </details>;
}
