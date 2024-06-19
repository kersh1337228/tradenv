'use client';

import Pagination from 'components/misc/pagination/Pagination';
import {
    useState,
    useEffect
} from 'react';
import {
    usePathname,
    useRouter,
    useSearchParams
} from 'next/navigation';
import {
    serverRequest
} from 'utils/actions';
import HintedField from 'components/misc/form/HintedField';
import TextSearch from 'components/misc/form/TextSearch';
import NumberSearch from 'components/misc/form/NumberSearch';
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

export default function StocksList(
    {
        stocks,
        pagination
    }: {
        stocks: StockObject[];
        pagination: PaginationType;
    }
) {
    const [stocks_, setStocks] = useState(stocks);
    const [pagination_, setPagination] = useState(pagination);

    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter()

    const [symbolOrName, setSymbolOrName] = useState(
        searchParams.get('symbol_or_name') ?? ''
    );
    const [types, setTypes] = useState(
        searchParams.has('types') ? JSON.parse(
            searchParams.get('types') as string
        ) as StockType[] : []
    );
    const [exchange, setExchange] = useState(
        searchParams.get('exchange') ?? ''
    );
    const [timezone, setTimezone] = useState(
        searchParams.get('timezone') ?? ''
    );
    const [country, setCountry] = useState(
        searchParams.get('country') ?? ''
    );
    const [currency, setCurrency] = useState(
        searchParams.get('currency') ?? ''
    );
    const [sector, setSector] = useState(
        searchParams.get('sector') ?? ''
    );
    const [industry, setIndustry] = useState(
        searchParams.get('industry') ?? ''
    );
    const [limit, setLimit] = useState(
        searchParams.has('limit') ? Number(
            searchParams.get('limit')
        ) : 50
    );

    useEffect(() => {
        const params = new URLSearchParams(searchParams);

        params.set('symbol_or_name', symbolOrName);
        params.set('types', JSON.stringify(types));
        params.set('exchange', exchange);
        params.set('timezone', timezone);
        params.set('country', country);
        params.set('currency', currency);
        params.set('sector', sector);
        params.set('industry', industry);
        params.set('limit', limit.toString());
        params.set('page', pagination_.current_page.toString());

        replace(`${pathname}?${params.toString()}`);

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
                    limit,
                    page: pagination_.current_page
                }
            );

            if (response.ok) {
                const { stocks, pagination } = response.data;
                setStocks(stocks as StockObject[]);
                setPagination(pagination as PaginationType);
            }
        })()
    }, [
        symbolOrName,
        types,
        exchange,
        timezone,
        country,
        currency,
        sector,
        industry,
        limit,
        pagination_.current_page
    ]);

    return <main>
        <section>
            <form>
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
                <NumberSearch
                    name="limit"
                    label="Limit"
                    value={limit}
                    setValue={setLimit}
                />
            </form>
        </section>
        <section>
            {stocks_.length ? <>
                <table>
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
                    </tr>
                    </thead>
                    <tbody>
                    {stocks_.map(stock =>
                        <tr key={stock.symbol}>
                            <td>
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
                        </tr>
                    )}
                    </tbody>
                </table>
                <Pagination
                    pagination={pagination_}
                    setPage={(page) => {
                        setPagination(pagination => {
                            return {
                                ...pagination,
                                current_page: page as number
                            };
                        })
                    }}
                />
            </> : null}
        </section>
    </main>;
}
