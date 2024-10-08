import { add, subtract } from '../debugging/sample';

describe('add', () => {
  it('should add two positive numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('should add two negative numbers correctly', () => {
    expect(add(-2, -3)).toBe(-5);
  });

  it('should add a positive and a negative number correctly', () => {
    expect(add(2, -3)).toBe(-1);
  });

  it('should add zero correctly', () => {
    expect(add(0, 5)).toBe(5);
    expect(add(5, 0)).toBe(5);
    expect(add(0, 0)).toBe(0);
  });
});

describe('subtract', () => {
  it('should subtract two positive numbers correctly', () => {
    expect(subtract(5, 3)).toBe(2);
  });

  it('should subtract two negative numbers correctly', () => {
    expect(subtract(-5, -3)).toBe(-2);
  });

  it('should subtract a positive and a negative number correctly', () => {
    expect(subtract(5, -3)).toBe(8);
    expect(subtract(-5, 3)).toBe(-8);
  });

  it('should handle subtracting from zero correctly', () => {
    expect(subtract(0, 5)).toBe(-5);
    expect(subtract(5, 0)).toBe(5);
  });
});

import { subtract } from '../debugging/sample';

describe('subtract', () => {
  it('should subtract two positive numbers correctly', () => {
    expect(subtract(5, 3)).toBe(2);
  });

  it('should subtract two negative numbers correctly', () => {
    expect(subtract(-10, -5)).toBe(-5);
  });

  it('should handle subtracting a negative number from a positive number', () => {
    expect(subtract(10, -5)).toBe(15);
  });

  it('should handle subtracting a positive number from a negative number', () => {
    expect(subtract(-10, 5)).toBe(-15);
  });

  it('should return 0 when subtracting the same number', () => {
    expect(subtract(10, 10)).toBe(0);
  });

  it('should handle subtracting 0 from a number', () => {
    expect(subtract(5, 0)).toBe(5);
  });

  it('should handle subtracting a number from 0', () => {
    expect(subtract(0, 5)).toBe(-5);
  });
});