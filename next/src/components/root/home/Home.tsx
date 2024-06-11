import styles from './styles.module.css';

export default async function Home() {
    return <main
        className={styles.home}
    >
        <section
            className={styles.welcome}
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
                Financial data
            </h1>
            <span
                className={styles.sectionContent}
            >
                Financial data will appear here...
            </span>
        </section>
    </main>;
}
