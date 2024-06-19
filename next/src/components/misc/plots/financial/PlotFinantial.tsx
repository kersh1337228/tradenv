'use client';

import {
    Figure,
    Axes,
    AxesGroup,
    Line,
    Hist,
    Candle,
    VolumeHist
} from 'react-plots';
import Indicators from './Indicators';
import {
    useState
} from 'react';
import {
    randomColor
} from 'utils/functions';

export default function PlotFinancial(
    {
        ohlcv,
        stock,
        timeframe,
        available
    }: {
        ohlcv: OHLCV[];
        stock: StockObject;
        timeframe: string;
        available: Record<string, IndicatorAvailable>;
    }
) {
    const [indicators, setIndicators] = useState<Indicator[]>([]);

    return <div>
        <Indicators
            stock={stock}
            timeframe={timeframe}
            available={available}
            indicators={indicators}
            setIndicators={setIndicators}
        />
        <Figure
            width={1280}
            height={720}
            name={`${stock.symbol} ${timeframe}`}
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
                    name={stock.symbol}
                >
                    <Candle
                        data={ohlcv}
                        name={'OHLC'}
                    />
                    {indicators.filter(indicator =>
                        !available[indicator.name].separate
                    ).flatMap(indicator =>
                        Object.entries(
                            available[indicator.name].plots
                        ).map(([name, type]) =>
                            type === 'line' ? <Line
                                key={indicator.verbose_name}
                                data={indicator.data[name]}
                                name={indicator.verbose_name}
                                style={{
                                    color: randomColor(),
                                    width: 1
                                }}
                            /> : <Hist
                                key={indicator.verbose_name}
                                data={indicator.data[name]}
                                name={indicator.verbose_name}
                                style={{
                                    color: {
                                        pos: randomColor(),
                                        neg: randomColor()
                                    }
                                }}
                            />
                        )
                    )}
                </Axes>
                <Axes
                    position={{
                        row: {
                            start: 3,
                            end: 4
                        },
                        column: {
                            start: 1,
                            end: 2
                        }
                    }}
                    name={'Volumes'}
                >
                    <VolumeHist
                        data={ohlcv}
                        name={'Volume'}
                    />
                </Axes>
                {indicators.filter(indicator =>
                    available[indicator.name].separate
                ).map((indicator, i) =>
                    <Axes
                        key={indicator.verbose_name}
                        position={{
                            row: {
                                start: 4 + i,
                                end: 5 + i
                            },
                            column: {
                                start: 1,
                                end: 2
                            }
                        }}
                        name={indicator.verbose_name}
                    >
                        {Object.entries(
                            available[indicator.name].plots
                        ).map(([name, type]) =>
                            type === 'line' ? <Line
                                key={name}
                                data={indicator.data[name]}
                                name={name}
                                style={{
                                    color: randomColor(),
                                    width: 1
                                }}
                            /> : <Hist
                                key={name}
                                data={indicator.data[name]}
                                name={name}
                            />
                        )}
                    </Axes>
                )}
            </AxesGroup>
        </Figure>
    </div>
}