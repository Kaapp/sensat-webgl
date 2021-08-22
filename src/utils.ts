import { Vec2 } from 'three';

/**
 * Converts coordinates from DOM coordinate system (origin top-left, +x = right, +y = down) to 
 * normalised device coordinates (NDC) (origin center, +x = right, +y = up)
 * @param param0 The coordinates to convert, in DOM coordinate system.
 * @param width The width of the DOM container, defaults to the window.
 * @param height The height of the DOM container, defaults to the window.
 */
export const convertDOMCoordinatesToNDC = ({ x, y }: Vec2, width = window.innerWidth, height = window.innerHeight): Vec2 => {
    return {
        x: 2 * (x / width) - 1,
        y: 2 * (1 - (y / height)) - 1
    };
};
