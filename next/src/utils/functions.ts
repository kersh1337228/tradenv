export function serialize(
    field: FormField
): BasicValue | Record<string, any> | undefined {
    if (field instanceof HTMLInputElement)
        switch (field.type) {
            case 'number':
                return field.valueAsNumber;
            case 'text':
            case 'date':
            case 'datetime-local':
                return field.value;
            case 'checkbox':
                return field.checked;
        }
    else if (field instanceof HTMLSelectElement)
        return field.multiple ?
            [...field.options]
                .filter(opt => opt.selected)
                .map(opt => opt.value) :
            field.value;
    else if (field instanceof HTMLFieldSetElement) {
        // @ts-ignore
        return field.attributes.format ? Object.fromEntries(
            ([...field.elements] as FormField[])
                .map(field => [field.name, serialize(field)])
                .filter(field =>
                    !(field[0] as string).includes('-')
                    && field[1] !== undefined
                )
        ) : ([...field.elements] as FormField[])
            .map(serialize)
            .filter(value => value !== undefined) as BasicValue;
    }
}

export function debounce(
    callback: (...args: any[]) => Promise<void>,
    wait: number
) {
    let timeoutId: number;
    return (...args: any[]) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(async () => {
            await callback(...args);
        }, wait);
    };
}

export function randomColor(): string {
    return `#${Math.round(
        0xffffff * Math.random()
    ).toString(16)}`;
}
