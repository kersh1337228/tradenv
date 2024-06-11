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
        label = false,
        required = true,
        defaultValue,
        inputRef,
        onChange,
        children
    }: {
        name: string;
        errors?: string[];
        label?: boolean;
        required?: boolean;
        defaultValue?: string;
        inputRef?: RefObject<HTMLSelectElement>;
        onChange?: ChangeEventHandler<HTMLSelectElement> | undefined;
        children: any;
    }
) {
    return <div
        className={styles.field}
    >
        {
            label ? <label
                htmlFor={name}
            >
                {name.charAt(0).toUpperCase() + name.slice(1)}
            </label> : null
        }
        <ul
            className={styles.errors}
        >
            {errors?.map((error, key) =>
                <li
                    key={key}
                >
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
        >
            {children}
        </select>
    </div>;
}
