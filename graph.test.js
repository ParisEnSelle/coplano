const getUniqueElements = require('./graph');

describe('getUniqueElements tests', () => {
    test('should return an empty set for empty input', () => {
        expect(getUniqueElements([])).toEqual(new Set());
    });

    test('should handle a single pair', () => {
        expect(getUniqueElements([[1, 2]])).toEqual(new Set([1, 2]));
    });

    test('should handle multiple pairs with unique elements', () => {
        expect(getUniqueElements([[1, 2], [3, 4]])).toEqual(new Set([1, 2, 3, 4]));
    });

    test('should handle multiple pairs with unique elements', () => {
        expect(getUniqueElements([[1, 2], [3, 4], [5, 6]])).toEqual(new Set([1, 2, 3, 4, 5, 6]));
    });

    test('should handle multiple pairs with duplicate elements', () => {
        expect(getUniqueElements([[1, 2], [1, 2]])).toEqual(new Set([1, 2]));
    });

    test('should handle multiple pairs with duplicate elements', () => {
        expect(getUniqueElements([[1, 2], [2, 3]])).toEqual(new Set([1, 2, 3]));
    });

    test('should handle multiple pairs with duplicate elements', () => {
        expect(getUniqueElements([[1, 2], [2, 3], [3, 1]])).toEqual(new Set([1, 2, 3]));
    });

    test('should handle multiple pairs with duplicate elements', () => {
        expect(getUniqueElements([[1, 2], [2, 5], [5, 6]])).toEqual(new Set([1, 2, 5, 6]));
    });
});
