'use client';

import {
    useState
} from 'react';
import TypedField from './TypedField';
import styles from './styles.module.css';

export default function TypedList(
    {
        name,
        type,
        errors,
        label = '',
        values,
        required = true
    }: {
        name: string;
        type: BasicType;
        errors?: string[];
        label?: string;
        values?: number[] | string[] | boolean[];
        required?: boolean;
    }
) {
    const [size, setSize] = useState(1);

    let fields = [];
    for (let i = 0; i < size; ++i)
        fields.push(
            <TypedField
                key={i}
                name={`${name}-${i}`}
                type={type}
                value={values ? values[i] : undefined}
                required={required}
            />
        );

    return <fieldset name={name} className={styles.field}>
        {label ? <legend>{label}</legend> : null}
        <ul className={styles.errors}>
            {errors?.map((error, key) =>
                <li key={key}>
                    {error}
                </li>
            )}
        </ul>
        {fields}
        <div className={styles.listControls}>
            <span
                onClick={() => setSize(size => size + 1)}
                className={styles.add}
            ></span>
            {size > 1 ? <span
                onClick={() => setSize(size => size - 1)}
                className={styles.del}
            ></span> : null}
        </div>
    </fieldset>;
}
