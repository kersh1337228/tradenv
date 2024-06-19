'use client';

import React, {
    ChangeEventHandler,
    HTMLAttributes,
    ReactElement,
    RefObject
} from 'react';
import styles from './styles.module.css';

export default function Select(
    {
        name,
        errors,
        label = '',
        required = true,
        defaultValue,
        inputRef,
        onChange,
        multiple = false,
        children
    }: {
        name: string;
        errors?: string[];
        label?: string;
        required?: boolean;
        defaultValue?: string | number;
        inputRef?: RefObject<HTMLSelectElement>;
        onChange?: ChangeEventHandler<HTMLSelectElement> | undefined;
        multiple?: boolean;
        children: any;
    }
) {
    return <div
        className={styles.field}
    >
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
        <select
            className={styles.select}
            id={name}
            name={name}
            required={required}
            defaultValue={defaultValue}
            ref={inputRef}
            onChange={onChange}
            multiple={multiple}
        >
            {children}
        </select>
    </div>;
}
