'use client';

import {
    Dispatch,
    SetStateAction,
    useState
} from 'react';
import {
    serverRequest
} from 'utils/actions';
import Editable from 'components/misc/editable/Editable';
import DeleteIcon from 'components/misc/icons/Delete';
import Link from 'next/link';
import styles from './styles.module.css';

export default function StockListItem(
    {
        instance,
        setInstances
    }: {
        instance: StockInstance;
        setInstances: Dispatch<SetStateAction<StockInstance[]>>;
    }
) {
    const [amount, setAmount] = useState(instance.amount);
    const [priority, setPriority] = useState(instance.priority);

    function patch(
        name: keyof StockInstance,
        setValue: Dispatch<SetStateAction<any>>,
    ) {
        return async (value: string) => {
            const response = await serverRequest(
                `portfolios/stocks/${instance.id}`,
                'PATCH',
                { cache: 'no-store' },
                { [name]: value }
            );

            if (response.ok) {
                const patched = response.data as StockInstance;
                setValue(patched[name]);
                setInstances(instances => {
                    const instances_ = [...instances];
                    instances_[instances.findIndex(instance_ =>
                        instance_.id === instance.id
                    )] = patched;
                    return instances_;
                });
            }

            if (
                'non_field_errors' in response.data
                && (response.data.non_field_errors as string[]).some(error =>
                    error.includes('priority')
                )
            )
                if ('priority' in response.data)
                    response.data.priority.push('Stock priority must be unique per portfolio');
                else
                    response.data.priority = ['Stock priority must be unique per portfolio'];

            return response;
        };
    }

    return <tr>
        <td>
            <Editable
                name="priority"
                type="number"
                value={priority}
                setValue={patch('priority', setPriority)}
                min={1}
                step={1}
            >
                {priority}
            </Editable>
        </td>
        <td>
            <Link href={`/stocks/${instance.stock.symbol}`}>
                {instance.stock.symbol}
            </Link>
        </td>
        <td>{instance.stock.name ?? '-'}</td>
        <td>{instance.stock.type}</td>
        <td>
            {instance.stock.exchange_name ?
                `${instance.stock.exchange_name} (${instance.stock.exchange})`
                : instance.stock.exchange ?? '-'}
        </td>
        <td>{instance.stock.timezone}</td>
        <td>{instance.stock.country}</td>
        <td>{instance.stock.currency}</td>
        <td>{instance.stock.sector ?? '-'}</td>
        <td>{instance.stock.industry ?? '-'}</td>
        <td>
            <Editable
                name="amount"
                type="number"
                value={amount}
                setValue={patch('amount', setAmount)}
                min={1}
                step={1}
            >
                {amount}
            </Editable>
        </td>
        <td>
            <DeleteIcon
                onDoubleClick={async () => {
                    const response = await serverRequest(
                        `portfolios/stocks/${instance.id}`,
                        'DELETE',
                        { cache: 'no-store' }
                    );

                    if (response.ok)
                        setInstances(
                            instances => instances.filter(instance_ =>
                                instance_.id !== instance.id
                            )
                        );
                }}
            />
        </td>
    </tr>;
}
