import React from 'react';
import { useState } from 'react';
import { TextInput, IconSearch } from '@frontify/fondue';

import { useTranslation } from 'react-i18next';

export function SearchField({ disabled, placeholder, onInput, onChange = () => {} }) {
    const [query, setQuery] = useState('');
    const { t, i18n } = useTranslation();

    return (
        <TextInput
            disabled={disabled}
            type="text"
            clearable="true"
            placeholder={placeholder || t('general.search')}
            decorator={<IconSearch />}
            value={query}
            spellcheck={false}
            autocomplete={false}
            onChange={(value) => {
                setQuery(value);
                onInput(value);
                if (value == '') onChange('');
            }}
            onEnterPressed={(event) => {
                onChange(event.target.value);
            }}
            onClear={() => {
                setQuery('');
                onChange('');
            }}
        ></TextInput>
    );
}
