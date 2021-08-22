import { BufferAttribute, InterleavedBufferAttribute, Line, Object3D, Points } from "three";

/**
 * Type guard to check if an Object3D is actually a Points instance.
 * @param maybe The potential Points object
 * @returns Whether or not the supplied value was a Points instance.
 */
export const isPoints = (maybe: Object3D): maybe is Points => {
    return maybe !== null && (maybe as Points).isPoints;
};

/**
 * Type guard to discriminate between buffer attribute types.
 * @param maybe The potential buffer attribute
 * @returns Whether or not the supplied value was a buffer attribute.
 */
export const isBufferAttribute = (maybe: BufferAttribute | InterleavedBufferAttribute): maybe is BufferAttribute => {
    return maybe !== null && (maybe as BufferAttribute).isBufferAttribute;
};
