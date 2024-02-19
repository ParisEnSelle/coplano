const { depthFirstSearch, getRatRuns, getUniqueElements } = require('./graph');

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



describe('depthFirstSearch tests', () => {
    test('Empty Graph', () => {
        const graph = {};
        const labels = new Set();
        expect(depthFirstSearch(graph, 1, labels)).toEqual([]);
    });


    test('Single Node Graph Without Destination', () => {
        const graph = { 1: [] };
        const labels = new Set([2]);
        expect(depthFirstSearch(graph, 1, labels)).toEqual([]);
    });

    test('Graph With Multiple Paths', () => {
        const graph = {
            1: [2, 3],
            2: [4],
            3: [4],
            4: []
        };
        const labels = new Set([4]);
        expect(depthFirstSearch(graph, 1, labels)).toEqual([[1, 2, 4], [1, 3, 4]]);
    });

    test('Graph With Cycles', () => {
        const graph = {
            1: [2],
            2: [1, 3],
            3: [2]
        };
        const labels = new Set([3]);
        expect(depthFirstSearch(graph, 1, labels)).toEqual([[1, 2, 3]]);
    });

    test('Graph With Complex Structure', () => {
        const graph = {
            1: [2, 5],
            2: [3],
            3: [4],
            4: [],
            5: [6],
            6: [4]
        };
        const labels = new Set([4]);
        expect(depthFirstSearch(graph, 1, labels)).toEqual([[1, 2, 3, 4], [1, 5, 6, 4]]);
    });

    test('Destination Node Not In Graph', () => {
        const graph = {
            1: [2],
            2: [3],
            3: []
        };
        const labels = new Set([3]);
        expect(depthFirstSearch(graph, 4, labels)).toEqual([]);
    });
});

describe('getRatRuns tests', () => {
    test('Transit Sets Only', () => {
        const graph = {
            1: [2, 3],
            2: [4],
            3: [4],
            4: []
        };
        const transitSets = [new Set([1]), new Set([4])];
        expect(getRatRuns(graph, transitSets)).toEqual([[1, 2, 4], [1, 3, 4]]);
    });
});