import { useState } from 'react';

export const useModal = (defaultState: boolean = false) => {
    const [isOpen, setIsOpen] = useState<boolean>(defaultState);

    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);

    return {
        isOpen,
        open,
        close
    };
};
