import GitHubIcon from '../../misc/icons/GitHub';
import GitLabIcon from '../../misc/icons/GitLab';
import Link from 'next/link';
import styles from './styles.module.css';

export default async function Footer() {
    return <footer
        className={styles.footer}
    >
        <div
            className={styles.inner}
        >
            <div
                className={styles.row}
            >
                <span
                    className={styles.icons}
                >
                    <a
                        className={styles.ellipticButton}
                        href="https://github.com/kersh1337228"
                    >
                        <GitHubIcon/>
                    </a>
                    <a
                        className={styles.ellipticButton}
                        href="https://gitlab.com/kersh1337228"
                    >
                        <GitLabIcon/>
                    </a>
                </span>
                <Link
                    href={'/about#author'}
                    className={styles.author}
                >
                    About author
                </Link>
            </div>
            <div className={styles.row}>
                <span
                    className={styles.meta}
                >
                    MIT License © 2024 Anton Cherevko
                </span>
                <span
                    className={styles.meta}
                >
                    Developed for educational purposes
                </span>
            </div>
        </div>
    </footer>;
}
