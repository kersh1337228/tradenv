'use client';

import Link from 'next/link';
import {
    usePathname
} from 'next/navigation';
import {
    useState
} from 'react';
import styles from './styles.module.css';

const menu = [{
    name: 'Home',
    href: '/'
}, {
    name: 'Stocks',
    href: '/stocks'
}, {
    name: 'Portfolios',
    href: '/portfolios'
}, {
    name: 'Strategies',
    href: '/strategies'
}, {
    name: 'Logs',
    href: '/logs'
}];

export default function Header() {
    const path = usePathname();

    const [active, setActive] = useState(false);

    const menuItems = menu.map(({ name, href }) =>
        <li
            key={name}
        >
            {path === href ? <span
                className={styles.link}
            >
                {name}
            </span> : <Link
                href={href}
                className={styles.link}
            >
                {name}
            </Link>}
        </li>
    );

    return <header
        className={styles.header}
    >
        <div
            className={styles.placeholder}
        >
        </div>
        <div
            className={styles.inner}
        >
            <nav>
                <ul
                    className={styles.mainMenu}
                >
                    {menuItems}
                </ul>
                <div className={styles.additionalMenu}>
                    <h1
                        onClick={(_) => setActive(active => !active)}
                    >
                        Menu
                    </h1>
                    {active ? <ul>
                        {menuItems}
                    </ul> : null}
                </div>
            </nav>
        </div>
    </header>;
}
