import {
    Dispatch,
    SetStateAction,
    ChangeEvent
} from 'react';
import {
    debounce
} from 'utils/functions';
import styles from './styles.module.css';

export default function NumberSearch(
    {
        name,
        value,
        setValue,
        label = ''
    }: {
        name: string;
        value: number;
        setValue: Dispatch<SetStateAction<number>>;
        label?: string;
    }
) {
    const handleSearch = debounce(
        async (event: ChangeEvent<HTMLInputElement>) => {
            setValue(event.target.valueAsNumber);
        }, 300
    );

    return <div className={styles.field}>
        {label ? <label htmlFor={name}>
            {label}
        </label> : null}
        <input
            type="number"
            id={name}
            name={name}
            placeholder={label}
            defaultValue={value}
            onChange={handleSearch}
        />
    </div>;
}