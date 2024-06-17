import {
    Dispatch,
    SetStateAction,
    ChangeEvent
} from 'react';
import {
    debounce
} from '../../../utils/functions';
import styles from './styles.module.css';

export default function TextSearch(
    {
        name,
        value,
        setValue,
        label = '',
        type = 'search'
    }: {
        name: string;
        value: string;
        setValue: Dispatch<SetStateAction<string>>;
        label?: string;
        type?: string;
    }
) {
    const handleSearch = debounce(
        async (event: ChangeEvent<HTMLInputElement>) => {
            setValue(event.target.value);
        }, 300
    );

    return <div className={styles.field}>
        {label ? <label htmlFor={name}>
            {label}
        </label> : null}
        <input
            type={type}
            id={name}
            name={name}
            placeholder={label}
            defaultValue={value}
            onChange={handleSearch}
        />
    </div>;
}