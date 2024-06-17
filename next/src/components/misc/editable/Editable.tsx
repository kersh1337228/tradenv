'use client';

import {
    ReactNode,
    HTMLInputTypeAttribute,
    useRef,
    useState
} from 'react';
import Input from '../form/Input';
import EditIcon from 'components/misc/icons/Edit';
import OKIcon from 'components/misc/icons/OK';
import CancelIcon from 'components/misc/icons/Cancel';
import DeleteIcon from 'components/misc/icons/Delete';
import styles from './styles.module.css';

export default function Editable(
    {
        name,
        type,
        value,
        setValue,
        label = '',
        children,
        onDelete,
        allowDelete = false,
        allowEdit = true
    }: {
        name: string;
        type:  HTMLInputTypeAttribute;
        value: any;
        setValue: (value: any) => Promise<JSONResponse>;
        onDelete?: () => Promise<void>;
        allowDelete?: boolean | null;
        allowEdit?: boolean | null;
        label?: string;
        children: ReactNode;
    }
) {
    const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
    const [edit, setEdit] = useState(false);
    const [errors, setErrors] = useState(new Array<string>());

    return edit ? <div
        className={styles.editableRow}
    >
        <Input
            name={name}
            label={label}
            type={type}
            defaultValue={value}
            inputRef={inputRef}
            errors={errors}
        />
        <span
            className={styles.row}
        >
            <OKIcon onClick={async (_) => {
                const response = await setValue(inputRef.current?.value);
                if (!response.ok && name in response.data)
                    setErrors(response.data[name]);
                else
                    setEdit(false);
            }} />
            <CancelIcon onClick={(_) => {
                setEdit(false);
            }} />
        </span>
    </div> : <div
        className={styles.editableRow}
    >
        {children}
        <span
            className={styles.row}
        >
            {allowEdit ? <EditIcon
                onClick={(_) => {
                    setEdit(true);
                }}
            /> : null}
            {value && (onDelete || allowDelete) ? <DeleteIcon
                onDoubleClick={onDelete ?? (allowDelete ?
                    async () => await setValue(null) : undefined)}
            /> : null}
        </span>
    </div>;
}
