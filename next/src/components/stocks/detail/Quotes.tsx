import {
    dateTimeFormat
} from 'src/utils/constants';

export default function Quotes(
    {
        stock,
        quotes
    }: {
        stock: Stock;
        quotes: Quotes;
    }
) {
    return <div>
        <span>
            Updated: <time suppressHydrationWarning>
                {dateTimeFormat.format(new Date(
                    quotes.update_time
                ))}
            </time>
        </span>
        <table>
            <caption>Latest quotes</caption>
            <thead>
            <tr>
                <th>Timestamp</th>
                <th>Open</th>
                <th>High</th>
                <th>Low</th>
                <th>Close</th>
                <th>Volume</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td>
                    <time suppressHydrationWarning>
                        {dateTimeFormat.format(new Date(
                            quotes.tendency.ohlcv.timestamp
                        ))}
                    </time>
                </td>
                <td>{quotes.tendency.ohlcv.open}</td>
                <td>{quotes.tendency.ohlcv.high}</td>
                <td>{quotes.tendency.ohlcv.low}</td>
                <td>{quotes.tendency.ohlcv.close}</td>
                <td>{quotes.tendency.ohlcv.volume}</td>
            </tr>
            </tbody>
        </table>
        <table>
            <caption>Latest change</caption>
            <tbody>
            <tr>
                <th>{stock.currency}</th>
                <td>{quotes.tendency.abs}</td>
            </tr>
            <tr>
                <th>%</th>
                <td>{quotes.tendency.rel}</td>
            </tr>
            </tbody>
        </table>
        {/*TODO: chart */}
        {/*<div className="quotes_price_plot">*/}
        {/*    <h3>Price change</h3>*/}
        {/*    <PlotFinancial*/}
        {/*        data={this.state.quotes.quotes}*/}
        {/*        symbol={this.state.quotes.symbol}*/}
        {/*    />*/}
        {/*</div>*/}
    </div>;
}
