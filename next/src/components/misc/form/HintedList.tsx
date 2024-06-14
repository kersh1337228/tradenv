'use client';

import {
    Dispatch,
    RefObject,
    SetStateAction,
    createRef,
    useEffect,
    useRef,
    useState
} from 'react';
import {
    debounce
} from '../../../utils/functions';
import styles from './styles.module.css';
import CancelIcon from '../icons/Cancel';

export default function HintedList(
    {
        name,
        values,
        setValues,
        search,
        label = '',
        errors,
        className,
        inputRef
    }: {
        name: string;
        values: any[];
        setValues: Dispatch<SetStateAction<any[]>>;
        search: (query: string) => Promise<string[]>;
        label?: string;
        errors?: string[];
        className?: string;
        inputRef?: RefObject<HTMLInputElement>;
    }
) {
    inputRef = inputRef ?? createRef<HTMLInputElement>();
    const datalistRef = useRef<HTMLDataListElement>(null);

    const queryRef = useRef('');
    const [matches, setMatches] = useState<string[]>([]);

    async function getMatches(query?: string) {
        if (query)
            return await search(query).then(
                matches => matches.filter(
                    match => !values.some(
                        value => value === match
                    )
                )
            );

        return [];
    }

    const handleSearch = debounce(
        async (query: string): Promise<void> => {
            await getMatches(query).then(setMatches);
            queryRef.current = query;
        }, 300
    );

    useEffect(() => {
        const input = inputRef.current as HTMLInputElement;
        const dataList = datalistRef.current as HTMLDataListElement;

        if (matches.length) {
            dataList.style.display = 'block';
            input.style.borderBottom = 'none';
            input.style.borderRadius = '7px 7px 0 0';
        } else {
            dataList.style.display = 'none';
            input.style.borderBottom = '';
            input.style.borderRadius = '7px';
        }
    }, [matches.length]);

    useEffect(() => {
        getMatches(queryRef.current).then(setMatches);
    }, [values.length]);

    return <div className={className ?? styles.field}>
        {label ? <label htmlFor={name}>
            {label}
        </label> : null}
        <ul className={styles.errors}>
            {errors?.map((error, key) =>
                <li key={key}>
                    {error}
                </li>
            )}
        </ul>
        <input
            className={styles.input}
            type="search"
            id={name}
            name={name}
            placeholder={label}
            onChange={(event) => {
                handleSearch(event.target.value);
            }}
            onKeyDown={(event) => {
                event.stopPropagation();
                if (matches.length) {
                    switch (event.key) {
                        case 'Enter':
                            event.preventDefault();
                            (event.target as HTMLInputElement).value = '';
                            queryRef.current = '';
                            setValues(values => values.concat(matches[0]));
                            break;
                        case 'Tab':
                            event.preventDefault();
                            (event.target as HTMLInputElement).value = matches[0];
                            queryRef.current = matches[0];
                            break;
                    }
                }

                event.stopPropagation();
                if (matches.length && event.key === 'Tab') {
                    event.preventDefault();
                    (event.target as HTMLInputElement).value = matches[0];
                    queryRef.current = matches[0];
                }
            }}
            defaultValue={queryRef.current}
            ref={inputRef}
        />
        <datalist
            className={styles.datalist}
            ref={datalistRef}
        >
            {matches.map(match =>
                <option
                    key={match}
                    value={match}
                    onClick={(_) => {
                        const input = inputRef.current as HTMLInputElement;
                        const nativeInputValueSetter = (
                            Object.getOwnPropertyDescriptor(
                                window.HTMLInputElement.prototype,
                                'value'
                            ) as PropertyDescriptor
                        ).set;
                        nativeInputValueSetter?.call(input, match);
                        const event = new Event('input', { bubbles: true });
                        input.dispatchEvent(event);
                    }}
                >
                    {match}
                </option>
            )}
        </datalist>
        <ul
            className={styles.values}
        >
            {values.map(value =>
                <li key={value}>
                    <span>{value}</span>
                    <CancelIcon
                        onClick={(_) => {
                            setValues(
                                values => values.filter(
                                    val => val !== value
                                )
                            );
                        }}
                    />
                </li>
            )}
        </ul>
    </div>;
}