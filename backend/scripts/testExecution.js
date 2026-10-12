require('dotenv').config();
const db = require('../db');
const { executeTestCase } = require('../services/codeExecution');

async function runTests() {
  console.log('--- EXAMFORGE MULTI-LANGUAGE CODE EXECUTION VERIFICATION ---');

  // Test 1: Python on Easy Challenge (Sum of Digits - ID 6)
  const [cEasy] = await db.promise().query('SELECT * FROM coding_test_cases WHERE challenge_id = 6 AND is_sample = 1 LIMIT 1');
  const pyCode = `import sys
n = int(sys.stdin.read().strip())
print(sum(int(d) for d in str(abs(n))))`;
  const pyRes = await executeTestCase({ language: 'Python', sourceCode: pyCode, testCase: cEasy[0] });
  console.log('1. Python (Easy - Sum of Digits):', pyRes.status === 'Accepted' ? 'PASS' : 'FAIL', '| Status:', pyRes.status, '| Output:', pyRes.output.trim(), '| Expected:', cEasy[0].expected_output);

  // Test 2: Java on Medium Challenge (Two Sum - ID 13)
  const [cMed] = await db.promise().query('SELECT * FROM coding_test_cases WHERE challenge_id = 13 AND is_sample = 1 LIMIT 1');
  const javaCode = `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        int target = sc.nextInt();
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < n; i++) {
            int comp = target - arr[i];
            if (map.containsKey(comp)) {
                System.out.println(map.get(comp) + " " + i);
                return;
            }
            map.put(arr[i], i);
        }
        System.out.println("NOT_FOUND");
    }
}`;
  const javaRes = await executeTestCase({ language: 'Java', sourceCode: javaCode, testCase: cMed[0] });
  console.log('2. Java (Medium - Two Sum):', javaRes.status === 'Accepted' ? 'PASS' : 'FAIL', '| Status:', javaRes.status, '| Output:', javaRes.output.trim(), '| Expected:', cMed[0].expected_output);

  // Test 3: C on Hard Challenge (Product of Array Except Self - ID 28)
  const [cHard] = await db.promise().query('SELECT * FROM coding_test_cases WHERE challenge_id = 28 AND is_sample = 1 LIMIT 1');
  const cCode = `#include <stdio.h>
int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int arr[100];
    long long prod = 1;
    int zeros = 0;
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
        if (arr[i] == 0) zeros++;
        else prod *= arr[i];
    }
    for (int i = 0; i < n; i++) {
        if (zeros > 1) printf("0");
        else if (zeros == 1) printf("%lld", arr[i] == 0 ? prod : 0);
        else printf("%lld", prod / arr[i]);
        if (i < n - 1) printf(" ");
    }
    printf("\\n");
    return 0;
}`;
  const cRes = await executeTestCase({ language: 'C', sourceCode: cCode, testCase: cHard[0] });
  console.log('3. C (Hard - Product Except Self):', cRes.status === 'Accepted' ? 'PASS' : 'FAIL', '| Status:', cRes.status, '| Output:', cRes.output.trim(), '| Expected:', cHard[0].expected_output);

  process.exit();
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
