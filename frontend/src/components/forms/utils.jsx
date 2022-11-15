import React from 'react'
import ListField from './ListField'

function dtype_to_field(name, dtype, defaultValue = null) {
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
            return <select name={name} defaultValue={defaultValue}>
                {dtype.map(value =>
                    <option value={value} key={value}>
                        {value}
                    </option>
                )}
            </select>
    }
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
}

export {dtype_to_field, capitalize}
