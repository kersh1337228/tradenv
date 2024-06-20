import React, {
    Dispatch,
    SetStateAction,
    ChangeEvent
} from 'react';
import {
    debounce
} from 'utils/functions';
import styles from './styles.module.css';

export default function DateTimeRange(
    {
        name,
        start,
        setStart,
        startMin,
        startMax,
        end,
        setEnd,
        endMin,
        endMax,
        label = '',
        errors
    }: {
        name: string;
        start: string;
        setStart: Dispatch<SetStateAction<string>>;
        startMin?: string;
        startMax?: string;
        end: string;
        setEnd: Dispatch<SetStateAction<string>>;
        endMin?: string;
        endMax?: string;
        label?: string;
        errors?: string[];
    }
) {
    const handleStart = debounce(
        async (event: ChangeEvent<HTMLInputElement>) => {
            setStart(event.target.value);
        }, 300
    );
    const handleEnd = debounce(
        async (event: ChangeEvent<HTMLInputElement>) => {
            setEnd(event.target.value);
        }, 300
    );

    return <fieldset
        name={name}
        className={styles.double}
    >
        {label ? <legend>{label}</legend> : null}
        <ul className={styles.errors}>
            {errors?.map((error, key) =>
                <li key={key}>
                    {error}
                </li>
            )}
        </ul>
        <input
            type="datetime-local"
            name={`${name}__start`}
            placeholder={label}
            defaultValue={start}
            min={startMin}
            max={startMax}
            onChange={handleStart}
            className={styles.left}
        />
        <input
            type="datetime-local"
            name={`${name}__end`}
            placeholder={label}
            defaultValue={end}
            min={endMin}
            max={endMax}
            onChange={handleEnd}
            className={styles.right}
        />
    </fieldset>;
}
