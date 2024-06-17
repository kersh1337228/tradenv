'use client';

import {
    useFormState
} from 'react-dom';
import {
    Dispatch,
    SetStateAction,
    useRef,
    useState
} from 'react';
import {
    serverRequest
} from 'utils/actions';
import HintedField from 'components/misc/form/HintedField';
import Input from 'components/misc/form/Input';
import styles from './styles.module.css';

export default function PortfolioCreate(
    {
        setPortfolios
    }: {
        setPortfolios: Dispatch<SetStateAction<PortfolioPartial[]>>
    }
) {
    const [currency, setCurrency] = useState('');

    const formRef = useRef<HTMLFormElement>(null);

    const [formState, dispatch] = useFormState(async (
        _: Record<string, string[]>,
        formData: FormData
    ) => {
        const response = await serverRequest(
            'portfolios/create',
            'POST',
            { cache: 'no-store' },
            {
                name: formData.get('name'),
                currency
            }
        );

        if (response.ok) {
            setPortfolios(portfolios =>
                portfolios.concat(response.data as Portfolio)
            );
            formRef.current?.reset();
            return {};
        }

        const errors = response.data;
        if (
            'non_field_errors' in errors
            && (errors.non_field_errors as string[]).some(error =>
                error.includes('name')
            )
        )
            if ('name' in errors)
                errors.name.push('Portfolio name must be unique');
            else
                errors.name = ['Portfolio name must be unique'];

        return errors;
    }, {});

    return <details>
        <summary>Add portfolio</summary>
        <form
            action={dispatch}
            ref={formRef}
        >
            <Input
                name="name"
                label="Name"
                type="text"
                errors={formState.name}
                required={true}
                defaultValue={''}
            />
            <HintedField
                name="currency"
                label="Currency"
                value={currency}
                setValue={setCurrency}
                search={async (query: string) => {
                    return query ? (await serverRequest(
                        'stocks/meta/currency',
                        'POST',
                        { cache: 'force-cache' },
                        { query }
                    )).data as string[] : [];
                }}
                errors={formState.currency}
                required={true}
            />
            <button type="submit">Add</button>
        </form>
    </details>;
}
