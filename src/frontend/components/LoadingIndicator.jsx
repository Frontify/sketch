import React from 'react';
import { Logo } from './Logo';

export function LoadingIndicator() {
    return (
        <div padding="small" style={{ height: '100%', flex: 1, width: '100%', display: 'grid', placeItems: 'center' }}>
            <custom-v-stack align-items="center" gap="large">
                <img src="../../assets/images/nook-animated.gif" width="64" />
            </custom-v-stack>
        </div>
    );
}
