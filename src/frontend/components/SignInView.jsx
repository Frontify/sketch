import { Button, TextInput } from '@frontify/arcade';
import React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function SignInView() {
    let [domain, setDomain] = useState('https://company-136571.frontify.com');
    const { t, i18n } = useTranslation();

    function handleSignIn(domain) {
        let isValidDomain = true;
        if (!isValidDomain) return;
        window.postMessage('beginOauthFlow', domain);
    }
    return (
        <custom-v-stack gap="small" padding="small">
            <h2>{t('signin.title')}</h2>
            <fieldset>
                <TextInput
                    type="text"
                    placeholder="https://domain"
                    value={domain}
                    onInput={(event) => setDomain(event.target.value)}
                />
            </fieldset>
            <div>
                <Button onClick={(event) => handleSignIn(domain)}>{t('signin.sign_in')}</Button>
            </div>
        </custom-v-stack>
    );
}
