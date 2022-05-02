import React, { useState } from 'react';
export function CustomDialog({ children, trigger, onChange }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <button>{trigger}</button>

            <custom-dialog>
                <custom-dialog-content>{children}</custom-dialog-content>
            </custom-dialog>
        </div>
    );
}
