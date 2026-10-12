const db = require('../db');

const challengesData = [
  // EXISTING 3 REUSED AND UPDATED:
  // 1: Find the Largest Number (Easy, Array)
  // 2: Check Whether a String Is a Palindrome (Easy, String / Two Pointers)
  // 3: Find the Second Largest Element (Easy, Array)

  // EASY (7 new + 3 existing = 10 Easy):
  {
    title: 'Sum of Digits',
    specification: 'Mathematics',
    difficulty: 'Easy',
    description: 'Given an integer N, calculate and print the sum of its digits. If N is negative, treat it by taking the absolute value of the digits.',
    input_format: 'A single integer N.',
    output_format: 'Print the non-negative integer representing the sum of the digits.',
    constraints: '-10^9 <= N <= 10^9',
    sample_tests: [
      { input_data: '12345', expected_output: '15' },
      { input_data: '908', expected_output: '17' }
    ],
    hidden_tests: [
      { input_data: '0', expected_output: '0' },
      { input_data: '-456', expected_output: '15' },
      { input_data: '999999999', expected_output: '81' }
    ]
  },
  {
    title: 'Reverse a Number',
    specification: 'Mathematics',
    difficulty: 'Easy',
    description: 'Given an integer N, reverse its digits and print the result. Preserve the negative sign if N is negative. Trailing zeros in the original number should become leading zeros and be omitted in the output.',
    input_format: 'A single integer N.',
    output_format: 'Print the reversed integer.',
    constraints: '-2^31 <= N <= 2^31 - 1',
    sample_tests: [
      { input_data: '1234', expected_output: '4321' },
      { input_data: '-506', expected_output: '-605' }
    ],
    hidden_tests: [
      { input_data: '1000', expected_output: '1' },
      { input_data: '0', expected_output: '0' },
      { input_data: '-9', expected_output: '-9' }
    ]
  },
  {
    title: 'Prime Number Check',
    specification: 'Mathematics',
    difficulty: 'Easy',
    description: 'Given an integer N, determine whether it is a prime number. A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.',
    input_format: 'A single integer N.',
    output_format: 'Print YES if N is prime; otherwise print NO.',
    constraints: '1 <= N <= 10^9',
    sample_tests: [
      { input_data: '29', expected_output: 'YES' },
      { input_data: '1', expected_output: 'NO' }
    ],
    hidden_tests: [
      { input_data: '4', expected_output: 'NO' },
      { input_data: '2', expected_output: 'YES' },
      { input_data: '97', expected_output: 'YES' }
    ]
  },
  {
    title: 'Fibonacci Series',
    specification: 'Mathematics / Recursion',
    difficulty: 'Easy',
    description: 'Given an integer N, compute the N-th Fibonacci number where F(0) = 0, F(1) = 1, and F(N) = F(N-1) + F(N-2) for N >= 2.',
    input_format: 'A single integer N.',
    output_format: 'Print the N-th Fibonacci number.',
    constraints: '0 <= N <= 45',
    sample_tests: [
      { input_data: '5', expected_output: '5' },
      { input_data: '10', expected_output: '55' }
    ],
    hidden_tests: [
      { input_data: '0', expected_output: '0' },
      { input_data: '1', expected_output: '1' },
      { input_data: '20', expected_output: '6765' }
    ]
  },
  {
    title: 'Count Vowels in a String',
    specification: 'String',
    difficulty: 'Easy',
    description: 'Given a string S, count the total number of vowels (a, e, i, o, u, case-insensitive) present in the string.',
    input_format: 'A single line containing the string S.',
    output_format: 'Print the total vowel count.',
    constraints: '1 <= |S| <= 10^5',
    sample_tests: [
      { input_data: 'ExamForge', expected_output: '4' },
      { input_data: 'rhythm', expected_output: '0' }
    ],
    hidden_tests: [
      { input_data: 'AEIOU', expected_output: '5' },
      { input_data: 'Hello World', expected_output: '3' },
      { input_data: 'b', expected_output: '0' }
    ]
  },
  {
    title: 'Reverse a String',
    specification: 'String',
    difficulty: 'Easy',
    description: 'Given a string S, print the string in reverse order.',
    input_format: 'A single line containing string S.',
    output_format: 'Print the reversed string.',
    constraints: '1 <= |S| <= 10^5',
    sample_tests: [
      { input_data: 'hello', expected_output: 'olleh' },
      { input_data: 'Placement', expected_output: 'tnemecalP' }
    ],
    hidden_tests: [
      { input_data: 'a', expected_output: 'a' },
      { input_data: '12345', expected_output: '54321' },
      { input_data: 'code test', expected_output: 'tset edoc' }
    ]
  },
  {
    title: 'Frequency of Array Elements',
    specification: 'Array / Hashing',
    difficulty: 'Easy',
    description: 'Given an array of N integers and a query target X, count how many times X appears in the array.',
    input_format: 'Line 1: N\nLine 2: N space-separated integers\nLine 3: Integer X',
    output_format: 'Print the frequency of X in the array.',
    constraints: '1 <= N <= 10^5; -10^9 <= A[i], X <= 10^9',
    sample_tests: [
      { input_data: '5\n1 2 2 3 2\n2', expected_output: '3' },
      { input_data: '4\n10 20 30 40\n50', expected_output: '0' }
    ],
    hidden_tests: [
      { input_data: '1\n5\n5', expected_output: '1' },
      { input_data: '6\n-1 -1 -1 0 1 2\n-1', expected_output: '3' },
      { input_data: '4\n7 7 7 7\n7', expected_output: '4' }
    ]
  },

  // MEDIUM (12 new = 12 Medium):
  {
    title: 'Two Sum',
    specification: 'Array / Hashing',
    difficulty: 'Medium',
    description: 'Given an array of integers and a target value, find the 0-based indices of the two numbers such that they add up to target. Print the smaller index first. If no pair exists, print NOT_FOUND.',
    input_format: 'Line 1: N\nLine 2: N space-separated integers\nLine 3: Target integer',
    output_format: 'Print the two 0-based indices separated by a space, or NOT_FOUND.',
    constraints: '2 <= N <= 10^5; -10^9 <= A[i], Target <= 10^9',
    sample_tests: [
      { input_data: '4\n2 7 11 15\n9', expected_output: '0 1' },
      { input_data: '3\n3 2 4\n6', expected_output: '1 2' }
    ],
    hidden_tests: [
      { input_data: '2\n3 3\n6', expected_output: '0 1' },
      { input_data: '5\n1 5 3 7 9\n12', expected_output: '2 4' },
      { input_data: '4\n1 2 3 4\n10', expected_output: 'NOT_FOUND' }
    ]
  },
  {
    title: 'Remove Duplicates from Sorted Array',
    specification: 'Array / Two Pointers',
    difficulty: 'Medium',
    description: 'Given a sorted array of integers, remove duplicates in-place such that each unique element appears only once. Print the unique elements separated by space, and on the next line print the number of unique elements.',
    input_format: 'Line 1: N\nLine 2: N space-separated sorted integers',
    output_format: 'Line 1: space-separated unique elements\nLine 2: count of unique elements',
    constraints: '1 <= N <= 10^5; sorted in non-decreasing order',
    sample_tests: [
      { input_data: '6\n1 1 2 2 3 4', expected_output: '1 2 3 4\n4' },
      { input_data: '3\n1 1 1', expected_output: '1\n1' }
    ],
    hidden_tests: [
      { input_data: '5\n-3 -3 -1 0 2', expected_output: '-3 -1 0 2\n4' },
      { input_data: '1\n42', expected_output: '42\n1' },
      { input_data: '4\n1 2 3 4', expected_output: '1 2 3 4\n4' }
    ]
  },
  {
    title: 'Valid Anagram',
    specification: 'String / Hashing',
    difficulty: 'Medium',
    description: 'Given two strings s1 and s2, return YES if s2 is an anagram of s1, and NO otherwise. An Anagram is a word formed by rearranging the letters of a different word, using all original letters exactly once.',
    input_format: 'Line 1: String s1\nLine 2: String s2',
    output_format: 'Print YES or NO.',
    constraints: '1 <= |s1|, |s2| <= 10^5',
    sample_tests: [
      { input_data: 'anagram\nnagaram', expected_output: 'YES' },
      { input_data: 'rat\ncar', expected_output: 'NO' }
    ],
    hidden_tests: [
      { input_data: 'listen\nsilent', expected_output: 'YES' },
      { input_data: 'a\nab', expected_output: 'NO' },
      { input_data: 'aabb\nabab', expected_output: 'YES' }
    ]
  },
  {
    title: 'First Non-Repeating Character',
    specification: 'String / Hashing',
    difficulty: 'Medium',
    description: 'Given a string S, find the first non-repeating character in it and print it. If non-repeating character does not exist, print -1.',
    input_format: 'A single string S.',
    output_format: 'Print the first non-repeating character or -1.',
    constraints: '1 <= |S| <= 10^5',
    sample_tests: [
      { input_data: 'leetcode', expected_output: 'l' },
      { input_data: 'loveleetcode', expected_output: 'v' }
    ],
    hidden_tests: [
      { input_data: 'aabb', expected_output: '-1' },
      { input_data: 'z', expected_output: 'z' },
      { input_data: 'examforge', expected_output: 'x' }
    ]
  },
  {
    title: 'Missing Number',
    specification: 'Array / Mathematics',
    difficulty: 'Medium',
    description: 'Given an array containing N distinct numbers taken from the range 0 to N, find and print the one number that is missing from the array.',
    input_format: 'Line 1: N\nLine 2: N space-separated distinct integers from range [0, N]',
    output_format: 'Print the missing number.',
    constraints: '1 <= N <= 10^5',
    sample_tests: [
      { input_data: '3\n3 0 1', expected_output: '2' },
      { input_data: '2\n0 1', expected_output: '2' }
    ],
    hidden_tests: [
      { input_data: '9\n9 6 4 2 3 5 7 0 1', expected_output: '8' },
      { input_data: '1\n0', expected_output: '1' },
      { input_data: '1\n1', expected_output: '0' }
    ]
  },
  {
    title: 'Move Zeroes',
    specification: 'Array / Two Pointers',
    difficulty: 'Medium',
    description: 'Given an array of N integers, move all 0s to the end of it while maintaining the relative order of the non-zero elements.',
    input_format: 'Line 1: N\nLine 2: N space-separated integers',
    output_format: 'Print the modified array elements space-separated.',
    constraints: '1 <= N <= 10^5',
    sample_tests: [
      { input_data: '5\n0 1 0 3 12', expected_output: '1 3 12 0 0' },
      { input_data: '1\n0', expected_output: '0' }
    ],
    hidden_tests: [
      { input_data: '4\n1 2 3 4', expected_output: '1 2 3 4' },
      { input_data: '4\n0 0 0 1', expected_output: '1 0 0 0' },
      { input_data: '6\n-1 0 2 0 0 -3', expected_output: '-1 2 -3 0 0 0' }
    ]
  },
  {
    title: 'Maximum Subarray',
    specification: 'Array / Dynamic Programming',
    difficulty: 'Medium',
    description: 'Given an integer array of N numbers, find the contiguous subarray (containing at least one number) which has the largest sum and print its sum.',
    input_format: 'Line 1: N\nLine 2: N space-separated integers',
    output_format: 'Print the maximum subarray sum.',
    constraints: '1 <= N <= 10^5; -10^4 <= A[i] <= 10^4',
    sample_tests: [
      { input_data: '9\n-2 1 -3 4 -1 2 1 -5 4', expected_output: '6' },
      { input_data: '1\n1', expected_output: '1' }
    ],
    hidden_tests: [
      { input_data: '5\n5 4 -1 7 8', expected_output: '23' },
      { input_data: '4\n-5 -2 -3 -1', expected_output: '-1' },
      { input_data: '3\n-1 0 -2', expected_output: '0' }
    ]
  },
  {
    title: 'Binary Search',
    specification: 'Searching',
    difficulty: 'Medium',
    description: 'Given a sorted array of N integers and a target value, return the 0-based index of target if it exists, or -1 if target is not present.',
    input_format: 'Line 1: N\nLine 2: N sorted space-separated integers\nLine 3: Target integer',
    output_format: 'Print the 0-based index or -1.',
    constraints: '1 <= N <= 10^5',
    sample_tests: [
      { input_data: '6\n-1 0 3 5 9 12\n9', expected_output: '4' },
      { input_data: '6\n-1 0 3 5 9 12\n2', expected_output: '-1' }
    ],
    hidden_tests: [
      { input_data: '1\n5\n5', expected_output: '0' },
      { input_data: '5\n2 4 6 8 10\n1', expected_output: '-1' },
      { input_data: '5\n2 4 6 8 10\n10', expected_output: '4' }
    ]
  },
  {
    title: 'Merge Two Sorted Arrays',
    specification: 'Array / Sorting',
    difficulty: 'Medium',
    description: 'Given two sorted integer arrays of size N and M respectively, merge them into a single sorted array and print all elements.',
    input_format: 'Line 1: N M\nLine 2: N space-separated sorted integers\nLine 3: M space-separated sorted integers',
    output_format: 'Print the merged sorted array space-separated.',
    constraints: '1 <= N, M <= 10^5',
    sample_tests: [
      { input_data: '3 3\n1 3 5\n2 4 6', expected_output: '1 2 3 4 5 6' },
      { input_data: '2 1\n10 20\n5', expected_output: '5 10 20' }
    ],
    hidden_tests: [
      { input_data: '1 1\n1\n1', expected_output: '1 1' },
      { input_data: '4 2\n-5 -2 0 4\n-3 1', expected_output: '-5 -3 -2 0 1 4' },
      { input_data: '3 1\n1 2 3\n4', expected_output: '1 2 3 4' }
    ]
  },
  {
    title: 'Rotate Array',
    specification: 'Array',
    difficulty: 'Medium',
    description: 'Given an array of N integers, rotate the array to the right by K steps, where K is non-negative.',
    input_format: 'Line 1: N K\nLine 2: N space-separated integers',
    output_format: 'Print the rotated array elements space-separated.',
    constraints: '1 <= N <= 10^5; 0 <= K <= 10^9',
    sample_tests: [
      { input_data: '7 3\n1 2 3 4 5 6 7', expected_output: '5 6 7 1 2 3 4' },
      { input_data: '4 2\n-1 -100 3 99', expected_output: '3 99 -1 -100' }
    ],
    hidden_tests: [
      { input_data: '3 0\n1 2 3', expected_output: '1 2 3' },
      { input_data: '2 3\n1 2', expected_output: '2 1' },
      { input_data: '5 5\n10 20 30 40 50', expected_output: '10 20 30 40 50' }
    ]
  },
  {
    title: 'Valid Parentheses',
    specification: 'Stack / String',
    difficulty: 'Medium',
    description: 'Given a string S containing just the characters (, ), {, }, [, ], determine if the input string is valid. Open brackets must be closed by the same type of brackets and in the correct order.',
    input_format: 'A single string S.',
    output_format: 'Print YES if valid; otherwise print NO.',
    constraints: '1 <= |S| <= 10^5',
    sample_tests: [
      { input_data: '()[]{}', expected_output: 'YES' },
      { input_data: '(]', expected_output: 'NO' }
    ],
    hidden_tests: [
      { input_data: '([])', expected_output: 'YES' },
      { input_data: '([)]', expected_output: 'NO' },
      { input_data: '}', expected_output: 'NO' }
    ]
  },
  {
    title: 'Longest Common Prefix',
    specification: 'String',
    difficulty: 'Medium',
    description: 'Given N strings, find the longest common prefix string amongst them. If there is no common prefix, print -1.',
    input_format: 'Line 1: N\nNext N lines: one string per line',
    output_format: 'Print the longest common prefix or -1.',
    constraints: '1 <= N <= 200; 1 <= |S[i]| <= 200',
    sample_tests: [
      { input_data: '3\nflower\nflow\nflight', expected_output: 'fl' },
      { input_data: '3\ndog\nracecar\ncar', expected_output: '-1' }
    ],
    hidden_tests: [
      { input_data: '2\ninterspecies\ninterstellar', expected_output: 'inter' },
      { input_data: '1\nsingle', expected_output: 'single' },
      { input_data: '3\na\na\na', expected_output: 'a' }
    ]
  },

  // HARD (8 new = 8 Hard):
  {
    title: 'Longest Substring Without Repeating Characters',
    specification: 'String / Sliding Window',
    difficulty: 'Hard',
    description: 'Given a string S, find the length of the longest substring without repeating characters.',
    input_format: 'A single line containing string S.',
    output_format: 'Print the length of the longest non-repeating substring.',
    constraints: '0 <= |S| <= 10^5',
    sample_tests: [
      { input_data: 'abcabcbb', expected_output: '3' },
      { input_data: 'bbbbb', expected_output: '1' }
    ],
    hidden_tests: [
      { input_data: 'pwwkew', expected_output: '3' },
      { input_data: 'a', expected_output: '1' },
      { input_data: 'au', expected_output: '2' }
    ]
  },
  {
    title: '3Sum',
    specification: 'Array / Two Pointers',
    difficulty: 'Hard',
    description: 'Given an integer array of N numbers, find all unique triplets [A[i], A[j], A[k]] such that i != j, i != k, and j != k, and A[i] + A[j] + A[k] == 0. Print each triplet sorted space-separated on a new line, ordered lexicographically. If no triplets exist, print NONE.',
    input_format: 'Line 1: N\nLine 2: N space-separated integers',
    output_format: 'Sorted unique triplets space-separated, one per line, or NONE.',
    constraints: '3 <= N <= 3000; -10^5 <= A[i] <= 10^5',
    sample_tests: [
      { input_data: '6\n-1 0 1 2 -1 -4', expected_output: '-1 -1 2\n-1 0 1' },
      { input_data: '3\n0 1 1', expected_output: 'NONE' }
    ],
    hidden_tests: [
      { input_data: '3\n0 0 0', expected_output: '0 0 0' },
      { input_data: '4\n-2 0 1 1', expected_output: 'NONE' },
      { input_data: '5\n-4 -1 -1 0 1 2', expected_output: '-1 -1 2\n-1 0 1' }
    ]
  },
  {
    title: 'Merge Intervals',
    specification: 'Array / Sorting',
    difficulty: 'Hard',
    description: 'Given an array of N intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals and print the non-overlapping intervals in sorted order of start time.',
    input_format: 'Line 1: N\nNext N lines: start end separated by space',
    output_format: 'Merged intervals start end space-separated, one per line.',
    constraints: '1 <= N <= 10^5; 0 <= start_i <= end_i <= 10^9',
    sample_tests: [
      { input_data: '4\n1 3\n2 6\n8 10\n15 18', expected_output: '1 6\n8 10\n15 18' },
      { input_data: '2\n1 4\n4 5', expected_output: '1 5' }
    ],
    hidden_tests: [
      { input_data: '3\n1 4\n0 2\n3 5', expected_output: '0 5' },
      { input_data: '1\n2 3', expected_output: '2 3' },
      { input_data: '4\n1 10\n2 3\n4 5\n6 7', expected_output: '1 10' }
    ]
  },
  {
    title: 'Product of Array Except Self',
    specification: 'Array',
    difficulty: 'Hard',
    description: 'Given an integer array nums of size N, return an array answer such that answer[i] is equal to the product of all elements of nums except nums[i].',
    input_format: 'Line 1: N\nLine 2: N space-separated integers',
    output_format: 'Print the resulting array space-separated.',
    constraints: '2 <= N <= 10^5; product fits in standard integer/long bounds',
    sample_tests: [
      { input_data: '4\n1 2 3 4', expected_output: '24 12 8 6' },
      { input_data: '5\n-1 1 0 -3 3', expected_output: '0 0 9 0 0' }
    ],
    hidden_tests: [
      { input_data: '2\n5 10', expected_output: '10 5' },
      { input_data: '3\n0 0 2', expected_output: '0 0 0' },
      { input_data: '4\n-2 -3 4 5', expected_output: '-60 -40 30 24' }
    ]
  },
  {
    title: 'Longest Consecutive Sequence',
    specification: 'Array / Hashing',
    difficulty: 'Hard',
    description: 'Given an unsorted array of N integers, find the length of the longest consecutive elements sequence.',
    input_format: 'Line 1: N\nLine 2: N space-separated integers',
    output_format: 'Print the length of the longest consecutive sequence.',
    constraints: '1 <= N <= 10^5; -10^9 <= A[i] <= 10^9',
    sample_tests: [
      { input_data: '6\n100 4 200 1 3 2', expected_output: '4' },
      { input_data: '10\n0 3 7 2 5 8 4 6 0 1', expected_output: '9' }
    ],
    hidden_tests: [
      { input_data: '1\n5', expected_output: '1' },
      { input_data: '5\n1 2 0 1 2', expected_output: '3' },
      { input_data: '4\n10 20 30 40', expected_output: '1' }
    ]
  },
  {
    title: 'Group Anagrams',
    specification: 'String / Hashing',
    difficulty: 'Hard',
    description: 'Given N strings, group the anagrams together. Print each group of anagrams on a new line. Within each line, words should be sorted alphabetically space-separated. Groups should be printed sorted by the first word of each group.',
    input_format: 'Line 1: N\nNext N lines: 1 string per line',
    output_format: 'Grouped anagrams space-separated, one group per line.',
    constraints: '1 <= N <= 1000; 1 <= |S[i]| <= 100',
    sample_tests: [
      { input_data: '6\neat\ntea\ntan\nate\nnat\nbat', expected_output: 'ate eat tea\nat n nat\nbat' },
      { input_data: '1\na', expected_output: 'a' }
    ],
    hidden_tests: [
      { input_data: '3\nlisten\nsilent\nenlist', expected_output: 'enlist listen silent' },
      { input_data: '2\nab\nba', expected_output: 'ab ba' },
      { input_data: '3\na\nb\nc', expected_output: 'a\nb\nc' }
    ]
  },
  {
    title: 'Linked List Cycle Detection',
    specification: 'Linked List / Two Pointers',
    difficulty: 'Hard',
    description: 'Given a linked list representation where line 1 gives N and pos (-1 if no cycle, or 0-based index pos where tail connects), and line 2 gives node values, determine if the linked list has a cycle.',
    input_format: 'Line 1: N pos\nLine 2: N space-separated integers',
    output_format: 'Print CYCLE if a cycle exists; otherwise print NO_CYCLE.',
    constraints: '1 <= N <= 10^5; -1 <= pos < N',
    sample_tests: [
      { input_data: '4 1\n3 2 0 -4', expected_output: 'CYCLE' },
      { input_data: '2 0\n1 2', expected_output: 'CYCLE' }
    ],
    hidden_tests: [
      { input_data: '1 -1\n1', expected_output: 'NO_CYCLE' },
      { input_data: '5 -1\n1 2 3 4 5', expected_output: 'NO_CYCLE' },
      { input_data: '3 2\n10 20 30', expected_output: 'CYCLE' }
    ]
  },
  {
    title: 'Spiral Matrix Traversal',
    specification: 'Matrix',
    difficulty: 'Hard',
    description: 'Given an R x C matrix of integers, print all elements of the matrix in spiral order starting from top-left going right, down, left, and up.',
    input_format: 'Line 1: R C\nNext R lines: C space-separated integers each',
    output_format: 'Print all matrix elements in spiral order space-separated on a single line.',
    constraints: '1 <= R, C <= 100',
    sample_tests: [
      { input_data: '3 3\n1 2 3\n4 5 6\n7 8 9', expected_output: '1 2 3 6 9 8 7 4 5' },
      { input_data: '3 4\n1 2 3 4\n5 6 7 8\n9 10 11 12', expected_output: '1 2 3 4 8 12 11 10 9 5 6 7' }
    ],
    hidden_tests: [
      { input_data: '1 1\n42', expected_output: '42' },
      { input_data: '2 2\n1 2\n3 4', expected_output: '1 2 4 3' },
      { input_data: '4 1\n1\n2\n3\n4', expected_output: '1 2 3 4' }
    ]
  }
];

async function seed() {
  const connection = await db.promise().getConnection();
  try {
    console.log('Beginning coding challenge database setup...');
    
    // Step 1: Ensure specification column exists in coding_challenges
    const [cols] = await connection.query('DESCRIBE coding_challenges');
    const hasSpec = cols.some((c) => c.Field === 'specification');
    if (!hasSpec) {
      console.log('Adding specification column to coding_challenges...');
      await connection.query(
        "ALTER TABLE coding_challenges ADD COLUMN specification VARCHAR(250) NOT NULL DEFAULT 'Basic Algorithms' AFTER description"
      );
    }

    // Step 2: Update existing 3 challenges
    // Challenge 1: Find the Largest Number (Easy, Array)
    await connection.query(
      "UPDATE coding_challenges SET difficulty = 'Easy', specification = 'Array' WHERE challenge_id = 1"
    );
    // Add extra hidden test to Challenge 1 if < 5 test cases
    const [tcs1] = await connection.query('SELECT test_case_id FROM coding_test_cases WHERE challenge_id = 1');
    if (tcs1.length < 5) {
      await connection.query(
        "INSERT INTO coding_test_cases (challenge_id, input_data, expected_output, is_sample) VALUES (1, '5\\n-10 -20 -30 -40 -5', '-5', 0)"
      );
    }

    // Challenge 2: Check Whether a String Is a Palindrome (Easy, String / Two Pointers)
    await connection.query(
      "UPDATE coding_challenges SET difficulty = 'Easy', specification = 'String / Two Pointers' WHERE challenge_id = 2"
    );
    const [tcs2] = await connection.query('SELECT test_case_id FROM coding_test_cases WHERE challenge_id = 2');
    if (tcs2.length < 5) {
      await connection.query(
        "INSERT INTO coding_test_cases (challenge_id, input_data, expected_output, is_sample) VALUES (2, 'a', 'YES', 0)"
      );
    }

    // Challenge 3: Find the Second Largest Element (Easy, Array)
    await connection.query(
      "UPDATE coding_challenges SET difficulty = 'Easy', specification = 'Array' WHERE challenge_id = 3"
    );
    const [tcs3] = await connection.query('SELECT test_case_id FROM coding_test_cases WHERE challenge_id = 3');
    if (tcs3.length < 5) {
      await connection.query(
        "INSERT INTO coding_test_cases (challenge_id, input_data, expected_output, is_sample) VALUES (3, '4\\n100 100 99 98', '99', 0)"
      );
    }

    // Step 3: Insert new challenges if not present by title
    const adminId = 4; // admin@examforge.com
    for (const item of challengesData) {
      const [existing] = await connection.query(
        'SELECT challenge_id FROM coding_challenges WHERE title = ?',
        [item.title]
      );
      let challengeId;
      if (existing.length > 0) {
        challengeId = existing[0].challenge_id;
        await connection.query(
          'UPDATE coding_challenges SET description=?, input_format=?, output_format=?, `constraints`=?, difficulty=?, specification=? WHERE challenge_id=?',
          [item.description, item.input_format, item.output_format, item.constraints, item.difficulty, item.specification, challengeId]
        );
        console.log(`Updated challenge: ${item.title} (ID: ${challengeId})`);
      } else {
        const [res] = await connection.query(
          'INSERT INTO coding_challenges (title, description, specification, input_format, output_format, `constraints`, difficulty, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [item.title, item.description, item.specification, item.input_format, item.output_format, item.constraints, item.difficulty, adminId]
        );
        challengeId = res.insertId;
        console.log(`Inserted challenge: ${item.title} (ID: ${challengeId})`);

        // Insert sample test cases
        for (const st of item.sample_tests) {
          await connection.query(
            'INSERT INTO coding_test_cases (challenge_id, input_data, expected_output, is_sample) VALUES (?, ?, ?, 1)',
            [challengeId, st.input_data, st.expected_output]
          );
        }
        // Insert hidden test cases
        for (const ht of item.hidden_tests) {
          await connection.query(
            'INSERT INTO coding_test_cases (challenge_id, input_data, expected_output, is_sample) VALUES (?, ?, ?, 0)',
            [challengeId, ht.input_data, ht.expected_output]
          );
        }
      }
    }

    // Step 4: Verify counts
    const [counts] = await connection.query(
      'SELECT difficulty, COUNT(*) as cnt FROM coding_challenges GROUP BY difficulty'
    );
    console.log('Final Difficulty Distribution:', counts);

    const [total] = await connection.query('SELECT COUNT(*) as total FROM coding_challenges');
    console.log('Total Challenges:', total[0].total);

  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    connection.release();
    process.exit();
  }
}

seed();
