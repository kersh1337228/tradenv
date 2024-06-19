'use client';

import {
    Dispatch,
    SetStateAction,
    useState
} from 'react';
import {
    serverRequest
} from 'utils/actions';
import {
    deletePortfolio
} from './actions';
import {
    dateTimeFormat
} from 'utils/constants';
import AccountList from './AccountList';
import StockList from './StockList';
import Editable from 'components/misc/editable/Editable';
import EditableHinted from 'components/misc/editable/EditableHinted';
import DeleteIcon from 'components/misc/icons/Delete';
import Link from 'next/link';
import styles from './styles.module.css';

export default function Portfolio(
    {
        portfolio
    }: {
        portfolio: Portfolio;
    }
) {
    const [currency, setCurrency] = useState(portfolio.currency);
    const [longLimit, setLongLimit] = useState(portfolio.long_limit);
    const [shortLimit, setShortLimit] = useState(portfolio.short_limit);

    function patch(
        name: string,
        setValue: Dispatch<SetStateAction<any>>,
    ) {
        return async (value: string) => {
            const response = await serverRequest(
                `portfolios/${portfolio.id}`,
                'PATCH',
                { cache: 'no-store' },
                { [name]: value }
            );

            if (response.ok)
                setValue(response.data[name]);

            return response;
        };
    }

    return <main>
        <section>
            <span>
                <h1>{portfolio.name}</h1>
                <DeleteIcon
                    onDoubleClick={async () =>
                        await deletePortfolio(portfolio.id)
                    }
                />
            </span>
            <div>
                <span>
                    Created: <time suppressHydrationWarning>
                        {dateTimeFormat.format(new Date(
                            portfolio.create_time
                        ))}
                    </time>
                </span>
                <span>
                    Updated: <time suppressHydrationWarning>
                        {dateTimeFormat.format(new Date(
                            portfolio.update_time
                        ))}
                    </time>
                </span>
            </div>
        </section>
        <section>
            <table>
                <tbody>
                <tr>
                    <th>Max simultaneous long positions:</th>
                    <td>
                        <Editable
                            name="long_limit"
                            type="number"
                            value={longLimit ?? undefined}
                            setValue={patch('long_limit', setLongLimit)}
                            allowDelete={true}
                        >
                            {longLimit ?? '-'}
                        </Editable>
                    </td>
                </tr>
                <tr>
                    <th>Max simultaneous short positions:</th>
                    <td>
                        <Editable
                            name="short_limit"
                            type="number"
                            value={shortLimit ?? undefined}
                            setValue={patch('short_limit', setShortLimit)}
                            allowDelete={true}
                        >
                            {shortLimit ?? '-'}
                        </Editable>
                    </td>
                </tr>
                </tbody>
            </table>
        </section>
        <section>
            <EditableHinted
                name="currency"
                value={currency}
                setValue={patch('currency', setCurrency)}
                search={async (query: string) => {
                    return query ? (await serverRequest(
                        'stocks/meta/currency',
                        'POST',
                        { cache: 'force-cache' },
                        { query }
                    )).data as string[] : [];
                }}
            >
                Main currency: {currency}
            </EditableHinted>
            <AccountList
                accounts={portfolio.accounts}
                portfolio={portfolio.id}
            />
        </section>
        <StockList
            instances={portfolio.stocks}
            portfolio={portfolio.id}
        />
        {portfolio.logs.length ? <table>
            <caption>Logs:</caption>
            <thead>
            <tr>
                <th>ID</th>
                <th>Portfolio</th>
                <th>Created</th>
                <th>Strategies</th>
            </tr>
            </thead>
            <tbody>
            {portfolio.logs.map(log =>
                <tr key={log.id}>
                    <td>
                        <Link href={`/logs/${log.id}`}>
                            {log.id}
                        </Link>
                    </td>
                    <td>{log.portfolio}</td>
                    <td>
                        <time suppressHydrationWarning>
                            {dateTimeFormat.format(new Date(
                                log.create_time
                            ))}
                        </time>
                    </td>
                    <td>
                        <pre>
                            {log.strategies.join(';\n')}
                        </pre>
                    </td>
                </tr>
            )}
            </tbody>
        </table> : null}
    </main>;
}
