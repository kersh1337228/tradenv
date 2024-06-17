'use client';

import {
    Dispatch,
    SetStateAction,
    useState
} from 'react';
import {
    serverRequest
} from 'utils/actions';
import {
    deletePortfolio
} from './actions';
import {
    dateTimeFormat
} from '../../../utils/constants';
import AccountList from './AccountList';
import StockList from './StockList';
import Editable from '../../misc/editable/Editable';
import DeleteIcon from '../../misc/icons/Delete';
import styles from './styles.module.css';

export default function Portfolio(
    {
        portfolio
    }: {
        portfolio: Portfolio;
    }
) {
    const [longLimit, setLongLimit] = useState(portfolio.long_limit);
    const [shortLimit, setShortLimit] = useState(portfolio.short_limit);

    function patch(
        name: string,
        setValue: Dispatch<SetStateAction<any>>,
    ) {
        return async (value: string) => {
            const response = await serverRequest(
                `portfolios/${portfolio.id}`,
                'PATCH',
                { cache: 'no-store' },
                { [name]: value }
            );

            if (response.ok)
                setValue(response.data[name]);

            return response;
        };
    }

    return <main>
        <section>
            <span>
                <h1>{portfolio.name}</h1>
                <DeleteIcon
                    onDoubleClick={async () =>
                        await deletePortfolio(portfolio.id)
                    }
                />
            </span>
            <div>
                <span>
                    Created: <time suppressHydrationWarning>
                        {dateTimeFormat.format(new Date(
                            portfolio.create_time
                        ))}
                    </time>
                </span>
                <span>
                    Updated: <time suppressHydrationWarning>
                        {dateTimeFormat.format(new Date(
                            portfolio.update_time
                        ))}
                    </time>
                </span>
            </div>
        </section>
        <section>
            <table>
                <tbody>
                <tr>
                    <th>Max simultaneous long positions:</th>
                    <td>
                        <Editable
                            name="long_limit"
                            type="number"
                            value={longLimit ?? undefined}
                            setValue={patch('long_limit', setLongLimit)}
                            allowDelete={true}
                        >
                            {longLimit ?? '-'}
                        </Editable>
                    </td>
                </tr>
                <tr>
                    <th>Max simultaneous short positions:</th>
                    <td>
                        <Editable
                            name="short_limit"
                            type="number"
                            value={shortLimit ?? undefined}
                            setValue={patch('short_limit', setShortLimit)}
                            allowDelete={true}
                        >
                            {shortLimit ?? '-'}
                        </Editable>
                    </td>
                </tr>
                </tbody>
            </table>
        </section>
        <AccountList
            accounts={portfolio.accounts}
            portfolio={portfolio.id}
        />
        <StockList
            instances={portfolio.stocks}
            portfolio={portfolio.id}
        />
        {/* TODO: logs */}
    </main>;
}
