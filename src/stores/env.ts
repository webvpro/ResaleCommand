import { atom } from 'nanostores';

// Holds whether the current user is operating in alpha mode
export const isAlphaMode = atom<boolean>(false);
