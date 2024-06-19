'use server';


import CircleDiagram from 'components/misc/plots/circle/CircleDiagram';
import {
    dateTimeFormat
} from 'utils/constants';
import LogResults from './LogResults';
import Link from 'next/link';

export default async function Log(
    {
        log
    }: {
        log: Log;
    }
) {
    return <main>
        <section>
            <h1>Results:</h1>
            <table>
                <caption>Strategies:</caption>
                <thead>
                <tr>
                    <th>Strategy</th>
                    <th>Change, %</th>
                    <th>Change, {log.portfolio.currency}</th>
                    <th>Average loss</th>
                    <th>Max loss</th>
                    <th>Average profit</th>
                    <th>Max profit</th>
                    <th>Profit/Loss Index</th>
                </tr>
                </thead>
                <tbody>
                {Object.entries(log.results.strategies).map(([strategy, result]) =>
                    <tr key={strategy}>
                        <th>{strategy}</th>
                        <td>{result.rel}</td>
                        <td>{result.abs}</td>
                        <td>{result.avg_loss}</td>
                        <td>{result.max_loss}</td>
                        <td>{result.avg_profit}</td>
                        <td>{result.max_profit}</td>
                        <td>{result.pli}</td>
                    </tr>
                )}
                </tbody>
            </table>
            <table>
                <caption>Stocks:</caption>
                <thead>
                <tr>
                    <th>Symbol</th>
                    <th>Change, %</th>
                    <th>Currency</th>
                    <th>Change, currency</th>
                </tr>
                </thead>
                <tbody>
                {Object.entries(log.results.stocks).map(([symbol, { abs, rel }]) =>
                    <tr key={symbol}>
                        <th>{symbol}</th>
                        <td>{rel}</td>
                        <td>
                            {log.portfolio.stocks.find(instance =>
                                instance.stock.symbol === symbol
                            )?.stock.currency}
                        </td>
                        <td>{abs}</td>
                    </tr>
                )}
                </tbody>
            </table>
            <LogResults
                logs={log.logs}
                quotes={log.quotes}
            />
        </section>
        <section>
            <table>
                <caption>Params:</caption>
                <tbody>
                <tr>
                    <th>Test range start</th>
                    <td>
                        <time suppressHydrationWarning>
                            {dateTimeFormat.format(new Date(
                                log.range_start
                            ))}
                        </time>
                    </td>
                </tr>
                <tr>
                    <th>Test range end</th>
                    <td>
                        <time suppressHydrationWarning>
                        {dateTimeFormat.format(new Date(
                                log.range_end
                            ))}
                        </time>
                    </td>
                </tr>
                <tr>
                    <th>Timeframe</th>
                    <td>{log.timeframe}</td>
                </tr>
                <tr>
                    <th>Commission</th>
                    <td>{log.commission}</td>
                </tr>
                <tr>
                    <th>Trading mode</th>
                    <td>T + {log.mode}</td>
                </tr>
                </tbody>
            </table>
        </section>
        <section>
            <h1>Strategies:</h1>
            <ul>
                {log.strategies.map(([strategy, params]) =>
                    <li key={strategy}>
                        <h2>{strategy}</h2>
                        <ul>
                            {Object.entries(params).map(([param, value]) =>
                                <li key={param}>
                                    <pre>{param}: {value}</pre>
                                </li>
                            )}
                        </ul>
                    </li>
                )}
            </ul>
        </section>
        <section>
            <h1>Portfolio: {log.portfolio.name}</h1>
            <table>
                <caption>Params:</caption>
                <tbody>
                <tr>
                    <th>Max simultaneous long positions:</th>
                    <td>{log.portfolio.long_limit ?? '-'}</td>
                </tr>
                <tr>
                    <th>Max simultaneous short positions:</th>
                    <td>{log.portfolio.short_limit ?? '-'}</td>
                </tr>
                </tbody>
            </table>
            <span>Main currency: {log.portfolio.currency}</span>
            <table>
                <caption>Accounts:</caption>
                <thead>
                <tr>
                    <th>Currency</th>
                    <th>Balance</th>
                </tr>
                </thead>
                <tbody>
                {log.portfolio.accounts.map(account =>
                    <tr key={account.id}>
                        <td>{account.currency}</td>
                        <td>{account.balance}</td>
                    </tr>
                )}
                </tbody>
            </table>
            <table>
                <caption>Stocks:</caption>
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
                </tr>
                </thead>
                <tbody>
                {log.portfolio.stocks.map(instance =>
                    <tr key={instance.id}>
                        <td>{instance.priority}</td>
                        <td>
                            <Link href={`/stocks/${instance.stock.symbol}`}>
                                {instance.stock.symbol}
                            </Link>
                        </td>
                        <td>{instance.stock.name ?? '-'}</td>
                        <td>{instance.stock.type}</td>
                        <td>
                            {instance.stock.exchange_name ?
                                `${instance.stock.exchange_name} (${instance.stock.exchange})`
                                : instance.stock.exchange ?? '-'}
                        </td>
                        <td>{instance.stock.timezone}</td>
                        <td>{instance.stock.country}</td>
                        <td>{instance.stock.currency}</td>
                        <td>{instance.stock.sector ?? '-'}</td>
                        <td>{instance.stock.industry ?? '-'}</td>
                        <td>{instance.amount}</td>
                    </tr>
                )}
                </tbody>
            </table>
            <figure>
                <figcaption>Structure</figcaption>
                <CircleDiagram
                    data={log.portfolio.stocks.map(instance =>
                        [instance.stock.symbol, instance.amount]
                    )}
                    width={384}
                    height={384}
                />
            </figure>
        </section>
        <span>
            Created: <time suppressHydrationWarning>
                {dateTimeFormat.format(new Date(
                    log.create_time
                ))}
            </time>
        </span>
    </main>;
}
