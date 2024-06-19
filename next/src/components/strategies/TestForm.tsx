'use client';

import {
    useFormState
} from 'react-dom';
import {
    useRef,
    useState
} from 'react'
import {
    serverRequest
} from 'utils/actions';
import {
    maxDate,
    minDate
} from 'utils/constants';
import {
    serialize
} from 'utils/functions';
import Select from 'components/misc/form/Select';
import DateTimeRange from 'components/misc/form/DateTimeRange';
import Input from 'components/misc/form/Input';
import StrategyList from './StrategyList';

export default function TestForm(
    {
        timeframes,
        portfolios,
        strategies
    }: {
        timeframes: string[];
        portfolios: PortfolioPartial[];
        strategies: Record<string, Strategy>;
    }
) {
    const [portfolio, setPortfolio] = useState<string>();
    const [borders, setBorders] = useState<[string, string]>();
    const [rangeStart, setRangeStart] = useState<string>(minDate);
    const [rangeEnd, setRangeEnd] = useState<string>(maxDate);
    const [strategies_, setStrategies] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const formRef = useRef<HTMLFormElement>(null);

    const [formState, dispatch] = useFormState(async (
        _: Record<string, string[]>,
        __: FormData
    ) => {
        setLoading(true);

        const data = Object.fromEntries(
            // @ts-ignore
            ([...formRef.current.elements] as FormField[])
                .map(field => [field.name, serialize(field)])
                .filter(field =>
                    !(field[0] as string).includes('-')
                    && field[1] !== undefined
                )
        );

        const response = await serverRequest(
            `strategies`,
            'POST',
            { 'cache': 'no-store' },
            {
                strategies: Object.entries(strategies_).map(([index, name]) =>
                    [name, data.strategies[`${name}(${index})`]]
                ),
                portfolio: data.portfolio,
                range_start: data.range__start,
                range_end: data.range__end,
                timeframe: data.timeframe,
                commission: data.commission,
                mode: data.mode
            }
        );

        setLoading(false);
        return response.data;
    }, {});
    return <main>
        <form
            action={dispatch}
            ref={formRef}
            id="test_form"
        >
            {portfolios.length ? <Select
                name="portfolio"
                label="Portfolio"
                defaultValue="default"
                errors={formState.portfolio}
                onChange={event => {
                    setBorders(undefined);
                    setStrategies({});
                    setPortfolio(event.target.value);
                }}
            >
                <option disabled value="default">Portfolio</option>
                {portfolios.map(portfolio =>
                    <option
                        key={portfolio.id}
                        value={portfolio.id}
                    >
                        {portfolio.name}
                    </option>
                )}
            </Select> : <span>No portfolios yet</span>}

            {portfolio ? <Select
                name="timeframe"
                label="Timeframe"
                defaultValue="default"
                errors={formState.timeframe}
                onChange={async event => {
                    setStrategies({});
                    const response = await serverRequest(
                        `portfolios/${portfolio}/borders`,
                        'POST',
                        { cache: 'no-store' },
                        { timeframe: event.target.value }
                    );

                    if (response.ok) {
                        const borders = response.data as [string, string];
                        setBorders(borders);
                        setRangeStart(borders[0]);
                        setRangeEnd(borders[1]);
                    }
                }}
            >
                <option disabled value="default">Timeframe</option>
                {timeframes.map(timeframe =>
                    <option
                        key={timeframe}
                        value={timeframe}
                    >
                        {timeframe}
                    </option>
                )}
            </Select> : null}

            {borders ? <>
                <DateTimeRange
                    name="range"
                    label="Test range"
                    start={rangeStart}
                    setStart={setRangeStart}
                    startMin={borders[0]}
                    startMax={rangeEnd}
                    end={rangeEnd}
                    setEnd={setRangeEnd}
                    endMin={rangeStart}
                    endMax={borders[1]}
                    errors={formState.range}
                />
                {Object.keys(strategies).length ? <StrategyList
                    available={strategies}
                    strategies={strategies_}
                    setStrategies={setStrategies}
                    errors={formState.strategies}
                /> : <span>No strategies yet</span>}
            </> : null}

            {Object.keys(strategies_).length ? <>
                <Input
                    name="commission"
                    label="Commission"
                    type="number"
                    defaultValue={0}
                    min={0}
                    max={1}
                    step={0.001}
                    errors={formState.commission}
                />
                <Input
                    name="mode"
                    label="Mode"
                    type="number"
                    defaultValue={0}
                    min={0}
                    step={1}
                    errors={formState.mode}
                />
                <button type="submit">
                    Test
                </button>
            </> : null}
        </form>
        {loading ? <h1>Testing...</h1> : null}
    </main>
}
