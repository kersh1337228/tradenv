import styles from './styles.module.css';
import Link from 'next/link';

export default async function Home() {
    return <main
        className={styles.home}
    >
        <section
            className={styles.section}
        >
            <h1
                className={styles.sectionHeader}
            >
                tradenv
            </h1>
            <span
                className={styles.sectionContent}
            >
                Trading strategies testing environment based on open stock market data
            </span>
        </section>
        <section
            className={styles.section}
        >
            <h1
                className={styles.sectionHeader}
            >
                Modules
            </h1>
            <ul>
                <li>
                    <Link
                        href={'/stocks'}
                    >
                        Stocks
                    </Link> - gain access to open stock market data
                </li>
                <li>
                    <Link
                        href={'/portfolios'}
                    >
                        Portfolios
                    </Link> - create and set up investment portfolios
                </li>
                <li>
                    <Link
                        href={'/strategies'}
                    >
                        Strategies
                    </Link> - write and test trading strategies
                </li>
                <li>
                    <Link
                        href={'/logs'}
                    >
                        Logs
                    </Link> - previous strategies tests logs
                </li>
            </ul>
        </section>
        <section
            id="author"
            className={styles.section}
        >
            <h1
                className={styles.sectionHeader}
            >
                Author
            </h1>
            <div>
                Anton Cherevko, Russian Federation / Saint-Petersburg.
            </div>
            <div>
                For other projects explore <a href="https://github.com/kersh1337228">
                    GitHub
                </a> and <a href="https://gitlab.com/kersh1337228">
                    GitLab
                </a> pages.
            </div>
        </section>
    </main>;
}
