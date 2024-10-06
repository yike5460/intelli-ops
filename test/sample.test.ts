import { add, subtract } from '../debugging/sample';

describe('add', () => {
  it('should return the sum of two positive numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('should return the sum of two negative numbers', () => {
    expect(add(-2, -3)).toBe(-5);
  });

  it('should return the sum of a positive and a negative number', () => {
    expect(add(2, -3)).toBe(-1);
  });

  it('should return 0 when adding 0 to any number', () => {
    expect(add(0, 5)).toBe(5);
    expect(add(5, 0)).toBe(5);
  });
});

describe('subtract', () => {
  it('should return the difference of two positive numbers', () => {
    expect(subtract(5, 3)).toBe(2);
  });

  it('should return the difference of two negative numbers', () => {
    expect(subtract(-5, -3)).toBe(-2);
  });

  it('should return the difference of a positive and a negative number', () => {
    expect(subtract(5, -3)).toBe(8);
    expect(subtract(-5, 3)).toBe(-8);
  });

  it('should return the negative of a number when subtracting from 0', () => {
    expect(subtract(0, 5)).toBe(-5);
  });

  it('should return the number itself when subtracting 0', () => {
    expect(subtract(5, 0)).toBe(5);
  });
});

// Iterating the absolute path
import { subtract } from '/home/runner/work/intelli-ops/intelli-ops/debugging/sample';

describe('subtract', () => {
  it('should subtract two positive numbers correctly', () => {
    const result = subtract(5, 3);
    expect(result).toBe(2);
  });

  it('should subtract two negative numbers correctly', () => {
    const result = subtract(-10, -5);
    expect(result).toBe(-5);
  });

  it('should subtract a negative number from a positive number correctly', () => {
    const result = subtract(10, -5);
    expect(result).toBe(15);
  });

  it('should subtract a positive number from a negative number correctly', () => {
    const result = subtract(-10, 5);
    expect(result).toBe(-15);
  });

  it('should return 0 when subtracting equal numbers', () => {
    const result = subtract(10, 10);
    expect(result).toBe(0);
  });

  it('should handle large numbers correctly', () => {
    const result = subtract(1000000000, 500000000);
    expect(result).toBe(500000000);
  });

  it('should handle floating-point numbers correctly', () => {
    const result = subtract(3.14, 1.57);
    expect(result).toBeCloseTo(1.57, 5);
  });
});