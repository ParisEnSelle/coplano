const { depthFirstSearch, getLocalNodes, getRatRuns, getRatRunSegments, getUniqueElements, groupKeysBySet, getStartEnds } = require('./graph');

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

describe('groupKeysBySet tests', () => {
   test('should return grouped keys', () => {
       const dictionary = {
            1: new Set([1, 2, 3]),
            2: new Set([4, 5]),
            3: new Set([1, 3, 2]),
            4: new Set([6, 7, 8]),
            5: new Set([5, 4]),
            6: new Set([1, 2, 3]),
        };
        const expected = [
            [[1,3,6], [1,2,3]],
            [[2,5], [4,5]],
            [[4], [6,7,8]],
        ];
        expect(groupKeysBySet(dictionary)).toEqual(expected);
   });
});

describe('getLocalNodes tests', () => {
    test('simple case', () => {
        const graph = {
            1: [2],
            2: [3]
        };
        const expected = new Set([2]);
        expect(getLocalNodes(graph)).toEqual(expected);
    });

    test('case with loop', () => {
        const graph = {
            1: [2],
            2: [3,4],
            4: [5],
            5: [2]
        };
        const expected = new Set([2,4,5]);
        expect(getLocalNodes(graph)).toEqual(expected);
    });

    test('case with double ways', () => {
        const graph = {
            1: [2],
            2: [3,4,5],
            3: [2,4],
            5: [2]
        };
        const expected = new Set([2,3]);
        expect(getLocalNodes(graph)).toEqual(expected);
    });

    test('complex case', () => {
        const graph = {
            1: [4],
            2: [4],
            3: [4,5,9],
            4: [6,7,8],
            9: [8]
        };
        const expected = new Set([4,9]);
        expect(getLocalNodes(graph)).toEqual(expected);
    });
});

describe('getStartEnds tests', () => {
    test('simple case with 2 nodes', () => {
        const transitSets = [new Set([19]), new Set([93])];
        const transitBlacklists = {};
        const transitWhitelists = {};
        const expected = [[[19], [93]], [[93],[19]]];
        expect(getStartEnds(transitSets, transitBlacklists, transitWhitelists)).toEqual(expected);
    });

    test('simple case with 3 nodes', () => {
        const transitSets = [new Set([1,2]), new Set([3])];
        const transitBlacklists = {};
        const transitWhitelists = {};
        const expected = [[[1,2], [3]], [[3],[1,2]]];
        expect(getStartEnds(transitSets, transitBlacklists, transitWhitelists)).toEqual(expected);
    });

    test('simple case with 3 transit sets', () => {
        const transitSets = [new Set([1,2]), new Set([3]), new Set([4])];
        const transitBlacklists = {};
        const transitWhitelists = {};
        const expected = [
            [[1,2], [3,4]],
            [[3],[1,2,4]],
            [[4],[1,2,3]]
        ];
        expect(getStartEnds(transitSets, transitBlacklists, transitWhitelists)).toEqual(expected);
    });

    test('simple case with whitelist', () => {
        const transitSets = [new Set([1,2]), new Set([3, 4])];
        const transitBlacklists = {};
        const transitWhitelists = { 1: [4]};
        const expected = [[[1], [4]], [[2],[3,4]], [[3,4],[1,2]]];
        expect(getStartEnds(transitSets, transitBlacklists, transitWhitelists)).toEqual(expected);
    });

    test('simple case with blacklist', () => {
        const transitSets = [new Set([1,2]), new Set([3, 4])];
        const transitBlacklists = {};
        const transitWhitelists = { 1: [4]};
        const expected = [[[1], [4]], [[2],[3,4]], [[3,4],[1,2]]];
        expect(getStartEnds(transitSets, transitBlacklists, transitWhitelists)).toEqual(expected);
    });

   test('simple case with whitelists', () => {
        const transitSets = [new Set([19]), new Set([93])];
        const transitBlacklists = {};
        const transitWhitelists = { 19: [93], 93: [19] };
        const expected = [[[19], [93]], [[93],[19]]];
        expect(getStartEnds(transitSets, transitBlacklists, transitWhitelists)).toEqual(expected);
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
    test('simple case', () => {
        const graph = {
            1: [2, 3],
            2: [4],
            3: [4],
            4: []
        };
        const startEnds = [
            [[1], [4]]
        ];
        const expected = [[1, 2], [2, 4], [1, 3], [3, 4]];
        expect(getRatRuns(graph, startEnds)).toEqual(expected);
    });
});



describe('getRatRunSegments tests', () => {
    test('simple case', () => {
        const graph = {
            1: [2],
            2: [3]
        };
        const ends = new Set([3]);
        const expected = new Set([[1, 2], [2, 3]]);
        expect(new Set(getRatRunSegments(graph, 1, ends))).toEqual(expected);
    });

    test('simple case', () => {
        const graph = {
            1: [2]
        };
        const ends = new Set([2]);
        const expected = new Set([[1, 2]]);
        expect(new Set(getRatRunSegments(graph, 1, ends))).toEqual(expected);
    });

    test('basic case, dangling start', () => {
        const graph = {
            1: [2, 4],
            2: [3]
        };
        const ends = new Set([3]);
        const expected = new Set([[1, 2], [2, 3]]);
        expect(new Set(getRatRunSegments(graph, 1, ends))).toEqual(expected);
    });

    test('basic case, dangling end', () => {
        const graph = {
            1: [2],
            2: [3, 4]
        };
        const ends = new Set([3]);
        const expected = new Set([[1, 2], [2, 3]]);
        expect(new Set(getRatRunSegments(graph, 1, ends))).toEqual(expected);
    });

    test('basic case, multiple ends', () => {
        const graph = {
            1: [2],
            2: [3, 4]
        };
        const ends = new Set([3, 4]);
        const expected = new Set([[1, 2], [2, 3], [2, 4]]);
        expect(new Set(getRatRunSegments(graph, 1, ends))).toEqual(expected);
    });

    test('basic case', () => {
        const graph = {
            1: [2],
            2: [3],
            4: [2]
        };
        const ends = new Set([3]);
        const expected = new Set([[1, 2], [2, 3]]);
        expect(new Set(getRatRunSegments(graph, 1, ends))).toEqual(expected);
    });

    test('double path', () => {
        const graph = {
            1: [2, 4],
            2: [3],
            4: [3]
        };
        const ends = new Set([3]);
        const expected = new Set([[1, 2], [2, 3], [1,4], [4, 3]]);
        expect(new Set(getRatRunSegments(graph, 1, ends))).toEqual(expected);
    });

    test('single path with reverse', () => {
        const graph = {
            1: [2],
            2: [3],
            3: [4],
            4: [1]
        };
        const ends = new Set([3]);
        const expected = new Set([[1, 2], [2, 3]]);
        expect(new Set(getRatRunSegments(graph, 1, ends))).toEqual(expected);
    });

    test('do not continue search after hitting a label', () => {
        const graph = {
            1: [2],
            2: [3],
            3: [4],
            4: [5]
        };
        const ends = new Set([3, 5]);
        const expected = new Set([[1, 2], [2, 3]]);
        expect(new Set(getRatRunSegments(graph, 1, ends))).toEqual(expected);
    });

    test('do not include loops', () => {
        const graph = {
            1: [2],
            2: [3,4],
            4: [5],
            5: [2]
        };
        const ends = new Set([3]);
        const expected = new Set([[1, 2], [2, 3]]);
        expect(new Set(getRatRunSegments(graph, 1, ends))).toEqual(expected);
    });

    test('complex case with loops', () => {
        const graph = {
            1: [4,2],
            2: [3,4],
            4: [5],
            5: [2]
        };
        const ends = new Set([3]);
        const expected = new Set([[1, 2], [2, 3], [1,4], [4, 5], [5, 2]]);
        expect(new Set(getRatRunSegments(graph, 1, ends))).toEqual(expected);
    });

    test('complex case with loops bis', () => {
        const graph = {
            1: [2,4],
            2: [3,4],
            4: [5],
            5: [2]
        };
        const ends = new Set([3]);
        const expected = new Set([[1, 2], [2, 3], [1,4], [4, 5], [5, 2]]);
        expect(new Set(getRatRunSegments(graph, 1, ends))).toEqual(expected);
    });

    //test('complex case with loop full', () => {
    //    const graph = {
    //        1: [4,2],
    //        2: [3,4],
    //        4: [2,3]
    //    };
    //    const ends = new Set([3]);
    //    const expected = new Set([[1, 2], [2, 3], [1, 4], [4, 3], [2, 4], [4, 2]]);
    //    expect(new Set(getRatRunSegments(graph, 1, ends))).toEqual(expected);
    //});

    test('complex case', () => {
        const graph = {
            1: [4],
            2: [4],
            3: [4],
            4: [7,8]
        };
        const ends = new Set([7]);
        const expected = new Set([[1, 4], [4, 7]]);
        expect(new Set(getRatRunSegments(graph, 1, ends))).toEqual(expected);
    });

    test('complex case', () => {
        const graph = {
            1: [4],
            2: [4],
            3: [4,5,9],
            4: [6,7,8],
            9: [8]
        };
        const ends = new Set([7, 8]);
        const expected = new Set([[3, 4], [4, 7], [4,8], [3,9], [9,8]]);
        expect(new Set(getRatRunSegments(graph, 3, ends))).toEqual(expected);
    });


});