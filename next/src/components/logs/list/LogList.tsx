'use client';

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
import {
    dateTimeFormat,
    maxDate,
    minDate
} from 'utils/constants';
import TextSearch from 'components/misc/form/TextSearch';
import NumberSearch from 'components/misc/form/NumberSearch';
import DateTimeRange from 'components/misc/form/DateTimeRange';
import Select from 'components/misc/form/Select';
import Link from 'next/link';
import styles from './styles.module.css';

export default function LogList(
    {
        logs,
        timeframes
    }: {
        logs: LogPartial[];
        timeframes: string[];
    }
) {
    const [logs_, setLogs] = useState(logs);

    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter()

    const [rangeStartStart, setRangeStartStart] = useState(
        searchParams.get('range_start__start') ?? minDate
    );
    const [rangeStartEnd, setRangeStartEnd] = useState(
        searchParams.get('range_start__end') ?? maxDate
    );
    const [rangeEndStart, setRangeEndStart] = useState(
        searchParams.get('range_end__start') ?? minDate
    );
    const [rangeEndEnd, setRangeEndEnd] = useState(
        searchParams.get('range_end__end') ?? maxDate
    );
    const [timeframe, setTimeframe] = useState(
        searchParams.get('timeframe') ?? ''
    );
    const [portfolio, setPortfolio] = useState(
        searchParams.get('portfolio') ?? ''
    );
    const [createTimeStart, setCreateTimeStart] = useState(
        searchParams.get('create_time__start') ?? minDate
    );
    const [createTimeEnd, setCreateTimeEnd] = useState(
        searchParams.get('create_time__end') ?? maxDate
    );
    const [offset, setOffset] = useState(
        searchParams.has('offset') ? Number(
            searchParams.get('offset')
        ) : 0
    );
    const [limit, setLimit] = useState(
        searchParams.has('limit') ? Number(
            searchParams.get('limit')
        ) : 50
    );

    useEffect(() => {
        const params = new URLSearchParams(searchParams);

        params.set('range_start__start', rangeStartStart);
        params.set('range_start__end', rangeStartEnd);
        params.set('range_end__start', rangeEndStart);
        params.set('range_end__end', rangeEndEnd);
        params.set('timeframe', timeframe);
        params.set('portfolio', portfolio);
        params.set('create_time__start', createTimeStart);
        params.set('create_time__end', createTimeEnd);
        params.set('offset', offset.toString());
        params.set('limit', limit.toString());

        replace(`${pathname}?${params.toString()}`);

        (async () => {
            const response = await serverRequest(
                'logs',
                'POST',
                { 'cache': 'no-store' },
                {
                    range_start__start: rangeStartStart,
                    range_start__end: rangeStartEnd,
                    range_end__start: rangeEndStart,
                    range_end__end: rangeEndEnd,
                    timeframe: timeframe,
                    portfolio: portfolio,
                    create_time__start: createTimeStart,
                    create_time__end: createTimeEnd,
                    offset,
                    limit
                }
            );

            if (response.ok)
                setLogs(response.data as LogPartial[]);
        })()
    }, [
        rangeStartStart, rangeStartEnd,
        rangeEndStart, rangeEndEnd,
        timeframe,
        portfolio,
        createTimeStart, createTimeEnd,
        offset,
        limit
    ]);

    return <main>
        <section>
            <form>
                <DateTimeRange
                    name="range_start"
                    label="Test range start"
                    start={rangeStartStart}
                    setStart={setRangeStartStart}
                    end={rangeStartEnd}
                    setEnd={setRangeStartEnd}
                />
                <DateTimeRange
                    name="range_end"
                    label="Test range end"
                    start={rangeEndStart}
                    setStart={setRangeEndStart}
                    end={rangeEndEnd}
                    setEnd={setRangeEndEnd}
                />
                <Select
                    name="timeframe"
                    label="Timeframe"
                    defaultValue=""
                    onChange={event => setTimeframe(event.target.value)}
                >
                    <option value="">Any</option>
                    {timeframes.map(timeframe =>
                        <option
                            key={timeframe}
                            value={timeframe}
                        >
                            {timeframe}
                        </option>
                    )}
                </Select>
                <TextSearch
                    name="portfolio"
                    label="Portfolio"
                    value={portfolio}
                    setValue={setPortfolio}
                />
                <DateTimeRange
                    name="create_time"
                    label="Create Time"
                    start={createTimeStart}
                    setStart={setCreateTimeStart}
                    end={createTimeEnd}
                    setEnd={setCreateTimeEnd}
                />
                <NumberSearch
                    name="offset"
                    label="Offset"
                    value={offset}
                    setValue={setOffset}
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
            {logs_.length ? <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Portfolio</th>
                    <th>Created</th>
                    <th>Strategies</th>
                </tr>
                </thead>
                <tbody>
                {logs_.map(log =>
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
        </section>
    </main>;
}
