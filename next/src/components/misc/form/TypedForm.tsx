'use client';

import {
    useFormState
} from 'react-dom';
import {
    useRef
} from 'react';
import TypedField from './TypedField';
import styles from './styles.module.css';

type FormField = HTMLInputElement |  HTMLSelectElement | HTMLFieldSetElement;

function serialize(field: FormField): BasicValue | undefined {
    if (field instanceof HTMLInputElement)
        switch (field.type) {
            case 'number':
                return field.valueAsNumber;
            case 'text':
            case 'date':
            case 'datetime-local':
                return field.value;
            case 'checkbox':
                return field.checked;
        }
     else if (field instanceof HTMLSelectElement)
        return field.multiple ?
            [...field.options]
                .filter(opt => opt.selected)
                .map(opt => opt.value) :
            field.value;
    else if (field instanceof HTMLFieldSetElement)
        return ([...field.elements] as FormField[])
            .map(serialize)
            .filter(value => value !== undefined) as BasicValue;
}

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
        className={styles.form}
        ref={formRef}
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