import React from 'react';
import { useState } from 'react';
import { Switch, Flyout, IconSettings, Button, IconGuidelines, Text } from '@frontify/arcade';

export function Switcher({ guidelines, onChange }) {
    const [open, setOpen] = useState(false);

    return (
        <Flyout
            trigger={<Button icon={<IconSettings />} inverted onClick={() => setOpen((open) => !open)}></Button>}
            isOpen={open}
            onOpenChange={(isOpen) => setOpen(isOpen)}
            legacyFooter={false}
        >
            <custom-v-stack separator="true">
                {guidelines &&
                    guidelines.map((guideline) => {
                        return (
                            <custom-h-stack gap="small" padding="small">
                                <IconGuidelines size="Size20"></IconGuidelines>
                                <Text size="large">{guideline.name}</Text>
                                <custom-spacer></custom-spacer>
                                <Switch
                                    key={guideline.name}
                                    size="Medium"
                                    on={guideline.active}
                                    onChange={(event) => {
                                        guideline.active = !guideline.active;
                                        onChange(guidelines);
                                    }}
                                ></Switch>
                            </custom-h-stack>
                        );
                    })}
            </custom-v-stack>
        </Flyout>
    );
}
