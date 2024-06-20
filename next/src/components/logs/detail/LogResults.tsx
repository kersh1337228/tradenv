'use client';

import {
    Figure,
    Axes,
    AxesGroup,
    Line,
    Candle,
    VolumeHist
} from 'react-plots';
import {
    useState
} from 'react';
import {
    randomColor
} from 'utils/functions';
import Select from 'components/misc/form/Select';
import styles from './styles.module.css';

export default function LogResults(
    {
        logs,
        quotes
    }: {
        logs: Log['logs'];
        quotes: Record<string, OHLCV[]>;
    }
) {
    const [vfield, setVfield] = useState('rel');

    return <div className={styles.logs}>
        <div className={styles.vfield}>
            <Select
                name="vfield"
                label="Field on chart"
                defaultValue={vfield}
                onChange={event => setVfield(event.target.value)}
            >
                {Object.keys(Object.values(logs)[0][0]).map(field =>
                    field !== 'timestamp' ? <option
                        key={field}
                        value={field}
                    >
                        {field}
                    </option> : null
                )}
            </Select>
        </div>
        <Figure
            width={1280}
            height={256 * (1 + Object.keys(quotes).length)}
            name="Test results"
        >
            <AxesGroup
                position={{
                    row: {
                        start: 1,
                        end: 3
                    },
                    column: {
                        start: 2,
                        end: 4
                    }
                }}
                name={'OHLCV'}
                settings={true}
            >
                <Axes
                    position={{
                        row: {
                            start: 1,
                            end: 3
                        },
                        column: {
                            start: 1,
                            end: 2
                        }
                    }}
                    padding={{
                        left: 0,
                        top: 0.05,
                        right: 0,
                        bottom: 0.05
                    }}
                    name="Strategies"
                >
                    {Object.entries(logs).map(([strategy, results]) =>
                        <Line
                            key={strategy}
                            data={results}
                            vfield={vfield}
                            name={strategy}
                            style={{
                                color: randomColor(),
                                width: 1
                            }}
                        />
                    )}
                </Axes>
                {Object.entries(quotes).map(([symbol, ohlcv], i) => <div key={symbol}>
                    <Axes
                        position={{
                            row: {
                                start: 3 + i * 3,
                                end: 5 + i * 3
                            },
                            column: {
                                start: 1,
                                end: 2
                            }
                        }}
                        padding={{
                            left: 0,
                            top: 0.05,
                            right: 0,
                            bottom: 0.05
                        }}
                        name={symbol}
                    >
                        <Candle
                            data={ohlcv}
                            name={'OHLC'}
                        />
                    </Axes>
                    <Axes
                        position={{
                            row: {
                                start: 5 + i * 3,
                                end: 6 + i * 3
                            },
                            column: {
                                start: 1,
                                end: 2
                            }
                        }}
                        name={`${symbol}_volume`}
                    >
                        <VolumeHist
                            data={ohlcv}
                            name={'Volume'}
                        />
                    </Axes>
                </div>)}
            </AxesGroup>
        </Figure>
    </div>;
}