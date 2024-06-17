'use client';

import {
    useFormState
} from 'react-dom';
import {
    useRef,
    useState
} from 'react';
import {
    serverRequest
} from 'utils/actions';
import HintedField from 'components/misc/form/HintedField';
import Input from 'components/misc/form/Input';
import AccountListItem from './AccountListItem';
import styles from './styles.module.css';

export default function AccountList(
    {
        accounts,
        portfolio
    }: {
        accounts: Account[];
        portfolio: string;
    }
) {
    const [accounts_, setAccounts] = useState(accounts);
    const [currency, setCurrency] = useState('');

    const formRef = useRef<HTMLFormElement>(null);

    const [formState, dispatch] = useFormState(async (
        _: Record<string, string[]>,
        formData: FormData
    ) => {
        const response = await serverRequest(
            'portfolios/accounts',
            'POST',
            { cache: 'no-store' },
            {
                portfolio,
                currency,
                balance: Number(formData.get('balance'))
            }
        );

        if (response.ok) {
            setAccounts(accounts =>
                accounts.concat(response.data as Account)
            );
            formRef.current?.reset();
            return {};
        }

        const errors = response.data;
        if (
            'non_field_errors' in errors
            && (errors.non_field_errors as string[]).some(error =>
                error.includes('currency')
            )
        )
            if ('currency' in errors)
                errors.currency.push('Account currency must be unique per portfolio');
            else
                errors.currency = ['Account currency must be unique per portfolio'];

        return errors;
    }, {});

    return <section>
        <details>
            <summary>Add account</summary>
            <form
                action={dispatch}
                ref={formRef}
            >
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
                <Input
                    name="balance"
                    label="Balance"
                    type="number"
                    errors={formState.balance}
                    required={true}
                    defaultValue={0}
                />
                <button type="submit">Add</button>
            </form>
        </details>
        {accounts_.length ? <table>
            <caption>Existing:</caption>
            <thead>
            <tr>
                <th>Currency</th>
                <th>Balance</th>
                <th></th>
            </tr>
            </thead>
            <tbody>
            {accounts_.map(account =>
                <AccountListItem
                    key={account.id}
                    account={account}
                    setAccounts={setAccounts}
                />
            )}
            </tbody>
        </table> : null}
    </section>;
}
