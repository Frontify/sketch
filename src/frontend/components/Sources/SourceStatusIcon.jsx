import React from 'react';
import {
    Badge,
    IconCheck,
    IconCircle,
    IconArrowUp,
    IconArrowDown,
    IconUnknownSimple,
    IconRefresh,
} from '@frontify/fondue';

export function SourceStatusIcon({ state, status, loading }) {
    if (loading) {
        switch (status) {
            case 'PUSHING':
                return (
                    <Badge style="Warning" size="Small" emphasis="Strong" icon={<IconArrowUp></IconArrowUp>}></Badge>
                );
            case 'PULLING':
                return (
                    <Badge
                        style="Warning"
                        size="Small"
                        emphasis="Strong"
                        icon={<IconArrowDown></IconArrowDown>}
                    ></Badge>
                );
            case 'FETCHING':
                return (
                    <Badge style="Progress" size="Small" emphasis="Strong" icon={<IconRefresh></IconRefresh>}></Badge>
                );
        }
    }
    switch (state) {
        case 'unsaved':
            return <Badge style="Primary" icon={<IconUnknownSimple></IconUnknownSimple>}></Badge>;
        case 'push':
            return <Badge style="Warning" size="Small" emphasis="Strong" icon={<IconCircle></IconCircle>}></Badge>;

        case 'pull':
            return (
                <Badge style="Warning" size="Small" emphasis="Strong" icon={<IconArrowDown></IconArrowDown>}></Badge>
            );
        case 'untracked':
            return <Badge style="Primary" icon={<IconUnknownSimple></IconUnknownSimple>}></Badge>;
        case 'same':
        default:
            return <Badge style="Positive" emphasis="Strong" icon={<IconCheck></IconCheck>}></Badge>;
    }

    // if (noChanges) {
    //     return <Badge style="Positive" emphasis="Strong" icon={<IconCheck></IconCheck>}></Badge>;
    // }

    // if (isModified) {
    //     if (isReadyForUpload) {
    //         return <Badge style="Warning" size="Small" emphasis="Strong" icon={<IconCircle></IconCircle>}></Badge>;
    //     }

    //     if (isUploaded) {
    //         return <Badge style="Positive" emphasis="Strong" icon={<IconCheck></IconCheck>}></Badge>;
    //     }

    //     if (isUploading) {
    //         return <Badge style="Warning" size="Small" emphasis="Strong" icon={<IconArrowUp></IconArrowUp>}></Badge>;
    //     }
    // }
}
