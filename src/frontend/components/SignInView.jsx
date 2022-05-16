import React from 'react';
import { Button, TextInput, Text } from '@frontify/arcade';
import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { UserContext } from '../UserContext';
import { useNavigate } from 'react-router-dom';

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
        if (!urlIsEmpty(domain) && !urlIsBlackListed(domain) && urlStartsWithProtocol(domain)) {
            setValidDomain(true);
        } else {
            setValidDomain(false);
        }
    }, [domain]);

    return (
        <custom-v-stack gap="small" padding="small">
            <Logo size="120"></Logo>
            <custom-spacer></custom-spacer>
            <h2>{t('signin.title')}</h2>
            <Text>{t('signin.your_frontify_domain')}</Text>
            <fieldset>
                <TextInput
                    onEnterPressed={(event) => {
                        console.log(event.target.value);
                        setDomain(event.target.value);
                        handleSignIn(event.target.value);
                    }}
                    type="text"
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
