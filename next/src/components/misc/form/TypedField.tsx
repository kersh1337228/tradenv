import Select from './Select';
import TypedList from './TypedList';
import {
    listRegex
} from 'utils/constants';
import styles from './styles.module.css';

export default function TypedField(
    {
        name,
        type,
        errors,
        label = '',
        value,
        required = true
    }: {
        name: string;
        type: BasicType;
        errors?: string[];
        label?: string;
        value?: number | string | boolean | null
            | number[] | string[] | boolean[];
        required?: boolean;
    }
) {
    switch (type) {
        case 'int':
            return <div>
                {label ? <label htmlFor={name}>
                    {label}
                </label> : null}
                <ul className={styles.errors}>
                    {errors?.map((error, key) =>
                        <li key={key}>
                            {error}
                        </li>
                    )}
                </ul>
                <input
                    type="number"
                    name={name}
                    step={1}
                    defaultValue={value as number}
                    required={required}
                />
            </div>;
        case 'float':
            return <div>
                {label ? <label htmlFor={name}>
                    {label}
                </label> : null}
                <ul className={styles.errors}>
                    {errors?.map((error, key) =>
                        <li key={key}>
                            {error}
                        </li>
                    )}
                </ul>
                <input
                    type="number"
                    name={name}
                    step={0.001}
                    defaultValue={value as number}
                    required={required}
                />
            </div>;
        case 'str':
            return <div>
                {label ? <label htmlFor={name}>
                    {label}
                </label> : null}
                <ul className={styles.errors}>
                    {errors?.map((error, key) =>
                        <li key={key}>
                            {error}
                        </li>
                    )}
                </ul>
                <input
                    type="text"
                    name={name}
                    defaultValue={value as string}
                    required={required}
                />
            </div>;
        case 'bool':
            return <div>
                {label ? <label htmlFor={name}>
                    {label}
                </label> : null}
                <ul className={styles.errors}>
                    {errors?.map((error, key) =>
                        <li key={key}>
                            {error}
                        </li>
                    )}
                </ul>
                <input
                    type="checkbox"
                    name={name}
                    defaultChecked={value as boolean}
                />
            </div>;
        default:
            if (type instanceof Array)
                return <Select
                    name={name}
                    errors={errors}
                    label={label}
                    required={required}
                    defaultValue={value as string | number}
                >
                    {type.map(opt =>
                        <option
                            key={opt}
                            value={opt}
                        >
                            {opt}
                        </option>
                    )}
                </Select>;
            else {
                const match = type.match(listRegex)?.groups;
                return match ? <TypedList
                    name={name}
                    type={match.type as BasicType}
                    label={label}
                    values={value as number[] | string[] | boolean[]}
                /> : null;
            }
    }
}
