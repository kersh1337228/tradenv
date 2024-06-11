import styles from './styles.module.css';

export default async function NotFound() {
    return <h1
        className={styles.error}
    >
        Page not found
    </h1>;
}
