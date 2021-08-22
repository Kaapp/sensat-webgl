import { Vec2 } from 'three';

/**
 * Matches only the allowed hexadecimal characters in a standard RRGGBB hex colour.
 */
export const HEX_COLOUR_REGEX = /^[0-9a-f]{0,6}$/i

/**
 * Converts coordinates from DOM coordinate system (origin top-left, +x = right, +y = down) to 
 * normalised device coordinates (NDC) (origin center, +x = right, +y = up)
 * @param param0 The coordinates to convert, in DOM coordinate system.
 * @param width The width of the DOM container, defaults to the window.
 * @param height The height of the DOM container, defaults to the window.
 * @returns The NDC-converted coordinates
 */
export const convertDOMCoordinatesToNDC = ({ x, y }: Vec2, width = window.innerWidth, height = window.innerHeight): Vec2 => {
    return {
        x: 2 * (x / width) - 1,
        y: 2 * (1 - (y / height)) - 1
    };
};

/**
 * Gets the numerical value from a hexadecimal colour string
 * @param colour The colour to convert
 * @returns The numerical value of the colour string
 */
export const getHexValueFromColourString = (colour: string): number => {
    return parseInt(colour.replace(/#/g, ''), 16);
};
