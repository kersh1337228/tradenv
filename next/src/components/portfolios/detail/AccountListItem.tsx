'use client';

import {
    Dispatch,
    SetStateAction,
    useState
} from 'react';
import {
    serverRequest
} from 'utils/actions';
import EditableHinted from 'components/misc/editable/EditableHinted';
import Editable from 'components/misc/editable/Editable';
import DeleteIcon from 'components/misc/icons/Delete';
import styles from './styles.module.css';

export default function AccountListItem(
    {
        account,
        setAccounts
    }: {
        account: Account;
        setAccounts:  Dispatch<SetStateAction<Account[]>>;
    }
) {
    const [currency, setCurrency] = useState(account.currency);
    const [balance, setBalance] = useState(account.balance);

    function patch(
        name: string,
        setValue: Dispatch<SetStateAction<any>>,
    ) {
        return async (value: string) => {
            const response = await serverRequest(
                `portfolios/accounts/${account.id}`,
                'PATCH',
                { cache: 'no-store' },
                { [name]: value }
            );

            if (response.ok)
                setValue(response.data[name]);

            return response;
        };
    }

    return <tr>
        <td>
            <EditableHinted
                name="currency"
                value={currency}
                setValue={patch('currency', setCurrency)}
                search={async (query: string) => {
                    return query ? (await serverRequest(
                        'stocks/meta/currency',
                        'POST',
                        { cache: 'force-cache' },
                        { query }
                    )).data as string[] : [];
                }}
            >
                {currency}
            </EditableHinted>
        </td>
        <td>
            <Editable
                name="balance"
                type="number"
                value={balance}
                setValue={patch('balance', setBalance)}
                min={1}
            >
                {balance}
            </Editable>
        </td>
        <td>
            <DeleteIcon
                onDoubleClick={async () => {
                    const response = await serverRequest(
                        `portfolios/accounts/${account.id}`,
                        'DELETE',
                        { cache: 'no-store' }
                    );

                    if (response.ok)
                        setAccounts(
                            accounts => accounts.filter(account_ =>
                                account_.id !== account.id
                            )
                        );
                }}
            />
        </td>
    </tr>;
}
