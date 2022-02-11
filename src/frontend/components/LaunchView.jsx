import React, { useEffect, useContext } from 'react';
import { UserContext } from '../UserContext';
import { useNavigate } from 'react-router-dom';

export function LaunchView({ state }) {
    const context = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(async () => {
        console.log('Laucnher', state);
        if (context.user?.getUser) {
            await context.user.getUser();
            navigate(state?.path || '/sources');
        } else {
            console.warn('Didn’t fetch user, because getUser() doesn’t exist.');
        }
    }, []);

    return (
        <div>
            <div>Launching …</div>
            <pre>{JSON.stringify(context.user, null, 2)}</pre>
        </div>
    );
}
