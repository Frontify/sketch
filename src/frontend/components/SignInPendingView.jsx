import { Button, TextInput, Text } from '@frontify/arcade';
import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { UserContext } from '../UserContext';
import { useNavigate } from 'react-router-dom';

export function SignInPendingView() {
    let [domain, setDomain] = useState('https://company-136571.frontify.com');
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const context = useContext(UserContext);

    useEffect(() => {
        window.addEventListener('message-from-sketch', async (event) => {
            let { payload, type } = event.detail.data;

            if (type == 'user.authentication') {
                let credentials = { token: payload.access_token, domain: payload.domain };
                context.actions.setAuth({
                    token: payload.access_token,
                    domain: payload.domain,
                });

                // await context.user.getUser(credentials);

                // redirect
                navigate('/sources');
            }
        });
    }, []);

    function cancel() {
        navigate('/signin');
    }

    return (
        <custom-v-stack gap="small" padding="small">
            <Logo size="120"></Logo>
            <custom-spacer></custom-spacer>
            <h2>{t('signin.wait_for_authorization_title')}</h2>
            <Text>{t('signin.wait_for_authorization')}</Text>
            <div>
                <Button onClick={(event) => cancel()}>{t('general.cancel')}</Button>
            </div>
            <custom-spacer></custom-spacer>
            <Text>{t('signin.need_help')}</Text>
            <custom-v-stack>
                <a href={t('signin.help_link_source')} target="_blank">
                    <Text color="interactive">{t('signin.help_link')}</Text>
                </a>
                <a href={t('signin.create_account_source')} target="_blank">
                    <Text color="interactive">{t('signin.create_account')}</Text>
                </a>
            </custom-v-stack>
        </custom-v-stack>
    );
}
