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
import PortfolioCreate from './PortfolioCreate';
import Link from 'next/link';
import styles from './styles.module.css';

export default function PortfoliosList(
    {
        portfolios
    }: {
        portfolios: PortfolioPartial[];
    }
) {
    const [portfolios_, setPortfolios] = useState(portfolios);

    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter()

    const [name, setName] = useState(
        searchParams.get('name') ?? ''
    );
    const [createTimeStart, setCreateTimeStart] = useState(
        searchParams.get('create_time__start') ?? minDate
    );
    const [createTimeEnd, setCreateTimeEnd] = useState(
        searchParams.get('create_time__end') ?? maxDate
    );
    const [updateTimeStart, setUpdateTimeStart] = useState(
        searchParams.get('update_time__start') ?? minDate
    );
    const [updateTimeEnd, setUpdateTimeEnd] = useState(
        searchParams.get('update_time__end') ?? maxDate
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

        params.set('name', name);
        params.set('create_time__start', createTimeStart);
        params.set('create_time__end', createTimeEnd);
        params.set('update_time__start', updateTimeStart);
        params.set('update_time__end', updateTimeEnd);
        params.set('offset', offset.toString());
        params.set('limit', limit.toString());

        replace(`${pathname}?${params.toString()}`);

        (async () => {
            const response = await serverRequest(
                'portfolios',
                'POST',
                { 'cache': 'no-store' },
                {
                    name,
                    create_time__start: createTimeStart,
                    create_time__end: createTimeEnd,
                    update_time__start: updateTimeStart,
                    update_time__end: updateTimeEnd,
                    offset,
                    limit
                }
            );

            if (response.ok)
                setPortfolios(response.data as PortfolioPartial[]);
        })()
    }, [
        name,
        createTimeStart, createTimeEnd,
        updateTimeStart, updateTimeEnd,
        offset,
        limit
    ]);



    return <main>
        <PortfolioCreate setPortfolios={setPortfolios}/>
        <section>
            <form>
                <TextSearch
                    name="name"
                    label="Name"
                    value={name}
                    setValue={setName}
                />
                <DateTimeRange
                    name="create_time"
                    label="Create Time"
                    start={createTimeStart}
                    setStart={setCreateTimeStart}
                    end={createTimeEnd}
                    setEnd={setCreateTimeEnd}
                />
                <DateTimeRange
                    name="update_time"
                    label="Update Time"
                    start={updateTimeStart}
                    setStart={setUpdateTimeStart}
                    end={updateTimeEnd}
                    setEnd={setUpdateTimeEnd}
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
            {portfolios_.length ? <>
                <table>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Currency</th>
                        <th>Created</th>
                        <th>Updated</th>
                    </tr>
                    </thead>
                    <tbody>
                    {portfolios_.map(portfolio =>
                        <tr key={portfolio.id}>
                            <td>
                                <Link href={`/portfolios/${portfolio.id}`}>
                                    {portfolio.name}
                                </Link>
                            </td>
                            <td>{portfolio.currency}</td>
                            <td>
                                <time suppressHydrationWarning>
                                    {dateTimeFormat.format(new Date(
                                        portfolio.create_time
                                    ))}
                                </time>
                            </td>
                            <td>
                                <time suppressHydrationWarning>
                                    {dateTimeFormat.format(new Date(
                                        portfolio.update_time
                                    ))}
                                </time>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </> : null}
        </section>
    </main>;
}
