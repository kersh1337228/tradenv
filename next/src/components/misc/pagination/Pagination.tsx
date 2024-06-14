import {
    Dispatch,
    SetStateAction
} from 'react';
import styles from './styles.module.css';

export default function Pagination(
    {
        pagination,
        setPage
    }: {
        pagination: PaginationType;
        setPage: Dispatch<SetStateAction<number>>
    }
) {
    return <ul className={styles.pagination}>
        {pagination.no_back ? null :
            <li
                onClick={() => setPage(pagination.current_page - 1)}
            >
                {'<<'}
            </li>
        }
        {pagination.page_numbers.map(number =>
            number !== pagination.current_page ?
                <li
                    key={number}
                    onClick={() => setPage(number)}
                >
                    {number}
                </li> : <li
                    key={number}
                    className={styles.current}
                >
                    {number}
                </li>
        )}
        {pagination.no_further ? null :
            <li
                onClick={() => setPage(pagination.current_page + 1)}
            >
                {'>>'}
            </li>
        }
    </ul>
}
