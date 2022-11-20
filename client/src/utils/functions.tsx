import React from 'react'
import ListField from '../components/forms/ListField'
import {colorT, rgbaObject} from "../types/general";

export function getCSRF(): string {
    const regex: RegExp = /csrftoken=(?<csrf>[\w]+)[;]?/
    const token = document.cookie.match(regex)?.groups?.csrf
    return token ? token : ''
}

export function dtype_to_field(
    name: string,
    dtype: string | any[],
    defaultValue: any = null
): React.ReactElement {
    switch (dtype) {
        case 'int':
            return <input name={name} type={'number'} defaultValue={defaultValue} required/>
        case 'float':
            return <input name={name} type={'number'} step={'0.001'} defaultValue={defaultValue} required/>
        case 'str':
            return <input name={name} type={'text'} defaultValue={defaultValue} required/>
        case 'list[int]':
            return <ListField name={name} defaultValue={defaultValue} type={'int'} />
        case 'list[float]':
            return <ListField name={name} defaultValue={defaultValue} type={'float'} />
        default:  // Literal list of values given
            if (dtype instanceof Array) {
                return (
                    <select name={name} defaultValue={defaultValue}>
                        {dtype.map(value =>
                            <option value={value} key={value}>
                                {value}
                            </option>
                        )}
                    </select>
                )
            } else {
                return <></>
            }
    }
}

export function capitalize(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1)
}

export function formSerialize(form: HTMLFormElement): string {
    // TODO: implement
    return ''
}

export function colorToString(color: rgbaObject): colorT {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
}

type HTTPRequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'TRACE' | 'OPTIONS'

export async function ajax(
    url: string,
    method: HTTPRequestMethod,
    success?: (response: any) => any,
    error?: (response: any) => any,
    body?: {
      [key: string]: any
    } | string | null,
    headers?: {
        [headerName: string]: string
    }
): Promise<void> {
    if (['GET', 'HEAD', 'TRACE', 'OPTIONS'].includes(method)) {  // Safe method
        url += '?' + new URLSearchParams(body ? body : {})
        body = null
    } else {  // Non-safe method
        headers = {
            ...headers,
            'X-CSRFToken': getCSRF()
        }
        body = JSON.stringify(body)
    }
    await fetch(
        url,
        {
            method: method,
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: body
        }
    ).then(
        (response: Response) => response.json()
    ).then(success).catch(error)
}
