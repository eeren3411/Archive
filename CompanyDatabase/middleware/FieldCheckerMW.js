import { StatusCodes } from "http-status-codes";

/**
 * Returns a function that checks if the given object has all fields specified in the "fields" parameter.
 * If any of the fields are missing, it returns an object with error: true and details: a string of the missing fields.
 * If all the fields are present, it returns an object with error: false.
 * @param {string[]} fields
 * @returns {(obj: object) => {error: boolean, details?: string}} - a function that takes an object and returns the result of the check.
 */
function ObjectFieldChecker(fields) {
    return (obj) => {
        if (typeof obj !== 'object') {
            return {
                error: true,
                details: 'Object expected'
            }
        }
        
        const missingFields = fields.filter(field => !(field in obj));

        if (missingFields.length > 0) {
            return {
                error: true,
                details: `Missing fields: ${missingFields.join(', ')}`
            }
        }

        return {
            error: false
        }
    }
}

/**
 * Returns a function that checks if the given array of objects has all fields specified in the "fields" parameter.
 * If any of the objects are missing any of the fields, it returns an object with error: true and details: an object with the index of the object as the key and the list of missing fields as the value.
 * If all the objects have all the fields, it returns an object with error: false.
 * @param {string[]} fields
 * @returns {(arr: object[]) => {error: boolean, details?: string | {index: string}}} - a function that takes an array of objects and returns the result of the check.
 */
function ObjectArrayFieldChecker(fields) {
    const checker = ObjectFieldChecker(fields);

    return (arr) => {
        if (!Array.isArray(arr)) {
            return {
                error: true,
                details: 'Array expected'
            }
        }

        const result = arr.reduce((acc, obj, i) => {
            const result = checker(obj);

            if (result.error) {
                acc[i] = result.details;
            }

            return acc;
        }, {});

        if (Object.keys(result).length > 0) {
            return {
                error: true,
                details: result
            }
        }

        return {
            error: false
        }
    }
}

/**
 * Returns a middleware function that checks the req[property] against the fieldChecker.
 * If the check fails, it returns a 422 with the details of the error.
 * If the check passes, it calls next().
 * @param {string} property - the property of the req object to check.
 * @param {(any) => {error: boolean, details?: string}} fieldChecker - the function that checks the field, should return an object with an error property and a details property.
 * @returns {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => void}
 */
function GeneralizedRequestParser(property, fieldChecker) {
    return (req, res, next) => {
        const result = fieldChecker(req[property]);

        if (result.error) {
            return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
                property: `req.${property}`,
                error: result.details
            });
        }

        next();
    }
}

/**
 * Creates a middleware that checks if the given fields exist in the body of the request.
 * @param  {...string} fields 
 * @returns {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => void}
 */
export const BodyFieldChecker = (...fields) => GeneralizedRequestParser('body', ObjectFieldChecker(fields));

/**
 * Creates a middleware that checks if the given fields exists in the body of the request as an array of objects.
 * @param  {...string} fields 
 * @returns {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => void}
 */
export const BodyArrayFieldChecker = (...fields) => GeneralizedRequestParser('body', ObjectArrayFieldChecker(fields));

/**
 * Creates a middleware that checks if the given fields exist in the headers of the request.
 * @param  {...string} fields 
 * @returns {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => void}
 */
export const HeaderFieldChecker = (...fields) => GeneralizedRequestParser('headers', ObjectFieldChecker(fields));