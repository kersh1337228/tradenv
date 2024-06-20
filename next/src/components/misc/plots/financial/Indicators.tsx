'use client';

import {
    Dispatch,
    SetStateAction,
    useState
} from 'react';
import TypedForm from 'components/misc/form/TypedForm';
import {
    serverRequest
} from 'utils/actions';
import styles from './styles.module.css';
import DeleteIcon from '../../icons/Delete';

export default function Indicators(
    {
        stock,
        timeframe,
        available,
        indicators,
        setIndicators
    }: {
        stock: StockObject;
        timeframe: string;
        available: Record<string, IndicatorAvailable>;
        indicators: Indicator[];
        setIndicators: Dispatch<SetStateAction<Indicator[]>>;
    }
) {
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<
        IndicatorAvailable & {
            name: string;
        } | Indicator
    >();

    return <details className={styles.indicators}>
        <summary>Indicators:</summary>
        <div>
            <details>
                <summary>Available:</summary>
                <ul>
                    {Object.entries(available).map(([name, indicator]) =>
                        <li
                            key={name}
                            onClick={() => setSelected({
                                name,
                                ...indicator
                            })}
                            className={
                                selected
                                && !('data' in selected)
                                && selected?.name === name ?
                                    styles.availableSelected : styles.available
                            }
                        >
                            {indicator.verbose_name}
                        </li>
                    )}
                </ul>
            </details>
            {indicators.length ? <details>
                <summary>Calculated:</summary>
                <ul>
                    {indicators.map(indicator =>
                        <li
                            key={indicator.name}
                            onClick={() => setSelected(indicator)}
                            className={
                                selected
                                && 'data' in selected
                                && selected?.verbose_name === indicator.verbose_name ?
                                    styles.calculatedSelected : styles.calculated
                            }
                        >
                            <h6>{indicator.verbose_name}</h6>
                            <DeleteIcon onDoubleClick={() => {
                                setSelected(undefined);
                                setIndicators(
                                    indicators => indicators.filter(indicator_ =>
                                        indicator_.verbose_name !== indicator.verbose_name
                                    )
                                )
                            }}/>
                        </li>
                    )}
                </ul>
            </details> : null}
            {selected ? loading ? <span>
                Loading indicator...
            </span> : <div>
                <h6>Params:</h6>
                {'data' in selected ? <TypedForm
                    fields={available[selected.name].params}
                    action={async (params: Record<string, any>) => {
                        setLoading(true);

                        const response = await serverRequest(
                            `stocks/${stock.symbol}/${timeframe}/${selected.name}`,
                            'POST',
                            { 'cache': 'no-store' },
                            { params }
                        );

                        if (response.ok) {
                            setSelected(undefined);
                            setIndicators(indicators =>
                                [...new Map(
                                    indicators.filter(indicator =>
                                        indicator.verbose_name !== selected?.verbose_name
                                    ).concat(
                                        response.data as Indicator
                                    ).map(indicator =>
                                        [indicator.verbose_name, indicator]
                                    )
                                ).values()]
                            );
                        }

                        setLoading(false);
                        return response.data;
                    }}
                    values={selected.params}
                /> : <TypedForm
                    fields={selected.params}
                    action={async (params: Record<string, any>) => {
                        setLoading(true);

                        const response = await serverRequest(
                            `stocks/${stock.symbol}/${timeframe}/${selected.name}`,
                            'POST',
                            { 'cache': 'no-store' },
                            { params }
                        );

                        if (response.ok) {
                            setSelected(undefined);
                            setIndicators(indicators =>
                                [...new Map(
                                    indicators.concat(
                                        response.data as Indicator
                                    ).map(indicator =>
                                        [indicator.verbose_name, indicator]
                                    )
                                ).values()]
                            );
                        }

                        setLoading(false);
                        return response.data;
                    }}
                />}
            </div> : null}
        </div>
    </details>
}