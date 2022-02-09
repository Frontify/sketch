import React from 'react';
import { useState } from 'react';
import { TextInput, IconSearch } from '@frontify/arcade';

import { useTranslation } from 'react-i18next';

export function SearchField({ onChange }) {
    const [query, setQuery] = useState('');
    const { t, i18n } = useTranslation();

    return (
        <TextInput
            type="search"
            placeholder={t('general.search')}
            decorator={<IconSearch />}
            value={query}
            onChange={(value) => {
                setQuery(value);
                onChange(value);
            }}
        ></TextInput>
    );
}
