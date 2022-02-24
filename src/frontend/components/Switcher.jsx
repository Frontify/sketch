import React from 'react';
import { useState } from 'react';
import { Switch, Flyout, IconSettings, Button, IconGuidelines, Text } from '@frontify/arcade';

export function Switcher({ guidelines, selection, onChange }) {
    const [open, setOpen] = useState(false);

    return (
        <Flyout
            isOpen={open}
            onOpenChange={(isOpen) => setOpen(isOpen)}
            legacyFooter={false}
            trigger={
                <Button icon={<IconGuidelines />} style="Secondary" onClick={() => setOpen((open) => !open)}>
                    <Text size="x-small">
                        <nobr>
                            {selection.length} / {guidelines.length}
                        </nobr>
                    </Text>
                </Button>
            }
        >
            <custom-v-stack separator="true">
                {guidelines &&
                    guidelines.length &&
                    guidelines
                        .sort((a, b) => (a.name > b.name ? 1 : -1))
                        .map((guideline) => {
                            return (
                                <custom-h-stack gap="small" padding="small" key={guideline.id}>
                                    <IconGuidelines size="Size20"></IconGuidelines>
                                    <Text>{guideline.name}</Text>
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
