export function bind<T extends Function>(
    target: any,
    methodName: string | symbol,
    methodDesc: PropertyDescriptor
) {
    return {
        configurable: true,
        get(this: T) {
            const bound = methodDesc.value.bind(this)
            Object.defineProperty(this, methodName, {
                ...methodDesc,
                value: bound
            })
            return bound
        }
    }
}
