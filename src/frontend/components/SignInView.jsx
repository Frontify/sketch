import React from 'react';
import { Button, TextInput, Text } from '@frontify/arcade';
import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { UserContext } from '../UserContext';
import { useNavigate } from 'react-router-dom';

export function SignInView() {
    const context = useContext(UserContext);
    let [domain, setDomain] = useState('https://company-136571.frontify.com');
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    function handleSignIn(domain) {
        navigate('/signin-pending');
        let isValidDomain = true;
        if (!isValidDomain) return;
        window.postMessage('beginOauthFlow', domain);
    }

    return (
        <custom-v-stack gap="small" padding="small">
            <Logo size="120"></Logo>
            <custom-spacer></custom-spacer>
            <h2>{t('signin.title')}</h2>
            <Text>{t('signin.your_frontify_domain')}</Text>
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
            <custom-spacer></custom-spacer>
            <Text>{t('signin.need_help')}</Text>
            <custom-v-stack>
                <a href={t('signin.help_link_source')}>
                    <Text color="interactive">{t('signin.help_link')}</Text>
                </a>
                <a href={t('signin.create_account_source')}>
                    <Text color="interactive">{t('signin.create_account')}</Text>
                </a>
            </custom-v-stack>
        </custom-v-stack>
    );
}
