export const dateTimeFormat = new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short'
});

export const minDate = new Date(999999999999).toJSON().slice(0, 19);
export const maxDate = new Date(1900000000000).toJSON().slice(0, 19);
