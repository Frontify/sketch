import React, { useState } from 'react';
export function CustomDialog({ children, trigger, onChange, open }) {
    return (
        <div>
            <button>{trigger}</button>

            {open && (
                <custom-dialog>
                    <custom-dialog-content>{children}</custom-dialog-content>
                </custom-dialog>
            )}
        </div>
    );
}
