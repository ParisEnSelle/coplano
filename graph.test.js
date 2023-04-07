const getUniqueElements = require('./graph');

test('getUniqueElements 1', () => {
  expect(getUniqueElements([[1,2]]).size).toBe(2);
});

test('getUniqueElements 1', () => {
  expect(getUniqueElements([[1,2], [1,2]]).size).toBe(2);
});

test('getUniqueElements 1', () => {
  expect(getUniqueElements([]).size).toBe(0);
});

test('getUniqueElements 1', () => {
  expect(getUniqueElements([[1,2], [2,3]]).size).toBe(3);
});

test('getUniqueElements 1', () => {
  expect(getUniqueElements([[1,2], [3,2]]).size).toBe(3);
});

test('getUniqueElements 1', () => {
  expect(getUniqueElements([[1,2], [3,4]]).size).toBe(4);
});

test('getUniqueElements 1', () => {
  expect(getUniqueElements([[1,2], [3,4], [5,6]]).size).toBe(6);
});

test('getUniqueElements 1', () => {
  expect(getUniqueElements([[1,2], [2,5], [5,6]]).size).toBe(4);
});
