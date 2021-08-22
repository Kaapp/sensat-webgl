import { Intersection, Vec2, Vector3 } from 'three';
import { isPoints } from './typeGuards';

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

/**
 * Formats a Vector3 instance as a string to be displayed to the user.
 * @param vector The vector data to display
 * @returns Formatted string displaying the data of the vector
 */
export const formatVector3String = (vector: Vector3, withNewlines = true): string => {
    if (!vector) {
        return '';
    }
    const newlineChar = withNewlines ? '\n' : ' ';

    return `x: ${vector.x.toFixed(3)},${newlineChar}y: ${vector.y.toFixed(3)},${newlineChar}z: ${vector.z.toFixed(3)}`;
};

/**
 * Gets the point location from an intersection with a Points instance.
 * @param intersection The intersection to get point location from
 * @returns The location of the point which was intersected with, rather than the intersection point (which can be different)
 */
export const getPointLocationFromIntersection = (intersection: Intersection): Vector3 => {
    if (!intersection) {
        return null;
    }
    
    if (!isPoints(intersection.object)) {
        throw new Error(`getPointLocationFromIntersection currently only handles intersections with Points instances!`);
    }

    const objectPosition = intersection.object.geometry.getAttribute('position'),
        pointLocation = new Vector3();
    
    pointLocation.fromBufferAttribute(objectPosition, intersection.index);

    return pointLocation;
}