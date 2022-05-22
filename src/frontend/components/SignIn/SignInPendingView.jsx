import React, { useEffect, useContext } from 'react';

// Components
import { Button, FrontifyPattern, Heading, Text } from '@frontify/arcade';
import { Logo } from '../Core/Logo';

// Context
import { UserContext } from '../../context/UserContext';

// Router
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function SignInPendingView() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const context = useContext(UserContext);

    useEffect(() => {
        window.addEventListener('message-from-sketch', async (event) => {
            let { payload, type } = event.detail.data;

            if (type == 'user.authentication') {
                context.actions.setAuth({
                    token: payload.access_token,
                    domain: payload.domain,
                });

                // redirect
                navigate('/source/artboards');
            }
        });
    }, []);

    function cancel() {
        navigate('/signin');
    }

    return (
        <custom-v-stack gap="large" padding="large" style={{ background: 'white' }}>
            <custom-v-stack gap="large" padding="large">
                <custom-spacer></custom-spacer>
                <Logo size="148"></Logo>
                <custom-spacer></custom-spacer>

                <Heading size="xx-large">{t('signin.wait_for_authorization_title')}</Heading>
                <Text>{t('signin.wait_for_authorization')}</Text>
                <div>
                    <Button onClick={() => cancel()}>{t('general.cancel')}</Button>
                </div>
                <custom-line></custom-line>
                <Text>{t('signin.need_help')}</Text>
                <custom-v-stack>
                    <a href={t('signin.help_link_source')} rel="noreferrer" target="_blank">
                        <Text color="interactive">{t('signin.help_link')}</Text>
                    </a>
                    <a href={t('signin.create_account_source')} rel="noreferrer" target="_blank">
                        <Text color="interactive">{t('signin.create_account')}</Text>
                    </a>
                </custom-v-stack>
            </custom-v-stack>

            <div className="tw-fixed tw-bottom-0 tw-left-0 tw--z-1" style={{ zIndex: -1 }}>
                <div className="tw-w-100 tw-h-80">
                    <FrontifyPattern pattern="Imagery" foregroundColor="Green" scale="LG"></FrontifyPattern>
                </div>
            </div>
        </custom-v-stack>
    );
}
