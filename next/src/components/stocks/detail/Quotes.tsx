import {
    dateTimeFormat
} from 'src/utils/constants';
import PlotFinancial from '../../misc/plots/financial/PlotFinantial';
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
                <td className={style}>{quotes.tendency.ohlcv.open}</td>
                <td className={style}>{quotes.tendency.ohlcv.high}</td>
                <td className={style}>{quotes.tendency.ohlcv.low}</td>
                <td className={style}>{quotes.tendency.ohlcv.close}</td>
                <td className={style}>{quotes.tendency.ohlcv.volume}</td>
            </tr>
            </tbody>
        </table>
        <table>
            <caption>Latest change</caption>
            <thead>
            <tr>
                <th>{stock.currency}</th>
                <th>%</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td className={style}>{quotes.tendency.abs}</td>
                <td className={style}>{quotes.tendency.rel}</td>
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
