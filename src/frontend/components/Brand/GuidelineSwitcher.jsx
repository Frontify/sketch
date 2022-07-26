import React from 'react';
import { useState } from 'react';
import { Badge, Switch, Flyout, IconSettings, Button, IconGuidelines, Text } from '@frontify/fondue';

export function GuidelineSwitcher({ guidelines, selection, onChange }) {
    const [open, setOpen] = useState(false);

    return (
        <Flyout
            hug={false}
            fitContent={true}
            isOpen={open}
            onOpenChange={(isOpen) => setOpen(isOpen)}
            legacyFooter={false}
            trigger={
                <Button
                    border-radius="none"
                    icon={<IconGuidelines />}
                    inverted={true}
                    style="Primary"
                    onClick={() => setOpen((open) => !open)}
                >
                    <Text size="x-small" whitespace="pre">
                        <custom-h-stack gap="x-small">
                            <span>Guidelines</span>
                            {selection.length != guidelines.length ? (
                                <custom-badge>{selection.length}</custom-badge>
                            ) : (
                                ''
                            )}
                        </custom-h-stack>
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
