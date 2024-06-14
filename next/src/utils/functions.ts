export function formDataSerialize(
    formData: FormData
): Object {
    const obj: Record<string, any> = {};

    for (const [key, val] of formData.entries())
        obj[key] = val;

    return obj;
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
