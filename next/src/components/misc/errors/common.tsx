import styles from './styles.module.css';

export default function CommonError(
    {
        error,
        reset
    }: {
        error: Error & { digest?: string }
        reset: () => void
    }
) {
    return <section className={styles.section}>
        <h1
            className={styles.error}
        >
            Error
        </h1>
        <button
            onClick={reset}
            className={styles.button}
        >
            Retry
        </button>
    </section>;
}