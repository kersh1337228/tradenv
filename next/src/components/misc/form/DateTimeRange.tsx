import {
    Dispatch,
    SetStateAction,
    ChangeEvent
} from 'react';
import {
    debounce
} from '../../../utils/functions';
import styles from './styles.module.css';

export default function DateTimeRange(
    {
        name,
        start,
        setStart,
        end,
        setEnd,
        label = ''
    }: {
        name: string;
        start: string;
        setStart: Dispatch<SetStateAction<string>>;
        end: string;
        setEnd: Dispatch<SetStateAction<string>>;
        label?: string;
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

    return <fieldset className={styles.field}>
        {label ? <legend>{label}</legend> : null}
        <input
            type="datetime-local"
            name={`${name}__start`}
            placeholder={label}
            defaultValue={start}
            onChange={handleStart}
            className={styles.start}
        />
        <input
            type="datetime-local"
            name={`${name}__end`}
            placeholder={label}
            defaultValue={end}
            onChange={handleEnd}
            className={styles.end}
        />
    </fieldset>;
}
