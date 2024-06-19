'use client';

import {
    ReactNode,
    useState
} from 'react';
import HintedField from 'components/misc/form/HintedField';
import EditIcon from 'components/misc/icons/Edit';
import OKIcon from 'components/misc/icons/OK';
import CancelIcon from 'components/misc/icons/Cancel';
import DeleteIcon from 'components/misc/icons/Delete';
import styles from './styles.module.css';

export default function EditableHinted(
    {
        name,
        value,
        setValue,
        search,
        children,
        onDelete,
        allowDelete = false,
        allowEdit = true,
    }: {
        name: string;
        value: string;
        setValue: (value: string) => Promise<JSONResponse>;
        search: (query: string) => Promise<string[]>;
        children: ReactNode;
        onDelete?: () => Promise<void>;
        allowDelete?: boolean | null;
        allowEdit?: boolean | null;
    }
) {
    const [value_, setValue_] = useState(value);
    const [edit, setEdit] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    return edit ? <div
        className={styles.editableRow}
    >
        <HintedField
            name={name}
            value={value_}
            setValue={setValue_}
            search={search}
            errors={errors}
        />
        <span
            className={styles.row}
        >
            <OKIcon onClick={async (_) => {
                const response = await setValue(value_);
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
                    async () => await setValue('') : undefined)}
            /> : null}
        </span>
    </div>;
}
