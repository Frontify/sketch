import { Button, TextInput } from '@frontify/arcade';
import React from 'react';
import { useState } from 'react';

export function SignInView() {
    let [domain, setDomain] = useState('https://company-136571.frontify.com');

    function handleSignIn(domain) {
        let isValidDomain = true;
        if (!isValidDomain) return;
        window.postMessage('beginOauthFlow', domain);
    }
    return (
        <div>
            <h2>SignIn</h2>
            <TextInput
                type="text"
                placeholder="https://domain"
                value={domain}
                onInput={(event) => setDomain(event.target.value)}
            />
            <Button onClick={(event) => handleSignIn(domain)}>Sign in</Button>
        </div>
    );
}
