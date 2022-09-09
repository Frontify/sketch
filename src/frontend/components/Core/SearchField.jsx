import React from 'react';
import { TextInput, IconSearch } from '@frontify/fondue';

import { useTranslation } from 'react-i18next';

export function SearchField({ disabled, placeholder, onInput, onChange = () => {}, value }) {
    const { t } = useTranslation();

    return (
        <TextInput
            disabled={disabled}
            type="text"
            clearable="true"
            placeholder={placeholder || t('general.search')}
            decorator={<IconSearch />}
            value={value}
            spellCheck={false}
            autocomplete={false}
            onChange={(value) => {
                onInput(value);
                if (value == '') onChange('');
            }}
            onEnterPressed={(event) => {
                onChange(event.target.value);
            }}
            onClear={() => {
                onChange('');
            }}
        ></TextInput>
    );
}
