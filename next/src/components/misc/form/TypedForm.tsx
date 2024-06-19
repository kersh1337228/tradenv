'use client';

import {
    useFormState
} from 'react-dom';
import {
    useRef
} from 'react';
import TypedField from './TypedField';
import {
    serialize
} from 'utils/functions';
import styles from './styles.module.css';

export default function TypedForm(
    {
        fields,
        action,
        values
    }: {
        fields: Record<string, BasicType>;
        action: (
            data: Record<string, any>
        ) => Promise<Record<string, string[]> | undefined>;
        values?: Record<string, BasicValue>;
    }
) {
    const formRef = useRef<HTMLFormElement>(null);

    const [formState, dispatch] = useFormState(async (
        _: Record<string, string[]>,
        __: FormData
    ) => {
        const data = Object.fromEntries(
            // @ts-ignore
            ([...formRef.current.elements] as FormField[])
                .map(field => [field.name, serialize(field)])
                .filter(field => field[1] !== undefined)
        );
        return await action(data) ?? {};
    }, {});

    return <form
        action={dispatch}
        ref={formRef}
        className={styles.form}
    >
        {Object.entries(fields).map(([name, type]) =>
            <TypedField
                key={name}
                name={name}
                type={type}
                value={values ? values[name] : undefined}
                errors={formState[name]}
                label={name}
                required={true}
            />
        )}
        <button
            type="submit"
            className={styles.button}
        >
            Submit
        </button>
    </form>;
}