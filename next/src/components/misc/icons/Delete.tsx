import {
    MouseEventHandler
} from 'react';
import styles from './styles.module.css';

export default function DeleteIcon(
    {
        onDoubleClick
    }: {
        onDoubleClick?: MouseEventHandler<SVGSVGElement> | undefined
    }
): React.ReactNode {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        viewBox="10 10 45 45"
        className={styles.smallClickable}
        onDoubleClick={onDoubleClick}
    >
        <path
            d="M 28 11 C 26.895 11 26 11.895 26 13 L 26 14 L 13 14 C 11.896 14 11 14.896 11 16 C 11 17.104 11.896 18 13 18 L 14.160156 18 L 16.701172 48.498047 C 16.957172 51.583047 19.585641 54 22.681641 54 L 41.318359 54 C 44.414359 54 47.041828 51.583047 47.298828 48.498047 L 49.839844 18 L 51 18 C 52.104 18 53 17.104 53 16 C 53 14.896 52.104 14 51 14 L 38 14 L 38 13 C 38 11.895 37.105 11 36 11 L 28 11 z"
        ></path>
    </svg>;
}
