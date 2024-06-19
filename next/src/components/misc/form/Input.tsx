'use client';

import React, {
    ChangeEventHandler,
    HTMLInputTypeAttribute,
    RefObject
} from 'react';
import styles from './styles.module.css';

export default function Input(
    {
        name,
        type,
        errors,
        label = '',
        required = true,
        defaultValue,
        inputRef,
        onChange,
        min,
        max,
        step
    }: {
        name: string;
        type: HTMLInputTypeAttribute;
        errors?: string[];
        label?: string;
        required?: boolean;
        defaultValue?: string | number;
        inputRef?: RefObject<HTMLInputElement>;
        onChange?: ChangeEventHandler<HTMLInputElement> | undefined;
        min?: number | string;
        max?: number | string;
        step?: number;
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
        <input
            name={name}
            type={type}
            placeholder={label}
            defaultValue={defaultValue}
            required={required}
            ref={inputRef}
            onChange={onChange}
            min={min}
            max={max}
            step={step}
        />
    </div>;
}
