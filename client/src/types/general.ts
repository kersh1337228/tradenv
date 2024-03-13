export interface ArgsType {
    [key: string]: (
        'str' | 'int' | 'float' |
        'list[str]' | 'list[int]' | 'list[float]' |
        string[] | number[]
    )
}

export interface rgbObject {
    r: number
    g: number
    b: number
}

export interface rgbaObject extends rgbObject {
    a: number
}

export type colorT = (  // String representing css-friendly color
    `rgba(${number}, ${number}, ${number}, ${number})` |
    `rgb(${number}, ${number}, ${number})` |
    `#${number | string}${number | string}${number | string}`
)
