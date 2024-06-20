'use client';

import {
    Dispatch,
    SetStateAction,
    useState
} from 'react'
import Select from 'components/misc/form/Select';
import TypedField from 'components/misc/form/TypedField';
import formStyles from 'components/misc/form/styles.module.css';
import styles from './styles.module.css';

export default function StrategyList(
    {
        available,
        strategies,
        setStrategies,
        errors
    }: {
        available: Record<string, Strategy>;
        strategies: Record<string, string>;
        setStrategies: Dispatch<SetStateAction<Record<string, string>>>;
        errors?: string[];
    }
) {
    console.log(available);
    const [size, setSize] = useState(1);

    let fields = [];
    for (let i = 0; i < size; ++i) {
        const strategy = i in strategies ? available[strategies[i]] : null;
        fields.push(<fieldset
            key={i}
            name={`strategies-${i}`}
            className={styles.strategy}
        >
            <Select
                name={`strategies-${i}-select`}
                defaultValue="default"
                onChange={event => {
                    setStrategies(strategies =>
                        ({
                            ...strategies,
                            [i]: event.target.value
                        })
                    );
                }}
            >
                <option disabled value="default">Strategy</option>
                {Object.entries(available).map(([name, strategy]) =>
                    <option
                        key={name}
                        value={name}
                    >
                        {strategy.verbose_name ?? name}
                    </option>
                )}
            </Select>
            {strategy ? <>
                 <fieldset
                     name={`${strategies[i]}(${i})`}
                     // @ts-ignore
                     format="dict"
                 >
                     {Object.entries(strategy.params).map(([param, type]) =>
                         <TypedField
                             key={param}
                             name={param}
                             type={type}
                             label={param}
                             required={true}
                         />
                     )}
                </fieldset>
            </> : null}
        </fieldset>);
    }

    return <fieldset
        name="strategies"
        // @ts-ignore
        format="dict"
    >
        <legend>Strategies</legend>
        <ul className={formStyles.errors}>
            {errors?.map((error, key) =>
                <li key={key}>
                    {error}
                </li>
            )}
        </ul>
        {fields}
        <div className={formStyles.listControls}>
            <span
                onClick={() => setSize(size => size + 1)}
                className={formStyles.add}
            ></span>
            {size > 1 ? <span
                onClick={() => {
                    setSize(size => size - 1);
                    setStrategies(strategies => {
                        const { [size - 1]: _, ...strategies_ } = strategies;
                        return strategies_;
                    });
                }}
                className={formStyles.del}
            ></span> : null}
        </div>
    </fieldset>;
}
