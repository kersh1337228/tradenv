import {
    dateTimeFormat
} from 'utils/constants';
import PlotFinancial from 'components/misc/plots/financial/PlotFinantial';
import styles from './styles.module.css';

export default function Quotes(
    {
        stock,
        timeframe,
        quotes,
        indicators
    }: {
        stock: StockObject;
        timeframe: string;
        quotes: QuotesObject;
        indicators: Record<string, IndicatorAvailable>;
    }
) {
    const style = quotes.tendency.abs > 0 ?
        styles.pos : quotes.tendency.abs < 0 ?
            styles.neg : styles.net;

    return <div>
        <span className={styles.datetime}>
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
                <th>Change, %</th>
                <th>Change, {stock.currency}</th>
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
                <td className={style}>{quotes.tendency.ohlcv.open}</td>
                <td className={style}>{quotes.tendency.ohlcv.high}</td>
                <td className={style}>{quotes.tendency.ohlcv.low}</td>
                <td className={style}>{quotes.tendency.ohlcv.close}</td>
                <td className={style}>{quotes.tendency.ohlcv.volume}</td>
                <td className={style}>{quotes.tendency.rel}</td>
                <td className={style}>{quotes.tendency.abs}</td>
            </tr>
            </tbody>
        </table>
        <PlotFinancial
            ohlcv={quotes.ohlcv}
            stock={stock}
            timeframe={timeframe}
            available={indicators}
        />
    </div>;
}
