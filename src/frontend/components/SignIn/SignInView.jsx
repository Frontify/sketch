import React, { useState, useEffect, useContext } from 'react';

// Components
import { Button, FrontifyPattern, Heading, TextInput, Text } from '@frontify/fondue';
import { Logo } from '../Core/Logo';

// Hooks
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSketch } from '../../hooks/useSketch';

// Context
import { UserContext } from '../../context/UserContext';

// Validation
function urlStartsWithProtocol(url) {
    return url.indexOf('http') == 0;
}

function urlIsEmpty(url) {
    return url.length == 0;
}

function urlIsBlackListed(url) {
    if (url) {
        var blacklist = ['http://app.frontify.com', 'https://app.frontify.com'];

        var forbidden = false;
        blacklist.forEach((entry) => {
            if (url.startsWith(entry)) forbidden = true;
        });
        return forbidden;
    }
}

function sanitizeURL(url) {
    // protocol

    let pattern = /^(ht)tps?:\/\//i;

    if (!pattern.test(url)) {
        url = 'https://' + url;
    }
    if (url.includes('http://')) {
        url = url.replace('http://', 'https://');
    }
    // strip path
    let parts = url.split('/');
    url = parts.slice(0, 3).join('/');
    return url;
}

export function SignInView() {
    let placeholders = { domain: 'https://your.frontify.domain.tld' };
    const context = useContext(UserContext);
    let [domain, setDomain] = useState('');
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    let [validDomain, setValidDomain] = useState(false);
    let [validationError, setValidationError] = useState('');

    function handleSignIn(domain) {
        if (validDomain) {
            domain = sanitizeURL(domain);
            navigate('/signin-pending');
            window.postMessage('beginOauthFlow', domain);
        }
    }

    useEffect(() => {
        // 29 Jun: removed && urlStartsWithProtocol(domain)
        if (!urlIsEmpty(domain) && !urlIsBlackListed(domain)) {
            setValidDomain(true);
        } else {
            setValidDomain(false);
        }
    }, [domain]);

    const openExternal = (url) => {
        useSketch('openUrl', { url });
    };

    return (
        <custom-v-stack gap="large" padding="large" style={{ background: 'white' }}>
            <custom-v-stack gap="large" padding="large">
                <custom-spacer></custom-spacer>
                <Logo size="148"></Logo>
                <custom-spacer></custom-spacer>
                <Heading size="xx-large">{t('signin.title')}</Heading>
                <custom-spacer></custom-spacer>
                <custom-v-stack gap="small">
                    <Text>{t('signin.your_frontify_domain')}</Text>
                    <fieldset>
                        <TextInput
                            onEnterPressed={(event) => {
                                setDomain(event.target.value);
                                handleSignIn(event.target.value);
                            }}
                            type="email"
                            placeholder={placeholders.domain}
                            value={domain}
                            onChange={(value) => setDomain(value)}
                        />
                    </fieldset>
                    <div>
                        <Button disabled={!validDomain} onClick={(event) => handleSignIn(domain)}>
                            {t('signin.sign_in')}
                        </Button>
                    </div>
                </custom-v-stack>
                <custom-line></custom-line>
                <Text>{t('signin.need_help')}</Text>
                <custom-v-stack>
                    <a onClick={() => openExternal(t('general.help_link_url'))}>
                        <Text color="interactive">{t('signin.help_link_title')}</Text>
                    </a>
                    <a onClick={() => openExternal(t('signin.create_account_url'))}>
                        <Text color="interactive">{t('signin.create_account_title')}</Text>
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
